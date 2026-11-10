// ---------- Orava village, horses, villagers, book ----------
const GROUND_Y = 820;
const CHESTNUT = '#8a5a3c', CHESTNUT_DARK = '#5c4033', MANE = '#2e2018';

function drawVillage(ctx, t, o = {}) {
  const groundY = o.groundY || GROUND_Y;
  const mood = villageMood(o);
  drawSky(ctx, mood.skyTop, mood.skyBot, -300, groundY);
  if (o.sun) drawSun(ctx, o.sun[0], o.sun[1], o.sun[2], t, o.sunPow || .8);
  drawCloud(ctx, 260 + t * 6, 170, 90, 1); drawCloud(ctx, 1300 + t * 4, 120, 70, 2); drawCloud(ctx, 1750 + t * 5, 260, 55, 3, .9);
  // far mountains
  path(ctx, [[-600, groundY - 120], [-200, 330], [120, 470], [420, 250], [760, 450], [1050, 300], [1380, 470], [1700, 280], [2100, 430], [2600, groundY - 120]]);
  fillStroke(ctx, mood.mountain, 3, 'rgba(26,26,26,.45)');
  path(ctx, [[-200, 330], [-120, 400], [-60, 380], [40, 430], [120, 470], [20, 420]], true); ctx.fillStyle = 'rgba(244,233,216,.75)';
  path(ctx, [[420, 250], [500, 330], [560, 310], [620, 360], [520, 330]]); ctx.fill();
  path(ctx, [[1700, 280], [1780, 350], [1840, 330], [1900, 370], [1800, 340]]); ctx.fill();
  // rolling hills with fields
  ctx.beginPath(); ctx.moveTo(-600, groundY); ctx.quadraticCurveTo(300, groundY - 260, 900, groundY - 120); ctx.quadraticCurveTo(1500, groundY - 10, 2600, groundY - 220); ctx.lineTo(2600, groundY + 40); ctx.lineTo(-600, groundY + 40); ctx.closePath();
  fillStroke(ctx, mood.hill, 5);
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(92,64,51,.18)'; ctx.lineWidth = 14;
  for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(-600 + i * 260, groundY); ctx.lineTo(-200 + i * 260, groundY - 300); ctx.stroke(); }
  ctx.restore();
  // ground
  ctx.fillStyle = mood.grass; ctx.fillRect(-1500, groundY, W + 3000, 600); line(ctx, -1500, groundY, W + 1500, groundY, 6);
  ctx.fillStyle = 'rgba(92,64,51,.16)';
  for (let i = 0; i < 40; i++) { const R = rng(i + 70); const gx = -400 + R() * 2700, gy = groundY + 30 + R() * 230; ellipse(ctx, gx, gy, 22, 6); ctx.fill(); }
}

// sepia palette: the original shot colours only pick the mood (day, dusk, sunset)
function villageMood(o) {
  const isSunset = o.skyTop && o.skyTop.startsWith('#ff');
  const isDusk = o.skyTop && !isSunset;
  if (isSunset) return { skyTop: '#e7b878', skyBot: '#f4e2c2', mountain: '#b9a58c', hill: '#8f9470', grass: '#a6a582' };
  if (isDusk) return { skyTop: '#bdb4a4', skyBot: '#e2d8c6', mountain: '#a49c90', hill: '#7d826c', grass: '#979880' };
  return { skyTop: '#efe0c4', skyBot: '#f6ecdb', mountain: '#c4b9a7', hill: '#8d9277', grass: '#a3a68a' };
}

