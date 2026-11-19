import { buildCity, districtAt } from './city.js';
import { createWorld, updateSun } from './world.js';
import { createCamera } from './camera.js';
import { createInput } from './input.js';
import { createPlayer, populateTraffic, updateTraffic, driveVehicle, getOut, enterVehicle } from './vehicles.js';
import { createPedestrians, updatePedestrians } from './pedestrians.js';
import { createPolice, createWanted, raiseWanted, updatePolice, policePressure } from './police.js';
import { CHAPTERS, createMissions, currentChapter, startChapter, updateMission } from './missions.js';
import { createActivities, createActivityMarkers, createRaceMarkers, updateActivityMarkers, findPackage, beginRace, updateRace, spawnSideJob, updateSideJobs, visibleActivityTarget } from './activities.js';
import { createHostiles, activateHostiles, clearHostiles, updateHostiles, fireWeapon } from './combat.js';
import { createEffects } from './effects.js';
import { createAudio } from './audio.js';
import { loadSave, saveGame } from './save.js';
import { createHud, updateHud, showMenu, hideMenu, showToast } from './hud.js';
import { createMinimap, renderMinimap } from './minimap.js';
import { clamp } from './config.js';

const THREE = window.THREE;
const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 0.72));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const world = createWorld(THREE);
const city = buildCity(THREE, world.scene);
const saved = loadSave();
const player = createPlayer(THREE, world.scene, saved.paint);
player.position.set(saved.x, 0, saved.z);
player.userData.heading = saved.heading;
player.rotation.y = saved.heading;
const traffic = populateTraffic(THREE, world.scene);
const walkers = createPedestrians(THREE, world.scene);
const avatar = walkers[0].root;
avatar.position.set(player.position.x + 2.3, 0, player.position.z - 0.5);
avatar.visible = false;
const sidearm = new THREE.Group();
const weaponBody = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.13, 0.58), new THREE.MeshStandardMaterial({ color: 0x30383a, metalness: 0.55, roughness: 0.37 }));
weaponBody.position.set(0.36, 1.1, 0.42);
const weaponGrip = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.25, 0.16), new THREE.MeshStandardMaterial({ color: 0x463a31, roughness: 0.82 }));
weaponGrip.position.set(0.36, 0.92, 0.23);
sidearm.add(weaponBody, weaponGrip);
world.scene.add(sidearm);
const police = createPolice(THREE, world.scene);
const wanted = createWanted();
const missions = createMissions(saved);
const activities = createActivities();
for (const index of saved.packages) activities.collected.add(index);
const markers = createActivityMarkers(THREE, world.scene);
const races = createRaceMarkers(THREE, world.scene);
const hostiles = createHostiles(THREE, world.scene);
const effects = createEffects(THREE, world.scene);
const audio = createAudio();
audio.setVolume(saved.volume);
const input = createInput(canvas);
const followCamera = createCamera(THREE, renderer);
const hud = createHud();
const minimap = createMinimap(hud.map);
const state = {
  player, avatar, missions, activities, wanted, markers, races, cash: saved.cash,
  clothes: saved.clothes, paint: saved.paint, quality: saved.quality, volume: saved.volume,
  weapons: new Set(saved.weapons), weapon: saved.weapon, fireWait: 0,
  health: 100, onFoot: false, playing: false, paused: false, elapsed: 0, shot: new URLSearchParams(location.search).get('shot'),
};

function actor() { return state.onFoot ? avatar : player; }
function tell(message) { showToast(hud, message, audio); }
function pay(amount, message) { state.cash += amount; tell(`${message} · +$${amount}`); saveGame(state); }
function fail(message) { tell(message); }
function missionDone(chapter) { pay(chapter.reward, `CHAPTER COMPLETE · ${chapter.name}`); if (chapter.type === 'shootout') clearHostiles(hostiles); saveGame(state); }
function enterChapter(index) {
  const chapter = startChapter(missions, index);
  clearHostiles(hostiles);
  if (chapter.type === 'shootout') activateHostiles(hostiles, index);
  state.paused = false;
  hideMenu(hud);
  if (!state.playing) state.playing = true;
  audio.unlock();
  tell(`${chapter.act} · ${chapter.name}`);
}

function makeButton(label, action, secondary = false) {
  const button = document.createElement('button');
  button.textContent = label;
  if (secondary) button.className = 'secondary';
  button.addEventListener('click', action);
  return button;
}

