# maturitka-vids

Explainer videos for Maturitka Formalitka (Slovak maturita prep), drawn entirely in code:
ink-and-watercolour stick figures on sepia paper, Slovak Azure voiceover, teal word-by-word captions.

When the user gives content (a book, a topic, notes) and wants a video, follow
`.claude/skills/maturitka-video/SKILL.md` step by step. The look is fixed: read `docs/style-guide.md`
and do not restyle the engine, captions or transitions unless the user asks.

English (ANJ) topic videos use the present-day style: follow `.claude/skills/anj-video/SKILL.md` and
`docs/style-guide-present.md`. Neither style has background music, only sound effects.

YouTube literature videos use `style.txt` = `youtube`: the same ink story with an automatic
12-second website-style outro with restrained sound effects. When the user says the video is for
YouTube, always deliver BOTH `<slug>-web.mp4` (story only, for the website) and
`<slug>-youtube.mp4` (same story + outro). The build exports both automatically. See `docs/style-guide-youtube.md`; create with
`tools/new-video.sh <slug> youtube`. Do not append the outro manually to shots or narration.

- User-facing text is in Slovak for literature videos and in English for ANJ videos. Code and comments in English.
- Show the script and wait for approval before rendering. Show a stills contact sheet before the full build.
- Never read, print or commit `.env` files or API keys.
- Code style: clear long names, early returns, small functions, match the surrounding code.
- Working examples: `examples/bacik-z-chocholova/` (2 min, shots timed from the voice automatically; start from this one)
  and `examples/tri-gastanove-kone/` (35 s reel, older hand-timed shots).
