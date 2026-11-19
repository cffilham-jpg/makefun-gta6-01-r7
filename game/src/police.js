import { createVehicle } from './vehicles.js';

export function createPolice(THREE, scene) {
  return Array.from({ length: 4 }, (_, index) => {
    const car = createVehicle(THREE, index % 2 ? 0x252f3d : 0xe2e1d4, 'police');
    car.visible = false;
    scene.add(car);
    return car;
  });
}

export function createWanted() {
  return { level: 0, heat: 0, cooldown: 0, roadblock: null };
}

export function raiseWanted(wanted, amount = 1) {
  wanted.level = Math.min(5, Math.max(wanted.level, amount));
  wanted.heat = 32 + wanted.level * 12;
  wanted.cooldown = 0;
}

export function updatePolice(cars, wanted, player, dt, elapsed) {
  const count = wanted.level ? Math.min(cars.length, Math.ceil(wanted.level / 1.4)) : 0;
  const heading = player.visible ? player.userData.heading : 0;
  for (let i = 0; i < cars.length; i++) {
    const car = cars[i];
    car.visible = i < count;
    if (i >= count) continue;
    const angle = elapsed * 0.55 + i * Math.PI * 2 / Math.max(1, count);
    const radius = wanted.level >= 4 && i === count - 1 ? 17 : 27 + i * 5;
    const goalX = player.position.x + Math.cos(angle) * radius;
    const goalZ = player.position.z + Math.sin(angle) * radius;
    const dx = goalX - car.position.x;
    const dz = goalZ - car.position.z;
    const distance = Math.hypot(dx, dz) || 1;
    const pace = 12 + wanted.level * 2.9;
    const travel = Math.min(distance, pace * dt);
    car.position.x += dx / distance * travel;
    car.position.z += dz / distance * travel;
    car.position.y = 0;
    car.rotation.y = Math.atan2(dx, dz);
    if (wanted.level >= 5 && i === count - 1) {
      const across = Math.atan2(Math.sin(heading + Math.PI / 2), Math.cos(heading + Math.PI / 2));
      car.position.x = player.position.x + Math.sin(across) * 16;
      car.position.z = player.position.z + Math.cos(across) * 16;
      car.rotation.y = across;
    }
  }
  if (wanted.level > 0) {
    wanted.heat = Math.max(0, wanted.heat - dt * (player.visible ? 0.38 : 0.7));
    wanted.cooldown += dt;
    if (wanted.heat <= 0) wanted.level = Math.max(0, wanted.level - 1);
  }
}

export function policePressure(cars, wanted, player, bump, damage) {
  if (!player.visible) return;
  for (const car of cars) {
    if (!car.visible) continue;
    const distance = Math.hypot(player.position.x - car.position.x, player.position.z - car.position.z);
    if (distance < 3.2 && Math.abs(player.userData.speed) > 2) {
      player.userData.integrity = Math.max(0, player.userData.integrity - (wanted.level > 2 ? 13 : 7));
      player.userData.speed *= -0.25;
      bump(0.5);
      damage();
    }
  }
}