function openChapterSelect() {
  const items = CHAPTERS.map((chapter, index) => {
    const complete = missions.completed.includes(index);
    const button = makeButton(`${complete ? '✓ ' : String(index + 1).padStart(2, '0') + '  '}${chapter.name}`, () => enterChapter(index), !complete);
    const small = document.createElement('small');
    small.textContent = `${chapter.act} · ${chapter.district} · $${chapter.reward.toLocaleString()}`;
    button.append(small);
    return button;
  });
  const grid = document.createElement('div');
  grid.className = 'menu-list';
  grid.replaceChildren(...items);
  showMenu(hud, 'Choose a<br>chapter.', 'Replay a completed chapter or pick up the story anywhere in Palma.', [grid, makeButton('BACK', () => openPause(), true)]);
}

function openSettings() {
  const quality = makeButton(`QUALITY · ${state.quality ? 'HIGH' : 'LOW'}`, () => {
    state.quality = !state.quality;
    renderer.shadowMap.enabled = state.quality;
    renderer.setPixelRatio(Math.min(devicePixelRatio, state.quality ? 0.9 : 0.62));
    openSettings();
  }, true);
  const volume = makeButton(`VOLUME · ${Math.round(state.volume * 100)}%`, () => {
    state.volume = state.volume > 0.08 ? 0 : 0.16;
    audio.setVolume(state.volume);
    openSettings();
  }, true);
  showMenu(hud, 'Set the<br>tone.', 'Settings are saved with your story on this device.', [quality, volume, makeButton('BACK', () => openPause(), true)]);
}

function openPause() {
  state.paused = true;
  showMenu(hud, 'Take a<br>breather.', 'Palma is still here when you are ready.', [
    makeButton('BACK TO PALMA →', () => { state.paused = false; hideMenu(hud); }),
    makeButton('CHAPTER SELECT', openChapterSelect, true),
    makeButton('SETTINGS', openSettings, true),
    makeButton('SAVE CITY', () => { saveGame(state); tell('PALMA SAVED ON THIS DEVICE'); }, true),
  ]);
}

function openShop() {
  const choices = [
    ['TIDAL .45 · $650', 650, () => { state.weapons.add('tidal'); state.weapon = 'tidal'; }],
    ['COASTLINE FIT · $400', 400, () => { state.clothes = (state.clothes + 1) % 5; avatar.userData.clothes = state.clothes; }],
    ['PEARL METALLIC · $500', 500, () => { state.paint = 0xd9d4c2; player.userData.paint.color.setHex(state.paint); }],
    ['MARINA TEAL · $500', 500, () => { state.paint = 0x31a69c; player.userData.paint.color.setHex(state.paint); }],
  ];
  const buttons = choices.map(([name, cost, effect]) => makeButton(name, () => {
    if (state.cash < cost) { tell('NOT ENOUGH CASH'); return; }
    state.cash -= cost;
    effect();
    saveGame(state);
    tell(`PURCHASED · −$${cost}`);
    openShop();
  }, true));
  buttons.push(makeButton('LEAVE SHOP', () => { state.paused = false; hideMenu(hud); }, true));
  showMenu(hud, 'Palm &<br>Chrome.', 'Boutique clothes, a cleaner finish, or something for the glove box.', buttons);
  state.paused = true;
}

function onFootMove(delta) {
  const forward = (input.down('KeyW') || input.down('ArrowUp') ? 1 : 0) - (input.down('KeyS') || input.down('ArrowDown') ? 1 : 0);
  const side = (input.down('KeyD') || input.down('ArrowRight') ? 1 : 0) - (input.down('KeyA') || input.down('ArrowLeft') ? 1 : 0);
  if (forward || side) {
    const angle = avatar.rotation.y;
    const dx = Math.sin(angle) * forward + Math.cos(angle) * side;
    const dz = Math.cos(angle) * forward - Math.sin(angle) * side;
    const length = Math.hypot(dx, dz) || 1;
    avatar.position.x = clamp(avatar.position.x + dx / length * delta * 6.4, -255, 191);
    avatar.position.z = clamp(avatar.position.z + dz / length * delta * 6.4, -255, 255);
    avatar.rotation.y = Math.atan2(dx, dz);
  }
}

function closestItem(items, position, limit) {
  let best = null;
  let distance = limit;
  for (const item of items) {
    const current = Math.hypot(item.x - position.x, item.z - position.z);
    if (current < distance) { distance = current; best = item; }
  }
  return best;
}

