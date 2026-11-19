import { CITY, PALETTE, seededRandom } from './config.js';

const towers = [0xb7a78f, 0xd5c4a5, 0xc1b99e, 0x8ca0a0, 0xe0c7a4, 0xafa89d, 0x99abb0, 0xd7b696];

function box(THREE, scene, dimensions, position, material, shadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...dimensions), material);
  mesh.position.set(...position);
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function facadeTextures(THREE) {
  return towers.map((tone, variant) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const color = `#${tone.toString(16).padStart(6, '0')}`;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = 'rgba(46,57,57,.34)';
    ctx.fillRect(0, 0, 256, 18);
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 7; col++) {
        const shade = (row + col + variant) % 5 === 0 ? '#d8bd89' : (col + variant) % 2 ? '#385968' : '#59757a';
        ctx.fillStyle = shade;
        ctx.fillRect(13 + col * 34, 22 + row * 28, 22, 18);
        ctx.fillStyle = 'rgba(233,218,186,.28)';
        ctx.fillRect(14 + col * 34, 22 + row * 28, 20, 2);
      }
    }
    ctx.fillStyle = 'rgba(48,51,47,.2)';
    for (let y = 0; y < 256; y += 28) ctx.fillRect(0, y + 19, 256, 2);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 2;
    return texture;
  });
}

function building(THREE, scene, rng, x, z, district, facades, batches) {
  const downtown = district === 'downtown';
  const beach = district === 'beach';
  const width = 11 + rng() * 4;
  const depth = 11 + rng() * 4;
  const height = downtown ? 24 + rng() * 78 : beach ? 9 + rng() * 18 : 8 + rng() * 16;
  const style = Math.floor(rng() * facades.length);
  batches[style].push({ x, y: height / 2, z, width, height, depth });
  if (beach) {
    const awning = new THREE.Mesh(new THREE.BoxGeometry(width * 0.78, 0.2, 1.2), new THREE.MeshStandardMaterial({ color: rng() > 0.5 ? 0xe6d2a4 : 0xc56d54 }));
    awning.position.set(x, 3.2, z + depth / 2 + 0.55);
    scene.add(awning);
  }
  if (downtown && height > 55) {
    const crown = new THREE.Mesh(new THREE.BoxGeometry(width * 0.6, 1.2, depth * 0.6), new THREE.MeshStandardMaterial({ color: 0xe4d5b6, metalness: 0.28 }));
    crown.position.set(x, height + 0.6, z);
    scene.add(crown);
  }
}

function palm(THREE, scene, x, z, scale = 1) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * scale, 0.38 * scale, 7 * scale, 7), new THREE.MeshStandardMaterial({ color: 0x846344, roughness: 0.95 }));
  trunk.position.set(x, 3.5 * scale, z);
  trunk.castShadow = true;
  scene.add(trunk);
  const leaves = new THREE.Group();
  leaves.position.set(x, 7 * scale, z);
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(1.25 * scale, 7 * scale, 5), new THREE.MeshStandardMaterial({ color: [0x397957, 0x53835b, 0x2d6e60][i % 3], roughness: 0.88 }));
    leaf.rotation.z = -Math.PI / 2;
    leaf.rotation.y = i * Math.PI * 2 / 7;
    leaf.position.set(Math.cos(i * Math.PI * 2 / 7) * 1.25 * scale, 1.15 * scale, Math.sin(i * Math.PI * 2 / 7) * 1.25 * scale);
    leaves.add(leaf);
  }
  scene.add(leaves);
}

function streetLamp(THREE, scene, x, z) {
  const metal = new THREE.MeshStandardMaterial({ color: 0x404b4b, metalness: 0.58, roughness: 0.45 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 7, 8), metal);
  pole.position.set(x, 3.5, z);
  scene.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.12), metal);
  arm.position.set(x + 0.65, 6.85, z);
  scene.add(arm);
  const glow = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.2, 0.35), new THREE.MeshBasicMaterial({ color: 0xffd68c }));
  glow.position.set(x + 1.35, 6.7, z);
  scene.add(glow);
}

