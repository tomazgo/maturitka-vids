// Keď báčik z Chochoľova umrie (Martin Kukučín)
// Shots are cut on sentence boundaries read from words.js, so they follow the voice automatically.

// ---------- timing ----------
const normalizeWord = word => word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const lineWords = line => WORDS.filter(w => w.line === line);
const LAST_LINE = WORDS[WORDS.length - 1].line;
const CUT_BEFORE_LINE = .25; // half of the 0.5 s gap between sentences
const CLOSING_HOLD = .65;

function lineStart(line) { return lineWords(line)[0].s; }
function lineEnd(line) { const words = lineWords(line); return words[words.length - 1].e; }
// global second at which `word` is spoken inside sentence `line`
function wordAt(word, line) {
  const found = lineWords(line).find(w => normalizeWord(w.w) === word);
  return found ? found.s : lineStart(line);
}
function shotStart(firstLine) { return firstLine === 0 ? 0 : lineStart(firstLine) - CUT_BEFORE_LINE; }
function shotEnd(lastLine) { return lastLine === LAST_LINE ? lineEnd(lastLine) + CLOSING_HOLD : lineStart(lastLine + 1) - CUT_BEFORE_LINE; }

const SHOTS = [];
function addShot(firstLine, lastLine, draw) {
  SHOTS.push({ start: shotStart(firstLine), end: shotEnd(lastLine), tr: 'whip', draw });
}
// gentle fade-up 0 -> 1 without overshoot, starting at global second `at`
const popAt = (t, at, length = .5) => kf(t, [[at, 0], [at + length, 1, easeOut]]);
const fadeAt = (t, at, length = .4) => kf(t, [[at, 0], [at + length, 1]]);

// ---------- camera and motion ----------
const C = (base, extra) => Object.assign({}, base, extra);
const handheld = (t, a = 2) => shake(t * .15, a * .2, 1, 2);
const centerCam = (t, z = 1, dx = 0, dy = 0, a = 3) => { const hh = handheld(t, a); return { x: W / 2 + dx + hh[0], y: H / 2 + dy + hh[1], z, r: 0 }; };
const walkLegs = (t, sp = 9, amp = .5) => ({ L: [Math.sin(t * sp) * amp + .05, -Math.max(0, Math.sin(t * sp + 1)) * .7], R: [-Math.sin(t * sp) * amp + .05, -Math.max(0, -Math.sin(t * sp + 1)) * .7] });
const walkArms = (t, sp = 9) => ({ L: [.3 - Math.sin(t * sp) * .4, -.3], R: [.3 + Math.sin(t * sp) * .4, -.3] });
const SEATED_LEGS = { L: [1.5, -1.5], R: [1.45, -1.5] };
const GESTURE_ARMS = t => ({ L: [.3, -.1], R: [2.2 + Math.sin(t * 6) * .35, .5] });
const BIG_GESTURE_ARMS = t => ({ L: [2.3 + Math.sin(t * 5) * .25, .4], R: [2.3 - Math.sin(t * 5) * .25, .4] });

// ---------- characters ----------
const ONDREJ = { cols: ['#6b705c', '#6b705c'], vest: '#5c4033' };
const ADUS = { cols: ['#5c4033', '#dda15e'], vest: '#2b2230', belt: false };
const JURAN_WIFE = { cols: ['#8d6e63', '#8d6e63'], scarf: '#6b705c', skirt: '#5c4033', apron: '#efe3cc' };
const EVA = { cols: ['#a1887f', '#a1887f'], scarf: '#dda15e', skirt: '#6b705c', apron: '#efe3cc' };
const ADAM = { cols: ['#8c7a5b', '#8c7a5b'], hat: 'none' };

function drawOndrej(ctx, o) { drawGazda(ctx, C(ONDREJ, o)); }

// impoverished nobleman: striped coat, tall top hat, thin curled moustache
function drawAdus(ctx, o) {
  drawStick(ctx, C(C(ADUS, { hat: 'none' }), o));
  const s = o.s; ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s * (o.flip || 1), s); ctx.rotate(o.lean || 0);
  ctx.translate(0, o.bob || 0);
  const headY = -.765;
  ctx.save(); ctx.translate(0, headY); ctx.rotate(o.headTilt || 0); ctx.translate(0, -headY);
  // thin pencil moustache kept above the mouth (hy + .085) so it never reads as a smile
  ctx.beginPath(); ctx.moveTo(0, headY + .035); ctx.quadraticCurveTo(-.045, headY + .028, -.085, headY + .05); ctx.quadraticCurveTo(-.045, headY + .05, 0, headY + .05);
  ctx.quadraticCurveTo(.045, headY + .05, .085, headY + .05); ctx.quadraticCurveTo(.045, headY + .028, 0, headY + .035); fillStroke(ctx, '#2a1d18', .008);
  const hatLift = o.hatLift || 0;
  ctx.translate(0, -hatLift); ctx.rotate(hatLift * 2);
  ellipse(ctx, 0, headY - .15, .25, .045); fillStroke(ctx, '#1f1a22', .015);
  rrect(ctx, -.13, headY - .45, .26, .31, .03); fillStroke(ctx, '#1f1a22', .015);
  ctx.fillStyle = '#5c4033'; ctx.fillRect(-.13, headY - .2, .26, .04);
  if (o.shabby) { line(ctx, -.06, headY - .42, .02, headY - .3, .012, '#f4e9d8'); rrect(ctx, .02, headY - .38, .07, .06, .01); fillStroke(ctx, '#8d6e63', .01); }
  ctx.restore(); ctx.restore();
}

// the rich uncle, a dean: black cassock, white collar, round hat
function drawBacik(ctx, o) {
  drawStick(ctx, C({ cols: ['#2a2528', '#2a2528'], hat: 'none', belt: false }, o));
  const s = o.s; ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s * (o.flip || 1), s); ctx.rotate(o.lean || 0);
  const headY = -.765;
  rrect(ctx, -.05, -.62, .1, .035, .01); fillStroke(ctx, '#f6f1e8', .008);
  ellipse(ctx, 0, headY - .15, .3, .05); fillStroke(ctx, '#1f1a22', .015);
  ctx.beginPath(); ctx.ellipse(0, headY - .16, .15, .12, 0, Math.PI, 0); fillStroke(ctx, '#1f1a22', .015);
  ctx.restore();
}

function drawJuran(ctx, o) { drawGazda(ctx, C({ cols: ['#7a6a55', '#7a6a55'], vest: '#3b3a3f' }, o)); }

// ---------- props ----------
// manor house (kaštieľ); decay 0 = proud, 1 = crumbling
function drawManor(ctx, x, y, s, decay = 0, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const wall = mix('#e8dcc4', '#b7a88e', decay);
  rrect(ctx, -420, -330, 840, 330, 6); fillStroke(ctx, wall, 7);
  path(ctx, [[-450, -320], [-380, -430], [380, -430], [450, -320]]); fillStroke(ctx, mix('#8a4b3a', '#6d5a4e', decay), 7);
  // portico: pediment and columns
  path(ctx, [[-170, -330], [0, -470], [170, -330]]); fillStroke(ctx, wall, 7);
  circle(ctx, 0, -380, 26); fillStroke(ctx, decay > .5 ? '#9a8a74' : '#dda15e', 5);
  for (const cx of [-140, -70, 70, 140]) {
    const fallen = decay > .7 && cx === 140;
    ctx.save(); if (fallen) { ctx.translate(cx, 0); ctx.rotate(.18); ctx.translate(-cx, 0); }
    rrect(ctx, cx - 18, -330, 36, 330, 6); fillStroke(ctx, mix('#f4ead8', '#c9bba3', decay), 6); ctx.restore();
  }
  rrect(ctx, -45, -170, 90, 170, 8); fillStroke(ctx, '#6b3d1d', 6);
  // windows: lit when proud, broken when decayed
  for (const wx of [-350, -260, 260, 350]) for (const wy of [-270, -150]) {
    rrect(ctx, wx - 30, wy - 40, 60, 80, 6); fillStroke(ctx, decay > .4 ? '#3a3236' : '#f3d58a', 5);
    if (decay > .4) { line(ctx, wx - 25, wy - 30, wx + 10, wy + 5, 4, '#cfc4b0'); line(ctx, wx + 10, wy + 5, wx - 5, wy + 35, 4, '#cfc4b0'); }
    else { line(ctx, wx, wy - 40, wx, wy + 40, 4); line(ctx, wx - 30, wy, wx + 30, wy, 4); }
  }
  if (decay > 0) drawManorCracks(ctx, decay);
  if (decay > .3) drawWeeds(ctx, -440, 440, 0, decay, t);
  ctx.restore();
}

