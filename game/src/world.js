import { CITY } from './config.js';

export function createWorld(THREE) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe29a68);
  scene.fog = new THREE.FogExp2(0xc58868, 0.00175);
  const ambient = new THREE.HemisphereLight(0xd6edff, 0x514a42, 2.55);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffd294, 3.1);
  sun.position.set(-95, 135, -42);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -150;
  sun.shadow.camera.right = 150;
  sun.shadow.camera.top = 150;
  sun.shadow.camera.bottom = -150;
  sun.shadow.bias = -0.00035;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x93c9d0, 0.65);
  fill.position.set(110, 45, 75);
  scene.add(fill);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(CITY.bounds * 2, CITY.bounds * 2), new THREE.MeshStandardMaterial({ color: 0x758471, roughness: 0.92 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.08;
  ground.receiveShadow = true;
  scene.add(ground);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(800, 32, 20), new THREE.MeshBasicMaterial({ color: 0xd58f70, side: THREE.BackSide }));
  scene.add(sky);
  return { scene, sun, ambient, fill, ground, sky };
}

export function updateSun(world, time) {
  const phase = (time % 210) / 210;
  const angle = phase * Math.PI * 2;
  const daylight = Math.max(0.12, Math.min(0.96, 0.52 - Math.sin(angle + 0.5) * 0.42));
  world.sun.position.set(Math.cos(angle) * -125, 32 + daylight * 125, Math.sin(angle) * 110);
  world.sun.intensity = 1.25 + daylight * 2.8;
  world.ambient.intensity = 1.25 + daylight * 1.5;
  world.scene.fog.color.setHSL(0.045 + daylight * 0.01, 0.29, 0.32 + daylight * 0.27);
  world.scene.background.copy(world.scene.fog.color);
  world.sky.material.color.copy(world.scene.fog.color);
  return { phase, daylight };
}