// wooden log cottage (drevenica)
function drawCottage(ctx, x, y, s = 1, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rrect(ctx, -170, -230, 340, 230, 6); fillStroke(ctx, '#9a5d2e', 7);
  ctx.save(); rrect(ctx, -170, -230, 340, 230, 6); ctx.clip();
  for (let ly = -205; ly < 0; ly += 30) line(ctx, -170, ly, 170, ly, 5, '#f3ead8');
  ctx.fillStyle = 'rgba(30,10,0,.18)'; ctx.fillRect(60, -240, 120, 250); ctx.restore();
  path(ctx, [[-215, -220], [0, -390], [215, -220]]); fillStroke(ctx, '#4b3a3a', 7);
  path(ctx, [[-90, -260], [0, -330], [90, -260]]); fillStroke(ctx, '#f3ead8', 6);
  rrect(ctx, -115, -170, 80, 80, 6); fillStroke(ctx, o.window || '#ffe48a', 6); line(ctx, -75, -170, -75, -90, 5); line(ctx, -115, -130, -35, -130, 5);
  rrect(ctx, 40, -150, 80, 150, 6); fillStroke(ctx, '#6b3d1d', 6);
  for (const fx of [-120, -60]) { circle(ctx, fx + 40, -60 + 60 * 0, 0); }
  ctx.restore();
}

function drawFence(ctx, x0, x1, y, h = 110) {
  for (let x = x0; x <= x1; x += 60) { rrect(ctx, x - 9, y - h, 18, h, 6); fillStroke(ctx, '#a07850', 5); }
  for (const yy of [y - h * .75, y - h * .35]) { rrect(ctx, x0 - 10, yy - 8, x1 - x0 + 20, 16, 6); fillStroke(ctx, '#8c6844', 5); }
}

function horseLeg(ctx, hx, hy, a1, a2, col) {
  const l1 = 85, l2 = 80;
  const kx = hx + Math.sin(a1) * l1, ky = hy + Math.cos(a1) * l1;
  const b = a1 + a2, fx = kx + Math.sin(b) * l2, fy = ky + Math.cos(b) * l2;
  ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 36; ctx.strokeStyle = INK; ctx.stroke();
  ctx.lineWidth = 24; ctx.strokeStyle = col; ctx.stroke();
  rrect(ctx, fx - 18, fy - 6, 36, 20, 6); fillStroke(ctx, '#3a2a26', 5);
}

// side-view cartoon horse facing right; origin on the ground under the body
function drawHorse(ctx, o) {
  const s = o.s || 1, t = o.t || 0, kick = o.kick || 0, col = o.col || CHESTNUT;
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s * (o.flip || 1), s); ctx.rotate(o.lean || 0);
  ellipse(ctx, 0, 4, 230, 24); ctx.fillStyle = 'rgba(40,20,30,.22)'; ctx.fill();
  ctx.translate(120, 0); ctx.rotate(kick * .22); ctx.translate(-120, 0);
  const bob = o.gallop != null ? Math.sin(o.gallop * 2) * 10 : 0;
  ctx.translate(0, bob);
  const g = o.gallop;
  const swing = k => g != null ? Math.sin(g + k) * .6 : 0;
  // far legs (darker)
  horseLeg(ctx, -120, -170, swing(1.4) - kick * 1.4, -Math.max(0, swing(2.4)) * .9, CHESTNUT_DARK);
  horseLeg(ctx, 110, -170, swing(3.6), -Math.max(0, swing(4.6)) * 1.1, CHESTNUT_DARK);
  // tail
  const sway = Math.sin(t * 3) * 20;
  ctx.beginPath(); ctx.moveTo(-170, -230); ctx.quadraticCurveTo(-260, -220 + sway, -250 - kick * 40, -90 + sway * .5);
  ctx.lineWidth = 46; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 34; ctx.strokeStyle = MANE; ctx.stroke();
  // body
  ellipse(ctx, 0, -215, 180, 82); fillStroke(ctx, col, 7);
  ctx.save(); ellipse(ctx, 0, -215, 180, 82); ctx.clip(); ctx.fillStyle = 'rgba(30,10,0,.16)'; ctx.fillRect(-200, -190, 400, 120);
  ellipse(ctx, -60, -260, 70, 18, -.1); ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fill(); ctx.restore();
  if (o.saddle) { rrect(ctx, -60, -300, 120, 50, 18); fillStroke(ctx, '#d0453a', 6); }
  // near legs
  horseLeg(ctx, -100, -170, -swing(1.4) - kick * 1.6, -Math.max(0, -swing(2.4)) * .9, col);
  horseLeg(ctx, 130, -170, -swing(3.6), -Math.max(0, -swing(4.6)) * 1.1, col);
  // neck
  ctx.beginPath(); ctx.moveTo(80, -270); ctx.quadraticCurveTo(150, -350, 205, -420); ctx.lineTo(285, -360); ctx.quadraticCurveTo(200, -280, 170, -175); ctx.closePath(); fillStroke(ctx, col, 7);
  // mane
  ctx.beginPath(); ctx.moveTo(85, -275); ctx.quadraticCurveTo(140, -360, 200, -430); ctx.lineWidth = 34; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 24; ctx.strokeStyle = MANE; ctx.stroke();
  // head
  ctx.save(); ctx.translate(255, -380); ctx.rotate(.95 - (o.headUp || 0));
  ellipse(ctx, 50, 0, 95, 46); fillStroke(ctx, col, 7);
  ellipse(ctx, 120, 0, 40, 40); fillStroke(ctx, '#c97650', 6);
  circle(ctx, 130, -14, 7); ctx.fillStyle = INK; ctx.fill();
  ctx.save(); ellipse(ctx, 50, 0, 95, 46); ctx.clip(); ctx.fillStyle = '#fff6ea'; ctx.fillRect(10, -10, 80, 16); ctx.restore();
  ctx.restore();
  path(ctx, [[215, -430], [228, -485], [250, -425]]); fillStroke(ctx, col, 6);
  // eye
  const eyes = (o.face || {}).eyes || 'normal';
  if (eyes === 'closed') { ctx.beginPath(); ctx.arc(250, -395, 13, .2, Math.PI - .2); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); }
  else {
    ellipse(ctx, 250, -395, 17, 19); fillStroke(ctx, '#fff', 5); circle(ctx, 254, -393, 9); ctx.fillStyle = INK; ctx.fill(); circle(ctx, 251, -397, 3); ctx.fillStyle = '#fff'; ctx.fill();
    if (eyes === 'angry') line(ctx, 230, -425, 268, -410, 7);
    if (eyes === 'sad') line(ctx, 232, -410, 268, -424, 7);
  }
  ctx.restore();
}

