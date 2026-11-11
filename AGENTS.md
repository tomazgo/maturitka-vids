# Video workflow

Read `CLAUDE.md` and the relevant style guide before making videos. Never read,
print or commit `.env` files or API keys.

For Slovak literature, follow `.claude/skills/maturitka-video/SKILL.md`.
For English topics, follow `.claude/skills/anj-video/SKILL.md`.

When the user says a literature video is for **YouTube**, use `style.txt` = `youtube`
and `docs/style-guide-youtube.md`. Always deliver both exports from `tools/build.sh`:

- `<slug>-web.mp4`: the story without the outro, for the website.
- `<slug>-youtube.mp4`: the same story with the animated outro, official SVG logo,
  and synchronized sound effects. No background music.

Keep one script, voice and set of story scenes. The build appends the outro and
its effects automatically. Use `engine-youtube/assets/logo.svg`; do not redraw the logo.
