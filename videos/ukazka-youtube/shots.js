// Ukážka pomalšieho nastavenia: Keď báčik z Chochoľova umrie, vety 1–3
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
