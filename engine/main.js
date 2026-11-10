// ---------- compositor: shots, transitions, captions, grade ----------
const canvas = document.getElementById('c'); canvas.width = W; canvas.height = H;
const out = canvas.getContext('2d');
const buf = document.createElement('canvas'); buf.width = W; buf.height = H; const bctx = buf.getContext('2d');
const WARP = window.WARP || null;
function warpMap(x, from, to) { const A = WARP.anchors; if (x <= A[0][from]) return x - A[0][from] + A[0][to]; for (let i = 0; i < A.length - 1; i++) if (x <= A[i + 1][from]) { const k = (x - A[i][from]) / (A[i + 1][from] - A[i][from]); return A[i][to] + k * (A[i + 1][to] - A[i][to]); } const L = A[A.length - 1]; return x - L[from] + L[to]; }
const toOld = t => WARP ? warpMap(t, 1, 0) : t, toNew = t => WARP ? warpMap(t, 0, 1) : t;
const DUR = WARP ? WARP.new_end + 0.6 : SHOTS[SHOTS.length - 1].end;
window.SHOT_SPANS = SHOTS.map((s, i) => [toNew(s.start), i === SHOTS.length - 1 ? DUR : toNew(s.end)]);
const TOTAL_FRAMES = Math.round(DUR * FPS);

// ---------- ink & watercolour look ----------
const DRAWN_FPS = 12; // hand-drawn hold: every drawing stays on screen for 2.5 video frames
const TRANSITION_HALF = .5; // ink-bleed dissolve lasts 1 s around each cut
const PAPER = '#f4e9d8', SEPIA_INK = '#5c4033', OCHRE = '#dda15e';
const makeCanvas = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

const paperTexture = (() => {
  const c = makeCanvas(), p = c.getContext('2d'), R = rng(91);
  p.fillStyle = PAPER; p.fillRect(0, 0, W, H);
  // coffee / tea stains: faint irregular washes with a broken drying edge
  for (let i = 0; i < 6; i++) {
    const x = R() * W, y = R() * H, r = 90 + R() * 220;
    for (let k = 0; k < 5; k++) {
      const ox = x + (R() - .5) * r * .5, oy = y + (R() - .5) * r * .5, rr = r * (.6 + R() * .5);
      const wash = p.createRadialGradient(ox, oy, rr * .2, ox, oy, rr);
      wash.addColorStop(0, 'rgba(170,120,70,.025)'); wash.addColorStop(.9, 'rgba(150,100,55,.045)'); wash.addColorStop(1, 'rgba(150,100,55,0)');
      p.fillStyle = wash; p.fillRect(ox - rr, oy - rr, rr * 2, rr * 2);
    }
  }
  // paper fibres
  p.strokeStyle = 'rgba(92,64,51,.05)'; p.lineWidth = 1;
  for (let i = 0; i < 2600; i++) { const x = R() * W, y = R() * H, a = R() * TAU, l = 4 + R() * 14; p.beginPath(); p.moveTo(x, y); p.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); p.stroke(); }
  // grain
  const id = p.getImageData(0, 0, W, H);
  for (let i = 0; i < id.data.length; i += 4) { const v = (R() - .5) * 18; id.data[i] += v; id.data[i + 1] += v; id.data[i + 2] += v; }
  p.putImageData(id, 0, 0);
  // burnt edges
  const edge = p.createRadialGradient(W / 2, H / 2, 560, W / 2, H / 2, 1180);
  edge.addColorStop(0, 'rgba(92,64,51,0)'); edge.addColorStop(1, 'rgba(92,64,51,.38)');
  p.fillStyle = edge; p.fillRect(0, 0, W, H);
  return c;
})();

// low-frequency noise for the ink-bleed mask (small, upscaled with smoothing)
const BLEED_W = 240, BLEED_H = 135;
const bleedNoise = (() => {
  const R = rng(57), n = new Float32Array(BLEED_W * BLEED_H);
  const smooth = t => t * t * (3 - 2 * t);
  const octave = (cells, weight) => {
    const cols = cells + 1, rows = Math.ceil(cells * BLEED_H / BLEED_W) + 1, grid = Array.from({ length: cols * rows }, R);
    for (let y = 0; y < BLEED_H; y++) for (let x = 0; x < BLEED_W; x++) {
      const gx = x / BLEED_W * cells, gy = y / BLEED_W * cells, ix = Math.floor(gx), iy = Math.floor(gy), fx = smooth(gx - ix), fy = smooth(gy - iy);
      const v = (a, b) => grid[(iy + b) * cols + ix + a];
      n[y * BLEED_W + x] += weight * lerp(lerp(v(0, 0), v(1, 0), fx), lerp(v(0, 1), v(1, 1), fx), fy);
    }
  };
  octave(4, .6); octave(11, .28); octave(30, .12);
  return n;
})();
const bleedMask = makeCanvas(BLEED_W, BLEED_H), bleedEdge = makeCanvas(BLEED_W, BLEED_H);
function updateBleedMasks(progress) {
  const reveal = progress * 1.25 - .12, soft = .05;
  const maskData = new ImageData(BLEED_W, BLEED_H), edgeData = new ImageData(BLEED_W, BLEED_H);
  for (let i = 0; i < bleedNoise.length; i++) {
    const d = reveal - bleedNoise[i];
    maskData.data[i * 4 + 3] = clamp(d / soft + .5) * 255;
    edgeData.data[i * 4] = 92; edgeData.data[i * 4 + 1] = 64; edgeData.data[i * 4 + 2] = 51;
    edgeData.data[i * 4 + 3] = clamp(1 - Math.abs(d) / .035) * 150;
  }
  bleedMask.getContext('2d').putImageData(maskData, 0, 0);
  bleedEdge.getContext('2d').putImageData(edgeData, 0, 0);
}