// villagers built on the stick rig
function drawWoman(ctx, o) {
  const s = o.s, hx = o.x, hy = o.y - .765 * s, flip = o.flip || 1;
  if (o.braids) for (const side of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(hx + side * .15 * s, hy); ctx.quadraticCurveTo(hx + side * .24 * s, hy + .15 * s, hx + side * .2 * s, hy + .3 * s);
    ctx.lineWidth = .06 * s; ctx.strokeStyle = INK; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = .04 * s; ctx.strokeStyle = o.hair || '#c98a2e'; ctx.stroke();
  }
  drawStick(ctx, Object.assign({ hat: 'none', belt: false }, o));
  // skirt over the hips
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s * flip, s); ctx.rotate(o.lean || 0);
  ctx.beginPath(); ctx.moveTo(-.12, -.36); ctx.lineTo(.12, -.36); ctx.lineTo(.22, -.13); ctx.quadraticCurveTo(0, -.1, -.22, -.13); ctx.closePath();
  fillStroke(ctx, o.skirt || '#d8312b', .017);
  ctx.save(); ctx.clip(); ctx.fillStyle = o.apron || '#f6f1e8'; ctx.fillRect(-.07, -.37, .14, .3); ctx.restore();
  ctx.beginPath(); ctx.moveTo(-.12, -.36); ctx.lineTo(.12, -.36); ctx.lineTo(.22, -.13); ctx.quadraticCurveTo(0, -.1, -.22, -.13); ctx.closePath(); fillStroke(ctx, null, .017);
  // hair fringe or headscarf
  const hr = .19, cy = -.765;
  if (o.scarf) {
    ctx.beginPath(); ctx.arc(0, cy, hr + .015, Math.PI + .25, -.25); ctx.quadraticCurveTo(0, cy - .06, -(hr + .015) * Math.cos(.25), cy - (hr + .015) * Math.sin(.25)); ctx.closePath(); fillStroke(ctx, o.scarf, .017);
    path(ctx, [[-.05, cy + .17], [.05, cy + .17], [0, cy + .26]]); fillStroke(ctx, o.scarf, .017);
  } else if (o.braids) {
    ctx.beginPath(); ctx.arc(0, cy, hr + .01, Math.PI + .35, -.35); ctx.quadraticCurveTo(0, cy - .09, -(hr + .01) * Math.cos(.35), cy - (hr + .01) * Math.sin(.35)); ctx.closePath(); fillStroke(ctx, o.hair || '#c98a2e', .015);
  }
  if (o.veil) { ctx.globalAlpha = .8; for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * .14, cy - .15); ctx.quadraticCurveTo(side * .3, cy + .05, side * .3, cy + .42); ctx.lineTo(side * .17, cy + .42); ctx.quadraticCurveTo(side * .2, cy + .1, side * .14, cy - .15); ctx.closePath(); fillStroke(ctx, '#ffffff', .012); } ctx.globalAlpha = 1;
    for (let i = 0; i < 5; i++) { circle(ctx, -.12 + i * .06, cy - .17, .025); fillStroke(ctx, ['#ff6b6b', '#ffd23a', '#6bc3ff'][i % 3], .01); } }
  ctx.restore();
}

