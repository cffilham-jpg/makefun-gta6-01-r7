import { CITY, VEHICLE_COLORS, clamp, seededRandom } from './config.js';

export function createVehicle(THREE, color = 0xd85f4b, model = 'coupe', detailed = true) {
  const root = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color, metalness: 0.48, roughness: 0.32 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x24363b, metalness: 0.25, roughness: 0.3 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x8db7b7, metalness: 0.35, roughness: 0.22 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222629, roughness: 0.85 });
  const length = model === 'van' ? 5.5 : model === 'police' ? 5.7 : 4.65;
  const width = model === 'van' ? 2.25 : 2.05;
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, 0.72, length), paint);
  body.position.y = 0.72;
  body.castShadow = true;
  body.receiveShadow = true;
  root.add(body);
  if (detailed) {
    const hood = new THREE.Mesh(new THREE.BoxGeometry(width * 0.93, 0.18, length * 0.28), paint);
    hood.position.set(0, 1.11, length * 0.32);
    root.add(hood);
  }
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.76, model === 'van' ? 0.94 : 0.72, length * 0.46), glass);
  cabin.position.set(0, 1.34, -0.15);
  cabin.castShadow = true;
  root.add(cabin);
  if (detailed) {
    const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.72, 0.12, length * 0.39), model === 'police' ? new THREE.MeshStandardMaterial({ color: 0xe4e3cf, roughness: 0.5 }) : paint);
    roof.position.set(0, 1.72, -0.18);
    root.add(roof);
  }
  const wheelGeometry = new THREE.CylinderGeometry(0.43, 0.43, 0.25, 10);
  if (detailed) {
    for (const x of [-width * 0.56, width * 0.56]) for (const z of [-length * 0.32, length * 0.31]) {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.43, z);
      wheel.castShadow = true;
      root.add(wheel);
    }
  } else {
    const wheels = new THREE.InstancedMesh(wheelGeometry, wheelMat, 4);
    const transform = new THREE.Object3D();
    let index = 0;
    for (const x of [-width * 0.56, width * 0.56]) for (const z of [-length * 0.32, length * 0.31]) {
      transform.position.set(x, 0.43, z);
      transform.rotation.set(0, 0, Math.PI / 2);
      transform.updateMatrix();
      wheels.setMatrixAt(index++, transform.matrix);
    }
    root.add(wheels);
  }
  if (detailed) for (const x of [-0.66, 0.66]) {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.2, 0.08), new THREE.MeshBasicMaterial({ color: 0xffe7ae }));
    head.position.set(x, 0.83, length * 0.51);
    root.add(head);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.19, 0.07), new THREE.MeshBasicMaterial({ color: 0xff543f }));
    tail.position.set(x, 0.8, -length * 0.51);
    root.add(tail);
  }
  if (model === 'police') {
    const lightbar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.16, 0.35), new THREE.MeshStandardMaterial({ color: 0x2b3d42, metalness: 0.4 }));
    lightbar.position.set(0, 1.83, -0.18);
    root.add(lightbar);
    const red = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.16, 0.28), new THREE.MeshBasicMaterial({ color: 0xf45157 }));
    const blue = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.16, 0.28), new THREE.MeshBasicMaterial({ color: 0x57a9ff }));
    red.position.set(-0.31, 1.85, -0.18);
    blue.position.set(0.31, 1.85, -0.18);
    root.add(red, blue);
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.26, 0.62), new THREE.MeshStandardMaterial({ color: 0xf0c36d, metalness: 0.55 }));
    badge.position.set(-1.05, 0.75, 0.05);
    root.add(badge);
  }
  root.userData = { model, length, speed: 0, heading: 0, integrity: 100, paint };
  return root;
}

export function createPlayer(THREE, scene, savedColor) {
  const car = createVehicle(THREE, savedColor ?? 0x37a9a0, 'coupe');
  car.position.set(12, 0, 12);
  car.rotation.y = 0;
  scene.add(car);
  return car;
}

