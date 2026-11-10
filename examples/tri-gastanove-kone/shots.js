// ---------- characters ----------
const PETER = { cols: PAL.green, hat: 'none', belt: true };
const MAGDALENA = { cols: ['#f6f1e8', '#f6f1e8'], braids: true, skirt: '#a8553a', apron: '#efe3cc', blush: true };
const AUTHOR = { cols: ['#7a4bc4', '#7a4bc4'], braids: true, hair: '#3a2a20', skirt: '#2a3f8f', apron: '#2a3f8f' };
const MOTHER = { cols: ['#5a4a7a', '#5a4a7a'], scarf: '#3a6fc4', skirt: '#2f3f6f', apron: '#d9d2c4' };
const C = (base, extra) => Object.assign({}, base, extra);
const handheld = (t, a = 4) => shake(t * .2, a * .25, 1, 2);
const centerCam = (t, z = 1, dx = 0, dy = 0, a = 3) => { const hh = handheld(t, a); return { x: W / 2 + dx + hh[0], y: H / 2 + dy + hh[1], z, r: 0 }; };
const walkLegs = (t, sp = 9, amp = .5) => ({ L: [Math.sin(t * sp) * amp + .05, -Math.max(0, Math.sin(t * sp + 1)) * .7], R: [-Math.sin(t * sp) * amp + .05, -Math.max(0, -Math.sin(t * sp + 1)) * .7] });
const RIDER_LEGS = { L: [1.25, -1.35], R: [1.15, -1.25] };
// voiceover second at which a word is spoken (first match, from `fromSecond` on)
function wordTime(word, fromSecond = 0) {
  // shots are timed in the original voice's clock; captions use the new one
  const timedWords = typeof WORDS_OLD !== 'undefined' ? WORDS_OLD : WORDS;
  const found = timedWords.find(w => w.s >= fromSecond && w.w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '') === word);
  return found ? found.s : fromSecond;
}

function drawPeter(ctx, o) { drawStick(ctx, C(PETER, o)); drawPeterHat(ctx, o); }
function drawRider(ctx, horse, rider, drawFn) {
  const bob = horse.gallop != null ? Math.sin(horse.gallop * 2) * 10 * horse.s : 0;
  const saddleY = horse.y - 300 * horse.s + bob;
  drawFn(ctx, C(rider, { x: horse.x - 10 * horse.s, y: saddleY + .3 * rider.s, legs: RIDER_LEGS, shadow: false }));
}

const SHOTS = [];
// A — hook: three chestnut horses gallop over the Orava hills, a heart pops
SHOTS.push({ start: 0, end: 3.25, tr: 'whip', draw(ctx, lt, t) {
  const cam = centerCam(t, kf(lt, [[0, 1.0], [3.2, 1.08]]), lt * 60, 0);
  applyCam(ctx, cam, .4); drawVillage(ctx, t, { sun: [1500, 180, 70] });
  applyCam(ctx, cam, 1);
  drawFence(ctx, -300, 2300, 900, 90);
  for (let i = 0; i < 3; i++) {
    const x = kf(lt, [[0, -500 - i * 330], [3.25, 1500 - i * 330]], v => v);
    drawHorse(ctx, { x, y: 870 + i * 25, s: .95, t: t + i, gallop: t * 11 + i * 1.3 });
  }
  const heartPop = kf(lt, [[1.9, 0], [2.2, 1, backOut]]);
  drawHeart(ctx, 1080 + lt * 60, 300, 150 * heartPop, heartPop);
  sparkle(ctx, 960 + lt * 60, 230, 50 * heartPop, heartPop); sparkle(ctx, 1210 + lt * 60, 380, 34 * heartPop, heartPop);
} });