function drawManorCracks(ctx, decay) {
  ctx.save(); ctx.globalAlpha = clamp(decay * 1.5); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.lineCap = 'round';
  path(ctx, [[-300, -330], [-280, -280], [-310, -230], [-285, -190]], false); ctx.stroke();
  path(ctx, [[220, -330], [240, -270], [210, -220]], false); ctx.stroke();
  path(ctx, [[-180, -60], [-150, -30], [-170, 0]], false); ctx.stroke();
  // missing roof tiles
  ctx.fillStyle = '#2c2a2e'; path(ctx, [[-260, -400], [-200, -400], [-215, -360], [-270, -365]]); ctx.fill();
  path(ctx, [[230, -410], [290, -405], [280, -370], [235, -372]]); ctx.fill();
  ctx.restore();
}

// weeds growing from the ground line; grow 0..1
function drawWeeds(ctx, x0, x1, y, grow, t) {
  for (let x = x0; x <= x1; x += 38) {
    const R = rng(Math.round(x * 7 + 1000)); const h = (60 + R() * 110) * clamp(grow * 1.4 - R() * .4);
    if (h <= 2) continue;
    const sway = Math.sin(t * 2 + x) * 6;
    ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.quadraticCurveTo(x - 14 + sway, y - h * .6, x - 22 + sway, y - h);
    ctx.moveTo(x, y); ctx.quadraticCurveTo(x + sway, y - h * .7, x + 4 + sway, y - h * 1.15);
    ctx.moveTo(x + 10, y); ctx.quadraticCurveTo(x + 16 + sway, y - h * .5, x + 26 + sway, y - h * .85);
    ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke();
    ctx.lineWidth = 4; ctx.strokeStyle = '#6b705c'; ctx.stroke();
  }
}

// old ash tree (jaseň), origin at the trunk base
function drawAshTree(ctx, x, y, s, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-45, 0); ctx.quadraticCurveTo(-30, -200, -25, -380); ctx.lineTo(25, -380); ctx.quadraticCurveTo(30, -200, 45, 0); ctx.closePath(); fillStroke(ctx, '#6d5240', 7);
  line(ctx, -15, -280, -110, -400, 16, '#6d5240'); line(ctx, 15, -300, 120, -420, 16, '#6d5240');
  const sway = Math.sin(t * .9) * 8;
  for (const [bx, by, br] of [[-130, -440, 120], [130, -460, 125], [0, -560, 150], [-60, -400, 110], [80, -390, 105]]) { circle(ctx, bx + sway, by, br); fillStroke(ctx, '#7f8a63', 7); }
  for (const [bx, by, br] of [[-100, -470, 60], [40, -590, 70], [140, -480, 50]]) { circle(ctx, bx + sway, by, br); ctx.fillStyle = 'rgba(255,248,220,.18)'; ctx.fill(); }
  ctx.restore();
}

function drawGraveCross(ctx, x, y, s, alpha = 1) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(s, s);
  ellipse(ctx, 0, 0, 90, 20); fillStroke(ctx, '#8d8670', 5);
  rrect(ctx, -12, -170, 24, 170, 4); fillStroke(ctx, '#5c4033', 5); rrect(ctx, -60, -130, 120, 24, 4); fillStroke(ctx, '#5c4033', 5);
  ctx.restore();
}

function drawGrainSack(ctx, x, y, s, label) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-70, 0); ctx.quadraticCurveTo(-90, -90, -50, -150); ctx.lineTo(50, -150); ctx.quadraticCurveTo(90, -90, 70, 0); ctx.closePath(); fillStroke(ctx, '#d9c49a', 6);
  path(ctx, [[-50, -150], [-30, -185], [0, -165], [30, -185], [50, -150]]); fillStroke(ctx, '#d9c49a', 6);
  line(ctx, -45, -150, 45, -150, 7, '#5c4033');
  if (label) text(ctx, label, 0, -70, 30, '#5c4033', INK, 0, 'Lora', 700);
  ctx.restore();
}

function drawMug(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rrect(ctx, -28, -70, 56, 70, 8); fillStroke(ctx, '#b07d4f', 5);
  ctx.beginPath(); ctx.arc(32, -38, 18, -Math.PI / 2, Math.PI / 2); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke();
  ellipse(ctx, 0, -70, 30, 9); fillStroke(ctx, '#f7efe1', 4);
  ctx.restore();
}

// tavern interior: plank wall, small night window, table in front
function drawTavern(ctx, t) {
  ctx.fillStyle = '#9c7350'; ctx.fillRect(-600, -500, W + 1200, 1400);
  for (let y = -460; y < 900; y += 64) line(ctx, -600, y, W + 600, y, 4, 'rgba(60,35,20,.45)');
  rrect(ctx, 1700, 180, 260, 220, 10); fillStroke(ctx, '#4a5568', 7); line(ctx, 1830, 180, 1830, 400, 6); line(ctx, 1700, 290, 1960, 290, 6);
  circle(ctx, 1890, 230, 28); ctx.fillStyle = '#f3e3b0'; ctx.fill();
  ctx.fillStyle = '#6b4a30'; ctx.fillRect(-600, 760, W + 1200, 600); line(ctx, -600, 760, W + 600, 760, 6);
  drawLantern(ctx, 960, 210, 1.1, .8, t);
}

function drawTable(ctx, x, y, w) {
  rrect(ctx, x - w / 2, y, w, 34, 8); fillStroke(ctx, '#8a5a3c', 6);
  rrect(ctx, x - w / 2 + 40, y + 34, 26, 170, 4); fillStroke(ctx, '#6b4428', 5);
  rrect(ctx, x + w / 2 - 66, y + 34, 26, 170, 4); fillStroke(ctx, '#6b4428', 5);
}

// shabby nobleman's carriage (koč): box on two big wheels
function drawCarriage(ctx, x, y, s, t, rolling = 0, flip = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * flip, s);
  rrect(ctx, -170, -330, 300, 170, 14); fillStroke(ctx, '#5a4a3f', 7);
  rrect(ctx, -130, -305, 90, 80, 6); fillStroke(ctx, '#c9bba3', 5); line(ctx, -40, -260, 40, -300, 5, '#e8dcc4');
  rrect(ctx, 30, -300, 50, 60, 6); fillStroke(ctx, '#8d6e63', 5);
  for (const wx of [-110, 90]) drawWheel(ctx, wx, -80, 80, t * rolling * 3);
  line(ctx, 130, -170, 300, -140, 8, '#5c4033');
  ctx.restore();
}

function drawWheel(ctx, x, y, r, rot = 0) {
  circle(ctx, x, y, r); ctx.lineWidth = 12; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 7; ctx.strokeStyle = '#8c6844'; ctx.stroke();
  for (let i = 0; i < 6; i++) { const a = rot + i * Math.PI / 3; line(ctx, x, y, x + Math.cos(a) * r, y + Math.sin(a) * r, 5); }
  circle(ctx, x, y, r * .18); fillStroke(ctx, '#5c4033', 5);
}

// farmer's wagon; wheelOff 0..1 makes the front wheel roll away
function drawWagon(ctx, x, y, s, t, rolling = 1, wheelOff = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.save(); ctx.translate(-140, -80); ctx.rotate(wheelOff * .16); ctx.translate(140, 80);
  rrect(ctx, -230, -230, 380, 110, 8); fillStroke(ctx, '#a07850', 7);
  for (let px = -200; px < 150; px += 60) line(ctx, px, -230, px, -120, 4, 'rgba(60,35,20,.5)');
  ctx.restore();
  drawWheel(ctx, -170, -80, 75, t * rolling * 3);
  drawWheel(ctx, 100 + wheelOff * 380, -80 + wheelOff * 10, 75, t * rolling * 3 + wheelOff * 9);
  line(ctx, 150, -170, 330, -150, 8, '#5c4033');
  ctx.restore();
}

