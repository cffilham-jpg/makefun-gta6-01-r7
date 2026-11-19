export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  const pointer = { x: 0, y: 0, fire: false };
  window.addEventListener('keydown', event => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
    if (!held.has(event.code)) pressed.add(event.code);
    held.add(event.code);
  });
  window.addEventListener('keyup', event => held.delete(event.code));
  window.addEventListener('blur', () => held.clear());
  canvas.addEventListener('pointermove', event => { pointer.x = event.clientX; pointer.y = event.clientY; });
  canvas.addEventListener('pointerdown', () => { pointer.fire = true; });
  window.addEventListener('pointerup', () => { pointer.fire = false; });
  return {
    down(code) { return held.has(code); },
    tap(code) { const hit = pressed.has(code); pressed.delete(code); return hit; },
    pointer,
    clear() { pressed.clear(); },
  };
}