export function populateTraffic(THREE, scene) {
  const rng = seededRandom(CITY.seed + 88);
  const cars = [];
  const roads = [-204, -170, -136, -102, -68, -34, 0, 34, 68, 102, 136, 170];
  for (let i = 0; i < 12; i++) {
    const horizontal = rng() > 0.44;
    const lane = roads[Math.floor(rng() * roads.length)] + (rng() > 0.5 ? 2.7 : -2.7);
    const vehicle = createVehicle(THREE, VEHICLE_COLORS[Math.floor(rng() * VEHICLE_COLORS.length)], rng() > 0.86 ? 'van' : 'coupe', false);
    const dir = rng() > 0.5 ? 1 : -1;
    vehicle.userData.route = horizontal ? 'horizontal' : 'vertical';
    vehicle.userData.lane = lane;
    vehicle.userData.dir = dir;
    vehicle.userData.speed = 7 + rng() * 9;
    if (horizontal) {
      vehicle.position.set(-250 + rng() * 500, 0, lane);
      vehicle.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    } else {
      vehicle.position.set(lane, 0, -250 + rng() * 500);
      vehicle.rotation.y = dir > 0 ? 0 : Math.PI;
    }
    scene.add(vehicle);
    cars.push(vehicle);
  }
  return cars;
}

export function updateTraffic(cars, delta, phase = 0) {
  for (const car of cars) {
    const speed = car.userData.speed * (0.9 + Math.sin(phase * 0.2 + car.position.z) * 0.05);
    if (car.userData.route === 'horizontal') {
      car.position.x += car.userData.dir * speed * delta;
      if (car.position.x > 260) car.position.x = -260;
      if (car.position.x < -260) car.position.x = 260;
    } else {
      car.position.z += car.userData.dir * speed * delta;
      if (car.position.z > 260) car.position.z = -260;
      if (car.position.z < -260) car.position.z = 260;
    }
  }
}

export function driveVehicle(player, input, delta, onFoot, buildings = []) {
  const speed = player.userData.speed;
  if (onFoot) return;
  const previous = { x: player.position.x, z: player.position.z };
  const throttle = (input.down('KeyW') || input.down('ArrowUp') ? 1 : 0) - (input.down('KeyS') || input.down('ArrowDown') ? 1 : 0);
  const steer = (input.down('KeyA') || input.down('ArrowLeft') ? 1 : 0) - (input.down('KeyD') || input.down('ArrowRight') ? 1 : 0);
  player.userData.speed = clamp(speed + throttle * 23 * delta - speed * 0.9 * delta, -13, 36);
  if (input.down('Space')) player.userData.speed *= Math.pow(0.82, delta * 60);
  player.userData.heading += steer * Math.sign(speed || 1) * (0.95 + Math.abs(speed) * 0.025) * delta;
  player.rotation.y = player.userData.heading;
  player.position.x += Math.sin(player.userData.heading) * player.userData.speed * delta;
  player.position.z += Math.cos(player.userData.heading) * player.userData.speed * delta;
  player.position.x = clamp(player.position.x, -CITY.bounds + 3, 193);
  player.position.z = clamp(player.position.z, -CITY.bounds + 3, CITY.bounds - 3);
  const hit = buildings.some(block => Math.abs(player.position.x - block.x) < block.width / 2 + 1.15 && Math.abs(player.position.z - block.z) < block.depth / 2 + 1.7);
  if (hit) {
    player.position.x = previous.x;
    player.position.z = previous.z;
    player.userData.speed *= -0.24;
    player.userData.integrity = Math.max(0, player.userData.integrity - 5);
  }
}

export function getOut(player, pedestrian) {
  const angle = player.userData.heading;
  pedestrian.position.set(player.position.x + Math.cos(angle) * 2.1, 0, player.position.z - Math.sin(angle) * 2.1);
  pedestrian.rotation.y = angle + Math.PI / 2;
  pedestrian.visible = true;
  player.userData.speed = 0;
  player.visible = false;
}

export function enterVehicle(player, pedestrian) {
  player.position.set(pedestrian.position.x, 0, pedestrian.position.z);
  player.visible = true;
  pedestrian.position.y = -100;
  pedestrian.visible = false;
}
