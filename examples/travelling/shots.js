// ---------- characters ----------
const STUDENT = { cols: [PRESENT.teal, PRESENT.teal], hair: { style: 'short', col: '#3a2a20' }, backpack: PRESENT.ochre };
const FRIEND = { cols: [PRESENT.coral, '#f6f1e8'], hair: { style: 'ponytail', col: '#c98a2e' }, blush: true };
const EXAMINER = { cols: ['#3b3a3f', '#3b3a3f'], hair: { style: 'bun', col: '#9a9a9a' }, glasses: true };
const C = (base, extra) => Object.assign({}, base, extra);
const handheld = (t, a = 3) => shake(t * .2, a * .25, 1, 2);
const centerCam = (t, z = 1, dx = 0, dy = 0, a = 3) => { const hh = handheld(t, a); return { x: W / 2 + dx + hh[0], y: H / 2 + dy + hh[1], z, r: 0 }; };
const walkLegs = (t, sp = 9, amp = .5) => ({ L: [Math.sin(t * sp) * amp + .05, -Math.max(0, Math.sin(t * sp + 1)) * .7], R: [-Math.sin(t * sp) * amp + .05, -Math.max(0, -Math.sin(t * sp + 1)) * .7] });
const walkArms = (t, sp = 9) => ({ L: [.3 - Math.sin(t * sp) * .4, -.3], R: [.3 + Math.sin(t * sp) * .4, -.3] });
const popIn = (lt, at, length = .3) => kf(lt, [[at, 0], [at + length, 1, backOut]]);

