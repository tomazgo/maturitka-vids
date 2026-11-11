# Style guide: present-day English (ANJ) videos

Second house style for Maturitka Formalitka, used for English maturita topics (Travelling, Family, Sports…).
It is implemented in `engine-present/`, which the build copies on top of `engine/` when the video folder
has `style.txt` with `present`. The ink style (`docs/style-guide.md`) stays for Slovak literature.

## Format

- 16:9, 1920 × 1080, 30 fps. Smooth motion at the full 30 fps (no hand-drawn hold).
- Length 35–50 s, 8–10 English sentences, about 80–100 words.
- Calm pacing: one shot per 1–2 sentences, at least about 5 s per shot. Do not cut inside a sentence. Few effects.

## Look

| Element | Rule |
|---|---|
| Background | Clean and bright, no paper texture, no sepia, no boiling lines. Soft corner vignette only. |
| Ink | Charcoal `#1A1A1A` outlines, 6 px on props (`OUTLINE`), still lines. |
| Colour | Saturated flat colours from `PRESENT` in `engine-present/present.js`: teal `#075056`, teal light `#2A9D8F`, mint `#CDEAE4`, ochre `#F2B84B`, coral `#EF6F5E`, sky `#8ECAE6`, purple `#7B6CD9`. |
| Characters | `drawPerson`: the same stick figure (white head, dot eyes) with modern hair (`short`, `ponytail`, `bun`, `curly`), optional `cap`, `glasses`, `backpack`. No belts or old hats. |
| Settings | Today: `drawCity`, `drawRoom`, `drawCountryside`. Props: plane, train + rails, car, suitcase, passport, banknote, insurance card, phone, globe, map pin, hotel, hostel, tent, exam table, speech bubble, check / cross, leaf, smoke. |
| Key words | English vocabulary fades up as `drawTag` pills when it is spoken (`popIn` + the word's time, soft ease without bounce). At most 2–3 tags per shot. |
| Transitions | `push` (slow slide left, no smear, default), `zoom` (gentle), or `cut`, set per shot; .8 s long. |
| Camera | Slow pans and push-ins only, no handheld shake. |

## Captions

Exactly the same teal BubbleCaptions as the ink style (see `docs/style-guide.md`). Do not restyle them.

## Voice

- Azure `en-GB-RyanNeural` (British male), rate `-8%` for B1 learners (clear and unhurried), 0.5 s between sentences. Set in the video folder:
  `voice.txt` and `rate.txt`. The SSML language is taken from the voice name.
- Plain spoken English at B1/B2 level, useful exam phrases (comparing, giving reasons, "I prefer… because…").

## Sound

Voice and a few code-generated effects only (soft whoosh on cuts, one sound per key action), mixed quietly under the voice (`sfx * .45`). No pop for every tag.
**No background music.** Effects are placed from `audio/words.json`, so a re-voice needs no edits.
