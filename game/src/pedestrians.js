import { CITY, seededRandom } from './config.js';

const shirts = [0xe9c36a, 0x638b7d, 0xe9e1cf, 0xd67658, 0x6688a2, 0xb87393, 0x756b5e, 0xf0a85b];

export function createPedestrians(THREE, scene) {
  const rng = seededRandom(CITY.seed + 309);
  const walkers = [];
  const count = 18;
  const skinColors = [];
  const shirtColors = [];
  const shortColors = [];
  for (let i = 0; i < count; i++) {
    skinColors.push([0xb47859, 0x95664f, 0xd9aa80, 0x704d40][Math.floor(rng() * 4)]);
    shirtColors.push(shirts[Math.floor(rng() * shirts.length)]);
    shortColors.push(rng() > 0.5 ? 0x4d5652 : 0x403b44);
    const waypoints = [
      { x: -245 + rng() * 420, z: -226 + rng() * 450 },
      { x: -245 + rng() * 420, z: -226 + rng() * 450 },
    ];
    const root = new THREE.Group();
    root.position.set(waypoints[0].x, 0, waypoints[0].z);
    walkers.push({ root, waypoints, target: 1, speed: 0.45 + rng() * 0.8, phase: rng() * 6, idle: rng() > 0.78, id: i });
  }
  const parts = [
    new THREE.InstancedMesh(new THREE.CylinderGeometry(0.29, 0.36, 1.1, 7), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82 }), count),
    new THREE.InstancedMesh(new THREE.SphereGeometry(0.27, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88 }), count),
    new THREE.InstancedMesh(new THREE.BoxGeometry(0.56, 0.35, 0.35), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), count),
    new THREE.InstancedMesh(new THREE.CylinderGeometry(0.095, 0.08, 0.48, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), count * 2),
  ];
  for (const part of parts) part.castShadow = true;
  const transform = new THREE.Object3D();
  for (const walker of walkers) {
    const index = walker.id;
    parts[0].setColorAt(index, new THREE.Color(shirtColors[index]));
    parts[1].setColorAt(index, new THREE.Color(skinColors[index]));
    parts[2].setColorAt(index, new THREE.Color(shortColors[index]));
    parts[3].setColorAt(index * 2, new THREE.Color(skinColors[index]));
    parts[3].setColorAt(index * 2 + 1, new THREE.Color(skinColors[index]));
  }
  scene.add(...parts);
  const batch = { parts, transform };
  syncPedestrians(walkers, batch);
  return Object.assign(walkers, { batch });
}

function syncPedestrians(walkers, batch) {
  const { parts, transform } = batch;
  for (const walker of walkers) {
    const { x, z } = walker.root.position;
    const angle = walker.root.rotation.y;
    const index = walker.id;
    const set = (mesh, slot, ox, oy, oz, scale = 1, partAngle = angle) => {
      transform.position.set(x + Math.cos(angle) * ox + Math.sin(angle) * oz, oy, z - Math.sin(angle) * ox + Math.cos(angle) * oz);
      transform.rotation.set(0, partAngle, 0);
      transform.scale.setScalar(scale);
      transform.updateMatrix();
      mesh.setMatrixAt(slot, transform.matrix);
    };
    const scale = rootScale(walker.root.visible);
    set(parts[0], index, 0, 1.06, 0, scale);
    set(parts[1], index, 0, 1.82, 0, scale);
    set(parts[2], index, 0, 0.34, 0, scale);
    set(parts[3], index * 2, -0.16, 0.06 + Math.sin(walker.phase) * 0.08, 0, scale, angle + 0.06);
    set(parts[3], index * 2 + 1, 0.16, 0.06 - Math.sin(walker.phase) * 0.08, 0, scale, angle - 0.06);
  }
  for (const part of parts) {
    part.instanceMatrix.needsUpdate = true;
    if (part.instanceColor) part.instanceColor.needsUpdate = true;
  }
}

function rootScale(visible) { return visible ? 1 : 0; }

export function updatePedestrians(walkers, delta, player) {
  const allWalkers = walkers.batch ? walkers : walkers;
  for (const walker of walkers) {
    const { root } = walker;
    walker.phase += delta * 5;
    if (walker.id === 0) continue;
    if (walker.idle) {
      root.rotation.y = Math.sin(walker.phase * 0.15) * 0.16;
      continue;
    }
    const target = walker.waypoints[walker.target];
    const dx = target.x - root.position.x;
    const dz = target.z - root.position.z;
    const length = Math.hypot(dx, dz);
    if (length < 1.5) { walker.target = 1 - walker.target; continue; }
    const speed = player && Math.hypot(player.position.x - root.position.x, player.position.z - root.position.z) < 8 ? walker.speed * 0.28 : walker.speed;
    root.position.x += dx / length * speed * delta;
    root.position.z += dz / length * speed * delta;
    root.rotation.y = Math.atan2(dx, dz);
  }
  if (allWalkers.batch) syncPedestrians(allWalkers, allWalkers.batch);
}

export function setClothes(THREE, walker, color) {
  const batch = walker.parentWalkers?.batch;
  if (batch) {
    batch.parts[0].setColorAt(walker.id, new THREE.Color(color));
    batch.parts[0].instanceColor.needsUpdate = true;
  }
}