function drawMarketStall(ctx, x, y, s, stripe = '#b5563f') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rrect(ctx, -170, -380, 18, 380, 4); fillStroke(ctx, '#8c6844', 5); rrect(ctx, 152, -380, 18, 380, 4); fillStroke(ctx, '#8c6844', 5);
  path(ctx, [[-200, -380], [200, -380], [230, -300], [-230, -300]]); fillStroke(ctx, '#efe3cc', 6);
  ctx.save(); path(ctx, [[-200, -380], [200, -380], [230, -300], [-230, -300]]); ctx.clip(); ctx.fillStyle = stripe;
  for (let i = -5; i < 6; i += 2) ctx.fillRect(i * 46, -390, 46, 100); ctx.restore();
  rrect(ctx, -190, -150, 380, 30, 6); fillStroke(ctx, '#a07850', 6);
  for (let i = 0; i < 5; i++) { circle(ctx, -130 + i * 65, -172, 24); fillStroke(ctx, ['#dda15e', '#b5563f', '#8d9277'][i % 3], 5); }
  ctx.restore();
}

// thought cloud with a small tail of bubbles toward `toward`; content draws inside, centred at 0,0
function drawThought(ctx, x, y, r, alpha, toward, content) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha;
  for (let i = 0; i < 3; i++) { const k = (i + 1) / 4; circle(ctx, lerp(toward[0], x, k), lerp(toward[1], y + r * .6, k), 12 + i * 8); fillStroke(ctx, '#f7efe1', 4); }
  ctx.beginPath();
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; ctx.moveTo(x + Math.cos(a) * r * 1.25 + r * .42, y + Math.sin(a) * r * .8); ctx.arc(x + Math.cos(a) * r * 1.25, y + Math.sin(a) * r * .8, r * .42, 0, TAU); }
  ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = '#f7efe1'; ctx.fill();
  ellipse(ctx, x, y, r * 1.3, r * .85); ctx.fill();
  ctx.save(); ctx.translate(x, y); ctx.scale(r / 200, r / 200); content(ctx); ctx.restore();
  ctx.restore();
}

function drawDocument(ctx, x, y, s, rot, sealAlpha = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  rrect(ctx, -170, -230, 340, 460, 10); fillStroke(ctx, '#f7efe1', 7);
  text(ctx, 'Závet', 0, -160, 54, '#5c4033', INK, 0, 'Lora', 700);
  for (let i = 0; i < 6; i++) line(ctx, -120, -80 + i * 42, i === 5 ? 40 : 120, -80 + i * 42, 6, 'rgba(92,64,51,.55)');
  ctx.globalAlpha *= sealAlpha; circle(ctx, 90, 160, 44); fillStroke(ctx, '#a8553a', 6); star5(ctx, 90, 160, 22, 0, '#d98c6e');
  ctx.restore();
}

function drawChurch(ctx, x, y, s, bellSwing = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rrect(ctx, -220, -280, 440, 280, 6); fillStroke(ctx, '#e8dcc4', 7);
  path(ctx, [[-250, -270], [0, -420], [250, -270]]); fillStroke(ctx, '#6d5a4e', 7);
  rrect(ctx, -70, -620, 140, 360, 6); fillStroke(ctx, '#e8dcc4', 7);
  path(ctx, [[-90, -610], [0, -760], [90, -610]]); fillStroke(ctx, '#5a4a3f', 7);
  line(ctx, 0, -760, 0, -840, 8); line(ctx, -30, -810, 30, -810, 8);
  ctx.save(); ctx.translate(0, -540); ctx.rotate(bellSwing);
  ctx.beginPath(); ctx.moveTo(-34, 50); ctx.quadraticCurveTo(-30, -10, 0, -14); ctx.quadraticCurveTo(30, -10, 34, 50); ctx.closePath(); fillStroke(ctx, '#c9a35e', 6);
  ctx.restore();
  rrect(ctx, -45, -150, 90, 150, 40); fillStroke(ctx, '#6b3d1d', 6);
  ctx.restore();
}

function drawCandle(ctx, x, y, s, flame, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rrect(ctx, -22, -160, 44, 160, 6); fillStroke(ctx, '#f6f1e8', 5);
  line(ctx, 0, -160, 0, -180, 4);
  if (flame > 0) { ctx.save(); ctx.globalAlpha = flame; ctx.beginPath(); const flicker = Math.sin(t * 17) * 3; ctx.moveTo(0, -178); ctx.quadraticCurveTo(-16, -200, flicker, -240 * (.6 + .4 * flame)); ctx.quadraticCurveTo(16, -200, 0, -178); fillStroke(ctx, '#f2b84b', 4); ctx.restore(); }
  ctx.restore();
}

function drawPlow(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  line(ctx, -150, -150, 60, -20, 12, '#6d5240'); line(ctx, -150, -150, -190, -170, 12, '#6d5240');
  path(ctx, [[40, -40], [130, -10], [40, 0]]); fillStroke(ctx, '#8a8a8a', 5);
  ctx.restore();
}

function drawQuestionMark(ctx, x, y, size, alpha) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha; text(ctx, '?', x, y, size, '#f7efe1', INK, size * .12, 'Lora', 700); text(ctx, '?', x, y, size, '#f7efe1', INK, 0, 'Lora', 700); ctx.restore();
}

function drawNightSky(ctx, t) {
  drawSky(ctx, '#6f6a7a', '#b8ae9c', -300, GROUND_Y);
  circle(ctx, 1550, 200, 60); fillStroke(ctx, '#f3e3b0', 5);
  for (let i = 0; i < 18; i++) { const R = rng(i + 300); star5(ctx, R() * 1900, 60 + R() * 380, 8 + R() * 6, 0, '#f3e3b0'); }
  ctx.fillStyle = '#7d826c'; ctx.fillRect(-1500, GROUND_Y, W + 3000, 600); line(ctx, -1500, GROUND_Y, W + 1500, GROUND_Y, 6);
}

function drawCoinsFlying(ctx, fromX, fromY, toX, toY, t, count, alpha = 1) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha;
  for (let i = 0; i < count; i++) {
    const k = ((t * .9 + i / count) % 1);
    drawCoin(ctx, lerp(fromX, toX, k), lerp(fromY, toY, k) - Math.sin(k * Math.PI) * 160, 22, t * 6 + i);
  }
  ctx.restore();
}

// ---------- shots ----------
// 0 — hook: Aduš waits on a bench, the dream of money pops like a bubble
addShot(0, 0, (ctx, lt, t) => {
  const cam = centerCam(t, kf(lt, [[0, 1.0], [3.5, 1.08]]), 40, 0);
  applyCam(ctx, cam, .4); drawVillage(ctx, t, { skyTop: '#9aa' });
  applyCam(ctx, cam, 1);
  drawAshTree(ctx, 560, 830, 1.1, t);
  rrect(ctx, 800, 760, 360, 26, 6); fillStroke(ctx, '#8c6844', 5); rrect(ctx, 830, 786, 20, 70, 4); fillStroke(ctx, '#6b4428', 4); rrect(ctx, 1110, 786, 20, 70, 4); fillStroke(ctx, '#6b4428', 4);
  const neverAt = wordAt('nepríde', 0);
  const popped = t > neverAt + .1;
  drawAdus(ctx, { x: 980, y: 860, s: 480, legs: SEATED_LEGS, arms: { L: [.5, -.6], R: [.5, -.6] }, bob: Math.sin(t * 2) * .004,
    face: popped ? { eyes: 'half', mouth: 'frown', browAng: .3 } : { eyes: 'happy', mouth: 'smile', look: [.5, -.8] } });
  const dreamIn = fadeAt(t, .3, .6);
  if (!popped) drawThought(ctx, 1320, 300, 150, dreamIn, [1060, 520], c => { drawMoneyBag(c, 0, 90, 1.4); drawCoin(c, -150, -60, 34, t * 4); drawCoin(c, 150, -80, 34, t * 4 + 1); });
  if (popped) puff(ctx, 1320, 300, 150, t, '#f7efe1', 4, 1 - (t - neverAt - .1) * 1.6);
});