// B — the book: Margita Figuli, 1940, naturism
SHOTS.push({ start: 3.25, end: 9.68, tr: 'whip', draw(ctx, lt, t) {
  const cam = centerCam(t, kf(lt, [[0, 1.0], [6.4, 1.06]]), 0, 0, 2);
  applyCam(ctx, cam, 1);
  const paper = ctx.createLinearGradient(0, 0, 0, H); paper.addColorStop(0, '#f4e9d8'); paper.addColorStop(1, '#e6d3b3');
  ctx.fillStyle = paper; ctx.fillRect(-500, -500, W + 1000, H + 1000);
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  for (let x = -400; x < W + 400; x += 110) for (let y = -300; y < H + 300; y += 110) { circle(ctx, x + ((y / 110) % 2) * 55, y, 8); ctx.fill(); }
  const fly = kf(lt, [[0, 0], [.7, 1, backOut]]);
  drawBook(ctx, lerp(-400, 760, fly), 470 + Math.sin(t * 1.5) * 8, .95, lerp(-.6, -.05, fly));
  const authorAt = wordTime('margita', 3) - 3.25, yearAt = wordTime('1940', 3) - 3.25, movementAt = wordTime('naturizmu', 3) - 3.25;
  const authorPop = kf(lt, [[authorAt + .2, 0], [authorAt + .5, 1, backOut]]);
  drawWoman(ctx, C(AUTHOR, { x: 1320, y: 860, s: 520 * authorPop, face: { eyes: 'happy', mouth: 'smile' }, arms: { L: [.3, -.1], R: [2.3, .4] },
    prop: (c, k, h) => { if (k !== 'R') return; c.save(); c.translate(h[0], h[1]); c.rotate(-.5); c.beginPath(); c.moveTo(0, .02); c.quadraticCurveTo(.05, -.12, .02, -.2); c.quadraticCurveTo(-.03, -.1, 0, .02); fillStroke(c, '#ffffff', .01); c.restore(); } }));
  const yearPop = kf(lt, [[yearAt, 0], [yearAt + .3, 1, backOut]]);
  drawTag(ctx, '1940', 1500, 260, 64 * yearPop, '#e0563a', yearPop, .08);
  const movementPop = kf(lt, [[movementAt, 0], [movementAt + .3, 1, backOut]]);
  drawTag(ctx, 'naturizmus', 1560, 450, 50 * movementPop, '#3fa35b', movementPop, -.06);
} });

// C — Peter, a poor wanderer with a good heart, walks to Magdaléna's cottage
SHOTS.push({ start: 9.68, end: 15.46, tr: 'whip', draw(ctx, lt, t) {
  const cam = centerCam(t, kf(lt, [[0, 1.0], [5.7, 1.1]]), kf(lt, [[0, -200], [5.7, 150]]), 40);
  applyCam(ctx, cam, .4); drawVillage(ctx, t);
  applyCam(ctx, cam, 1);
  drawCottage(ctx, 1500, 820, 1.25);
  drawFence(ctx, 1150, 1950, 840, 100);
  const loveAt = wordTime('magdalénu', 9) - 9.68;
  const waving = lt > loveAt - .3;
  drawWoman(ctx, C(MAGDALENA, { x: 1320, y: 860, s: 540, flip: -1,
    arms: waving ? { L: [.3, -.1], R: [2.6 + Math.sin(t * 10) * .25, .3] } : POSE.idle.arms,
    face: waving ? { eyes: 'happy', mouth: 'grin' } : { eyes: 'normal', mouth: 'smile', look: [-.8, 0] } }));
  const peterX = kf(lt, [[0, -100], [4.2, 860]], v => v);
  const walking = lt < 4.2;
  drawPeter(ctx, { x: peterX, y: 880, s: 560, legs: walking ? walkLegs(t, 9) : POSE.idle.legs, bob: walking ? Math.abs(Math.sin(t * 9)) * -.01 : 0,
    arms: walking ? { L: [.3 - Math.sin(t * 9) * .4, -.3], R: [.3 + Math.sin(t * 9) * .4, -.3] } : POSE.idle.arms,
    face: waving ? { eyes: 'happy', mouth: 'grin' } : { eyes: 'normal', mouth: 'smile', look: [.8, 0] }, });
  const goodHeartAt = wordTime('srdcom', 9) - 9.68;
  const heartGlow = kf(lt, [[goodHeartAt, 0], [goodHeartAt + .25, 1, backOut], [goodHeartAt + 1.2, 0]]);
  drawHeart(ctx, peterX + 10, 880 - 560 * .45, 60 * heartGlow, heartGlow, '#ff6b81');
  if (waving) for (let i = 0; i < 3; i++) { const k = ((lt - loveAt + i * .45) % 1.4) / 1.4; drawHeart(ctx, 1100 + i * 40 + Math.sin(k * 6) * 20, 420 - k * 200, 40, Math.sin(k * Math.PI)); }
} });