function drawGazda(ctx, o) {
  const s = o.s;
  drawStick(ctx, Object.assign({ hat: 'none', cols: PAL.navy, vest: '#2b2230' }, o));
  ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s * (o.flip || 1), s); ctx.rotate(o.lean || 0);
  const cy = -.765;
  // moustache
  ctx.beginPath(); ctx.moveTo(0, cy + .055); ctx.quadraticCurveTo(-.05, cy + .03, -.1, cy + .08); ctx.quadraticCurveTo(-.05, cy + .075, 0, cy + .07); ctx.quadraticCurveTo(.05, cy + .075, .1, cy + .08); ctx.quadraticCurveTo(.05, cy + .03, 0, cy + .055);
  fillStroke(ctx, '#2a1d18', .01);
  // black hat
  ellipse(ctx, 0, cy - .14, .28, .05); fillStroke(ctx, '#1f1a22', .015);
  rrect(ctx, -.15, cy - .3, .3, .17, .05); fillStroke(ctx, '#1f1a22', .015);
  ctx.fillStyle = '#c0392b'; ctx.fillRect(-.15, cy - .19, .3, .035);
  ctx.restore();
}

function drawPeterHat(ctx, o) {
  const s = o.s; ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s * (o.flip || 1), s); ctx.rotate(o.lean || 0);
  const cy = -.765;
  ellipse(ctx, 0, cy - .15, .26, .045); fillStroke(ctx, '#dda15e', .014);
  ctx.beginPath(); ctx.ellipse(0, cy - .16, .14, .11, 0, Math.PI, 0); fillStroke(ctx, '#dda15e', .014);
  ctx.fillStyle = '#5c4033'; ctx.fillRect(-.14, cy - .2, .28, .03);
  ctx.restore();
}

function drawBundle(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  circle(ctx, 0, 0, 55); fillStroke(ctx, '#d8312b', 6);
  ctx.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { circle(ctx, -25 + (i % 3) * 25, -15 + Math.floor(i / 3) * 30, 6); ctx.fill(); }
  path(ctx, [[-15, -50], [0, -75], [15, -50]]); fillStroke(ctx, '#d8312b', 6);
  ctx.restore();
}

function drawMoneyBag(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-30, -95); ctx.quadraticCurveTo(-95, -40, -80, 0); ctx.lineTo(80, 0); ctx.quadraticCurveTo(95, -40, 30, -95); ctx.closePath(); fillStroke(ctx, '#c9a35e', 6);
  rrect(ctx, -38, -112, 76, 22, 8); fillStroke(ctx, '#8a6a34', 5);
  circle(ctx, 0, -42, 28); fillStroke(ctx, '#ffd84a', 5); text(ctx, 'zl', 0, -42, 26, INK, INK, 0, 'Poppins', 700);
  ctx.restore();
}