// ---------- timing: shots follow the voice, so they survive a re-voice without hand editing ----------
const normalise = word => word.toLowerCase().replace(/[^\p{L}\p{N}']/gu, '');
function lineWords(line) { return WORDS.filter(w => w.line === line); }
function lineStart(line) { return lineWords(line)[0].s; }
function lineEnd(line) { const words = lineWords(line); return words[words.length - 1].e; }
// voiceover second at which `word` is spoken inside sentence `line`
function wordAt(word, line) {
  const found = lineWords(line).find(w => normalise(w.w) === word);
  return found ? found.s : lineStart(line);
}
// cut between two sentences sits in the middle of the pause
function cutBefore(line) { return line === 0 ? 0 : (lineEnd(line - 1) + lineStart(line)) / 2; }
const LAST_LINE = Math.max(...WORDS.map(w => w.line));

// every shot names where it begins: a sentence, or a word inside one; it ends where the next one begins
const SHOT_PLAN = [];
function shot(begin, draw, tr = 'push') { SHOT_PLAN.push({ begin, draw, tr }); }
function beginSecond(begin) { return begin.word ? wordAt(begin.word, begin.line) - .12 : cutBefore(begin.line); }

// ---------- 0: hook, the exam room and a spinning globe ----------
shot({ line: 0 }, function (ctx, lt, t, start) {
  const cam = centerCam(t, kf(lt, [[0, 1.0], [3.5, 1.08]]), 0, -20);
  applyCam(ctx, cam, .5); drawRoom(ctx, t, { wall: PRESENT.mint, windowX: 1420 });
  applyCam(ctx, cam, 1);
  drawPerson(ctx, C(EXAMINER, { x: 1250, y: 860, s: 470, flip: -1, t, face: { eyes: 'normal', mouth: 'smile', look: [-.8, 0] }, arms: { L: [.3, -.1], R: [.6, -1.2] } }));
  drawExamTable(ctx, 1250, 690, 560);
  const talking = Math.sin(t * 14) > 0;
  drawPerson(ctx, C(STUDENT, { x: 560, y: 880, s: 520, t, face: { eyes: 'wide', mouth: talking ? 'o' : 'smile', look: [.8, -.2] }, arms: { L: [.3, -.1], R: [2.2, .5] } }));
  const globeIn = popIn(lt, .2, .45);
  drawGlobe(ctx, 900, 300, 120 * globeIn, t);
  const tagIn = popIn(lt, wordAt('travelling', 0) - start);
  drawTag(ctx, 'TRAVELLING', 960, 470, 62 * tagIn, PRESENT.coral, tagIn, -.05);
  const examIn = popIn(lt, wordAt('maturita', 0) - start);
  drawTag(ctx, 'ANJ maturita', 1250, 220, 46 * examIn, PRESENT.teal, examIn, .06);
});

// ---------- 1: why people travel ----------
shot({ line: 1 }, function (ctx, lt, t, start) {
  const cam = centerCam(t, 1.02, kf(lt, [[0, -80], [5, 80]], v => v), 0);
  applyCam(ctx, cam, .4); drawCity(ctx, t);
  applyCam(ctx, cam, 1);
  const friendX = kf(lt, [[0, 1500], [3.5, 1150]]);
  const friendWalking = lt < 3.5;
  drawSuitcase(ctx, friendX + 180, 870, .9, PRESENT.purple);
  drawPerson(ctx, C(FRIEND, { x: friendX, y: 870, s: 500, flip: -1, t, legs: friendWalking ? walkLegs(t) : POSE.idle.legs,
    arms: { L: [.3 - Math.sin(t * 9) * .3, -.3], R: { ik: [.3, -.32] } }, face: { eyes: 'happy', mouth: 'grin', look: [-.8, 0] } }));
  drawSuitcase(ctx, 460, 875, .9, PRESENT.ochre);
  drawPerson(ctx, C(STUDENT, { x: 640, y: 880, s: 520, t, face: { eyes: 'happy', mouth: 'grin', look: [.8, 0] }, arms: { L: { ik: [-.2, -.3] }, R: [2.6 + Math.sin(t * 10) * .25, .3] } }));
  const labels = [['relax', 'relax', PRESENT.tealLight, 520], ['cultures', 'new cultures', PRESENT.purple, 960], ['friends', 'friends', PRESENT.coral, 1400]];
  labels.forEach(([word, label, colour, x], i) => {
    const pop = popIn(lt, wordAt(word, 1) - start);
    drawTag(ctx, label, x, 230 + (i % 2) * 70, 54 * pop, colour, pop, (i - 1) * .05);
  });
});

// ---------- 2: flying is fast, expensive and bad for the planet ----------
shot({ line: 2 }, function (ctx, lt, t, start) {
  const cam = centerCam(t, 1.0, 0, 0, 5);
  applyCam(ctx, cam, .3); drawSkyGradient(ctx, '#6fb7da', PRESENT.skyLight);
  for (let i = 0; i < 5; i++) drawFlatCloud(ctx, ((i * 480 - t * 260) % (W + 800) + W + 800) % (W + 800) - 400, 200 + (i % 3) * 230, .9 + (i % 2) * .3);
  applyCam(ctx, cam, 1);
  const fastAt = wordAt('fastest', 2) - start, moneyAt = wordAt('expensive', 2) - start, planetAt = wordAt('planet', 2) - start;
  const planeX = kf(lt, [[0, -500], [fastAt + .6, 900, easeOut]]);
  drawPlane(ctx, planeX, 470 + Math.sin(t * 3) * 12, 1.25, -.04);
  for (let i = 0; i < 4; i++) line(ctx, planeX - 420 - i * 60, 420 + i * 28, planeX - 600 - i * 90, 420 + i * 28, 6, 'rgba(255,255,255,.9)');
  const fastIn = popIn(lt, fastAt);
  drawTag(ctx, 'fastest', 900, 210, 56 * fastIn, PRESENT.tealLight, fastIn, -.05);
  for (let i = 0; i < 3; i++) {
    const fall = clamp((lt - moneyAt - i * .12) / 1.6);
    if (fall > 0) drawBanknote(ctx, 1300 + i * 170, lerp(120, 330, easeOut(fall)), .8, -.2 + i * .2 + Math.sin(t * 4 + i) * .1, '€€€');
  }
  const planetIn = popIn(lt, planetAt, .4);
  drawSmokeCloud(ctx, planeX - 520, 520, 1.3 * planetIn, planetIn * .9);
  drawGlobe(ctx, 360, 250, 95 * planetIn, t);
  drawTag(ctx, 'bad for the planet', 520, 420, 44 * planetIn, PRESENT.coral, planetIn, .05);
}, 'zoom');

// ---------- 3: trains are slow but comfortable, with a view ----------
shot({ line: 3 }, function (ctx, lt, t, start) {
  const trainX = 400 + lt * 120;
  const cam = centerCam(t, kf(lt, [[0, 1.0], [4, 1.1]]), trainX - 660, 30, 2);
  applyCam(ctx, cam, .3); drawCountryside(ctx, t);
  applyCam(ctx, cam, 1);
  drawRails(ctx, 800, -1500, 4500);
  const trainScale = .9;
  drawTrain(ctx, trainX + 300, 800, trainScale, 3);
  // passenger in the second window of the front car
  const windowLeft = trainX + 300 + (-220 + 105) * trainScale, windowTop = 800 - 210 * trainScale;
  ctx.save(); rrect(ctx, windowLeft, windowTop, 80 * trainScale, 90 * trainScale, 12 * trainScale); ctx.clip();
  drawPerson(ctx, C(STUDENT, { x: windowLeft + 36 * trainScale, y: windowTop + 230, s: 220, t, shadow: false, backpack: null, face: { eyes: 'happy', mouth: 'smile', look: [.8, 0] } }));
  ctx.restore();
  const tags = [['slower', 'slower', PRESENT.ochre, 0], ['comfortable', 'comfortable', PRESENT.tealLight, 1], ['view', 'great view', PRESENT.purple, 2]];
  tags.forEach(([word, label, colour, i]) => {
    const pop = popIn(lt, wordAt(word, 3) - start);
    drawTag(ctx, label, trainX - 100 + i * 360, 260 + (i % 2) * 60, 52 * pop, colour, pop, (i - 1) * .05);
  });
  const viewIn = popIn(lt, wordAt('view', 3) - start);
  sparkle(ctx, trainX + 900, 300, 50 * viewIn, viewIn); sparkle(ctx, trainX + 1050, 380, 34 * viewIn, viewIn);
});

// ---------- 4a: a car gives you freedom ----------
shot({ line: 4 }, function (ctx, lt, t, start) {
  const cam = centerCam(t, 1.0, 0, 20, 3);
  const scroll = t * 500;
  applyCam(ctx, cam, .3);
  ctx.save(); ctx.translate(-(scroll * .3) % 430, 0); drawCountryside(ctx, t, { sunX: 1500 + (scroll * .3) % 430 }); ctx.restore();
  applyCam(ctx, cam, 1);
  ctx.fillStyle = PRESENT.asphalt; ctx.fillRect(-1500, 860, W + 3000, 600); line(ctx, -1500, 860, W + 1500, 860, OUTLINE);
  for (let x = -((scroll) % 260) - 260; x < W + 260; x += 260) { rrect(ctx, x, 930, 130, 14, 7); ctx.fillStyle = '#f3efe6'; ctx.fill(); }
  drawCar(ctx, 900, 905, 1.25, t, PRESENT.coral, { moving: true });
  drawDriver(ctx, 900, 905, 1.25, t, { eyes: 'happy', mouth: 'grin' }, Math.abs(Math.sin(t * 14)) * 4);
  const freeIn = popIn(lt, wordAt('freedom', 4) - start);
  drawTag(ctx, 'freedom', 900, 280, 64 * freeIn, PRESENT.tealLight, freeIn, -.05);
  sparkle(ctx, 640, 340, 46 * freeIn, freeIn); sparkle(ctx, 1170, 230, 34 * freeIn, freeIn);
});

// driver seen through the car's front side window (window spans x 50..145, y -185..-125 in car units)
function drawDriver(ctx, carX, carY, carScale, t, face, bump = 0) {
  const toCar = (x, y) => [carX + x * carScale, carY - bump + y * carScale];
  const personScale = 150 * carScale, [headX, headY] = toCar(92, -150);
  ctx.save();
  path(ctx, [toCar(50, -125), toCar(50, -185), toCar(100, -185), toCar(145, -125)]); ctx.clip();
  drawPerson(ctx, C(STUDENT, { x: headX, y: headY + .765 * personScale, s: personScale, t, shadow: false, backpack: null, face }));
  ctx.restore();
}

// ---------- 4b: but traffic jams can ruin your trip ----------
shot({ line: 4, word: 'traffic' }, function (ctx, lt, t) {
  const cam = centerCam(t, kf(lt, [[0, 1.05], [2, 1.12]]), 0, 20, 4);
  applyCam(ctx, cam, .4); drawCity(ctx, t, { ground: 760, sun: false, skyTop: '#a9b8c2', skyBottom: '#e3e8ea' });
  applyCam(ctx, cam, 1);
  const colours = [PRESENT.ochre, PRESENT.tealLight, PRESENT.coral, PRESENT.purple, PRESENT.sky];
  for (let i = 0; i < 5; i++) drawCar(ctx, -200 + i * 520, 920, 1.0, t, colours[i]);
  drawDriver(ctx, -200 + 3 * 520, 920, 1.0, t, { eyes: 'normal', mouth: 'teeth', browAng: .45 });
  for (let i = 0; i < 3; i++) {
    const honk = (lt * 2.2 + i * .33) % 1;
    if (honk < .45) burst(ctx, 330 + i * 520, 640, 70, 9, PRESENT.ochre, 5 + i);
    if (honk < .45) text(ctx, 'BEEP', 330 + i * 520, 640, 30, PRESENT.navy, INK, 0, 'Poppins', 700);
  }
  drawSmokeCloud(ctx, 1000, 540, 1.1, .6 + Math.sin(t * 3) * .1);
  const jamIn = popIn(lt, .1);
  drawTag(ctx, 'traffic jams', 960, 250, 60 * jamIn, PRESENT.coral, jamIn, .04);
}, 'cut');

// ---------- 5: hotel, hostel, campsite ----------
shot({ line: 5 }, function (ctx, lt, t, start) {
  const cam = centerCam(t, kf(lt, [[0, 1.0], [3.5, 1.05]]), 0, 0);
  applyCam(ctx, cam, .4); drawCountryside(ctx, t);
  applyCam(ctx, cam, 1);
  const hotelIn = popIn(lt, wordAt('hotel', 5) - start, .4), hostelIn = popIn(lt, wordAt('hostel', 5) - start, .4), campIn = popIn(lt, wordAt('campsite', 5) - start, .4);
  if (hotelIn > 0) drawHotel(ctx, 420, 830, .95 * hotelIn);
  if (hostelIn > 0) drawHostel(ctx, 960, 830, 1.0 * hostelIn);
  if (campIn > 0) drawTent(ctx, 1500, 830, 1.1 * campIn);
  const walkerX = kf(lt, [[0, -150], [3.2, 1220]], v => v);
  drawSuitcase(ctx, walkerX - 150, 880, .7, PRESENT.ochre);
  drawPerson(ctx, C(STUDENT, { x: walkerX, y: 885, s: 440, t, legs: walkLegs(t), arms: { L: { ik: [-.3, -.3] }, R: [.3 + Math.sin(t * 9) * .4, -.3] }, face: { eyes: 'happy', mouth: 'smile', look: [.8, 0] } }));
  drawMapPin(ctx, 420, 180 + Math.sin(t * 3) * 8, .7 * hotelIn, PRESENT.coral);
  drawMapPin(ctx, 960, 300 + Math.sin(t * 3 + 1) * 8, .7 * hostelIn, PRESENT.purple);
  drawMapPin(ctx, 1500, 430 + Math.sin(t * 3 + 2) * 8, .7 * campIn, PRESENT.teal);
});

// ---------- 6: packing list ----------
shot({ line: 6 }, function (ctx, lt, t, start) {
  const cam = centerCam(t, kf(lt, [[0, 1.0], [4, 1.06]]), 0, 0);
  applyCam(ctx, cam, .5); drawRoom(ctx, t, { wall: '#f7e1c8', frame: false, windowX: 1450 });
  applyCam(ctx, cam, 1);
  drawSuitcase(ctx, 960, 860, 1.5, PRESENT.teal);
  drawPerson(ctx, C(STUDENT, { x: 470, y: 880, s: 500, t, face: { eyes: 'normal', mouth: 'o', browUp: .3, look: [.8, -.2] }, arms: { L: [.3, -.1], R: [1.9, -.3] } }));
  const forgetIn = popIn(lt, .15);
  drawTag(ctx, "Don't forget!", 960, 160, 56 * forgetIn, PRESENT.coral, forgetIn, -.04);
  const items = [['passport', drawPassport, 700, 1], ['currency', drawBanknote, 960, .9], ['insurance', drawInsuranceCard, 1240, .9]];
  items.forEach(([word, drawItem, x, scale], i) => {
    const at = wordAt(word, 6) - start, drop = clamp((lt - at) / .45);
    if (drop <= 0) return;
    const y = lerp(-150, 420, backOut(drop));
    drawItem(ctx, x, y, scale, Math.sin(t * 2 + i) * .08);
    drawCheck(ctx, x + 110, y - 110, .7 * drop, drop);
  });
});

// ---------- 7: exam task, compare two kinds of transport ----------
shot({ line: 7 }, function (ctx, lt, t, start) {
  const cam = centerCam(t, kf(lt, [[0, 1.08], [4, 1.0]]), 0, 0);
  applyCam(ctx, cam, .5); drawRoom(ctx, t, { wall: PRESENT.mint, windowX: 1500 });
  applyCam(ctx, cam, 1);
  drawPerson(ctx, C(EXAMINER, { x: 1350, y: 860, s: 460, flip: -1, t, face: { eyes: 'normal', mouth: 'smile', look: [-.8, 0] }, arms: { L: [.3, -.1], R: [1.3, -.6] } }));
  drawExamTable(ctx, 1300, 700, 520);
  drawPerson(ctx, C(STUDENT, { x: 380, y: 880, s: 500, t, face: { eyes: 'normal', mouth: 'smile', look: [.8, -.3] }, arms: { L: [.3, -.1], R: { ik: [.1, -.75] } } }));
  const compareAt = wordAt('compare', 7) - start;
  const leftIn = popIn(lt, compareAt, .35), rightIn = popIn(lt, compareAt + .25, .35);
  drawPictureCard(ctx, 700, 380, leftIn, -.06, c => drawPlane(c, 0, 0, .45, -.05));
  drawPictureCard(ctx, 1100, 380, rightIn, .06, c => drawTrain(c, 60, 50, .3, 1));
  const versusIn = popIn(lt, compareAt + .5);
  drawTag(ctx, 'VS', 900, 380, 56 * versusIn, PRESENT.navy, versusIn);
  const reasonsIn = popIn(lt, wordAt('reasons', 7) - start);
  drawTag(ctx, 'because…', 900, 640, 50 * reasonsIn, PRESENT.ochre, reasonsIn, -.04);
});
function drawPictureCard(ctx, x, y, scale, rot, drawPicture) {
  if (scale <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(scale, scale);
  rrect(ctx, -170, -130, 340, 260, 18); fillStroke(ctx, '#ffffff', OUTLINE);
  rrect(ctx, -150, -110, 300, 220, 12); ctx.fillStyle = PRESENT.skyLight; ctx.fill();
  ctx.save(); rrect(ctx, -150, -110, 300, 220, 12); ctx.clip(); drawPicture(ctx); ctx.restore();
  ctx.restore();
}

// ---------- 8: model answer, trains are cheaper and greener ----------
shot({ line: 8 }, function (ctx, lt, t, start) {
  const cam = centerCam(t, kf(lt, [[0, 1.0], [4.5, 1.08]]), 0, 0);
  applyCam(ctx, cam, .5); drawRoom(ctx, t, { wall: PRESENT.mint, windowX: 1500 });
  applyCam(ctx, cam, 1);
  const nod = Math.max(0, Math.sin(t * 6)) * .08;
  drawPerson(ctx, C(EXAMINER, { x: 1350, y: 860, s: 460, flip: -1, t, headTilt: nod, face: { eyes: 'happy', mouth: 'smile' }, arms: { L: [.3, -.1], R: [2.4, .6] } }));
  drawExamTable(ctx, 1300, 700, 520);
  drawPerson(ctx, C(STUDENT, { x: 420, y: 880, s: 520, t, face: { eyes: 'happy', mouth: Math.sin(t * 14) > 0 ? 'grin' : 'smile' }, arms: { L: [.3, -.1], R: [2.3, .4] } }));
  const bubbleIn = popIn(lt, .1, .35);
  drawSpeechBubble(ctx, 700, 260, 440, 230, '', bubbleIn, -1);
  if (bubbleIn > .5) { drawTrain(ctx, 720, 330, .32, 1); drawHeart(ctx, 860, 190, 40, bubbleIn, PRESENT.coral); }
  const cheaperIn = popIn(lt, wordAt('cheaper', 8) - start), greenerIn = popIn(lt, wordAt('greener', 8) - start);
  drawTag(ctx, 'cheaper', 1080, 200, 52 * cheaperIn, PRESENT.ochre, cheaperIn, -.05);
  drawCheck(ctx, 1260, 150, .6 * cheaperIn, cheaperIn);
  drawTag(ctx, 'greener', 1120, 340, 52 * greenerIn, '#5fa86a', greenerIn, .05);
  drawLeaf(ctx, 1290, 300, .7 * greenerIn, .4 + Math.sin(t * 3) * .15);
  if (greenerIn > 0) for (let i = 0; i < 4; i++) sparkle(ctx, 600 + i * 260, 120 + (i % 2) * 80, 30 * greenerIn, greenerIn);
});

// ---------- turn the plan into contiguous shots ----------
const SHOTS = SHOT_PLAN.map((planned, i) => {
  const start = beginSecond(planned.begin);
  const next = SHOT_PLAN[i + 1];
  const end = next ? beginSecond(next.begin) : lineEnd(LAST_LINE) + .8;
  return { start, end, tr: planned.tr, draw(ctx, lt, t) { planned.draw(ctx, lt, t, start); } };
});