// D — her mother wants the rich farmer Jano Zápotočný
SHOTS.push({ start: 15.46, end: 19.46, tr: 'whip', draw(ctx, lt, t) {
  const cam = centerCam(t, kf(lt, [[0, 1.0], [4.0, 1.08]]), 60, 30);
  applyCam(ctx, cam, .4); drawVillage(ctx, t, { hill: '#8bc764' });
  applyCam(ctx, cam, 1);
  drawCottage(ctx, 330, 820, 1.1);
  const push = kf(lt, [[.4, 0], [1.4, 1]]);
  const richAt = wordTime('bohatého', 15) - 15.46;
  drawPeter(ctx, { x: 240, y: 900, s: 480, alpha: .9, face: { eyes: 'normal', mouth: 'frown', browAng: -.3, look: [.8, 0] }, arms: POSE.idle.arms });
  drawBrokenHeart(ctx, 250, 900 - 480 * 1.15, 50, kf(lt, [[2.4, 0], [2.8, 1]]), kf(lt, [[2.2, 0], [2.4, 1]]));
  drawWoman(ctx, C(MOTHER, { x: lerp(760, 880, push), y: 870, s: 560, arms: { L: [.3, -.1], R: { ik: [.36, -.5], bend: -1 } }, face: { eyes: 'smug', mouth: 'smirk', look: [.8, 0] } }));
  drawWoman(ctx, C(MAGDALENA, { x: lerp(1000, 1120, push), y: 870, s: 540, lean: .05, face: { eyes: 'normal', mouth: 'flat', look: [-.8, 0], browAng: -.3 }, arms: POSE.idle.arms }));
  const janoIn = kf(lt, [[richAt - .3, 0], [richAt + .2, 1, backOut]]);
  const janoX = lerp(2200, 1520, janoIn);
  drawGazda(ctx, { x: janoX, y: 880, s: 640, flip: -1, face: { eyes: 'smug', mouth: 'grin', browAng: .35, look: [-.8, 0] }, arms: { L: [.9, -2.2], R: { ik: [.38, -.45], bend: -1 } } });
  drawMoneyBag(ctx, janoX - 250, 880 - 640 * .42, .9 * janoIn);
  for (let i = 0; i < 5; i++) { const k = ((lt + i * .4) % 1.5) / 1.5; if (janoIn > .5) drawCoin(ctx, janoX - 250 + Math.sin(i * 2) * 120, 880 - 640 * .62 - k * 160, 22, t * 6 + i); }
} });

// E — Jano is brutal to people and horses; Magdaléna ends up marrying him
SHOTS.push({ start: 19.46, end: 24.57, tr: 'whip', draw(ctx, lt, t) {
  const marryAt = wordTime('vydá', 19) - 19.46;
  const panAt = marryAt - 1.1;
  const cam = centerCam(t, 1.05, kf(lt, [[0, -300], [panAt, -250], [panAt + .8, 230]]), 40);
  applyCam(ctx, cam, .4); drawVillage(ctx, t, { skyTop: '#7a95b8', skyBot: '#c9d6e0', hill: '#6aa554', grass: '#7fbf5c' });
  applyCam(ctx, cam, 1);
  const crackAt = wordTime('koňom', 19) - 19.46;
  const crack = kf(lt, [[crackAt - .35, 0], [crackAt, 1, easeIn], [crackAt + .4, .2]]);
  drawHorse(ctx, { x: 420, y: 880, s: 1.0, flip: -1, t, face: { eyes: lt > crackAt ? 'sad' : 'normal' }, headUp: lt > crackAt ? -.25 : 0 });
  if (lt > crackAt) sweat(ctx, 200, 470, 30, clamp((lt - crackAt) * 3));
  if (Math.abs(lt - crackAt) < .15) burst(ctx, 330, 560, 80, 10, '#fff2a8', 4);
  const janoX = 900;
  drawGazda(ctx, { x: janoX, y: 880, s: 640, flip: -1, face: { eyes: 'normal', mouth: 'teeth', browAng: .45, look: [-.8, 0] }, arms: { L: [.3, -.1], R: [lerp(2.6, 1.2, crack), -.2] } });
  drawWhip(ctx, janoX - 140, 880 - 640 * .62, crack, t);
  // the wedding: veil, sad face, grey cloud
  drawWoman(ctx, C(MAGDALENA, { x: 1230, y: 870, s: 540, veil: true, face: { eyes: 'normal', mouth: 'frown', browAng: -.35, look: [-.6, .3] }, arms: POSE.idle.arms }));
  const cloudIn = kf(lt, [[marryAt, 0], [marryAt + .5, 1]]);
  drawCloud(ctx, 1230, 230, 110 * cloudIn, 6, cloudIn);
  for (let i = 0; i < 6 && cloudIn > .8; i++) { const k = ((lt * 1.5 + i / 6) % 1); line(ctx, 1120 + i * 40, 280 + k * 160, 1115 + i * 40, 305 + k * 160, 6, '#5aa0e0'); }
} });

// F — Peter does not take revenge: the fist opens, hand on heart
SHOTS.push({ start: 24.57, end: 28.15, tr: 'whip', draw(ctx, lt, t) {
  const cam = centerCam(t, kf(lt, [[0, 1.35], [3.6, 1.5]]), 0, 80);
  applyCam(ctx, cam, .4); drawVillage(ctx, t, { sun: [1400, 200, 70], sunPow: .6 });
  applyCam(ctx, cam, 1);
  const calm = kf(lt, [[.9, 0], [1.6, 1]]);
  const angry = calm < .5;
  drawPeter(ctx, { x: 960, y: 960, s: 640,
    arms: angry ? { L: [.3, -.1], R: [1.9, -1.8] } : { L: [.3, -.1], R: { ik: [-.02, -.5], bend: 1 } },
    face: angry ? { eyes: 'normal', mouth: 'flat', browAng: .45 } : { eyes: 'happy', mouth: 'smile' } });
  if (!angry) { drawHeart(ctx, 960, 960 - 640 * .45, 70 * calm, calm); sparkle(ctx, 1150, 470, 50 * calm, calm); sparkle(ctx, 780, 530, 36 * calm, calm); }
  if (angry) puff(ctx, 960 + 160, 960 - 640 * .95, 40, t, '#f3efe6', 3, 1 - calm * 2);
} });

