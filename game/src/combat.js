import { seededRandom } from './config.js';

export function createHostiles(THREE, scene) {
  const random = seededRandom(411);
  const targets = [];
  for (let i = 0; i < 9; i++) {
    const person = new THREE.Group();
    const coat = new THREE.MeshStandardMaterial({ color: [0x4a5453, 0x764b43, 0x4c4b58][i % 3], roughness: 0.8 });
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.95, 0.4), coat);
    torso.position.y = 1.15;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 9, 8), new THREE.MeshStandardMaterial({ color: 0xa36f54 }));
    head.position.y = 1.84;
    person.add(torso, head);
    person.visible = false;
    scene.add(person);
    targets.push({ mesh: person, x: -20 + random() * 48, z: 92 + random() * 20, alive: true, cooldown: 0.7 + random() * 1.4 });
  }
  return targets;
}

export function activateHostiles(targets, chapterIndex) {
  let count = 0;
  for (const target of targets) {
    target.alive = true;
    target.mesh.visible = true;
    const column = count % 3;
    const row = Math.floor(count / 3);
    target.x = chapterIndex === 10 ? -76 : 12 + (column - 1) * 3;
    target.z = chapterIndex === 10 ? 8 : 124;
    target.mesh.position.set(target.x, 0, target.z);
    count++;
    if (count >= 3) break;
  }
}

export function clearHostiles(targets) {
  for (const target of targets) {
    target.alive = false;
    target.mesh.visible = false;
  }
}

export function updateHostiles(targets, player, onFire, dt) {
  if (!player) return;
  for (const target of targets) {
    if (!target.alive) continue;
    target.cooldown -= dt;
    target.mesh.lookAt(player.position.x, 1.4, player.position.z);
    if (target.cooldown <= 0) {
      target.cooldown = 1.6 + Math.random() * 1.7;
      if (Math.hypot(target.x - player.position.x, target.z - player.position.z) < 28) onFire(target);
    }
  }
}

export function fireWeapon(THREE, player, targets, camera, onHit) {
  const origin = camera.camera.position;
  const direction = new THREE.Vector3();
  camera.camera.getWorldDirection(direction);
  const ray = new THREE.Raycaster(origin, direction, 0, 62);
  const available = targets.filter(target => target.alive).map(target => target.mesh.children[0]);
  const hit = ray.intersectObjects(available, false)[0];
  if (hit) {
    const target = targets.find(item => item.mesh.children[0] === hit.object);
    if (target) {
      target.alive = false;
      target.mesh.visible = false;
      onHit(target);
    }
  }
  return hit;
}
