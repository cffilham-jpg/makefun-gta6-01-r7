export const CITY = {
  name: 'Palma Coast',
  bounds: 260,
  roadStep: 34,
  blockSize: 26,
  waterX: 196,
  beachStart: 145,
  seed: 73129,
  dayLength: 210,
  playerStart: { x: 2, z: 12 },
};

export const PALETTE = {
  road: 0x35434a,
  sidewalk: 0xc9bda0,
  sand: 0xd4b780,
  sea: 0x168b91,
  seaDeep: 0x12636f,
  cream: 0xf5d8aa,
  palm: 0x387d62,
};

export const VEHICLE_COLORS = [0xd85f4b, 0xe3b949, 0x40a29b, 0x5278a3, 0xe3ded0, 0x373c47, 0xb76d8e];

export function seededRandom(seed = CITY.seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function distance2(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}