// 1–2 — the book: Kukučín (Matej Bencúr), 1890
addShot(1, 2, (ctx, lt, t) => {
  const cam = centerCam(t, kf(lt, [[0, 1.0], [8, 1.06]]), 0, 0, 2);
  applyCam(ctx, cam, 1);
  ctx.fillStyle = '#ead9bb'; ctx.fillRect(-500, -500, W + 1000, H + 1000);
  const fly = kf(lt, [[0, 0], [1.4, 1, easeOut]]);
  drawBook(ctx, lerp(-400, 700, fly), 470 + Math.sin(t * 1.5) * 8, .95, lerp(-.6, -.05, fly),
    { title: ['Keď báčik', 'z Chochoľova', 'umrie'], author: 'Martin Kukučín', cover: '#5c4033', spine: '#3e2a20', art: c => drawManor(c, 0, 60, .45) });
  const authorAt = wordAt('kukučín', 2);
  drawStick(ctx, { x: 1320, y: 870, s: 520 * popAt(t, authorAt), cols: ['#3b3a3f', '#3b3a3f'], hat: 'none', belt: false,
    face: { eyes: 'normal', mouth: 'smile', look: [-.6, 0] }, arms: { L: [.3, -.1], R: [2.1, .6] } });
  drawTag(ctx, 'Matej Bencúr', 1450, 250, 48 * popAt(t, wordAt('bencúr', 2)), '#6b705c', popAt(t, wordAt('bencúr', 2)), .06);
  const yearAt = wordAt('tisícosemstodeväťdesiat', 2);
  drawTag(ctx, '1890', 1560, 420, 64 * popAt(t, yearAt), '#a8553a', popAt(t, yearAt), -.08);
});

// 3 — realism, the decline of the gentry: the proud manor cracks, a top hat falls
addShot(3, 3, (ctx, lt, t) => {
  const cam = centerCam(t, kf(lt, [[0, 1.0], [4.6, 1.1]]), 0, 30);
  applyCam(ctx, cam, .4); drawVillage(ctx, t, { skyTop: '#9aa' });
  applyCam(ctx, cam, 1);
  const declineAt = wordAt('úpadok', 3);
  const decay = kf(t, [[declineAt - .2, 0], [declineAt + 1.2, 1]]);
  drawManor(ctx, 760, 820, 1.0, decay, t);
  drawTag(ctx, 'realizmus', 1480, 260, 54 * popAt(t, wordAt('realizmu', 3)), '#6b705c', popAt(t, wordAt('realizmu', 3)), .06);
  const satireAt = wordAt('humorom', 3);
  drawTag(ctx, 'humor a satira', 1500, 420, 46 * popAt(t, satireAt), '#dda15e', popAt(t, satireAt), -.05);
  const hatFall = clamp((t - declineAt - .3) / .9);
  ctx.save(); ctx.translate(1380 + hatFall * 80, lerp(560, 800, easeOut(hatFall))); ctx.rotate(hatFall * 2.2);
  ellipse(ctx, 0, 0, 80, 14); fillStroke(ctx, '#1f1a22', 5); rrect(ctx, -42, -95, 84, 95, 10); fillStroke(ctx, '#1f1a22', 5);
  ctx.restore();
});

// 4–5 — Ondrej Tráva walks past the plough toward the fair
addShot(4, 5, (ctx, lt, t) => {
  const length = shotEnd(5) - shotStart(4);
  const cam = centerCam(t, 1.04, kf(lt, [[0, -150], [length, 260]]), 30);
  applyCam(ctx, cam, .4); drawVillage(ctx, t);
  applyCam(ctx, cam, 1);
  drawCottage(ctx, 250, 820, 1.0);
  drawPlow(ctx, 640, 860, 1.2);
  drawMarketStall(ctx, 1650, 830, 1.0);
  drawMarketStall(ctx, 2080, 830, .9, '#6b705c');
  const nameAt = wordAt('ondrej', 4);
  drawTag(ctx, 'Ondrej Tráva', 700, 200, 50 * popAt(t, nameAt), '#6b705c', popAt(t, nameAt), -.05);
  const refuseAt = wordAt('neláka', 5);
  const walkStart = refuseAt + .6;
  const ondrejX = kf(t, [[walkStart, 760], [walkStart + 2.4, 1380]], v => v);
  const walking = t > walkStart && t < walkStart + 2.4;
  const shakingHead = t > refuseAt - .2 && t < walkStart;
  drawOndrej(ctx, { x: ondrejX, y: 880, s: 560, flip: walking ? 1 : -1, legs: walking ? walkLegs(t) : POSE.idle.legs, arms: walking ? walkArms(t) : POSE.hips.arms,
    headTilt: shakingHead ? Math.sin(t * 14) * .15 : 0, bob: walking ? Math.abs(Math.sin(t * 9)) * -.01 : 0,
    face: shakingHead ? { eyes: 'squint', mouth: 'flat', browAng: -.3 } : { eyes: 'happy', mouth: 'smile' } });
});

// 6 — buy cheap, sell dear: one coin out, a pile of coins back
addShot(6, 6, (ctx, lt, t) => {
  const cam = centerCam(t, 1.1, 0, 40);
  applyCam(ctx, cam, .4); drawVillage(ctx, t);
  applyCam(ctx, cam, 1);
  drawMarketStall(ctx, 960, 830, 1.15);
  const cheapAt = wordAt('lacno', 6), dearAt = wordAt('draho', 6);
  drawGrainSack(ctx, kf(t, [[cheapAt, 1500], [cheapAt + .5, 1180]]), 870, .9);
  drawOndrej(ctx, { x: 720, y: 880, s: 560, arms: { L: [.3, -.1], R: [1.4, -.3] }, face: { eyes: t > dearAt ? 'happy' : 'smug', mouth: t > dearAt ? 'grin' : 'smirk', look: [.8, 0] } });
  drawTag(ctx, 'lacno', 520, 300, 50 * popAt(t, cheapAt), '#6b705c', popAt(t, cheapAt), -.06);
  drawTag(ctx, 'draho', 1420, 300, 60 * popAt(t, dearAt), '#a8553a', popAt(t, dearAt), .06);
  if (t > dearAt) drawCoinsFlying(ctx, 1300, 600, 760, 560, t, 6);
});

// 7–8 — in the tavern Aduš boasts with big words
addShot(7, 8, (ctx, lt, t) => {
  const cam = centerCam(t, kf(lt, [[0, 1.0], [6, 1.08]]), 0, 30, 2);
  applyCam(ctx, cam, 1); drawTavern(ctx, t);
  const nobleAt = wordAt('adušom', 7), boastAt = wordAt('veľkými', 8);
  const boasting = t > boastAt;
  drawOndrej(ctx, { x: 560, y: 900, s: 520, legs: SEATED_LEGS, arms: { L: [.3, -.1], R: [1.3, -1.2] }, face: { eyes: 'normal', mouth: 'smile', look: [.8, 0] } });
  drawAdus(ctx, { x: 1360, y: 900, s: 540, flip: -1, legs: SEATED_LEGS, arms: boasting ? BIG_GESTURE_ARMS(t) : GESTURE_ARMS(t), bob: Math.sin(t * 3) * .004,
    face: { eyes: boasting ? 'smug' : 'happy', mouth: 'grin', look: [-.8, 0], browAng: -.2 } });
  drawTable(ctx, 960, 700, 820);
  drawMug(ctx, 760, 700, 1); drawMug(ctx, 1160, 700, 1);
  drawTag(ctx, 'Aduš Domanický', 1380, 150, 46 * popAt(t, nobleAt), '#5c4033', popAt(t, nobleAt), .05);
  drawThought(ctx, 1000, 260, 120, fadeAt(t, boastAt + .3), [1250, 420], c => { drawManor(c, 0, 120, .42); drawCoin(c, -230, -90, 30, t * 4); drawCoin(c, 230, -70, 30, t * 4 + 2); });
});

// 9 — the rich uncle in Chochoľov sends money
addShot(9, 9, (ctx, lt, t) => {
  const cam = centerCam(t, kf(lt, [[0, 1.0], [5, 1.08]]), 0, 30, 2);
  applyCam(ctx, cam, .4); drawVillage(ctx, t, { sun: [1600, 180, 60] });
  applyCam(ctx, cam, 1);
  const uncleAt = wordAt('báčikom', 9);
  const uncleIn = popAt(t, uncleAt - .2, .4);
  drawChurch(ctx, 1500, 820, .8);
  drawBacik(ctx, { x: 1220, y: 880, s: 560 * uncleIn, flip: -1, arms: { L: [.3, -.1], R: [1.6, -.5] }, face: { eyes: 'happy', mouth: 'smile', look: [-.8, 0] } });
  drawMoneyBag(ctx, 1130, 880 - 560 * .55, .8 * uncleIn);
  drawAdus(ctx, { x: 520, y: 880, s: 540, arms: POSE.handsUp.arms, face: { eyes: 'happy', mouth: 'grin', look: [.8, -.3] } });
  if (t > wordAt('pomáha', 9) - .8) drawCoinsFlying(ctx, 1100, 500, 560, 400, t, 5);
  drawTag(ctx, 'báčik = strýko', 900, 180, 46 * popAt(t, uncleAt + .3), '#6b705c', popAt(t, uncleAt + .3), -.04);
});