// G — the cruel Jano is killed by a horse
SHOTS.push({ start: 28.15, end: 30.71, tr: 'whip', draw(ctx, lt, t) {
  const hitAt = wordTime('kôň', 28) - 28.15;
  const shakeAmt = lt > hitAt && lt < hitAt + .3 ? 18 : 3;
  const cam = centerCam(t, 1.1, 0, 40, shakeAmt);
  applyCam(ctx, cam, .4); drawVillage(ctx, t, { skyTop: '#6f86a8', skyBot: '#c3cfdc' });
  applyCam(ctx, cam, 1);
  const kick = kf(lt, [[hitAt - .25, 0], [hitAt, 1, easeIn], [hitAt + .6, 0]]);
  drawHorse(ctx, { x: 820, y: 880, s: 1.05, flip: -1, t, kick, face: { eyes: 'angry' } });
  const flyK = clamp((lt - hitAt) / .9);
  const janoX = lt < hitAt ? 1250 : 1250 + flyK * 1200;
  const janoY = lt < hitAt ? 880 : 880 - Math.sin(flyK * Math.PI) * 300 + flyK * 200;
  drawGazda(ctx, { x: janoX, y: janoY, s: 600, lean: lt < hitAt ? 0 : flyK * 3, flip: -1, shadow: lt < hitAt,
    face: lt < hitAt ? { eyes: 'normal', mouth: 'teeth', browAng: .45, look: [-.8, 0] } : { eyes: 'x', mouth: 'o' },
    arms: lt < hitAt ? { L: [.3, -.1], R: [2.6, -.2] } : POSE.handsUp.arms });
  if (lt > hitAt && lt < hitAt + .35) burst(ctx, 1150, 690, 140, 12, '#ffd23a', 5);
  if (lt > hitAt) puff(ctx, 960, 860, 60 + (lt - hitAt) * 120, t, '#e8dcc0', 4, 1 - (lt - hitAt) * 1.2);
} });

// H — payoff: Peter and Magdaléna ride away on the three chestnut horses at sunset
SHOTS.push({ start: 30.71, end: 36.9, tr: 'cut', draw(ctx, lt, t) {
  const travel = lt * 140;
  const cam = centerCam(t, kf(lt, [[0, 1.0], [6.2, 1.1]]), travel - 150, 20);
  applyCam(ctx, cam, .4); drawVillage(ctx, t, { skyTop: '#ff9a6b', skyBot: '#ffe0a3', sun: [1250 + travel * .4, 520, 110], sunPow: 1.3, mountain: '#b98bb0', hill: '#9cc25e' });
  applyCam(ctx, cam, 1);
  const horses = [
    { x: 700 + travel, y: 900, s: .95, t, gallop: t * 6, saddle: true },
    { x: 1150 + travel, y: 880, s: .95, t: t + 1, gallop: t * 6 + 1.2, saddle: true },
    { x: 300 + travel, y: 860, s: .85, t: t + 2, gallop: t * 6 + 2.4 },
  ];
  drawHorse(ctx, horses[2]);
  drawHorse(ctx, horses[0]); drawRider(ctx, horses[0], { s: 470, face: { eyes: 'happy', mouth: 'grin' }, arms: { L: [.9, -.6], R: [1.1, -.8] } }, drawPeter);
  drawHorse(ctx, horses[1]); drawRider(ctx, horses[1], C(MAGDALENA, { s: 450, face: { eyes: 'happy', mouth: 'grin' }, arms: { L: [.9, -.6], R: [2.6 + Math.sin(t * 8) * .2, .3] } }), drawWoman);
  for (let i = 0; i < 4; i++) { const k = ((lt + i * .6) % 2.4) / 2.4; drawHeart(ctx, 950 + travel + i * 60 + Math.sin(k * 6 + i) * 30, 360 - k * 220, 40 + i * 4, Math.sin(k * Math.PI)); }
  const goodAt = wordTime('dobro', 30) - 30.71;
  const shine = kf(lt, [[goodAt, 0], [goodAt + .3, 1, backOut]]);
  sparkle(ctx, 900 + travel, 200, 70 * shine, shine); sparkle(ctx, 1300 + travel, 260, 50 * shine, shine);
} });
