// ---------- present-day props and settings (bright flat colours, ink outlines) ----------
const PRESENT = {
  teal: '#075056', tealLight: '#2a9d8f', mint: '#cdeae4', ochre: '#f2b84b', coral: '#ef6f5e', sky: '#8ecae6',
  skyLight: '#dff1f8', navy: '#16232a', cream: '#fbf7f0', grass: '#8cc084', asphalt: '#4a5359', white: '#ffffff', purple: '#7b6cd9',
};
const OUTLINE = 6;

// ---------- people ----------
// modern person: drawStick without the old hats/belt, plus hair and optional accessories
// o.hair = { style: 'short' | 'ponytail' | 'bun' | 'curly', col }, o.glasses, o.cap (colour), o.backpack (colour)
function drawPerson(ctx, o) {
  if (o.backpack) drawBackpack(ctx, o);
  if (o.hair && o.hair.style === 'ponytail') drawPonytail(ctx, o);
  drawStick(ctx, Object.assign({ hat: 'none', belt: false }, o));
  if (o.hair) drawHair(ctx, o);
  if (o.cap) drawCap(ctx, o);
  if (o.glasses) drawGlasses(ctx, o);
}
function personSpace(ctx, o) {
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(o.s * (o.flip || 1), o.s * (o.squash || 1)); ctx.rotate(o.lean || 0); ctx.translate(0, o.bob || 0);
  const hx = 0, hy = -.765; ctx.translate(hx, hy); ctx.rotate(o.headTilt || 0); ctx.translate(-hx, -hy);
}
function drawHair(ctx, o) {
  const col = o.hair.col || '#3a2a20', hr = .19, cy = -.765;
  personSpace(ctx, o);
  if (o.hair.style === 'curly') {
    for (let i = 0; i < 7; i++) { const a = Math.PI + .2 + i * (Math.PI - .4) / 6; circle(ctx, Math.cos(a) * hr * .95, cy + Math.sin(a) * hr * .95, .065); fillStroke(ctx, col, .014); }
  } else {
    ctx.beginPath(); ctx.arc(0, cy, hr + .012, Math.PI + .15, -.15);
    ctx.quadraticCurveTo(.06, cy - .1, -.02, cy - .08); ctx.quadraticCurveTo(-.12, cy - .06, -(hr + .012) * Math.cos(.15), cy - (hr + .012) * Math.sin(.15));
    ctx.closePath(); fillStroke(ctx, col, .015);
  }
  if (o.hair.style === 'bun') { circle(ctx, .02, cy - hr - .05, .07); fillStroke(ctx, col, .015); }
  ctx.restore();
}
function drawPonytail(ctx, o) {
  const col = o.hair.col || '#3a2a20', cy = -.765;
  personSpace(ctx, o);
  const swing = Math.sin((o.t || 0) * 6) * .03;
  ctx.beginPath(); ctx.moveTo(-.12, cy - .1); ctx.quadraticCurveTo(-.32, cy - .02 + swing, -.26, cy + .2); ctx.quadraticCurveTo(-.2, cy + .05, -.1, cy - .02); ctx.closePath();
  fillStroke(ctx, col, .015);
  ctx.restore();
}
function drawCap(ctx, o) {
  const cy = -.765, hr = .19;
  personSpace(ctx, o);
  ctx.beginPath(); ctx.arc(0, cy, hr + .015, Math.PI + .1, -.1); ctx.closePath(); fillStroke(ctx, o.cap, .015);
  ctx.beginPath(); ctx.moveTo(.1, cy - .05); ctx.quadraticCurveTo(.3, cy - .06, .32, cy - .02); ctx.lineTo(.12, cy - .01); ctx.closePath(); fillStroke(ctx, o.cap, .015);
  ctx.restore();
}
function drawGlasses(ctx, o) {
  const cy = -.765;
  personSpace(ctx, o);
  for (const side of [-1, 1]) { rrect(ctx, side * .075 - .05, cy - .035, .1, .07, .02); ctx.lineWidth = .012; ctx.strokeStyle = INK; ctx.stroke(); }
  line(ctx, -.025, cy - .01, .025, cy - .01, .012);
  ctx.restore();
}
function drawBackpack(ctx, o) {
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(o.s * (o.flip || 1), o.s); ctx.rotate(o.lean || 0); ctx.translate(0, o.bob || 0);
  rrect(ctx, -.2, -.6, .13, .26, .04); fillStroke(ctx, o.backpack, .015);
  ctx.restore();
}