// 10–11 — barley and oats cheap; Ondrej pays a deposit
addShot(10, 11, (ctx, lt, t) => {
  const cam = centerCam(t, 1.05, 0, 30, 2);
  applyCam(ctx, cam, 1); drawTavern(ctx, t);
  const barleyAt = wordAt('jačmeň', 10), oatsAt = wordAt('ovos', 10), lowAt = wordAt('nízku', 10), depositAt = wordAt('zálohu', 11);
  drawOndrej(ctx, { x: 520, y: 900, s: 540, arms: t > depositAt - .3 ? { L: [.3, -.1], R: [1.5, -.2] } : POSE.idle.arms, face: { eyes: t > lowAt ? 'happy' : 'normal', mouth: t > lowAt ? 'grin' : 'smile', look: [.8, 0] } });
  drawAdus(ctx, { x: 1400, y: 900, s: 540, flip: -1, arms: GESTURE_ARMS(t), face: { eyes: 'smug', mouth: 'smirk', look: [-.8, 0] } });
  drawGrainSack(ctx, 860, 880, .9 * popAt(t, barleyAt), 'jačmeň');
  drawGrainSack(ctx, 1080, 880, .9 * popAt(t, oatsAt), 'ovos');
  drawTag(ctx, 'lacno!', 970, 380, 56 * popAt(t, lowAt), '#a8553a', popAt(t, lowAt), .06);
  if (t > depositAt) drawCoinsFlying(ctx, 640, 560, 1300, 560, t, 4, fadeAt(t, depositAt, .2));
  drawTag(ctx, 'záloha', 960, 190, 50 * popAt(t, depositAt), '#6b705c', popAt(t, depositAt), -.05);
});

// 12–13 — at the fair: Aduš on a shabby carriage behind a skinny horse; Ondrej gets suspicious
addShot(12, 13, (ctx, lt, t) => {
  const length = shotEnd(13) - shotStart(12);
  const cam = centerCam(t, 1.02, kf(lt, [[0, -80], [length, 80]]), 30);
  applyCam(ctx, cam, .4); drawVillage(ctx, t, { skyTop: '#9aa' });
  applyCam(ctx, cam, 1);
  drawMarketStall(ctx, -120, 830, .9);
  const passX = kf(lt, [[0, 2200], [3.4, 1180]], v => v);
  drawHorse(ctx, { x: passX - 360, y: 880, s: .85, flip: -1, t, col: '#9a8f80', gallop: lt < 3.4 ? t * 4 : null, headUp: .25 });
  for (let i = 0; i < 4; i++) line(ctx, passX - 420 + i * 30, 880 - 250 * .85, passX - 430 + i * 30, 880 - 200 * .85, 4, 'rgba(26,26,26,.6)');
  drawCarriage(ctx, passX + 80, 880, .9, t, lt < 3.4 ? 1 : 0, -1);
  drawAdus(ctx, { x: passX + 100, y: 880 - 330 * .9, s: 360, flip: -1, shabby: true, legs: SEATED_LEGS, shadow: false, face: { eyes: 'half', mouth: 'flat' } });
  const suspectAt = wordAt('tušiť', 13);
  drawOndrej(ctx, { x: 330, y: 890, s: 560, arms: t > suspectAt ? { L: [.3, -.1], R: { ik: [.05, -.78], bend: -1 } } : POSE.idle.arms,
    face: t > suspectAt ? { eyes: 'squint', mouth: 'flat', browAng: -.35, look: [.8, 0] } : { eyes: 'wide', mouth: 'o', look: [.8, 0] } });
  drawQuestionMark(ctx, 420, 230, 150, popAt(t, suspectAt));
});

// 14–15 — journey to Domanice, the wagon breaks, a night at the Juráňs
addShot(14, 15, (ctx, lt, t) => {
  const breakAt = wordAt('pokazí', 15), nightAt = wordAt('prenocuje', 15);
  const isNight = t > nightAt - .2;
  const cam = centerCam(t, 1.02, isNight ? 0 : kf(t, [[shotStart(14), -200], [breakAt, 200]]), 30);
  applyCam(ctx, cam, .4);
  if (isNight) drawNightSky(ctx, t); else drawVillage(ctx, t, { sun: [1500, 200, 70] });
  applyCam(ctx, cam, 1);
  if (isNight) {
    drawCottage(ctx, 1250, 820, 1.25, { window: '#ffd76a' });
    drawJuran(ctx, { x: 820, y: 880, s: 540, flip: 1, arms: { L: [.3, -.1], R: [2.0, .3] }, face: { eyes: 'happy', mouth: 'smile', look: [-.8, 0] } });
    drawWoman(ctx, C(JURAN_WIFE, { x: 1000, y: 880, s: 520, face: { eyes: 'happy', mouth: 'smile', look: [-.8, 0] } }));
    drawOndrej(ctx, { x: 470, y: 890, s: 560, arms: { L: [.3, -.1], R: [1.2, -.3] }, face: { eyes: 'half', mouth: 'smile', look: [.8, 0] } });
    drawTag(ctx, 'Juráňovci', 1000, 180, 50 * popAt(t, wordAt('juráňovcov', 15)), '#6b705c', popAt(t, wordAt('juráňovcov', 15)), .05);
    return;
  }
  const broken = t > breakAt;
  const wagonX = kf(t, [[shotStart(14), 300], [breakAt, 1100]], v => v);
  const wheelOff = kf(t, [[breakAt, 0], [breakAt + .8, 1, easeOut]]);
  drawHorse(ctx, { x: wagonX + 520, y: 880, s: .85, t, gallop: broken ? null : t * 6 });
  drawWagon(ctx, wagonX, 880, 1, t, broken ? 0 : 1, wheelOff);
  drawOndrej(ctx, { x: wagonX - 40, y: 880 - 230, s: 420, legs: SEATED_LEGS, shadow: false, face: broken ? { eyes: 'x', mouth: 'o' } : { eyes: 'happy', mouth: 'smile' } });
  if (broken && t < breakAt + .4) burst(ctx, wagonX + 100, 800, 90, 10, '#f2d27a', 4);
  drawTag(ctx, 'Domanice', 1400, 220, 50 * popAt(t, wordAt('domaníc', 14)), '#5c4033', popAt(t, wordAt('domaníc', 14)), -.05);
});

// 16–17 — at supper Juráň tells the truth: a fine manor, neglected through laziness
addShot(16, 17, (ctx, lt, t) => {
  const cam = centerCam(t, kf(lt, [[0, 1.0], [5.5, 1.08]]), 0, 30, 2);
  applyCam(ctx, cam, 1); drawTavern(ctx, t);
  const inheritAt = wordAt('zdedil', 17), lazyAt = wordAt('lenivosť', 17);
  drawJuran(ctx, { x: 1380, y: 900, s: 540, flip: -1, legs: SEATED_LEGS, arms: GESTURE_ARMS(t), face: { eyes: 'normal', mouth: 'o', browAng: .2, look: [-.8, 0] } });
  drawOndrej(ctx, { x: 560, y: 900, s: 520, legs: SEATED_LEGS, face: { eyes: t > lazyAt ? 'wide' : 'normal', mouth: t > lazyAt ? 'o' : 'flat', look: [.8, 0] } });
  drawTable(ctx, 960, 700, 820); drawMug(ctx, 800, 700, .9);
  const decay = kf(t, [[lazyAt, 0], [lazyAt + 1.6, 1]]);
  drawThought(ctx, 980, 300, 150, fadeAt(t, inheritAt - .3), [1250, 450], c => drawManor(c, 0, 150, .5, decay, t));
  drawTag(ctx, 'márnotratnosť', 980, 560, 44 * popAt(t, wordAt('márnotratnosť', 17)), '#a8553a', popAt(t, wordAt('márnotratnosť', 17)), .04);
});

