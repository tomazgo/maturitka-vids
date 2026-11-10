---
name: anj-video
description: Makes a finished 16:9 present-day explainer video (30–45 s) for an English (ANJ) maturita topic for Maturitka Formalitka, with a British Azure voiceover, teal word-by-word captions and sound effects only. Use when the user asks for an English / ANJ topic video (Travelling, Family, Sports, Food, Housing…).
---

# /anj-video

Input: an ANJ maturita topic. Output: `hotove-videa/<slug>.mp4`.

Read `docs/style-guide-present.md` first. The working example is `examples/travelling/`.
Everything else (voice tool, stills, build, captions) works as in `.claude/skills/maturitka-video/SKILL.md`.

1. `tools/new-video.sh <slug> present` (copies shots.js, audio.py, style.txt, voice.txt, rate.txt from the example).
2. Write `script.json`: 8–10 English sentences, 90–110 words. Sentence 1 is a hook question, the middle gives
   vocabulary and pros/cons, the last one or two give an exam tip or a model answer. No digits or abbreviations.
   Show the script and wait for approval.
3. Voice: `cd videos/<slug> && ../../.venv/bin/python ../../tools/vo_azure.py` (Azure key in `.env`; never read it).
4. Scenes in `shots.js`: one `shot({ line: n }, draw)` per sentence, or `shot({ line: n, word: 'traffic' }, draw)` to cut
   inside a sentence. Timing comes from the voice automatically; sync pops with `wordAt('word', line) - start`.
   Build with `drawPerson` and the props in `engine-present/present.js`; add new props at the top of `shots.js`.
   Keep the bottom 25 % for captions.
5. `tools/stills.sh videos/<slug> <times>` and show the contact sheet before the full build.
6. Adapt `audio.py`: effects only, placed with `word_at` / `cut_before`. No music.
7. `SKIP_VOICE=1 tools/build.sh videos/<slug>`, check with `ffprobe`, report the path.
