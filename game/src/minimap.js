export function createMinimap(canvas) {
  return { canvas, context: canvas.getContext('2d') };
}

export function renderMinimap(map, state, activityTarget, traffic, police, races) {
  const { canvas, context } = map;
  const size = canvas.width;
  const mid = size / 2;
  const zoom = 0.55;
  context.clearRect(0, 0, size, size);
  context.save();
  context.beginPath();
  context.arc(mid, mid, mid - 2, 0, Math.PI * 2);
  context.clip();
  context.fillStyle = '#1b3435';
  context.fillRect(0, 0, size, size);
  context.fillStyle = '#bda675';
  context.fillRect(mid + (140 - state.player.position.x) * zoom, 0, 70 * zoom, size);
  context.fillStyle = '#146879';
  context.fillRect(mid + (208 - state.player.position.x) * zoom, 0, size, size);
  context.save();
  context.translate(mid, mid);
  context.rotate(-state.player.userData.heading);
  context.translate(-state.player.position.x * zoom, -state.player.position.z * zoom);
  context.strokeStyle = '#84928c';
  context.lineWidth = 4.5;
  for (let road = -238; road <= 238; road += 34) {
    context.beginPath(); context.moveTo(-260, road); context.lineTo(260, road); context.stroke();
    context.beginPath(); context.moveTo(road, -260); context.lineTo(road, 260); context.stroke();
  }
  const marker = (spot, color, radius) => {
    if (!spot) return;
    const x = spot.x * zoom;
    const y = spot.z * zoom;
    if (Math.hypot(x - state.player.position.x * zoom, y - state.player.position.z * zoom) < 138) {
      context.fillStyle = color;
      context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill();
    }
  };
  if (state.missions.active) marker(state.missions.objective, '#f0c872', 4.8);
  marker(activityTarget, '#83f0c8', 4.1);
  for (const car of traffic) {
    if (Math.hypot(car.position.x - state.player.position.x, car.position.z - state.player.position.z) < 78) marker(car.position, '#d0d6c8', 2.3);
  }
  for (const car of police) if (car.visible) marker(car.position, '#ff615e', 3.5);
  for (const spot of state.markers) if (!state.activities.collected.has(spot.index)) marker(spot, '#62dec0', 2.8);
  for (const race of races) marker(race.race.start, '#ffbb6b', 3.1);
  marker({ x: state.player.position.x, z: state.player.position.z }, '#fff5db', 5.8);
  context.restore();
  context.restore();
}
