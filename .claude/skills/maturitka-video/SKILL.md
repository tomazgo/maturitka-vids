---
name: maturitka-video
description: Makes a finished 16:9 ink-and-watercolour stick-figure explainer video (25–45 s reel, or a 2–3 min walkthrough of a whole work) for Maturitka Formalitka from a topic or text, with a Slovak Azure voiceover and teal word-by-word captions. Use when the user gives content (a literary work, a topic, notes) and asks for a video, reel, or "urob video".
---

# /maturitka-video

Input: content from the user (topic, book, notes). Output: `hotove-videa/<slug>.mp4`.

Read `docs/style-guide.md` first. Keep token use low: follow the "Token budget" section at the end. The engine already implements the whole look, the captions and the
transitions. Your job is the script, the scenes (`shots.js`) and the sound effects (`audio.py`).

## 0. One-time checks

- `node_modules/` and `.venv/` exist, otherwise run `tools/setup.sh`.
- `.env` has `AZURE_SPEECH_KEY` (or the user points to a file via `AZURE_ENV_FILE`).
  Never read, print or commit `.env` files. If the key is missing, ask the user to add it.

## 1. Script

`tools/new-video.sh <slug>` (slug in ASCII kebab case, e.g. `maco-mliec`).

If the user says the video is for **YouTube**, use `tools/new-video.sh <slug> youtube`
(or set the existing video's `style.txt` to `youtube`). Read `docs/style-guide-youtube.md`.
Always deliver **two exports**: `<slug>-web.mp4` without the outro for the website,
and `<slug>-youtube.mp4` with the animated official-logo outro and its sound effects.
Keep one shared story/script/voice; do not manually append outro shots or narration.
`tools/build.sh` renders the story once and creates both exports automatically.

Write `videos/<slug>/script.json`: a JSON list of 6–10 Slovak sentences, about 80–110 words in total.
For a 2–3 min walkthrough: 30–35 sentences, about 320 words (Lukas at −5 % with 0.5 s pauses speaks about 2.5 words per second).

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

Copy the header of `examples/bacik-z-chocholova/shots.js` (everything above `// ---------- shots ----------`):
it has `addShot(firstLine, lastLine, draw)` and `wordAt('slovo', line)`, which cut shots on sentence boundaries
from `words.js`, so no seconds are typed by hand and shots follow the voice after any re-voicing. It also has
ready props (manor, tavern, ash tree, wagon, carriage, market stall, church, thought cloud, grain sack, document)
and characters (gazda, nobleman, priest). Delete the story-specific ones you do not need.
`examples/tri-gastanove-kone/` is the older hand-timed style; do not copy its timing. Delete `retime-from.json` if it got copied.

- Calm pacing: one shot per 2–3 sentences (at least about 6 s): `addShot(4, 5, (ctx, lt, t) => { … })`. `lt` is the time inside the shot, `t` the global time.
- Sync key moments to words with `wordAt('slovo', line)` (lower case, no punctuation; returns a global second),
  e.g. `popAt(t, wordAt('1890', 2))` for a pop-in tag.
- Every frame: `applyCam(ctx, cam, depth)` then background, then props and characters. Use
  `centerCam(t, zoom, dx, dy)`, animate with `kf(lt, [[t0, v0], [t1, v1, easing]])`.
- Keep the bottom 25 % free of important action (mist and captions live there). Characters stand on y ≈ 820–900.
- Each shot has one clear, slow action that shows the sentence: someone walks in, a heart breaks, coins appear.
- Few effects: at most one or two tags per shot (`popAt` fades them up softly), no decorative bursts, sparkles or shakes.

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

Render one still per shot at about 72 % of its length, in batches of 12 (one sheet per batch).
After fixes re-render only the shots you changed. Open `videos/<slug>/stills/sheet.jpg` and check: every character is fully in frame, nothing important in
the bottom quarter, the action matches the caption, faces read clearly. Fix and re-render stills until it is right.

## 5. Sound

Adapt `videos/<slug>/audio.py`: it reads `audio/vo.wav` and writes `audio/mix.wav`. Keep the synth helpers,
replace the effect timeline with a few effects for your shots (whoosh on transitions, one sound per key action, not a pop for every tag). No background music or pads.
Place effects with `word_at('slovo', line)` and list each shot's first line in `SHOT_FIRST_LINES` for the whooshes,
as in `examples/bacik-z-chocholova/audio.py`. Never type seconds by hand.
`DUR` follows the voice length automatically.

## 6. Build

```
SKIP_VOICE=1 tools/build.sh videos/<slug>
```

Verify with `ffprobe` (duration, 1920×1080, audio stream) and report the path to the user.
For YouTube requests, verify and report both `-web.mp4` and `-youtube.mp4`; the YouTube
version must be 12 seconds longer and its outro effects must be audible.
Do not commit rendered videos or `.env`.

## Token budget

- Do not read `engine/` files whole. The table in step 3 lists the API; when you need one function's options,
  `grep -n "function drawX" engine/*.js` and read only those lines.
- Copy the header of `examples/bacik-z-chocholova/shots.js` with `sed`/`cp` instead of retyping it.
- Write `shots.js` in one pass, then fix by small edits, never by rewriting the file.
- Re-voicing costs nothing for unchanged sentences: `vo_azure.py` caches every sentence in `audio/cache/`
  and prints how many Azure characters it used. After the voice exists, always build with `SKIP_VOICE=1`.
- Stills: batches of 12 and only the changed shots afterwards (see step 4). Do not extract frames from the final MP4
  unless something looks wrong there.
- Do not read `audio/words.json`; `vo_azure.py` already prints each sentence's start and end.

## Known pitfalls

- `browAng`: negative = angry (inner ends down), positive = sad or worried.
- Eyes `half` read as smug, not sad. For sadness use `normal` eyes, `frown` and a positive `browAng`.
- The mouth sits at head centre + .085 (in head units). A moustache must stay above about +.05, or it reads as a smile.
- A negative scale flips vertically as well. Mirror props with a separate `flip` (`ctx.scale(s * flip, s)`).
- Seated characters (`SEATED_LEGS`) on a wagon or carriage: put `y` on the seat top, not above it.