function drawCoin(ctx, x, y, r, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(Math.cos(rot), 1); circle(ctx, 0, 0, r); fillStroke(ctx, '#ffd84a', 5); circle(ctx, 0, 0, r * .6); ctx.lineWidth = 3; ctx.strokeStyle = '#c9a035'; ctx.stroke(); ctx.restore();
}

// book cover: o = { title: ['line 1', 'line 2'], author, cover, spine, art(ctx) }
function drawBook(ctx, x, y, s, rot = 0, o = {}) {
  const titleLines = o.title || ['Tri gaštanové', 'kone'];
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  rrect(ctx, -250, -340, 520, 690, 18); ctx.fillStyle = 'rgba(40,20,30,.25)'; ctx.fill();
  rrect(ctx, -270, -350, 520, 690, 18); fillStroke(ctx, '#f6f1e8', 7);
  rrect(ctx, -280, -360, 520, 690, 18); fillStroke(ctx, o.cover || '#2f6b4f', 7);
  rrect(ctx, -280, -360, 50, 690, 14); fillStroke(ctx, o.spine || '#245640', 6);
  rrect(ctx, -200, -310, 400, 590, 12); ctx.lineWidth = 6; ctx.strokeStyle = '#e8c04a'; ctx.stroke();
  titleLines.forEach((titleLine, i) => text(ctx, titleLine, 0, -220 + i * 65, i === titleLines.length - 1 ? 64 : 52, '#ffe6a0', INK, 0, 'Lora', 700));
  ctx.save(); ctx.translate(-8, 150); ctx.scale(.42, .42);
  if (o.art) o.art(ctx);
  else for (let i = 0; i < 3; i++) drawHorse(ctx, { x: -150 + i * 150, y: 0, s: .9 - i * .08, t: 0 });
  ctx.restore();
  text(ctx, o.author || 'Margita Figuli', 0, 225, 36, '#f6f1e8', INK, 0, 'Lora', 600);
  ctx.restore();
}

function drawTag(ctx, label, x, y, size, fill, alpha = 1, rot = 0) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot);
  ctx.font = `700 ${size}px Poppins`; const w = ctx.measureText(label).width + size * 1.2, h = size * 1.7;
  rrect(ctx, -w / 2, -h / 2, w, h, h / 2); fillStroke(ctx, fill, 6);
  text(ctx, label, 0, 2, size, '#fff', INK, 0, 'Poppins', 700);
  ctx.restore();
}

function drawWhip(ctx, hx, hy, k, t) {
  ctx.beginPath(); ctx.moveTo(hx, hy);
  const ex = hx + lerp(-60, 330, k), ey = hy + lerp(-260, 40, k);
  ctx.bezierCurveTo(hx + 60, hy - 140, ex - 120 * (1 - k), ey - 80, ex, ey);
  ctx.lineWidth = 7; ctx.strokeStyle = '#4a2c1c'; ctx.lineCap = 'round'; ctx.stroke();
}

function drawHeart(ctx, x, y, size, alpha = 1, fill = '#b5563f') {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(size / 40, size / 40);
  ctx.beginPath(); ctx.moveTo(0, 14); ctx.bezierCurveTo(-40, -12, -18, -40, 0, -20); ctx.bezierCurveTo(18, -40, 40, -12, 0, 14); ctx.closePath();
  fillStroke(ctx, fill, 4); ctx.restore();
}

function drawBrokenHeart(ctx, x, y, size, split, alpha = 1) {
  if (alpha <= 0) return;
  for (const side of [-1, 1]) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x + side * split * 30, y + split * 20); ctx.rotate(side * split * .3); ctx.scale(size / 40, size / 40);
    ctx.beginPath(); ctx.moveTo(0, 14); if (side < 0) { ctx.bezierCurveTo(-40, -12, -18, -40, 0, -20); ctx.lineTo(-6, -8); ctx.lineTo(4, 0); } else { ctx.bezierCurveTo(40, -12, 18, -40, 0, -20); ctx.lineTo(-6, -8); ctx.lineTo(4, 0); }
    ctx.closePath(); fillStroke(ctx, '#ff4f6d', 4); ctx.restore();
  }
}