function useInteraction() {
  const location = actor().position;
  if (state.onFoot) {
    const nearby = closestItem(traffic.filter(car => car.visible), location, 5.5);
    if (nearby) {
      world.scene.remove(nearby);
      const color = nearby.userData.paint.color.getHex();
      player.userData.paint.color.setHex(color);
      state.paint = color;
      player.position.copy(nearby.position);
      player.rotation.y = nearby.rotation.y;
      player.userData.heading = nearby.rotation.y;
      enterVehicle(player, avatar);
      state.onFoot = false;
      raiseWanted(wanted, Math.max(1, wanted.level));
      tell('VEHICLE ACQUIRED · KEEP IT MOVING');
      return;
    }
    tell('NO CAR CLOSE ENOUGH · WALK TO THE CURB');
  } else {
    getOut(player, avatar);
    state.onFoot = true;
  }
}

function checkInteractions() {
  if (input.tap('Escape')) {
    if (state.paused) { state.paused = false; hideMenu(hud); }
    else openPause();
  }
  if (input.tap('KeyM')) openChapterSelect();
  if (input.tap('KeyE')) useInteraction();
  if (input.tap('KeyJ')) { spawnSideJob(activities, actor().position, 'fare'); tell('TAXI FARE · PICK UP THE PALMA HOTEL GUEST'); }
  if (input.tap('KeyV')) { spawnSideJob(activities, actor().position, 'vigilante'); raiseWanted(wanted, 1); tell('VIGILANTE SHIFT · INTERCEPT THE RUNNER'); }
  if (input.tap('KeyB')) openShop();
  if (input.tap('KeyR')) { if (state.cash >= 350) { state.cash -= 350; player.userData.integrity = 100; tell('BODY REPAIRED · −$350'); saveGame(state); } else tell('NOT ENOUGH CASH FOR REPAIRS'); }
  if (input.tap('Digit1')) { state.weapon = 'coastline'; tell('EQUIPPED · COASTLINE SIDEARM'); }
  if (input.tap('Digit2')) { if (state.weapons.has('tidal')) { state.weapon = 'tidal'; tell('EQUIPPED · TIDAL .45'); } else tell('TIDAL .45 AVAILABLE AT PALM & CHROME'); }
  if (input.tap('Digit3')) { if (state.weapons.has('marina')) { state.weapon = 'marina'; tell('EQUIPPED · MARINA SMG'); } else tell('MARINA SMG · COMPLETE THE GLASS MARKET JOB'); }
}

function checkRaceAndPackages(dt) {
  const current = actor().position;
  if (!activities.race) {
    const race = races.find(item => Math.hypot(item.race.start.x - current.x, item.race.start.z - current.z) < 9);
    if (race && input.tap('KeyF')) { beginRace(activities, race.race); tell(`RACE START · ${race.race.name}`); }
  }
  updateRace(activities, current, dt, pay, fail);
  findPackage(markers, current, activities, (amount, name) => pay(amount, name));
  updateSideJobs(activities, current, dt, pay, tell);
}

function fire() {
  state.fireWait = Math.max(0, state.fireWait - 1 / 60);
  if (state.onFoot && state.fireWait <= 0 && (input.tap('KeyF') || input.pointer.fire)) {
    state.fireWait = state.weapon === 'marina' ? 0.13 : 0.34;
    audio.shot();
    const hit = fireWeapon(THREE, avatar, hostiles, followCamera, target => {
      if (missions.active && currentChapter(missions).type === 'shootout') missions.kills++;
      effects.burst(target.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)), 0xd98b68, 0.9, 7);
      raiseWanted(wanted, Math.min(5, wanted.level + 1));
      followCamera.bump(0.1);
    });
    if (!hit) {
      raiseWanted(wanted, Math.max(1, wanted.level));
      effects.burst(avatar.position.clone().add(new THREE.Vector3(0, 1.5, 1)), 0xffcf78, 0.7, 5);
    }
  }
}

function stageShot() {
  const shot = state.shot;
  if (!shot) return false;
  hideMenu(hud);
  state.playing = true;
  state.onFoot = false;
  if (shot === 'chase') {
    player.position.set(12, 0, 12);
    player.userData.heading = -Math.PI / 2;
    player.rotation.y = -Math.PI / 2;
    player.userData.speed = 12;
    startChapter(missions, 4);
    raiseWanted(wanted, 5);
    state.elapsed = 4;
  } else if (shot === 'shootout') {
    player.position.set(12, 0, 114);
    player.userData.heading = 0;
    player.rotation.y = 0;
    player.visible = false;
    avatar.position.set(12, 0, 114);
    avatar.rotation.y = 0;
    avatar.visible = true;
    state.onFoot = true;
    startChapter(missions, 5);
    activateHostiles(hostiles, 5);
    raiseWanted(wanted, 2);
    state.elapsed = 5;
  } else if (shot === 'beach') {
    player.position.set(110, 0, 12);
    player.userData.heading = Math.PI / 3;
    player.rotation.y = Math.PI / 3;
    player.userData.speed = 0;
    state.elapsed = 210;
  } else if (shot === 'vista') {
    player.visible = true;
    avatar.visible = false;
    player.position.set(12, 0, 114);
    player.userData.heading = 0;
    player.rotation.y = 0;
    player.userData.speed = 0;
    state.elapsed = 145;
  } else return false;
  return true;
}