// 18 — in debt; his estate is only a façade that falls over
addShot(18, 18, (ctx, lt, t) => {
  const cam = centerCam(t, 1.04, 0, 30);
  applyCam(ctx, cam, .4); drawVillage(ctx, t, { skyTop: '#9aa' });
  applyCam(ctx, cam, 1);
  const debtAt = wordAt('zadĺžený', 18), facadeAt = wordAt('zdanie', 18);
  drawManor(ctx, 960, 820, 1.0, 1, t);
  const fall = kf(t, [[facadeAt - .1, 0], [facadeAt + .6, 1, easeIn]]);
  ctx.save(); ctx.translate(960, 820); ctx.transform(1, 0, 0, Math.cos(fall * Math.PI / 2), 0, 0); ctx.translate(-960, -820); ctx.globalAlpha = 1 - fall * .2;
  drawManor(ctx, 960, 820, 1.0, 0, t); ctx.restore();
  if (t > facadeAt + .55 && t < facadeAt + 1.1) puff(ctx, 960, 800, 220, t, '#e8dcc0', 6, 1 - (t - facadeAt - .55) * 1.8);
  for (let i = 0; i < 3; i++) drawTag(ctx, 'dlh', 1500 + i * 70, 220 + i * 90, 46 * popAt(t, debtAt + i * .2), '#a8553a', popAt(t, debtAt + i * .2), (i - 1) * .12);
});

// 19–20 — morning: Ondrej sees the poverty, the manor rots, weeds grow
addShot(19, 20, (ctx, lt, t) => {
  const length = shotEnd(20) - shotStart(19);
  const cam = centerCam(t, kf(lt, [[0, 1.0], [length, 1.1]]), kf(lt, [[0, -60], [length, 60]]), 30);
  applyCam(ctx, cam, .4); drawVillage(ctx, t, { sun: [300, 220, 70] });
  applyCam(ctx, cam, 1);
  const weedsAt = wordAt('burinou', 20);
  drawManor(ctx, 1150, 820, 1.0, kf(t, [[wordAt('chátra', 20) - .3, .6], [wordAt('chátra', 20) + .8, 1]]), t);
  drawWeeds(ctx, -200, 2200, 830, kf(t, [[weedsAt - .6, .2], [weedsAt + .8, 1]]), t);
  const arriveEnd = shotStart(19) + 1.8;
  const walking = t < arriveEnd;
  drawOndrej(ctx, { x: kf(t, [[shotStart(19), -100], [arriveEnd, 400]], v => v), y: 890, s: 560, legs: walking ? walkLegs(t) : POSE.idle.legs, arms: walking ? walkArms(t) : POSE.idle.arms,
    face: walking ? { eyes: 'normal', mouth: 'smile' } : { eyes: 'wide', mouth: 'o', look: [.8, -.2] } });
});

// 21 — Aduš welcomes him warmly, but has no barley and turns out empty pockets
addShot(21, 21, (ctx, lt, t) => {
  const cam = centerCam(t, 1.06, 0, 40);
  applyCam(ctx, cam, .4); drawVillage(ctx, t, { skyTop: '#9aa' });
  applyCam(ctx, cam, 1);
  drawManor(ctx, 1500, 820, .8, 1, t);
  const noBarleyAt = wordAt('nemá', 21);
  const empty = t > noBarleyAt;
  drawOndrej(ctx, { x: 520, y: 890, s: 560, arms: empty ? POSE.hips.arms : POSE.idle.arms, face: empty ? { eyes: 'squint', mouth: 'frown', browAng: -.4, look: [.8, 0] } : { eyes: 'normal', mouth: 'smile', look: [.8, 0] } });
  const bow = empty ? 0 : Math.max(0, Math.sin(clamp(lt / 1.6) * Math.PI)) * .35;
  drawAdus(ctx, { x: 980, y: 880, s: 560, flip: -1, shabby: true, lean: -bow, hatLift: bow * .3,
    arms: empty ? { L: [1.3, .8], R: [1.3, .8] } : GESTURE_ARMS(t),
    face: empty ? { eyes: 'normal', mouth: 'frown', browAng: .4, look: [-.6, .4] } : { eyes: 'happy', mouth: 'grin', look: [-.8, 0] } });
  if (empty) { for (const side of [-1, 1]) { ellipse(ctx, 980 + side * 75, 880 - 560 * .3, 22, 14); fillStroke(ctx, '#efe3cc', 4); } puff(ctx, 980, 880 - 560 * .25, 30, t, '#e8dcc0', 2, 1 - (t - noBarleyAt) * .8); }
  drawTag(ctx, 'žiadny jačmeň', 1000, 200, 48 * popAt(t, noBarleyAt), '#a8553a', popAt(t, noBarleyAt), .05);
});

// 22 — "everything will change when the uncle from Chochoľov dies"
addShot(22, 22, (ctx, lt, t) => {
  const cam = centerCam(t, kf(lt, [[0, 1.05], [4, 1.18]]), 60, 40, 2);
  applyCam(ctx, cam, .4); drawVillage(ctx, t, { skyTop: '#9aa' });
  applyCam(ctx, cam, 1);
  const uncleAt = wordAt('báčik', 22);
  drawAdus(ctx, { x: 820, y: 880, s: 580, shabby: true, arms: { L: [.3, -.1], R: [2.9, .1] }, face: { eyes: 'happy', mouth: 'smile', look: [.6, -.8] }, headTilt: .1 });
  sparkle(ctx, 820 + 150, 880 - 580 * 1.1, 30, .8 + Math.sin(t * 6) * .2);
  drawThought(ctx, 1350, 300, 150, fadeAt(t, uncleAt - .3), [1000, 500], c => {
    drawBacik(c, { x: -120, y: 160, s: 260, face: { eyes: 'normal', mouth: 'smile' } });
    drawMoneyBag(c, 150, 160, 1.1); drawCoin(c, 60, -120, 30, t * 4); drawCoin(c, 230, -60, 30, t * 4 + 2);
  });
  drawOndrej(ctx, { x: 1620, y: 900, s: 520, flip: -1, arms: POSE.hips.arms, face: { eyes: 'half', mouth: 'flat', browAng: -.3, look: [-.8, 0] } });
});

// 23 — Ondrej will not give up: steam, then he scratches his head and thinks
addShot(23, 23, (ctx, lt, t) => {
  const cam = centerCam(t, kf(lt, [[0, 1.2], [3.8, 1.32]]), 0, 70);
  applyCam(ctx, cam, .4); drawVillage(ctx, t, { skyTop: '#9aa' });
  applyCam(ctx, cam, 1);
  const thinkAt = wordAt('spôsob', 23);
  const thinking = t > thinkAt;
  drawOndrej(ctx, { x: 960, y: 960, s: 640, arms: thinking ? { L: [.3, -.1], R: { ik: [.08, -.88], bend: -1 } } : { L: [1.9, -1.8], R: [1.9, -1.8] },
    face: thinking ? { eyes: 'squint', mouth: 'smirk', look: [.5, -.6] } : { eyes: 'normal', mouth: 'teeth', browAng: -.45 } });
  if (!thinking) puff(ctx, 960 + 170, 960 - 640 * 1.05, 40, t, '#f3efe6', 3, .9);
  drawQuestionMark(ctx, 1220, 300, 130, popAt(t, thinkAt));
});

