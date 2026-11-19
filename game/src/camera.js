export function createCamera(THREE, renderer) {
  const camera = new THREE.PerspectiveCamera(56, innerWidth / innerHeight, 0.1, 950);
  camera.position.set(0, 13, -20);
  const target = new THREE.Vector3();
  const look = new THREE.Vector3();
  let shake = 0;
  return {
    camera,
    bump(amount = 0.25) { shake = Math.min(1.1, shake + amount); },
    update(player, pedestrian, delta, aiming = false) {
      const isCar = player.visible;
      const actor = isCar ? player : pedestrian;
      const angle = isCar ? player.userData.heading : pedestrian.rotation.y;
      const distance = isCar ? 8.6 : 8.4;
      const height = isCar ? 6.1 : 4.4;
      const backX = Math.sin(angle);
      const backZ = Math.cos(angle);
      target.set(actor.position.x - backX * distance, height, actor.position.z - backZ * distance);
      camera.position.lerp(target, 1 - Math.exp(-delta * 4.2));
      look.set(actor.position.x + backX * (isCar ? 6.2 : 1.4), isCar ? 1.1 : 1.45, actor.position.z + backZ * (isCar ? 6.2 : 1.4));
      look.x += aiming ? backX * 2.5 : 0;
      camera.lookAt(look);
      if (shake > 0.006) {
        camera.position.x += (Math.random() - 0.5) * shake;
        camera.position.y += (Math.random() - 0.5) * shake * 0.7;
        shake *= Math.exp(-delta * 7);
      }
      camera.fov += ((isCar ? 58 : 60) - camera.fov) * Math.min(1, delta * 2);
      camera.updateProjectionMatrix();
    },
    resize() { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); },
  };
}