const sceneA = makeCanvas(), sceneACtx = sceneA.getContext('2d');
const sceneB = makeCanvas(), sceneBCtx = sceneB.getContext('2d');
const layer = makeCanvas(), layerCtx = layer.getContext('2d');

// captions: 2-5 word phrases on one line, split at punctuation (Maturitka BubbleCaptions rules)
const CAPTION_MAX_WORDS = 5, CAPTION_MAX_CHARS = 30, CAPTION_LONG_PAUSE = 1;
const CHUNKS = (() => {
  const ch = []; let cur = null;
  WORDS.forEach((w, i) => {
    const prev = WORDS[i - 1];
    const isFull = cur && (cur.words.length >= CAPTION_MAX_WORDS || (cur.text + ' ' + w.w).length > CAPTION_MAX_CHARS);
    const brk = !cur || isFull || /[.,?!]$/.test(prev ? prev.w : '') || (prev && prev.line !== w.line);
    if (brk) { cur = { words: [w], text: w.w, s: w.s, e: w.e }; ch.push(cur); } else { cur.words.push(w); cur.text += ' ' + w.w; cur.e = w.e; }
  });
  ch.forEach((c, i) => { const n = ch[i + 1]; c.e = n && n.s - c.e < CAPTION_LONG_PAUSE ? n.s : c.e + .3; });
  return ch;
})();
// caption style copied from BubbleCaptions.tsx (maco-mliec.mp4): teal pill, Space Grotesk 700, white words,
// unspoken words at 35 % opacity fading in over 4 frames, no pop-in or pop-out, phrases swap in place
const CAPTION_BUBBLE = 'rgba(7,80,86,.94)', CAPTION_FONT = "'Space Grotesk'";
const CAPTION_SIZE = 57, CAPTION_FROM_BOTTOM = 72; // maco-mliec 38 px / 48 px at 720p, scaled to 1080p
const UNSPOKEN_WORD_OPACITY = .35, WORD_FADE_IN_SECONDS = 4 / FPS;
function drawCaption(ctx, t) {
  const c = CHUNKS.find(c => t >= c.s && t < c.e); if (!c) return;
  const padX = CAPTION_SIZE * .64, padY = CAPTION_SIZE * .36, gap = CAPTION_SIZE * .28;
  const bubbleHeight = CAPTION_SIZE * 1.15 + padY * 2;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.font = `700 ${CAPTION_SIZE}px ${CAPTION_FONT}`; ctx.letterSpacing = `${-.02 * CAPTION_SIZE}px`;
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  const widths = c.words.map(w => ctx.measureText(w.w).width);
  const textWidth = widths.reduce((a, b) => a + b, 0) + gap * (c.words.length - 1);
  const bubbleWidth = textWidth + padX * 2;
  const centerY = H - CAPTION_FROM_BOTTOM - bubbleHeight / 2;
  ctx.shadowColor = 'rgba(22,35,42,.35)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18;
  rrect(ctx, W / 2 - bubbleWidth / 2, centerY - bubbleHeight / 2, bubbleWidth, bubbleHeight, bubbleHeight / 2); ctx.fillStyle = CAPTION_BUBBLE; ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#ffffff';
  let x = W / 2 - textWidth / 2;
  c.words.forEach((w, i) => {
    ctx.globalAlpha = lerp(UNSPOKEN_WORD_OPACITY, 1, clamp((t - w.s) / WORD_FADE_IN_SECONDS));
    ctx.fillText(w.w, x, centerY + 2);
    x += widths[i] + gap;
  });
  ctx.restore();
}
function renderShot(ctx, i, t) {
  const s = SHOTS[i];
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  ctx.save(); s.draw(ctx, t - s.start, t); ctx.restore();
}
function shotIndexAt(t) { const i = SHOTS.findIndex(s => t >= s.start && t < s.end); return i < 0 ? SHOTS.length - 1 : i; }
// returns the cut we are inside the dissolve window of, or null
function activeTransition(t) {
  for (let i = 0; i < SHOTS.length - 1; i++) {
    const cut = SHOTS[i].end;
    if (Math.abs(t - cut) < TRANSITION_HALF) return { from: i, to: i + 1, progress: (t - cut + TRANSITION_HALF) / (TRANSITION_HALF * 2) };
  }
  return null;
}
function drawInkBleed(transition, t) {
  renderShot(sceneACtx, transition.from, t);
  renderShot(sceneBCtx, transition.to, t);
  updateBleedMasks(ease(transition.progress));
  layerCtx.globalCompositeOperation = 'source-over'; layerCtx.drawImage(sceneB, 0, 0);
  layerCtx.globalCompositeOperation = 'destination-in'; layerCtx.imageSmoothingEnabled = true; layerCtx.drawImage(bleedMask, 0, 0, W, H);
  layerCtx.globalCompositeOperation = 'source-over';
  sceneACtx.drawImage(layer, 0, 0);
  sceneACtx.globalAlpha = .8; sceneACtx.drawImage(bleedEdge, 0, 0, W, H); sceneACtx.globalAlpha = 1;
}
// washed-out watercolour colour, wobbling ink lines, then the paper underneath
function inkGrade(drawnFrame) {
  out.save(); out.setTransform(1, 0, 0, 1, 0, 0);
  out.filter = `url(#boil${drawnFrame % 3}) saturate(.55) sepia(.28) contrast(1.04)`;
  out.drawImage(sceneA, 0, 0);
  out.filter = 'none';
  out.globalCompositeOperation = 'multiply'; out.drawImage(paperTexture, 0, 0);
  out.restore();
}
function drawGodRays(ctx, t) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'screen';
  const sway = Math.sin(t * .35) * .03;
  for (let i = 0; i < 5; i++) {
    const x = 180 + i * 230, w = 70 + (i % 3) * 45, a = .07 + (i % 2) * .04 + Math.sin(t * .8 + i * 1.7) * .02;
    ctx.save(); ctx.translate(x, -60); ctx.rotate(-.42 + sway);
    const g = ctx.createLinearGradient(0, 0, 0, 1300); g.addColorStop(0, `rgba(240,200,120,${a})`); g.addColorStop(1, 'rgba(240,200,120,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-w * .4, 0); ctx.lineTo(w * .4, 0); ctx.lineTo(w * 1.3, 1300); ctx.lineTo(-w * 1.3, 1300); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
const DUST_MOTES = Array.from({ length: 70 }, (_, i) => { const R = rng(i * 7 + 3); return { x: R() * W, y: R() * H * .8, r: 1.5 + R() * 3.5, speed: 6 + R() * 14, phase: R() * TAU }; });
function drawDustMotes(ctx, t) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  DUST_MOTES.forEach(m => {
    const x = (m.x + t * m.speed + Math.sin(t * .6 + m.phase) * 20) % W, y = (m.y - t * m.speed * .4 + H) % H;
    ctx.globalAlpha = .35 + Math.sin(t * 1.4 + m.phase) * .25;
    circle(ctx, x, y, m.r); ctx.fillStyle = '#fbe9c4'; ctx.fill();
  });
  ctx.restore();
}
function drawMorningMist(ctx, t) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const top = H * .72;
  const g = ctx.createLinearGradient(0, top, 0, H); g.addColorStop(0, 'rgba(244,233,216,0)'); g.addColorStop(1, 'rgba(244,233,216,.6)');
  ctx.fillStyle = g; ctx.fillRect(0, top, W, H - top);
  for (let i = 0; i < 7; i++) {
    const x = ((i * 340 + t * (14 + i * 3)) % (W + 600)) - 300, y = H * .86 + Math.sin(i * 2.1) * 40;
    ellipse(ctx, x, y, 320, 45); ctx.fillStyle = 'rgba(244,233,216,.14)'; ctx.fill();
  }
  ctx.restore();
}
function renderFrame(f) {
  const tNew = f / FPS;
  const drawnFrame = Math.floor(tNew * DRAWN_FPS);
  const tDrawn = Math.min(toOld(drawnFrame / DRAWN_FPS), SHOTS[SHOTS.length - 1].end - 1e-3);
  const transition = activeTransition(tDrawn);
  if (transition) drawInkBleed(transition, tDrawn);
  else renderShot(sceneACtx, shotIndexAt(tDrawn), tDrawn);
  inkGrade(drawnFrame);
  drawGodRays(out, tDrawn);
  drawDustMotes(out, tDrawn);
  drawMorningMist(out, tDrawn);
  drawCaption(out, tNew);
}
window.renderFrame = renderFrame; window.TOTAL_FRAMES = TOTAL_FRAMES; window.DUR = DUR;
window.grab = (q = .93) => canvas.toDataURL('image/jpeg', q);
