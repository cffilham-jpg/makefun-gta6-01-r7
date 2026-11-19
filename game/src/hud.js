import { CHAPTERS, currentChapter, objectiveText } from './missions.js';
import { districtAt } from './city.js';

export function createHud() {
  return {
    map: document.querySelector('#map'),
    missionTitle: document.querySelector('#missionTitle'),
    missionText: document.querySelector('#missionText'),
    missionTag: document.querySelector('#missionTag'),
    district: document.querySelector('#district'),
    clock: document.querySelector('#clock'),
    cash: document.querySelector('#cash'),
    rep: document.querySelector('#rep'),
    wanted: document.querySelector('#wanted'),
    condition: document.querySelector('#condition'),
    toast: document.querySelector('#toast'),
    menu: document.querySelector('#menu'),
    menuTitle: document.querySelector('#menuTitle'),
    menuText: document.querySelector('#menuText'),
    menuActions: document.querySelector('#menuActions'),
    toastTimer: 0,
  };
}

export function updateHud(hud, state, elapsed, activityTarget, traffic, police) {
  const chapter = currentChapter(state.missions);
  const x = state.player.position.x;
  const z = state.player.position.z;
  hud.district.textContent = districtAt(x, z).toUpperCase();
  const exactHour = (19 + elapsed * 24 / 210) % 24;
  const hour = Math.floor(exactHour);
  const minute = Math.floor((exactHour % 1) * 60).toString().padStart(2, '0');
  hud.clock.textContent = `${hour.toString().padStart(2, '0')}:${minute} · ${hour >= 20 || hour < 6 ? 'COAST AFTER DARK' : 'GOLDEN HOUR'}`;
  hud.cash.textContent = `$${state.cash.toLocaleString('en-US')}`;
  hud.rep.textContent = `REP ${String(1 + state.missions.completed.length + Math.floor(state.activities.collected.size / 4)).padStart(2, '0')}`;
  hud.wanted.textContent = '★'.repeat(state.wanted.level) + '☆'.repeat(5 - state.wanted.level);
  hud.wanted.style.color = state.wanted.level >= 4 ? '#ff6c64' : '#ffd36c';
  hud.condition.textContent = `${Math.round(state.onFoot ? state.health : state.player.userData.integrity)}%`;
  hud.condition.style.color = Number.parseInt(hud.condition.textContent, 10) < 35 ? '#ff7368' : '#f2ead5';
  hud.missionTag.textContent = state.missions.active ? `${chapter.act} · ${chapter.district.toUpperCase()}` : `NEXT · ${chapter.act}`;
  hud.missionTitle.textContent = state.missions.active ? chapter.name : state.missions.completed.length === CHAPTERS.length ? 'Coast at last' : chapter.name;
  hud.missionText.textContent = state.missions.active ? objectiveText(state.missions) : `${chapter.blurb}  ·  M to choose a chapter`;
  if (hud.toastTimer > 0) {
    hud.toastTimer -= 1 / 60;
    hud.toast.classList.add('on');
  } else hud.toast.classList.remove('on');
}

export function showToast(hud, message, audio) {
  hud.toast.textContent = message;
  hud.toastTimer = 2.8;
  if (audio) audio.collect();
}

export function showMenu(hud, title, text, actions) {
  hud.menuTitle.innerHTML = title;
  hud.menuText.textContent = text;
  hud.menuActions.replaceChildren(...actions);
  hud.menu.classList.remove('hidden');
}

export function hideMenu(hud) { hud.menu.classList.add('hidden'); }