// 24 — servants Adam and Eva point to the old ash trees by the manor
addShot(24, 24, (ctx, lt, t) => {
  const cam = centerCam(t, 1.02, kf(lt, [[0, -100], [5.4, 120]]), 30);
  applyCam(ctx, cam, .4); drawVillage(ctx, t, { skyTop: '#9aa' });
  applyCam(ctx, cam, 1);
  drawManor(ctx, 1950, 820, .8, 1, t);
  const treesAt = wordAt('jasene', 24);
  drawAshTree(ctx, 1280, 830, 1.15, t); drawAshTree(ctx, 1560, 830, 1.0, t + 2);
  const pointing = t > treesAt - .4;
  drawStick(ctx, C(ADAM, { x: 380, y: 880, s: 520, arms: pointing ? { L: [.3, -.1], R: [1.9, .1] } : { L: [.3, -.1], R: { ik: [.1, -.75], bend: -1 } }, face: { eyes: 'normal', mouth: 'smile', look: [.8, 0] } }));
  drawWoman(ctx, C(EVA, { x: 560, y: 880, s: 500, arms: pointing ? { L: [.3, -.1], R: [1.8, .2] } : POSE.idle.arms, face: { eyes: 'happy', mouth: 'smile', look: [.8, 0] } }));
  drawOndrej(ctx, { x: 820, y: 890, s: 560, flip: pointing ? 1 : -1, face: pointing ? { eyes: 'wide', mouth: 'grin', look: [.8, -.4] } : { eyes: 'normal', mouth: 'flat', look: [-.8, 0] } });
  drawTag(ctx, 'Adam a Eva', 470, 220, 46 * popAt(t, wordAt('adam', 24)), '#6b705c', popAt(t, wordAt('adam', 24)), -.05);
  if (pointing) { sparkle(ctx, 1280, 300, 40 * popAt(t, treesAt), 1); sparkle(ctx, 1560, 340, 30 * popAt(t, treesAt), 1); }
});

// 25 — Aduš turns pale: his ancestors lie under the ash trees
addShot(25, 25, (ctx, lt, t) => {
  const cam = centerCam(t, kf(lt, [[0, 1.05], [3, 1.14]]), 0, 30);
  applyCam(ctx, cam, .4); drawVillage(ctx, t, { skyTop: '#9aa' });
  applyCam(ctx, cam, 1);
  drawAshTree(ctx, 1150, 830, 1.15, t); drawAshTree(ctx, 1500, 830, 1.0, t + 2);
  const paleAt = wordAt('zbledne', 25), ancestorsAt = wordAt('predkovia', 25);
  for (let i = 0; i < 3; i++) drawGraveCross(ctx, 1080 + i * 210, 860, .9, fadeAt(t, ancestorsAt - .3 + i * .15));
  const pale = t > paleAt;
  drawAdus(ctx, { x: 620, y: 880, s: 580, shabby: true, cols: pale ? ['#9a8f80', '#d8ccb4'] : ADUS.cols, arms: pale ? { L: [.6, -1.6], R: [.6, -1.6] } : POSE.idle.arms,
    face: pale ? { eyes: 'wide', mouth: 'frown', browAng: .45, look: [.8, 0] } : { eyes: 'normal', mouth: 'flat', look: [.8, 0] } });
  if (pale) sweat(ctx, 620 + 120, 880 - 580 * .95, 32, clamp((t - paleAt) * 3));
});

// 26 — remorse: head down, a light shaft, his conscience stirs
addShot(26, 26, (ctx, lt, t) => {
  const cam = centerCam(t, kf(lt, [[0, 1.3], [3.9, 1.45]]), 0, 80);
  applyCam(ctx, cam, .4); drawVillage(ctx, t, { skyTop: '#9aa' });
  applyCam(ctx, cam, 1);
  const stirAt = wordAt('svedomie', 26);
  const glow = fadeAt(t, stirAt - .3, .6);
  lightShaft(ctx, 960, -100, 160, 520, 1100, glow);
  drawAdus(ctx, { x: 960, y: 960, s: 640, shabby: true, headTilt: lerp(.25, 0, glow), arms: glow > .5 ? { L: [.3, -.1], R: { ik: [-.02, -.5], bend: 1 } } : POSE.idle.arms,
    face: glow > .5 ? { eyes: 'normal', mouth: 'flat', browAng: .35 } : { eyes: 'normal', mouth: 'frown', browAng: .45, look: [0, .8] } });
  drawHeart(ctx, 960, 960 - 640 * .45, 70 * glow, glow);
  sparkle(ctx, 1150, 470, 40 * glow, glow);
});

// 27 — he promises to pay and lives more honestly: handshake, coins back
addShot(27, 27, (ctx, lt, t) => {
  const cam = centerCam(t, 1.06, 0, 40);
  applyCam(ctx, cam, .4); drawVillage(ctx, t, { sun: [1450, 200, 80], sunPow: 1 });
  applyCam(ctx, cam, 1);
  const payAt = wordAt('zaplatí', 27), honestAt = wordAt('poctivejšie', 27);
  drawOndrej(ctx, { x: 700, y: 890, s: 560, arms: { L: [.3, -.1], R: [1.55, -.1] }, face: { eyes: 'happy', mouth: 'smile', look: [.8, 0] } });
  drawAdus(ctx, { x: 1220, y: 880, s: 560, flip: -1, arms: { L: [.3, -.1], R: [1.55, -.1] }, face: { eyes: 'happy', mouth: 'smile', look: [-.8, 0] } });
  if (t > payAt) drawCoinsFlying(ctx, 1100, 560, 800, 560, t, 4, fadeAt(t, payAt, .2));
  const honest = popAt(t, honestAt);
  sparkle(ctx, 960, 330, 50 * honest, honest); sparkle(ctx, 1080, 410, 34 * honest, honest);
  drawTag(ctx, 'splatí dlh', 960, 200, 50 * popAt(t, payAt), '#6b705c', popAt(t, payAt), .04);
});

// 28 — the uncle really dies: the bell tolls, a candle goes out
addShot(28, 28, (ctx, lt, t) => {
  const cam = centerCam(t, kf(lt, [[0, 1.0], [2.6, 1.08]]), 0, 20, 2);
  applyCam(ctx, cam, .4); drawVillage(ctx, t, { skyTop: '#9aa' });
  applyCam(ctx, cam, 1);
  const dieAt = wordAt('umrie', 28);
  drawChurch(ctx, 760, 830, 1.0, t > dieAt - .5 ? Math.sin((t - dieAt) * 5) * .35 : 0);
  const flame = 1 - fadeAt(t, dieAt, .3);
  drawCandle(ctx, 1350, 860, 1.3, flame, t);
  if (flame < 1) puff(ctx, 1350, 860 - 1.3 * 250 - (t - dieAt) * 80, 30 + (t - dieAt) * 20, t, '#e8dcc0', 2, .8 - (t - dieAt) * .5);
  drawTag(ctx, 'Chochoľov', 1350, 220, 48 * popAt(t, wordAt('chochoľova', 28)), '#5c4033', popAt(t, wordAt('chochoľova', 28)), -.05);
});

// 29 — the will: the money bag flies to others, Aduš gets nothing
addShot(29, 29, (ctx, lt, t) => {
  const cam = centerCam(t, 1.04, 0, 30, 2);
  applyCam(ctx, cam, .4); drawVillage(ctx, t, { skyTop: '#9aa' });
  applyCam(ctx, cam, 1);
  const nothingAt = wordAt('nič', 29), othersAt = wordAt('iní', 29);
  drawDocument(ctx, 960, 400, .8, -.05, popAt(t, nothingAt - .4));
  const bagFly = kf(t, [[othersAt - .4, 0], [othersAt + .5, 1]]);
  drawMoneyBag(ctx, lerp(960, 1500, bagFly), lerp(760, 640, bagFly) - Math.sin(bagFly * Math.PI) * 150, .9);
  drawAdus(ctx, { x: 520, y: 880, s: 560, shabby: true, arms: t > nothingAt ? { L: [2.0, 1.2], R: [2.0, 1.2] } : POSE.idle.arms,
    face: t > nothingAt ? { eyes: 'normal', mouth: 'frown', browAng: .4 } : { eyes: 'wide', mouth: 'o', look: [.8, -.4] } });
  for (let i = 0; i < 3; i++) drawStick(ctx, { x: 1450 + i * 170, y: 880, s: 440, cols: ['#3b3a3f', '#3b3a3f'], hat: 'none', alpha: .85 * fadeAt(t, othersAt - .5), face: { eyes: 'happy', mouth: 'grin' }, arms: POSE.handsUp.arms });
});