document.querySelector('#start').addEventListener('click', () => { audio.unlock(); enterChapter(missions.index); });
document.querySelector('#openMissions').addEventListener('click', openChapterSelect);
document.querySelector('#openSettings').addEventListener('click', openSettings);

if (state.shot && !stageShot()) showMenu(hud, 'The city<br>doesn\'t sleep.', 'One last summer on the coast.', [
  makeButton('ENTER THE CITY →', () => enterChapter(missions.index)),
  makeButton('CHAPTER SELECT', openChapterSelect, true),
]);
else if (state.shot) hideMenu(hud);

let last = performance.now();
let autosave = 0;
let sirenPulse = 0;
function frame(now) {
  const delta = Math.min(0.04, (now - last) / 1000);
  last = now;
  if (state.playing && !state.paused) {
    state.elapsed += delta;
    updateSun(world, state.elapsed);
    driveVehicle(player, input, delta, state.onFoot, city.buildings);
    if (state.onFoot) onFootMove(delta);
    else if (Math.abs(player.userData.speed) > 23 && input.down('Space') && Math.random() > 0.83) effects.skid(player.position);
    updateTraffic(traffic, delta, state.elapsed);
    updatePedestrians(walkers, delta, player);
    updatePolice(police, wanted, player, delta, state.elapsed);
    policePressure(police, wanted, player, () => followCamera.bump(0.45), () => effects.burst(player.position.clone().add(new THREE.Vector3(0, 0.7, 0)), 0xff7e47, 1.1, 13));
    updateHostiles(hostiles, actor(), target => {
      if (Math.hypot(target.x - actor().position.x, target.z - actor().position.z) < 25) {
        if (state.onFoot) state.health = Math.max(0, (state.health ?? 100) - 5);
        effects.burst(actor().position.clone().add(new THREE.Vector3(0, 1, 0)), 0xff5d45, 0.7, 6);
      }
    }, delta);
    checkInteractions();
    if (!state.paused) {
      fire();
      checkRaceAndPackages(delta);
      updateMission(missions, actor(), delta, wanted.level, missionDone, chapter => fail(`TIME EXPIRED · ${chapter.name}`));
    }
    updateActivityMarkers(markers, delta, state.elapsed, activities.collected);
    sidearm.visible = state.onFoot;
    sidearm.position.set(avatar.position.x, 0, avatar.position.z);
    sidearm.rotation.y = avatar.rotation.y;
    const target = visibleActivityTarget(activities) ?? (missions.active ? missions.objective : null);
    followCamera.update(player, avatar, delta, state.onFoot);
    audio.engine(player.userData.speed);
    sirenPulse += delta;
    if (wanted.level && sirenPulse > 1.2) { audio.siren(); sirenPulse = 0; }
    autosave += delta;
    if (autosave > 12) { saveGame(state); autosave = 0; }
    const sirens = police.filter(car => car.visible);
    window.__gameProbe = { driving: !state.onFoot, wanted: wanted.level, police: sirens.length, mission: missions.active, missionChapter: missions.index, minimap: Boolean(minimap.context), pedestrians: walkers.filter(walker => walker.root.visible).length, traffic: traffic.filter(car => car.parent).length };
    updateHud(hud, state, state.elapsed, target, traffic, police);
    renderMinimap(minimap, state, target, traffic, police, races);
  } else if (state.playing) {
    followCamera.update(player, avatar, delta, false);
    updateHud(hud, state, state.elapsed, null, traffic, police);
    renderMinimap(minimap, state, null, traffic, police, races);
  }
  effects.update(delta);
  renderer.render(world.scene, followCamera.camera);
  input.clear();
  if (state.shot) window.__shotReady = true;
  requestAnimationFrame(frame);
}

followCamera.resize();
window.addEventListener('resize', () => followCamera.resize());
window.addEventListener('beforeunload', () => saveGame(state));
window.__game = { state, renderer, enterChapter, openChapterSelect, openShop, pause: openPause };
requestAnimationFrame(frame);
