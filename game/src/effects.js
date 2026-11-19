export function createEffects(THREE, scene) {
  const effects = [];
  const smokeGeo = new THREE.SphereGeometry(0.23, 7, 6);
  const flashGeo = new THREE.SphereGeometry(0.36, 8, 7);
  function burst(position, color = 0xffb66d, size = 1, count = 9) {
    for (let i = 0; i < count; i++) {
      const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 });
      const particle = new THREE.Mesh(i % 3 === 0 ? flashGeo : smokeGeo, material);
      particle.scale.setScalar(0.35 + Math.random() * size * 0.65);
      particle.position.copy(position);
      particle.position.x += (Math.random() - 0.5) * 0.7;
      particle.position.z += (Math.random() - 0.5) * 0.7;
      scene.add(particle);
      effects.push({ particle, velocity: new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 3, (Math.random() - 0.5) * 3), life: 0.3 + Math.random() * 0.7, maxLife: 1 });
    }
  }
  function skid(position) {
    for (const side of [-1, 1]) {
      const particle = new THREE.Mesh(smokeGeo, new THREE.MeshBasicMaterial({ color: 0xd6d8ce, transparent: true, opacity: 0.22 }));
      particle.position.set(position.x + side * 0.9, 0.22, position.z);
      particle.scale.setScalar(0.8);
      scene.add(particle);
      effects.push({ particle, velocity: new THREE.Vector3(side * 0.28, 0.9, -0.2), life: 0.7, maxLife: 0.7 });
    }
  }
  function update(delta) {
    for (let i = effects.length - 1; i >= 0; i--) {
      const effect = effects[i];
      effect.life -= delta;
      effect.particle.position.addScaledVector(effect.velocity, delta);
      effect.particle.scale.multiplyScalar(1 + delta * 1.2);
      effect.particle.material.opacity = Math.max(0, effect.life / effect.maxLife * 0.85);
      if (effect.life <= 0) {
        scene.remove(effect.particle);
        effect.particle.material.dispose();
        effects.splice(i, 1);
      }
    }
  }
  return { burst, skid, update };
}
