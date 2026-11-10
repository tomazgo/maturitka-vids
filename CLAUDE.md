# maturitka-vids

Explainer videos for Maturitka Formalitka (Slovak maturita prep), drawn entirely in code:
ink-and-watercolour stick figures on sepia paper, Slovak Azure voiceover, teal word-by-word captions.

When the user gives content (a book, a topic, notes) and wants a video, follow
`.claude/skills/maturitka-video/SKILL.md` step by step. The look is fixed: read `docs/style-guide.md`
and do not restyle the engine, captions or transitions unless the user asks.

- All user-facing text (script, captions) is in Slovak. Code and comments in English.
- Show the script and wait for approval before rendering. Show a stills contact sheet before the full build.
- Never read, print or commit `.env` files or API keys.
- Code style: clear long names, early returns, small functions, match the surrounding code.
- Working example: `examples/tri-gastanove-kone/` (build it with `tools/build.sh examples/tri-gastanove-kone`).