// ---------- settings ----------
function drawSkyGradient(ctx, top = PRESENT.sky, bottom = PRESENT.skyLight) {
  const g = ctx.createLinearGradient(0, -300, 0, 900); g.addColorStop(0, top); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(-1500, -1500, W + 3000, H + 3000);
}
function drawFlatCloud(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.arc(-60, 10, 45, Math.PI * .5, Math.PI * 1.5); ctx.arc(-10, -25, 55, Math.PI, 0); ctx.arc(55, 0, 45, Math.PI * 1.3, Math.PI * .5); ctx.closePath();
  fillStroke(ctx, '#ffffff', 5);
  ctx.restore();
}
// city street: sky, drifting clouds, colourful blocks of flats with windows, pavement and road
function drawCity(ctx, t, o = {}) {
  drawSkyGradient(ctx, o.skyTop, o.skyBottom);
  if (o.sun !== false) { circle(ctx, 1550, 210, 85); fillStroke(ctx, PRESENT.ochre, OUTLINE); }
  for (let i = 0; i < 4; i++) drawFlatCloud(ctx, ((i * 620 + t * 25) % (W + 800)) - 400, 140 + (i % 2) * 90, .9 + (i % 3) * .2);
  const ground = o.ground || 820;
  const colours = [PRESENT.coral, PRESENT.ochre, PRESENT.tealLight, PRESENT.purple, '#f4a3a8', PRESENT.sky];
  for (let i = 0; i < 11; i++) {
    const R = rng(i * 13 + 5), w = 190 + R() * 120, h = 260 + R() * 330, x = -700 + i * 300;
    drawBuilding(ctx, x, ground, w, h, colours[i % colours.length], R);
  }
  ctx.fillStyle = '#d9d4cb'; ctx.fillRect(-1500, ground, W + 3000, 70);
  line(ctx, -1500, ground, W + 1500, ground, OUTLINE);
  ctx.fillStyle = PRESENT.asphalt; ctx.fillRect(-1500, ground + 70, W + 3000, 900);
  line(ctx, -1500, ground + 70, W + 1500, ground + 70, OUTLINE);
  for (let x = -1500; x < W + 1500; x += 260) { rrect(ctx, x, ground + 150, 130, 16, 8); ctx.fillStyle = '#f3efe6'; ctx.fill(); }
}
function drawBuilding(ctx, x, ground, w, h, fill, R) {
  rrect(ctx, x, ground - h, w, h, [14, 14, 0, 0]); fillStroke(ctx, fill, OUTLINE);
  const cols = Math.floor((w - 30) / 55), rows = Math.floor((h - 60) / 75);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const lit = R() > .55;
    rrect(ctx, x + 22 + c * 55, ground - h + 30 + r * 75, 34, 46, 6); fillStroke(ctx, lit ? '#fff3c4' : '#eaf4f7', 4);
  }
}
// cosy bedroom / living room: wall, floor, window with sky, picture frame
function drawRoom(ctx, t, o = {}) {
  ctx.fillStyle = o.wall || PRESENT.mint; ctx.fillRect(-1500, -1500, W + 3000, 2320 + 1500);
  ctx.fillStyle = o.floor || '#e9c9a0'; ctx.fillRect(-1500, 820, W + 3000, 1500);
  line(ctx, -1500, 820, W + 1500, 820, OUTLINE);
  const wx = o.windowX ?? 1380;
  rrect(ctx, wx, 180, 380, 330, 16); fillStroke(ctx, PRESENT.skyLight, OUTLINE);
  ctx.save(); rrect(ctx, wx, 180, 380, 330, 16); ctx.clip(); drawFlatCloud(ctx, wx + 120 + Math.sin(t * .3) * 30, 290, .7); ctx.restore();
  line(ctx, wx + 190, 180, wx + 190, 510, OUTLINE); line(ctx, wx, 345, wx + 380, 345, OUTLINE);
  if (o.frame !== false) { rrect(ctx, 260, 230, 220, 160, 10); fillStroke(ctx, PRESENT.ochre, OUTLINE); path(ctx, [[290, 360], [360, 280], [410, 330], [440, 300], [455, 360]]); fillStroke(ctx, PRESENT.tealLight, 4); }
}
// open countryside for the campsite and the car trip
function drawCountryside(ctx, t, o = {}) {
  drawSkyGradient(ctx, o.skyTop, o.skyBottom);
  circle(ctx, o.sunX ?? 1500, 220, 90); fillStroke(ctx, PRESENT.ochre, OUTLINE);
  for (let i = 0; i < 3; i++) drawFlatCloud(ctx, ((i * 700 + t * 20) % (W + 800)) - 400, 160 + i * 50, 1);
  ctx.beginPath(); ctx.moveTo(-1500, 700); ctx.quadraticCurveTo(200, 460, 900, 640); ctx.quadraticCurveTo(1500, 500, W + 1500, 650); ctx.lineTo(W + 1500, 2000); ctx.lineTo(-1500, 2000); ctx.closePath();
  fillStroke(ctx, '#a9d18e', OUTLINE);
  ctx.beginPath(); ctx.moveTo(-1500, 830); ctx.quadraticCurveTo(700, 760, W + 1500, 840); ctx.lineTo(W + 1500, 2000); ctx.lineTo(-1500, 2000); ctx.closePath();
  fillStroke(ctx, PRESENT.grass, OUTLINE);
  for (let i = 0; i < 6; i++) drawTree(ctx, -200 + i * 430, 760 + (i % 2) * 20, .8 + (i % 3) * .15);
}
function drawTree(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rrect(ctx, -14, -120, 28, 120, 8); fillStroke(ctx, '#8a5a3c', 5);
  circle(ctx, 0, -170, 85); fillStroke(ctx, '#5fa86a', 5);
  ctx.restore();
}

