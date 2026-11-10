// ---------- compositor (present style): shots, slide transitions, captions ----------
const canvas = document.getElementById('c'); canvas.width = W; canvas.height = H;
const out = canvas.getContext('2d');
const buf = document.createElement('canvas'); buf.width = W; buf.height = H; const bctx = buf.getContext('2d');
const WARP = window.WARP || null;
function warpMap(x, from, to) { const A = WARP.anchors; if (x <= A[0][from]) return x - A[0][from] + A[0][to]; for (let i = 0; i < A.length - 1; i++) if (x <= A[i + 1][from]) { const k = (x - A[i][from]) / (A[i + 1][from] - A[i][from]); return A[i][to] + k * (A[i + 1][to] - A[i][to]); } const L = A[A.length - 1]; return x - L[from] + L[to]; }
const toOld = t => WARP ? warpMap(t, 1, 0) : t, toNew = t => WARP ? warpMap(t, 0, 1) : t;
const DUR = WARP ? WARP.new_end + 0.6 : SHOTS[SHOTS.length - 1].end;
window.SHOT_SPANS = SHOTS.map((s, i) => [toNew(s.start), i === SHOTS.length - 1 ? DUR : toNew(s.end)]);
const TOTAL_FRAMES = Math.round(DUR * FPS);

// ---------- present-day look: clean colours, smooth 30 fps motion, quick slide transitions ----------
const TRANSITION_HALF = .22; // slide / zoom transition lasts .44 s around each cut
const BACKGROUND = '#fbf7f0';
const makeCanvas = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const sceneA = makeCanvas(), sceneACtx = sceneA.getContext('2d');
const sceneB = makeCanvas(), sceneBCtx = sceneB.getContext('2d');

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
  ctx.fillStyle = BACKGROUND; ctx.fillRect(0, 0, W, H);
  ctx.save(); s.draw(ctx, t - s.start, t); ctx.restore();
}
function shotIndexAt(t) { const i = SHOTS.findIndex(s => t >= s.start && t < s.end); return i < 0 ? SHOTS.length - 1 : i; }
// returns the cut we are inside the transition window of, or null; the incoming shot's `tr` picks the kind
function activeTransition(t) {
  for (let i = 0; i < SHOTS.length - 1; i++) {
    const cut = SHOTS[i].end, kind = SHOTS[i + 1].tr || 'push';
    if (kind === 'cut') continue;
    if (Math.abs(t - cut) < TRANSITION_HALF) return { from: i, to: i + 1, kind, progress: (t - cut + TRANSITION_HALF) / (TRANSITION_HALF * 2) };
  }
  return null;
}
// the old shot slides out to the left while the new one slides in, with a light motion smear
function drawPush(progress) {
  const k = ease(progress), offset = k * W, smear = Math.sin(progress * Math.PI) * 60;
  out.drawImage(sceneA, -offset, 0);
  out.drawImage(sceneB, W - offset, 0);
  out.globalAlpha = .25 * Math.sin(progress * Math.PI);
  out.drawImage(sceneA, -offset - smear, 0); out.drawImage(sceneB, W - offset + smear, 0);
  out.globalAlpha = 1;
}
// the old shot zooms towards the camera and fades, the new one settles from slightly bigger
function drawZoom(progress) {
  const k = ease(progress);
  const drawScaled = (img, scale, alpha) => { out.globalAlpha = alpha; out.drawImage(img, W / 2 - W * scale / 2, H / 2 - H * scale / 2, W * scale, H * scale); };
  drawScaled(sceneA, 1 + k * .35, 1);
  drawScaled(sceneB, 1.15 - k * .15, k);
  out.globalAlpha = 1;
}
function drawTransition(transition, t) {
  renderShot(sceneACtx, transition.from, t);
  renderShot(sceneBCtx, transition.to, t);
  out.save(); out.setTransform(1, 0, 0, 1, 0, 0); out.fillStyle = BACKGROUND; out.fillRect(0, 0, W, H);
  if (transition.kind === 'zoom') drawZoom(transition.progress); else drawPush(transition.progress);
  out.restore();
}
function drawSingleShot(t) {
  renderShot(sceneACtx, shotIndexAt(t), t);
  out.setTransform(1, 0, 0, 1, 0, 0); out.drawImage(sceneA, 0, 0);
}
// soft corner vignette keeps the eye in the middle without dulling the colours
const vignette = (() => {
  const c = makeCanvas(), p = c.getContext('2d');
  const g = p.createRadialGradient(W / 2, H / 2, 700, W / 2, H / 2, 1250);
  g.addColorStop(0, 'rgba(22,35,42,0)'); g.addColorStop(1, 'rgba(22,35,42,.16)');
  p.fillStyle = g; p.fillRect(0, 0, W, H);
  return c;
})();
function renderFrame(f) {
  const tNew = f / FPS;
  const tShot = Math.min(toOld(tNew), SHOTS[SHOTS.length - 1].end - 1e-3);
  const transition = activeTransition(tShot);
  if (transition) drawTransition(transition, tShot);
  else drawSingleShot(tShot);
  out.setTransform(1, 0, 0, 1, 0, 0); out.drawImage(vignette, 0, 0);
  drawCaption(out, tNew);
}
window.renderFrame = renderFrame; window.TOTAL_FRAMES = TOTAL_FRAMES; window.DUR = DUR;
window.grab = (q = .93) => canvas.toDataURL('image/jpeg', q);
