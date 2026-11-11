# Style guide: ink & watercolour stick-figure videos

This is the house style for Maturitka Formalitka explainer videos. Every rule here is already
implemented in `engine/`; this document says what the result must look like so you can check it.

Reference frames: `samples/finalny-styl.jpg` (target look), `samples/prechod-atramentom.jpg`
(transition), `samples/detail-zaber.jpg` (line and face detail),
`samples/referencia-titulkov-maco-mliec.jpg` (caption reference). `samples/povodny-styl-pred-upravou.jpg`
shows the bright cartoon style this replaced. Do not go back to it.

## Format

- 16:9, 1920 × 1080, 30 fps container.
- Drawings hold for 2.5 frames (12 drawings per second) for a hand-drawn feel. Captions run at full 30 fps.
- Calm pacing: one shot per 2–3 sentences, at least about 6 s per shot. Few cuts, few effects; the drawing and the voice carry the video.
- Length 25–45 s (6–10 sentences) for a reel, or 2–3 min (35–40 sentences) for a walkthrough of a whole work.

## Look

| Element | Rule |
|---|---|
| Paper | Sepia parchment `#F4E9D8` with faint coffee/tea stain washes, paper fibres, grain and burnt (darker) edges. Multiplied over the whole frame. |
| Ink | Charcoal `#1A1A1A` outlines. Lines "boil" gently: an SVG displacement filter with 3 seeds that change every 3rd drawing (4 times a second). |
| Colour | Muted, washed-out watercolour: whole frame `saturate(.55) sepia(.28)`. Accents: sage `#6B705C`, earthy brown `#5C4033`, ochre `#DDA15E`. No saturated primaries. |
| Characters | Round white stick head, **black dot eyes**, minimal line mouth, simple bean torso, no cel shading. Expressions come from brows, mouth, eye shape (`happy`, `squint`, `x`, `half`, `smug`). |
| Setting | 19th-century rural Slovakia: log cottages (drevenica), split-rail fences, fields, dirt paths. Tatra silhouettes in light grey/sepia wash on the horizon. |
| Light | Faint golden god rays from the top left, barely swaying. A few slow dust motes. |
| Atmosphere | Morning mist over the bottom 25 % of the frame, drifting slowly. Keep that band calm: it holds the captions. |
| Camera | Slow horizontal tracking and slow push-ins for emotional beats. No handheld shake. Static wide shots for establishing. |
| Transitions | Every cut is a 1.5 s ink-bleed dissolve: an organic noise mask with a brown ink fringe. No whip pans, no hard cuts. |
| Effects | Restraint: at most one or two pop-in tags per shot, appearing with a soft fade-up (no bounce or overshoot). No bursts, shakes or sparkles just for decoration. |

Village mood (in `drawVillage`): the shot's `skyTop` only picks the mood. No `skyTop` = day,
`skyTop` starting with `#ff` = sunset (ochre), any other `skyTop` = dusk (grey, for sad beats).

## Captions (BubbleCaptions)

Identical to `captions/BubbleCaptions.tsx` used in `maco-mliec.mp4` on the website:

- One rounded pill, teal `#075056` at 94 % opacity, shadow `0 18px 50px rgba(22,35,42,.35)`.
- Space Grotesk 700, white, letter spacing −0.02 em. 57 px at 1080p (38 px at 720p), pill bottom 72 px from the frame edge.
- Always one line, 2–5 words per phrase, split at punctuation.
- Words not yet spoken are 35 % opaque and turn solid white over 4 frames when spoken.
- **No pop-in, pop-out, scale or slide.** The next phrase replaces the previous one in place.
- If the gap to the next phrase is under 1 s the pill stays until the next phrase; otherwise it hides 0.3 s after the last word.

Captions are generated automatically from the voice's word timings. You never hand-time them.

## Voice

- Azure Speech, `sk-SK-LukasNeural` (male) by default, rate `-5%` (calm, a little slower than normal). Female alternative: `sk-SK-ViktoriaNeural`.
- One sentence per request, 0.5 s gap between sentences. Word timings come from Azure word boundaries.
- Write numbers and hard names the way they should be pronounced if Azure gets them wrong
  (e.g. "tisícdeväťstoštyridsať").
- Do not use VoiceStudio/OmniVoice for published videos: its weights are CC-BY-NC (non-commercial).

## Sound

`audio.py` in each video mixes the voice with code-generated effects (hooves, whooshes, chimes).
**No background music**, not even a soft pad: voice and sound effects only.
Effects are placed at old-clock times and shifted with `toNew()`. Use few of them (whoosh on cuts, one effect for each key action, no pop for every tag) and keep them quiet under the voice (`sfx * .45`);
the final mix is loudness-normalised to −14 LUFS.