// ---------- transport ----------
function drawPlane(ctx, x, y, s, rot = 0, col = PRESENT.white) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  path(ctx, [[-40, 10], [60, 10], [-60, 150], [-110, 150]]); fillStroke(ctx, PRESENT.teal, OUTLINE);
  path(ctx, [[-250, -10], [-210, -10], [-180, -110], [-225, -110]]); fillStroke(ctx, PRESENT.coral, OUTLINE);
  ctx.beginPath(); ctx.moveTo(-270, -20); ctx.lineTo(200, -40); ctx.quadraticCurveTo(300, -30, 300, 5); ctx.quadraticCurveTo(300, 40, 200, 45); ctx.lineTo(-240, 40); ctx.quadraticCurveTo(-285, 20, -270, -20); ctx.closePath();
  fillStroke(ctx, col, OUTLINE);
  for (let i = 0; i < 7; i++) { circle(ctx, -150 + i * 45, -2, 11); fillStroke(ctx, PRESENT.sky, 4); }
  path(ctx, [[-20, -10], [70, -10], [-40, -120], [-80, -120]]); fillStroke(ctx, PRESENT.teal, OUTLINE);
  ctx.restore();
}
function drawTrain(ctx, x, y, s, cars = 3) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  for (let c = 0; c < cars; c++) {
    const cx = -c * 520;
    ctx.beginPath();
    if (c === 0) { ctx.moveTo(cx - 250, -260); ctx.lineTo(cx + 150, -260); ctx.quadraticCurveTo(cx + 280, -250, cx + 300, -60); ctx.lineTo(cx + 300, 0); ctx.lineTo(cx - 250, 0); ctx.closePath(); }
    else ctx.roundRect(cx - 250, -260, 500, 260, 24);
    fillStroke(ctx, PRESENT.white, OUTLINE);
    ctx.fillStyle = PRESENT.coral; ctx.fillRect(cx - 247, -70, c === 0 ? 545 : 494, 34);
    for (let w = 0; w < 4; w++) { rrect(ctx, cx - 220 + w * 105, -210, 80, 90, 12); fillStroke(ctx, PRESENT.sky, 5); }
    if (c === 0) { ctx.beginPath(); ctx.moveTo(cx + 200, -230); ctx.quadraticCurveTo(cx + 265, -215, cx + 280, -130); ctx.lineTo(cx + 200, -130); ctx.closePath(); fillStroke(ctx, PRESENT.sky, 5); }
    for (const wx of [-170, 170]) { circle(ctx, cx + wx, 0, 30); fillStroke(ctx, PRESENT.navy, 5); }
  }
  ctx.restore();
}
function drawRails(ctx, y, x0 = -1500, x1 = W + 1500) {
  ctx.fillStyle = '#b9b2a6'; ctx.fillRect(x0, y + 20, x1 - x0, 60);
  for (let x = x0; x < x1; x += 70) { ctx.fillStyle = '#7a6a58'; ctx.fillRect(x, y + 28, 30, 44); }
  line(ctx, x0, y + 32, x1, y + 32, 8, '#5b6066');
}
function drawCar(ctx, x, y, s, t, col = PRESENT.coral, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.flip || 1), s);
  const bump = o.moving ? Math.abs(Math.sin(t * 14)) * 4 : 0;
  ctx.translate(0, -bump);
  ctx.beginPath(); ctx.moveTo(-200, -40); ctx.lineTo(-190, -110); ctx.lineTo(-90, -120); ctx.lineTo(-40, -200); ctx.lineTo(110, -200); ctx.lineTo(170, -120); ctx.lineTo(210, -110); ctx.lineTo(215, -40); ctx.quadraticCurveTo(215, -20, 195, -20); ctx.lineTo(-180, -20); ctx.quadraticCurveTo(-200, -20, -200, -40); ctx.closePath();
  fillStroke(ctx, col, OUTLINE);
  path(ctx, [[-70, -125], [-30, -185], [30, -185], [30, -125]]); fillStroke(ctx, PRESENT.skyLight, 5);
  path(ctx, [[50, -125], [50, -185], [100, -185], [145, -125]]); fillStroke(ctx, PRESENT.skyLight, 5);
  circle(ctx, 200, -85, 12); fillStroke(ctx, PRESENT.ochre, 4);
  ctx.translate(0, bump);
  for (const wx of [-120, 130]) {
    circle(ctx, wx, -20, 42); fillStroke(ctx, PRESENT.navy, 5); circle(ctx, wx, -20, 18); fillStroke(ctx, '#cfd6da', 4);
    const a = o.moving ? t * 12 : 0; line(ctx, wx, -20, wx + Math.cos(a) * 18, -20 + Math.sin(a) * 18, 4);
  }
  ctx.restore();
}

