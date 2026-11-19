export const RACES = [
  { name: 'Malecón Sprint', start: { x: 145, z: 26 }, route: [{ x: 170, z: 26 }, { x: 170, z: -52 }, { x: 112, z: -52 }], time: 42, reward: 700 },
  { name: 'Palmline Loop', start: { x: -92, z: 58 }, route: [{ x: -45, z: 58 }, { x: -45, z: -45 }, { x: -150, z: -45 }, { x: -150, z: 58 }], time: 54, reward: 950 },
  { name: 'Causeway Dash', start: { x: 12, z: 182 }, route: [{ x: 12, z: 126 }, { x: 80, z: 126 }, { x: 80, z: 188 }], time: 48, reward: 1100 },
];

export function createActivities() {
  return { packages: new Set(), race: null, raceTimer: 0, fare: null, vigilante: null, collected: new Set() };
}

export function createActivityMarkers(THREE, scene) {
  const markers = [];
  const points = [
    [-188, 148], [-156, 14], [-136, -121], [-82, -172], [-22, -146], [60, -178], [123, -152], [176, 115],
    [152, 65], [100, 168], [40, 72], [-42, 174], [-168, -73], [12, -78], [84, -15], [-114, 90],
  ];
  points.forEach(([x, z], index) => markers.push({ group: new THREE.Group(), x, z, index }));
  const beams = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 1.15, 3.6, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0x71e4c3, transparent: true, opacity: 0.12, depthWrite: false }), points.length);
  const rings = new THREE.InstancedMesh(new THREE.TorusGeometry(0.8, 0.09, 7, 16), new THREE.MeshBasicMaterial({ color: 0x92e6c2 }), points.length);
  const cubes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.52, 0.52, 0.52), new THREE.MeshStandardMaterial({ color: 0xa0f4d1, emissive: 0x1d8b74, metalness: 0.38 }), points.length);
  const transform = new THREE.Object3D();
  markers.forEach((marker, index) => {
    transform.position.set(marker.x, 1.8, marker.z);
    transform.scale.setScalar(1);
    transform.updateMatrix();
    beams.setMatrixAt(index, transform.matrix);
    transform.position.set(marker.x, 0.3, marker.z);
    transform.rotation.set(Math.PI / 2, 0, 0);
    transform.updateMatrix();
    rings.setMatrixAt(index, transform.matrix);
    transform.position.set(marker.x, 1.2, marker.z);
    transform.rotation.set(0, 0, 0);
    transform.updateMatrix();
    cubes.setMatrixAt(index, transform.matrix);
  });
  scene.add(beams, rings, cubes);
  markers.batch = { beams, rings, cubes, transform };
  return markers;
}

export function createRaceMarkers(THREE, scene) {
  return RACES.map((race, index) => {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(2, 0.22, 8, 24), new THREE.MeshBasicMaterial({ color: 0xffc56e, transparent: true, opacity: 0.92 }));
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(race.start.x, 1.5, race.start.z);
    scene.add(mesh);
    return { mesh, race, index };
  });
}

export function updateActivityMarkers(markers, dt, elapsed, collected) {
  const batch = markers.batch;
  for (const marker of markers) {
    marker.group.rotation.y += dt * 0.55;
    marker.group.position.y = Math.sin(elapsed * 1.5 + marker.index) * 0.16;
    marker.group.visible = !collected.has(marker.index);
    const scale = marker.group.visible ? 1 : 0;
    batch.transform.position.set(marker.x, 1.2 + marker.group.position.y, marker.z);
    batch.transform.rotation.set(0, marker.group.rotation.y, 0);
    batch.transform.scale.setScalar(scale);
    batch.transform.updateMatrix();
    batch.cubes.setMatrixAt(marker.index, batch.transform.matrix);
    batch.transform.position.set(marker.x, marker.group.position.y + 1.8, marker.z);
    batch.transform.rotation.set(0, 0, 0);
    batch.transform.updateMatrix();
    batch.beams.setMatrixAt(marker.index, batch.transform.matrix);
    batch.transform.position.set(marker.x, marker.group.position.y + 0.3, marker.z);
    batch.transform.rotation.set(Math.PI / 2, 0, 0);
    batch.transform.updateMatrix();
    batch.rings.setMatrixAt(marker.index, batch.transform.matrix);
  }
  batch.cubes.instanceMatrix.needsUpdate = true;
  batch.beams.instanceMatrix.needsUpdate = true;
  batch.rings.instanceMatrix.needsUpdate = true;
}

export function findPackage(markers, position, activities, reward) {
  const found = markers.find(marker => !activities.collected.has(marker.index) && Math.hypot(marker.x - position.x, marker.z - position.z) < 3.5);
  if (!found) return false;
  activities.collected.add(found.index);
  reward(250 + activities.collected.size * 50, `HIDDEN PACKAGE ${activities.collected.size}/16`);
  return true;
}

export function beginRace(activities, race) {
  activities.race = { race, gate: 0 };
  activities.raceTimer = race.time;
}

export function updateRace(activities, actor, dt, reward, fail) {
  if (!activities.race) return;
  activities.raceTimer -= dt;
  if (activities.raceTimer <= 0) {
    activities.race = null;
    fail('RACE MISSED · TRY AGAIN');
    return;
  }
  const gate = activities.race.race.route[activities.race.gate];
  if (Math.hypot(actor.position.x - gate.x, actor.position.z - gate.z) < 9) {
    activities.race.gate++;
    if (activities.race.gate >= activities.race.race.route.length) {
      reward(activities.race.race.reward, `RACE WON · ${activities.race.race.name}`);
      activities.race = null;
    }
  }
}

export function spawnSideJob(activities, actor, kind = 'fare') {
  const x = Math.max(-175, Math.min(175, actor.position.x + (kind === 'fare' ? 32 : -29)));
  const z = Math.max(-180, Math.min(180, actor.position.z + (kind === 'fare' ? 26 : 34)));
  activities[kind] = { x, z, time: kind === 'fare' ? 75 : 68, target: { x: x + 32, z: z - 42 } };
}

export function updateSideJobs(activities, actor, dt, reward, notify) {
  for (const kind of ['fare', 'vigilante']) {
    const job = activities[kind];
    if (!job) continue;
    job.time -= dt;
    const target = job.phase ? job.target : job;
    if (Math.hypot(actor.position.x - target.x, actor.position.z - target.z) < 8) {
      if (!job.phase) {
        job.phase = 1;
        notify(kind === 'fare' ? 'FARE COLLECTED · TAKE THEM TO THE PIER' : 'PURSUIT TAGGED · GET CLOSE');
      } else {
        reward(kind === 'fare' ? 400 : 500, kind === 'fare' ? 'TAXI FARE COMPLETE' : 'VIGILANTE SHIFT COMPLETE');
        activities[kind] = null;
      }
    } else if (job.time <= 0) {
      activities[kind] = null;
      notify('SIDE JOB EXPIRED');
    }
  }
}

export function visibleActivityTarget(activities) {
  if (activities.race) return activities.race.race.route[activities.race.gate];
  return activities.fare ?? activities.vigilante ?? null;
}
