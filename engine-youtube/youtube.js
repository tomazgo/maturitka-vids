// Keep the literature compositor; append the animated website end card.
(() => {
  const storyDuration = window.DUR;
  const outroDuration = 12;
  const drawStoryFrame = window.renderFrame;
  const ctx = document.getElementById('c').getContext('2d');
  const palette = { background: '#deeaee', ink: '#16232a', teal: '#075056', lime: '#d7ef70' };
  const logo = new Image();
  const previousAssets = window.ASSETS_READY || Promise.resolve();
  window.ASSETS_READY = Promise.all([previousAssets, new Promise((resolve, reject) => {
    logo.onload = resolve;
    logo.onerror = () => reject(new Error('Cannot load the official Maturitka Formalitka logo'));
    logo.src = 'assets/logo.svg';
  })]);
  const reveal = (time, delay, duration = .8) => easeOut(clamp((time - delay) / duration));

  function label(value, x, y, size, color = palette.ink, weight = 700) {
    ctx.font = `${weight} ${size}px 'Space Grotesk'`;
    ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(value, x, y);
  }

  function animate(time, delay, draw, distance = 35) {
    const progress = reveal(time, delay);
    if (!progress) return;
    ctx.save(); ctx.globalAlpha *= progress;
    ctx.translate(0, (1 - progress) * distance);
    draw(progress); ctx.restore();
  }

  function icon(kind, x, y) {
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = palette.teal; ctx.fillStyle = palette.teal;
    ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (kind === 'play') {
      rrect(ctx, -25, -19, 50, 38, 9); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-6, -10); ctx.lineTo(11, 0); ctx.lineTo(-6, 10); ctx.closePath(); ctx.fill();
    } else if (kind === 'book') {
      ctx.beginPath(); ctx.moveTo(0, -14); ctx.quadraticCurveTo(-12, -24, -27, -18);
      ctx.lineTo(-27, 19); ctx.quadraticCurveTo(-12, 13, 0, 23);
      ctx.quadraticCurveTo(12, 13, 27, 19); ctx.lineTo(27, -18);
      ctx.quadraticCurveTo(12, -24, 0, -14); ctx.lineTo(0, 23); ctx.stroke();
    } else {
      label('AI', -24, 1, 33);
    }
    ctx.restore();
  }

  function card(time, delay, index, title, subtitle, kind) {
    const progress = reveal(time, delay, .95);
    if (!progress) return;
    const y = 296 + index * 159;
    const float = Math.sin((time - delay) * 1.3 + index * 1.2) * 5;
    ctx.save(); ctx.globalAlpha *= progress;
    ctx.translate(1438 + (1 - progress) * 420, y + 66 + float);
    ctx.rotate((1 - progress) * .12 + Math.sin(time * .6 + index) * .008);
    ctx.shadowColor = 'rgba(7,80,86,.08)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12;
    rrect(ctx, -325, -66, 650, 132, 25); ctx.fillStyle = '#f8fcfc'; ctx.fill();
    ctx.shadowColor = 'transparent';
    rrect(ctx, -300, -41, 82, 82, 21); ctx.fillStyle = index === 2 ? palette.lime : '#e3efed'; ctx.fill();
    icon(kind, -259, 0);
    label(title, -192, -15, 35, palette.teal);
    label(subtitle, -192, 29, 22, '#52656a', 500);
    label('↗', 267, 0, 32, palette.teal);
    ctx.restore();
  }

  function drawOutro(time, alpha) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none'; ctx.globalAlpha = alpha;
    ctx.fillStyle = palette.background; ctx.fillRect(0, 0, W, H);
    // Slowly moving washes and an orbit give the held card life.
    ctx.save(); ctx.globalAlpha *= .38;
    circle(ctx, 1830 + Math.sin(time * .3) * 25, 100, 430);
    ctx.fillStyle = '#c8dfe1'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(1460, 480, 385, 355, -.25 + time * .018, 0, TAU);
    ctx.strokeStyle = '#a9c8c9'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
    const orbit = time * .35;
    circle(ctx, 1460 + Math.cos(orbit) * 385, 480 + Math.sin(orbit) * 355, 12);
    ctx.fillStyle = palette.lime; ctx.fill();

    animate(time, .1, p => {
      const scale = 1 + (1 - p) * .08;
      ctx.save(); ctx.translate(140, 93); ctx.scale(scale, scale);
      ctx.drawImage(logo, 0, 0, 434.4, 120); ctx.restore();
    });
    animate(time, .5, () => label('Tvoja príprava pokračuje.', 145, 294, 31, palette.teal, 500));
    animate(time, .8, () => label('Maturita?', 140, 408, 105));
    animate(time, 1.1, () => label('Len formalitka.', 140, 527, 99));
    // Draw the highlight across the headline instead of showing it all at once.
    const underline = reveal(time, 1.65, .9);
    ctx.save(); ctx.beginPath(); ctx.rect(140, 575, 790 * underline, 30); ctx.clip();
    ctx.beginPath(); ctx.moveTo(146, 590); ctx.bezierCurveTo(330, 572, 570, 605, 810, 583);
    ctx.strokeStyle = palette.lime; ctx.lineWidth = 13; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore();
    animate(time, 2, () => {
      label('Viac vedomostí. Menej stresu.', 145, 662, 32, palette.teal, 500);
      label('Všetko na maturitu na jednom mieste.', 145, 710, 25, '#52656a', 500);
    });
    card(time, .85, 0, 'Videá', 'Pochop učivo krok za krokom.', 'play');
    card(time, 1.3, 1, 'Maturitné témy', 'Urob si v témach jasno.', 'book');
    card(time, 1.75, 2, 'AI maturita', 'Precvičuj a pripravuj sa.', 'ai');

    animate(time, 2.6, p => {
      rrect(ctx, 140, 812, 1640, 166, 32); ctx.fillStyle = palette.teal; ctx.fill();
      label('Viac nájdeš na', 188, 854, 25, '#d5e9e5', 500);
      // Reveal the complete address with a horizontal mask; never change its spelling.
      ctx.save(); ctx.beginPath(); ctx.rect(183, 878, 1350 * reveal(time, 2.9, 1), 80); ctx.clip();
      label('maturitkaformalitka.sk', 184, 921, 70, '#ffffff'); ctx.restore();
      const pulse = 1 + Math.sin(Math.max(0, time - 3.6) * 2) * .035;
      ctx.save(); ctx.translate(1682, 895); ctx.scale(pulse, pulse);
      circle(ctx, 0, 0, 44); ctx.fillStyle = palette.lime; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(16, 0); ctx.moveTo(4, -12); ctx.lineTo(16, 0); ctx.lineTo(4, 12);
      ctx.strokeStyle = palette.teal; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
    }, 80);
    animate(time, 3.6, () => {
      label('Odoberaj kanál', 145, 1023, 24, palette.teal);
      label('a pozri si ďalšie videá.', 355, 1023, 24, '#52656a', 500);
    });
    ctx.restore();
  }

  window.DUR = storyDuration + outroDuration;
  window.OUTRO_START = storyDuration;
  window.TOTAL_FRAMES = Math.round(window.DUR * FPS);
  window.SHOT_SPANS.push([storyDuration, window.DUR]);
  window.renderFrame = frame => {
    const time = frame / FPS;
    if (time < storyDuration) return drawStoryFrame(frame);
    const outroTime = time - storyDuration;
    const progress = ease(clamp(outroTime / .7));
    if (progress < 1) drawStoryFrame(Math.max(0, Math.floor(storyDuration * FPS) - 1));
    drawOutro(outroTime, progress);
  };
})();