// ---------- travel things ----------
function drawSuitcase(ctx, x, y, s, col = PRESENT.teal, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  rrect(ctx, -40, -260, 80, 50, 18); ctx.lineWidth = 14; ctx.strokeStyle = INK; ctx.stroke();
  rrect(ctx, -110, -230, 220, 230, 26); fillStroke(ctx, col, OUTLINE);
  for (const sx of [-55, 55]) line(ctx, sx, -225, sx, -5, 5, 'rgba(0,0,0,.25)');
  circle(ctx, -45, -150, 28); fillStroke(ctx, PRESENT.ochre, 4);
  rrect(ctx, 20, -110, 60, 40, 8); fillStroke(ctx, PRESENT.coral, 4);
  for (const wx of [-75, 75]) { circle(ctx, wx, 8, 14); fillStroke(ctx, PRESENT.navy, 4); }
  ctx.restore();
}
function drawPassport(ctx, x, y, s, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  rrect(ctx, -90, -125, 180, 250, 14); fillStroke(ctx, '#1f3f7a', OUTLINE);
  circle(ctx, 0, -20, 42); ctx.lineWidth = 5; ctx.strokeStyle = '#f2c14e'; ctx.stroke();
  line(ctx, -42, -20, 42, -20, 4, '#f2c14e'); ctx.beginPath(); ctx.ellipse(0, -20, 18, 42, 0, 0, TAU); ctx.stroke();
  text(ctx, 'PASSPORT', 0, 75, 26, '#f2c14e', INK, 0, 'Poppins', 700);
  ctx.restore();
}
function drawBanknote(ctx, x, y, s, rot = 0, label = '€20') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  rrect(ctx, -150, -75, 300, 150, 12); fillStroke(ctx, '#9fd3a8', OUTLINE);
  circle(ctx, 0, 0, 48); fillStroke(ctx, '#d9f0dc', 4);
  text(ctx, label, 0, 2, 40, PRESENT.navy, INK, 0, 'Poppins', 700);
  ctx.restore();
}
// travel insurance: a shield card with a plus
function drawInsuranceCard(ctx, x, y, s, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  rrect(ctx, -150, -95, 300, 190, 18); fillStroke(ctx, PRESENT.white, OUTLINE);
  ctx.beginPath(); ctx.moveTo(-60, -60); ctx.lineTo(0, -75); ctx.lineTo(60, -60); ctx.quadraticCurveTo(60, 30, 0, 65); ctx.quadraticCurveTo(-60, 30, -60, -60); ctx.closePath();
  fillStroke(ctx, PRESENT.tealLight, 5);
  ctx.fillStyle = '#fff'; ctx.fillRect(-8, -40, 16, 60); ctx.fillRect(-30, -18, 60, 16);
  ctx.restore();
}
function drawPhone(ctx, x, y, s, rot = 0, drawScreen) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  rrect(ctx, -75, -150, 150, 300, 26); fillStroke(ctx, PRESENT.navy, OUTLINE);
  rrect(ctx, -62, -132, 124, 264, 16); ctx.fillStyle = '#ffffff'; ctx.fill();
  if (drawScreen) { ctx.save(); rrect(ctx, -62, -132, 124, 264, 16); ctx.clip(); drawScreen(ctx); ctx.restore(); }
  ctx.restore();
}
function drawGlobe(ctx, x, y, r, t) {
  ctx.save(); ctx.translate(x, y);
  circle(ctx, 0, 0, r); fillStroke(ctx, PRESENT.sky, OUTLINE);
  ctx.save(); circle(ctx, 0, 0, r); ctx.clip();
  const spin = (t * .25) % 1;
  for (let i = -1; i < 3; i++) {
    const cx = (i - spin) * r * 1.4;
    ctx.beginPath(); ctx.ellipse(cx, -r * .25, r * .35, r * .3, .4, 0, TAU); fillStroke(ctx, PRESENT.grass, 4);
    ctx.beginPath(); ctx.ellipse(cx + r * .45, r * .35, r * .22, r * .35, -.3, 0, TAU); fillStroke(ctx, PRESENT.grass, 4);
  }
  ctx.restore();
  circle(ctx, 0, 0, r); fillStroke(ctx, null, OUTLINE);
  ctx.restore();
}
function drawMapPin(ctx, x, y, s, col = PRESENT.coral) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-30, -45, -55, -70, -55, -100); ctx.arc(0, -100, 55, Math.PI, 0); ctx.bezierCurveTo(55, -70, 30, -45, 0, 0); ctx.closePath();
  fillStroke(ctx, col, OUTLINE); circle(ctx, 0, -100, 20); fillStroke(ctx, '#fff', 4);
  ctx.restore();
}
function drawHotel(ctx, x, ground, s) {
  ctx.save(); ctx.translate(x, ground); ctx.scale(s, s);
  rrect(ctx, -170, -520, 340, 520, [16, 16, 0, 0]); fillStroke(ctx, '#f4a3a8', OUTLINE);
  rrect(ctx, -120, -580, 240, 70, 14); fillStroke(ctx, PRESENT.navy, OUTLINE);
  text(ctx, 'HOTEL', 0, -544, 46, PRESENT.ochre, INK, 0, 'Poppins', 700);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { rrect(ctx, -125 + c * 95, -470 + r * 95, 60, 60, 8); fillStroke(ctx, '#fff3c4', 4); }
  rrect(ctx, -45, -100, 90, 100, [40, 40, 0, 0]); fillStroke(ctx, PRESENT.teal, OUTLINE);
  ctx.restore();
}
function drawHostel(ctx, x, ground, s) {
  ctx.save(); ctx.translate(x, ground); ctx.scale(s, s);
  rrect(ctx, -150, -380, 300, 380, [16, 16, 0, 0]); fillStroke(ctx, PRESENT.ochre, OUTLINE);
  rrect(ctx, -120, -440, 240, 66, 14); fillStroke(ctx, PRESENT.coral, OUTLINE);
  text(ctx, 'HOSTEL', 0, -406, 42, '#fff', INK, 0, 'Poppins', 700);
  // bunk bed seen through a big window
  rrect(ctx, -110, -320, 220, 190, 12); fillStroke(ctx, PRESENT.skyLight, 5);
  for (const by of [-270, -190]) { rrect(ctx, -90, by, 180, 26, 8); fillStroke(ctx, PRESENT.purple, 4); }
  line(ctx, -95, -310, -95, -140, 6); line(ctx, 95, -310, 95, -140, 6);
  rrect(ctx, -40, -100, 80, 100, [30, 30, 0, 0]); fillStroke(ctx, PRESENT.teal, OUTLINE);
  ctx.restore();
}
function drawTent(ctx, x, ground, s, col = PRESENT.tealLight) {
  ctx.save(); ctx.translate(x, ground); ctx.scale(s, s);
  path(ctx, [[-200, 0], [0, -260], [200, 0]]); fillStroke(ctx, col, OUTLINE);
  path(ctx, [[-50, 0], [0, -150], [50, 0]]); fillStroke(ctx, PRESENT.navy, 5);
  line(ctx, 0, -260, 0, -300, 6); path(ctx, [[0, -300], [50, -285], [0, -270]]); fillStroke(ctx, PRESENT.coral, 4);
  ctx.restore();
}
// exam table with a picture card and the examiner's papers
function drawExamTable(ctx, x, y, w) {
  rrect(ctx, x - w / 2, y - 30, w, 40, 10); fillStroke(ctx, '#c98a5a', OUTLINE);
  line(ctx, x - w / 2 + 40, y + 10, x - w / 2 + 40, y + 180, 12); line(ctx, x + w / 2 - 40, y + 10, x + w / 2 - 40, y + 180, 12);
}
function drawSpeechBubble(ctx, x, y, w, h, label, alpha = 1, tailSide = -1, fill = '#ffffff', textCol = PRESENT.navy, size = 40) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(lerp(.6, 1, alpha), lerp(.6, 1, alpha));
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 28);
  ctx.moveTo(tailSide * w * .2, h / 2 - 2); ctx.lineTo(tailSide * w * .32, h / 2 + 50); ctx.lineTo(tailSide * w * .05, h / 2 - 2);
  fillStroke(ctx, fill, OUTLINE);
  ctx.beginPath(); ctx.roundRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6, 26); ctx.fillStyle = fill; ctx.fill();
  const lines = Array.isArray(label) ? label : [label];
  lines.forEach((textLine, i) => text(ctx, textLine, 0, (i - (lines.length - 1) / 2) * size * 1.25, size, textCol, INK, 0, 'Poppins', 700));
  ctx.restore();
}
function drawCheck(ctx, x, y, s, alpha = 1, col = PRESENT.tealLight) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(s, s);
  circle(ctx, 0, 0, 50); fillStroke(ctx, col, OUTLINE);
  ctx.beginPath(); ctx.moveTo(-22, 2); ctx.lineTo(-6, 18); ctx.lineTo(24, -16); ctx.lineWidth = 12; ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
}
function drawCross(ctx, x, y, s, alpha = 1) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(s, s);
  circle(ctx, 0, 0, 50); fillStroke(ctx, PRESENT.coral, OUTLINE);
  line(ctx, -18, -18, 18, 18, 12, '#fff'); line(ctx, 18, -18, -18, 18, 12, '#fff');
  ctx.restore();
}
function drawLeaf(ctx, x, y, s, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(0, 50); ctx.quadraticCurveTo(-55, 0, 0, -60); ctx.quadraticCurveTo(55, 0, 0, 50); ctx.closePath(); fillStroke(ctx, '#5fa86a', 5);
  line(ctx, 0, 45, 0, -45, 4);
  ctx.restore();
}
function drawSmokeCloud(ctx, x, y, s, alpha = 1) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.arc(-40, 0, 40, 0, TAU); ctx.moveTo(60, -10); ctx.arc(20, -10, 50, 0, TAU); ctx.moveTo(110, 5); ctx.arc(75, 5, 35, 0, TAU);
  fillStroke(ctx, '#9aa1a6', 5);
  ctx.restore();
}