// 30 — the title is ironic: the dream bubble bursts
addShot(30, 30, (ctx, lt, t) => {
  const cam = centerCam(t, kf(lt, [[0, 1.0], [3.5, 1.06]]), 0, 0, 2);
  applyCam(ctx, cam, 1);
  ctx.fillStyle = '#ead9bb'; ctx.fillRect(-500, -500, W + 1000, H + 1000);
  drawBook(ctx, 640, 480, .85, -.05, { title: ['Keď báčik', 'z Chochoľova', 'umrie'], author: 'Martin Kukučín', cover: '#5c4033', spine: '#3e2a20', art: c => drawManor(c, 0, 60, .45) });
  const ironyAt = wordAt('ironický', 30), burstAt = wordAt('rozplynie', 30);
  drawTag(ctx, 'irónia', 1400, 230, 60 * popAt(t, ironyAt), '#a8553a', popAt(t, ironyAt), .06);
  if (t < burstAt) drawThought(ctx, 1380, 560, 140, fadeAt(t, shotStart(30) + .3), [1000, 650], c => { drawMoneyBag(c, 0, 90, 1.4); });
  else puff(ctx, 1380, 560, 160, t, '#f7efe1', 5, 1 - (t - burstAt) * 1.6);
});

// 31–33 — two worlds: practical Ondrej versus lazy Aduš
addShot(31, 33, (ctx, lt, t) => {
  const cam = centerCam(t, kf(lt, [[0, 1.0], [11, 1.06]]), 0, 30, 2);
  applyCam(ctx, cam, .4); drawVillage(ctx, t);
  applyCam(ctx, cam, 1);
  const ondrejAt = wordAt('ondrej', 32), adusAt = wordAt('aduš', 33);
  line(ctx, 960, 120, 960, 800, 8, 'rgba(26,26,26,.55)');
  drawHorse(ctx, { x: 260, y: 870, s: .8, t });
  drawGrainSack(ctx, 560, 880, .8); drawGrainSack(ctx, 690, 880, .7);
  const lifting = Math.max(0, Math.sin(t * 2.2));
  drawOndrej(ctx, { x: 640, y: 890, s: 520, arms: { L: [2.2 * lifting + .3, .3], R: [2.2 * lifting + .3, .3] }, face: { eyes: 'happy', mouth: 'smile' } });
  drawGrainSack(ctx, 640, 890 - 520 * (1.05 + lifting * .35), .55 * clamp(lifting * 3));
  drawManor(ctx, 1560, 820, .55, 1, t);
  rrect(ctx, 1150, 770, 300, 24, 6); fillStroke(ctx, '#8c6844', 5);
  drawAdus(ctx, { x: 1300, y: 860, s: 480, shabby: true, legs: SEATED_LEGS, arms: { L: [.5, -.6], R: [.5, -.6] }, headTilt: .15 + Math.sin(t) * .03, face: { eyes: 'half', mouth: 'smile', look: [.4, -.6] } });
  if (t > adusAt) { for (let i = 0; i < 3; i++) { const k = ((t * .7 + i / 3) % 1); text(ctx, 'z', 1400 + k * 80, 380 - k * 160, 40 + k * 30, '#5c4033', INK, 0, 'Lora', 700); } }
  drawTag(ctx, 'praktický', 450, 200, 46 * popAt(t, wordAt('praktický', 32)), '#6b705c', popAt(t, wordAt('praktický', 32)), -.05);
  drawTag(ctx, 'podnikavý', 700, 320, 46 * popAt(t, wordAt('podnikavý', 32)), '#6b705c', popAt(t, wordAt('podnikavý', 32)), .05);
  drawTag(ctx, 'lenivý', 1300, 200, 46 * popAt(t, wordAt('lenivý', 33)), '#a8553a', popAt(t, wordAt('lenivý', 33)), .05);
  drawTag(ctx, 'prázdne reči', 1560, 320, 44 * popAt(t, wordAt('prázdnych', 33)), '#a8553a', popAt(t, wordAt('prázdnych', 33)), -.05);
  drawTag(ctx, 'sedliak', 480, 90, 40 * popAt(t, ondrejAt - .5), '#5c4033', popAt(t, ondrejAt - .5), 0);
  drawTag(ctx, 'zeman', 1440, 90, 40 * popAt(t, adusAt - .5), '#5c4033', popAt(t, adusAt - .5), 0);
});

// 34 — the working farmer has the upper hand: a balance tips toward Ondrej
addShot(34, 34, (ctx, lt, t) => {
  const cam = centerCam(t, 1.04, 0, 30, 2);
  applyCam(ctx, cam, .4); drawVillage(ctx, t, { sun: [1500, 200, 70] });
  applyCam(ctx, cam, 1);
  const upperAt = wordAt('navrch', 34);
  const tilt = kf(t, [[upperAt - .3, 0], [upperAt + .6, -.22, backOut]]);
  rrect(ctx, 945, 300, 30, 520, 6); fillStroke(ctx, '#8c6844', 6);
  path(ctx, [[880, 830], [1040, 830], [960, 780]]); fillStroke(ctx, '#6d5240', 6);
  ctx.save(); ctx.translate(960, 300); ctx.rotate(-tilt);
  rrect(ctx, -520, -14, 1040, 28, 8); fillStroke(ctx, '#a07850', 6);
  ctx.restore();
  const panY = side => 300 + Math.sin(-tilt) * 500 * side;
  for (const side of [-1, 1]) {
    const px = 960 + side * 500 * Math.cos(tilt), py = panY(side) + 200;
    line(ctx, px, py - 200, px - 90, py, 4); line(ctx, px, py - 200, px + 90, py, 4);
    ctx.beginPath(); ctx.ellipse(px, py, 120, 40, 0, 0, Math.PI); fillStroke(ctx, '#c9a35e', 6);
  }
  const leftPanY = panY(-1) + 200, rightPanY = panY(1) + 200;
  drawOndrej(ctx, { x: 960 - 500 * Math.cos(tilt), y: leftPanY, s: 300, shadow: false, arms: t > upperAt ? POSE.handsUp.arms : POSE.idle.arms, face: { eyes: 'happy', mouth: 'grin' } });
  drawAdus(ctx, { x: 960 + 500 * Math.cos(tilt), y: rightPanY, s: 300, shadow: false, shabby: true, face: t > upperAt ? { eyes: 'wide', mouth: 'o' } : { eyes: 'half', mouth: 'smile' } });
  drawTag(ctx, 'práca', 220, 420, 44 * popAt(t, wordAt('pracuje', 34)), '#6b705c', popAt(t, wordAt('pracuje', 34)), -.05);
  drawTag(ctx, 'sny', 1720, 520, 44 * popAt(t, wordAt('sníva', 34)), '#a8553a', popAt(t, wordAt('sníva', 34)), .05);
});

// 35–36 — takeaway: no point waiting for an inheritance; Aduš picks up a hoe at sunrise
addShot(35, 36, (ctx, lt, t) => {
  const length = shotEnd(36) - shotStart(35);
  const cam = centerCam(t, kf(lt, [[0, 1.0], [length, 1.12]]), kf(lt, [[0, -80], [length, 80]]), 20);
  applyCam(ctx, cam, .4); drawVillage(ctx, t, { skyTop: '#ffa', sun: [1300, 480, 110], sunPow: 1.3 });
  applyCam(ctx, cam, 1);
  drawManor(ctx, 1550, 820, .7, kf(lt, [[0, .8], [length, .35]]), t);
  const changeAt = wordAt('zmeniť', 36), actAt = wordAt('konať', 36);
  const working = t > changeAt;
  const swing = working ? Math.sin(t * 5) : 0;
  drawAdus(ctx, { x: 760, y: 880, s: 580, hatLift: 0, arms: working ? { L: [1.4 + swing * .5, -.6], R: [1.2 + swing * .5, -.4] } : POSE.idle.arms,
    prop: (c, side, hand) => { if (!working || side !== 'R') return; c.save(); c.translate(hand[0], hand[1]); c.rotate(.9 + swing * .4); line(c, 0, -.05, 0, .42, .02, '#6d5240'); path(c, [[-.06, .42], [.06, .42], [.04, .5], [-.04, .5]]); fillStroke(c, '#8a8a8a', .01); c.restore(); },
    face: working ? { eyes: 'happy', mouth: 'smile' } : { eyes: 'normal', mouth: 'flat', look: [.6, -.4] } });
  drawHeart(ctx, 760, 880 - 580 * .45, 60 * popAt(t, wordAt('svedomie', 36)), popAt(t, wordAt('svedomie', 36)));
  const shine = popAt(t, actAt);
  sparkle(ctx, 620, 300, 60 * shine, shine); sparkle(ctx, 940, 260, 44 * shine, shine);
  drawTag(ctx, 'svedomie', 1100, 220, 52 * popAt(t, wordAt('svedomie', 36)), '#6b705c', popAt(t, wordAt('svedomie', 36)), .05);
});