export function buildCity(THREE, scene) {
  const rng = seededRandom();
  const facades = facadeTextures(THREE);
  const facadeMaterials = facades.map(map => new THREE.MeshStandardMaterial({ map, color: 0xffffff, roughness: 0.82, metalness: 0.04 }));
  const buildingBatches = facades.map(() => []);
  const buildings = [];
  const palmItems = [];
  const roadMat = new THREE.MeshStandardMaterial({ color: PALETTE.road, roughness: 0.94 });
  const curbMat = new THREE.MeshStandardMaterial({ color: PALETTE.sidewalk, roughness: 0.9 });
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0xe3c78c, transparent: true, opacity: 0.78 });
  const intersections = [];
  for (let p = -CITY.bounds; p <= CITY.bounds; p += CITY.roadStep) {
    intersections.push(p);
  }
  const flat = new THREE.PlaneGeometry(CITY.bounds * 2, 12);
  const roadHorizontal = new THREE.InstancedMesh(flat, roadMat, intersections.length);
  const roadVertical = new THREE.InstancedMesh(flat, roadMat, intersections.length);
  const curbHorizontal = new THREE.InstancedMesh(new THREE.PlaneGeometry(CITY.bounds * 2, 3), curbMat, intersections.length);
  const curbVertical = new THREE.InstancedMesh(new THREE.PlaneGeometry(CITY.bounds * 2, 3), curbMat, intersections.length);
  const roadTransform = new THREE.Object3D();
  for (const [index, road] of intersections.entries()) {
    roadTransform.rotation.set(-Math.PI / 2, 0, 0);
    roadTransform.position.set(0, 0.005, road);
    roadTransform.updateMatrix();
    roadHorizontal.setMatrixAt(index, roadTransform.matrix);
    roadTransform.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    roadTransform.position.set(road, 0.006, 0);
    roadTransform.updateMatrix();
    roadVertical.setMatrixAt(index, roadTransform.matrix);
    roadTransform.rotation.set(-Math.PI / 2, 0, 0);
    roadTransform.position.set(0, 0.014, road + 7.5);
    roadTransform.updateMatrix();
    curbHorizontal.setMatrixAt(index, roadTransform.matrix);
    roadTransform.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    roadTransform.position.set(road + 7.5, 0.014, 0);
    roadTransform.updateMatrix();
    curbVertical.setMatrixAt(index, roadTransform.matrix);
  }
  scene.add(roadHorizontal, roadVertical, curbHorizontal, curbVertical);
  const dashPositions = [];
  for (let p = -CITY.bounds; p <= CITY.bounds; p += CITY.roadStep) for (let dash = -CITY.bounds; dash < CITY.bounds; dash += 8) dashPositions.push([dash, 0.02, p, false], [p, 0.02, dash, true]);
  const dashMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(3.2, 0.13), stripeMat, dashPositions.length);
  const stamp = new THREE.Object3D();
  dashPositions.forEach(([x, y, z, vertical], index) => {
    stamp.position.set(x, y, z);
    stamp.rotation.set(-Math.PI / 2, 0, vertical ? Math.PI / 2 : 0);
    stamp.updateMatrix();
    dashMesh.setMatrixAt(index, stamp.matrix);
  });
  scene.add(dashMesh);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(53, CITY.bounds * 2), new THREE.MeshStandardMaterial({ color: PALETTE.sand, roughness: 0.98 }));
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(169, -0.015, 0);
  scene.add(sand);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(125, 1000), new THREE.MeshStandardMaterial({ color: PALETTE.sea, roughness: 0.22, metalness: 0.12, transparent: true, opacity: 0.95 }));
  water.rotation.x = -Math.PI / 2;
  water.position.set(243, -0.1, 0);
  scene.add(water);
  const waves = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x7dc9bc, transparent: true, opacity: 0.42 }), 36);
  for (let wave = 0; wave < 36; wave++) {
    roadTransform.position.set(208 + rng() * 48, 0.04, -250 + rng() * 500);
    roadTransform.rotation.set(0, 0, 0);
    roadTransform.scale.set(35 + rng() * 45, 0.045, 0.18);
    roadTransform.updateMatrix();
    waves.setMatrixAt(wave, roadTransform.matrix);
  }
  scene.add(waves);
  const pier = new THREE.Mesh(new THREE.BoxGeometry(35, 0.65, 95), new THREE.MeshStandardMaterial({ color: 0x967b5d, roughness: 0.95 }));
  pier.position.set(190, 1.3, -55);
  scene.add(pier);
  const pierPosts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.27, 0.32, 2.4, 8), new THREE.MeshStandardMaterial({ color: 0x705a45 }), 16);
  for (let index = 0; index < 16; index++) {
    const row = Math.floor(index / 2);
    roadTransform.position.set(index % 2 ? 202 : 178, 0.1, -96 + row * 11);
    roadTransform.scale.set(1, 1, 1);
    roadTransform.updateMatrix();
    pierPosts.setMatrixAt(index, roadTransform.matrix);
  }
  scene.add(pierPosts);
  for (let x = -CITY.bounds + CITY.roadStep / 2 + 3; x < CITY.beachStart - 31; x += CITY.roadStep) {
    for (let z = -CITY.bounds + CITY.roadStep / 2 + 3; z < CITY.bounds - CITY.roadStep / 2; z += CITY.roadStep) {
      if (x > 185) continue;
      const district = Math.abs(x) < 65 && z < 80 ? 'downtown' : x > 80 ? 'beach' : 'suburbs';
      buildings.push({ x, z, width: 13, depth: 13, district });
      building(THREE, scene, rng, x, z, district, facades, buildingBatches);
    }
  }
  const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
  const blockTransform = new THREE.Object3D();
  for (const [style, entries] of buildingBatches.entries()) {
    const batch = new THREE.InstancedMesh(blockGeometry, facadeMaterials[style], entries.length);
    for (const [index, entry] of entries.entries()) {
      blockTransform.position.set(entry.x, entry.y, entry.z);
      blockTransform.scale.set(entry.width, entry.height, entry.depth);
      blockTransform.updateMatrix();
      batch.setMatrixAt(index, blockTransform.matrix);
    }
    batch.castShadow = true;
    batch.receiveShadow = true;
    scene.add(batch);
  }
  for (let x = -155; x < 150; x += 19) {
    for (const z of [-149, -83, -16, 51, 117, 150]) {
      palmItems.push({ x: x + rng() * 5, z: z + rng() * 4, scale: 0.78 + rng() * 0.42 });
    }
  }
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x846344, roughness: 0.95 });
  const trunkBatch = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.38, 7, 7), trunkMaterial, palmItems.length);
  const leafMaterials = [0x397957, 0x53835b, 0x2d6e60].map(color => new THREE.MeshStandardMaterial({ color, roughness: 0.88 }));
  const leafBatches = leafMaterials.map(material => new THREE.InstancedMesh(new THREE.ConeGeometry(1.25, 7, 5), material, palmItems.length * 7));
  const transform = new THREE.Object3D();
  for (const [index, tree] of palmItems.entries()) {
    transform.position.set(tree.x, 3.5 * tree.scale, tree.z);
    transform.scale.setScalar(tree.scale);
    transform.rotation.set(0, 0, 0);
    transform.updateMatrix();
    trunkBatch.setMatrixAt(index, transform.matrix);
    for (let leafIndex = 0; leafIndex < 7; leafIndex++) {
      const angle = leafIndex * Math.PI * 2 / 7;
      transform.position.set(tree.x + Math.cos(angle) * 1.25 * tree.scale, 8.15 * tree.scale, tree.z + Math.sin(angle) * 1.25 * tree.scale);
      transform.scale.setScalar(tree.scale);
      transform.rotation.set(0, angle, -Math.PI / 2);
      transform.updateMatrix();
      leafBatches[leafIndex % 3].setMatrixAt(index * 7 + leafIndex, transform.matrix);
    }
  }
  scene.add(trunkBatch, ...leafBatches);
  const lamps = [];
  for (let x = -145; x < 155; x += 68) for (const z of [-26, 42, 110]) lamps.push([x + 8, z + 8]);
  const lampMetal = new THREE.MeshStandardMaterial({ color: 0x404b4b, metalness: 0.58, roughness: 0.45 });
  const lampPole = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.11, 0.16, 7, 6), lampMetal, lamps.length);
  const lampArm = new THREE.InstancedMesh(new THREE.BoxGeometry(1.6, 0.12, 0.12), lampMetal, lamps.length);
  const lampGlow = new THREE.InstancedMesh(new THREE.BoxGeometry(0.65, 0.2, 0.35), new THREE.MeshBasicMaterial({ color: 0xffd68c }), lamps.length);
  for (const [index, [x, z]] of lamps.entries()) {
    roadTransform.position.set(x, 3.5, z);
    roadTransform.rotation.set(0, 0, 0);
    roadTransform.scale.setScalar(1);
    roadTransform.updateMatrix();
    lampPole.setMatrixAt(index, roadTransform.matrix);
    roadTransform.position.set(x + 0.65, 6.85, z);
    roadTransform.updateMatrix();
    lampArm.setMatrixAt(index, roadTransform.matrix);
    roadTransform.position.set(x + 1.35, 6.7, z);
    roadTransform.updateMatrix();
    lampGlow.setMatrixAt(index, roadTransform.matrix);
  }
  scene.add(lampPole, lampArm, lampGlow);
  const signPositions = [];
  for (let i = 0; i < 8; i++) {
    const x = -138 + rng() * 290;
    const z = -215 + rng() * 420;
    if (x < 195) {
      signPositions.push([x, z, i]);
    }
  }
  const signBoard = new THREE.InstancedMesh(new THREE.BoxGeometry(2.2, 1.15, 0.12), new THREE.MeshStandardMaterial({ color: 0xe1ad55, emissive: 0x1b1009 }), signPositions.length);
  const signPost = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.08, 0.1, 4.5, 6), new THREE.MeshStandardMaterial({ color: 0x454847 }), signPositions.length);
  for (const [index, [x, z, palette]] of signPositions.entries()) {
    roadTransform.position.set(x, 4.9, z);
    roadTransform.updateMatrix();
    signBoard.setMatrixAt(index, roadTransform.matrix);
    signBoard.setColorAt(index, new THREE.Color([0xc75e49, 0x367e79, 0xe1ad55][palette % 3]));
    roadTransform.position.set(x, 2.1, z);
    roadTransform.updateMatrix();
    signPost.setMatrixAt(index, roadTransform.matrix);
  }
  scene.add(signBoard, signPost);
  return { buildings, palm, streetLamp };
}

export function districtAt(x, z) {
  if (x > 95) return 'Marina & Boardwalk';
  if (Math.abs(x) < 75 && z < 100) return 'Palma Downtown';
  return 'Coconut Heights';
}
