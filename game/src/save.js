const SAVE_KEY = 'sunline-palmar-save-v1';

export function loadSave() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY) ?? '{}');
    return {
      chapter: Math.max(0, Math.min(11, Number(data.chapter) || 0)),
      completed: Array.isArray(data.completed) ? data.completed : [],
      cash: Math.max(0, Number(data.cash) || 2450),
      packages: Array.isArray(data.packages) ? data.packages : [],
      paint: Number(data.paint) || 0x37a9a0,
      clothes: Number(data.clothes) || 0,
      weapons: Array.isArray(data.weapons) ? data.weapons : ['coastline'],
      weapon: typeof data.weapon === 'string' ? data.weapon : 'coastline',
      quality: data.quality !== false,
      volume: Number.isFinite(data.volume) ? data.volume : 0.16,
      x: Number.isFinite(data.x) ? data.x : 12,
      z: Number.isFinite(data.z) ? data.z : 12,
      heading: Number.isFinite(data.heading) ? data.heading : 0,
    };
  } catch {
    return { chapter: 0, completed: [], cash: 2450, packages: [], paint: 0x37a9a0, clothes: 0, weapons: ['coastline'], weapon: 'coastline', quality: true, volume: 0.16, x: 12, z: 12, heading: 0 };
  }
}

export function saveGame(state) {
  const record = {
    chapter: state.missions.index,
    completed: state.missions.completed,
    cash: state.cash,
    packages: [...state.activities.collected],
    paint: state.paint,
    clothes: state.clothes,
    weapons: [...state.weapons],
    weapon: state.weapon,
    quality: state.quality,
    volume: state.volume,
    x: state.player.position.x,
    z: state.player.position.z,
    heading: state.player.userData.heading,
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(record)); } catch { /* private mode can disable storage */ }
}
