export const CHAPTERS = [
  { name: 'A Favor in Palma', act: 'ACT I · FIRST LIGHT', type: 'meet', district: 'Marina', blurb: 'Meet Nico at the Palma marina. Keep the engine warm.', x: 42, z: -4, reward: 350 },
  { name: 'Borrowed Keys', act: 'ACT I · FIRST LIGHT', type: 'steal', district: 'Old Town', blurb: 'Find the red Solano coupe and bring it back to Nico.', x: -48, z: 64, reward: 450 },
  { name: 'Window Shopping', act: 'ACT I · FIRST LIGHT', type: 'tail', district: 'Avenida', blurb: 'Stay close to the courier. Do not let him spot you.', x: 12, z: -96, reward: 550 },
  { name: 'Blue Hour Run', act: 'ACT I · FIRST LIGHT', type: 'race', district: 'Boardwalk', blurb: 'Beat the sunset timer. Three turns, no excuses.', x: 148, z: 32, reward: 650 },
  { name: 'Night Delivery', act: 'ACT II · OPEN WATER', type: 'timed', district: 'Coconut Heights', blurb: 'Get the package to Lila before the sirens arrive.', x: -112, z: -132, reward: 700 },
  { name: 'No Loose Ends', act: 'ACT II · OPEN WATER', type: 'shootout', district: 'Glass Market', blurb: 'Clear the yard. Use the cars for cover.', x: -16, z: 112, reward: 850 },
  { name: 'The Long Look', act: 'ACT II · OPEN WATER', type: 'tail', district: 'Coast Road', blurb: 'Follow the black sedan to the ocean road.', x: 136, z: -114, reward: 900 },
  { name: 'Open House', act: 'ACT II · OPEN WATER', type: 'heist', district: 'Palma Towers', blurb: 'Plant the charges, take the ledger, and move.', x: -46, z: -26, reward: 1100 },
  { name: 'Tidal Lock', act: 'ACT II · OPEN WATER', type: 'escape', district: 'Old Port', blurb: 'Lose the search and reach the pier alive.', x: 178, z: -62, reward: 1250 },
  { name: 'A Narrow Margin', act: 'ACT III · THE LAST SUMMER', type: 'delivery', district: 'South Causeway', blurb: 'Cross the whole city before the bridge lifts.', x: 20, z: 188, reward: 1500 },
  { name: 'Everything Burns', act: 'ACT III · THE LAST SUMMER', type: 'shootout', district: 'Crown Hotel', blurb: 'The deal is gone bad. Get Mara out of the lobby.', x: -76, z: 8, reward: 1850 },
  { name: 'Last Light', act: 'ACT III · THE LAST SUMMER', type: 'finale', district: 'Palma Pier', blurb: 'Make one final choice before the tide comes in.', x: 186, z: -48, reward: 3000 },
];

const verbs = {
  meet: 'Drive to the marina marker', steal: 'Find the marked coupe', tail: 'Reach the courier marker', race: 'Reach the start line', timed: 'Deliver the package', shootout: 'Clear the marked yard', heist: 'Reach the tower', escape: 'Reach the pier and lose the heat', delivery: 'Make the coast-road delivery', finale: 'Meet Mara at the end of the pier',
};

export function createMissions(progress = {}) {
  return { index: Math.min(progress.chapter ?? 0, CHAPTERS.length - 1), completed: progress.completed ?? [], active: false, objective: null, timer: 0, kills: 0 };
}

export function currentChapter(state) { return CHAPTERS[state.index]; }

export function startChapter(state, index = state.index) {
  state.index = Math.max(0, Math.min(CHAPTERS.length - 1, index));
  const chapter = currentChapter(state);
  state.active = true;
  state.timer = ['race', 'timed', 'delivery'].includes(chapter.type) ? 92 : 0;
  state.kills = 0;
  state.objective = { x: chapter.x, z: chapter.z };
  return chapter;
}

export function updateMission(state, actor, dt, wanted, onComplete, onFail) {
  if (!state.active) return;
  const chapter = currentChapter(state);
  if (state.timer > 0) {
    state.timer -= dt;
    if (state.timer <= 0) {
      state.active = false;
      onFail(chapter);
      return;
    }
  }
  if (chapter.type === 'shootout' && state.kills < 3) return;
  if (chapter.type === 'escape' && wanted > 0) return;
  const distance = Math.hypot(actor.position.x - state.objective.x, actor.position.z - state.objective.z);
  if (distance < (chapter.type === 'race' ? 9 : 7)) {
    state.active = false;
    state.completed.push(state.index);
    onComplete(chapter);
    if (state.index < CHAPTERS.length - 1) state.index += 1;
  }
}

export function objectiveText(state) {
  if (!state.active) return 'M  OPEN CHAPTER SELECT · FIND SIDE WORK AROUND THE CITY';
  const chapter = currentChapter(state);
  if (chapter.type === 'shootout') return `CLEAR THE YARD · ${Math.max(0, 3 - state.kills)} HOSTILES LEFT`;
  if (chapter.type === 'escape') return state.timer ? `LOSE THE SEARCH · ${Math.ceil(state.timer)}s` : 'REACH THE PIER AND SHAKE THE TAIL';
  if (state.timer) return `${verbs[chapter.type]} · ${Math.ceil(state.timer)}s`;
  return `${verbs[chapter.type]} · ${Math.floor(Math.hypot(state.objective.x, state.objective.z))}m`;
}
