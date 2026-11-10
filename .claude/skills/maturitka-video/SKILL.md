---
name: maturitka-video
description: Makes a finished 16:9 ink-and-watercolour stick-figure explainer video (25–45 s) for Maturitka Formalitka from a topic or text, with a Slovak Azure voiceover and teal word-by-word captions. Use when the user gives content (a literary work, a topic, notes) and asks for a video, reel, or "urob video".
---

# /maturitka-video

Input: content from the user (topic, book, notes). Output: `videos/<slug>/<slug>.mp4`.

Read `docs/style-guide.md` first. The engine already implements the whole look, the captions and the
transitions. Your job is the script, the scenes (`shots.js`) and the sound effects (`audio.py`).

## 0. One-time checks

- `node_modules/` and `.venv/` exist, otherwise run `tools/setup.sh`.
- `.env` has `AZURE_SPEECH_KEY` (or the user points to a file via `AZURE_ENV_FILE`).
  Never read, print or commit `.env` files. If the key is missing, ask the user to add it.

## 1. Script

`tools/new-video.sh <slug>` (slug in ASCII kebab case, e.g. `maco-mliec`).

Write `videos/<slug>/script.json`: a JSON list of 6–10 Slovak sentences, about 80–110 words in total.

- Sentence 1 is a hook question ("Čo ak by…?", "Prečo…?").
- Facts must be correct for the Slovak maturita (author, year, literary period, main characters, plot, theme).
- Last sentence is the takeaway or the ending.
- Plain spoken Slovak, no abbreviations; spell out numbers if Azure might misread them.

Show the script to the user and wait for approval before rendering anything.

## 2. Voice

```
cd videos/<slug> && ../../.venv/bin/python ../../tools/vo_azure.py
```

Prints the start and end second of each sentence and writes `web/words.js` with word timings.
A "word count mismatch" line means a sentence's timings were estimated; it is fine, but avoid digits
and abbreviations if captions look off. Voice options: `AZURE_VOICE=sk-SK-ViktoriaNeural`, `AZURE_RATE=0%`.

## 3. Scenes: `videos/<slug>/shots.js`

The file starts from the example (`examples/tri-gastanove-kone/shots.js`). Replace its characters and
shots. Delete `retime-from.json` if it got copied; it is only for re-voicing old videos.

- One shot per sentence (or two for long sentences). `SHOTS.push({ start, end, tr: 'whip', draw(ctx, lt, t) { … } })`.
  `start`/`end` are voice seconds from step 2; shots must be contiguous (next start = previous end), the first starts at 0
  and the last ends about 0.6 s after the final word. `lt` is the time inside the shot, `t` the global time.
- Sync key moments to words with `wordTime('slovo', fromSecond)` (lower case, no punctuation).
- Every frame: `applyCam(ctx, cam, depth)` then background, then props and characters. Use
  `centerCam(t, zoom, dx, dy)`, animate with `kf(lt, [[t0, v0], [t1, v1, easing]])`.
- Keep the bottom 25 % free of important action (mist and captions live there). Characters stand on y ≈ 820–900.
- Each shot has one clear action that shows the sentence: someone walks in, a heart breaks, coins appear.

Building blocks (see the files for every option):

| File | Functions |
|---|---|
| `engine/lib.js` | `kf`, `ease`, `easeOut`, `backOut`, `elastic`, `rng`, `shake`, `path`, `rrect`, `fillStroke`, `circle`, `ellipse`, `line`, `drawCloud`, `puff`, `burst`, `star5`, `sweat`, `text` |
| `engine/chars.js` | `drawStick(ctx, o)` stick person: `x, y, s` (size ≈ 400–600), `flip`, `cols` [main, stripe], `hat`, `belt`, `vest`, `arms`/`legs` (angle pairs or `{ ik: [x, y] }`), `face: { eyes, mouth, look, blink, browAng, browUp }`, `lean`, `bob`, `squash`, `headTilt`, `blush`, `prop`. Eyes: `normal, wide, happy, squint, half, smug, x, spiral`. Mouths: `smile, flat, frown, smirk, o, grin, teeth`. Also `POSE`, `ik`, `sparkle`, `drawChest` |
| `engine/env.js` | `applyCam`, `drawSky`, `drawSun`, `lightShaft`, `darkness`, sea/ship props, `drawLantern`, `drawBarrel`, `drawCrate` |
| `engine/env3.js` | `drawVillage(ctx, t, { sun, skyTop })`, `drawCottage`, `drawFence`, `drawHorse`, `drawWoman` (braids, skirt, apron, scarf, veil), `drawGazda` (farmer with hat and moustache), `drawPeterHat`, `drawBundle`, `drawMoneyBag`, `drawCoin`, `drawBook(ctx, x, y, s, rot, { title: [..], author, cover, art })`, `drawTag`, `drawWhip`, `drawHeart`, `drawBrokenHeart` |

Need a new prop or character (a cow, a church, a pipe)? Add a `drawX` function at the top of `shots.js`
in the same style: thick `INK` outlines via `fillStroke`, flat muted fills, origin on the ground.
Do not edit `engine/` for one video; the build copies it fresh every time.

## 4. Check frames

```
tools/stills.sh videos/<slug> 1,5,9,13,17,21
```

Open `videos/<slug>/stills/sheet.jpg` and check: every character is fully in frame, nothing important in
the bottom quarter, the action matches the caption, faces read clearly. Fix and re-render stills until it is right.

## 5. Sound

Adapt `videos/<slug>/audio.py`: it reads `audio/vo.wav` and writes `audio/mix.wav`. Keep the synth helpers,
replace the effect timeline with effects for your shots (whoosh on transitions). No background music or pads.
`DUR` follows the voice length automatically.

## 6. Build

```
SKIP_VOICE=1 tools/build.sh videos/<slug>
```

Verify with `ffprobe` (duration, 1920×1080, audio stream) and report the path to the user.
Do not commit rendered videos or `.env`.
