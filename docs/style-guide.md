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
- Length 25–45 s, 6–10 sentences of voiceover.

## Look

| Element | Rule |
|---|---|
| Paper | Sepia parchment `#F4E9D8` with faint coffee/tea stain washes, paper fibres, grain and burnt (darker) edges. Multiplied over the whole frame. |
| Ink | Charcoal `#1A1A1A` outlines. Lines "boil": an SVG displacement filter with 3 seeds that change every drawing. |
| Colour | Muted, washed-out watercolour: whole frame `saturate(.55) sepia(.28)`. Accents: sage `#6B705C`, earthy brown `#5C4033`, ochre `#DDA15E`. No saturated primaries. |
| Characters | Round white stick head, **black dot eyes**, minimal line mouth, simple bean torso, no cel shading. Expressions come from brows, mouth, eye shape (`happy`, `squint`, `x`, `half`, `smug`). |
| Setting | 19th-century rural Slovakia: log cottages (drevenica), split-rail fences, fields, dirt paths. Tatra silhouettes in light grey/sepia wash on the horizon. |
| Light | Soft golden god rays from the top left, slowly swaying. Floating dust motes. |
| Atmosphere | Morning mist over the bottom 25 % of the frame, drifting slowly. Keep that band calm: it holds the captions. |
| Camera | Smooth horizontal tracking and slow push-ins for emotional beats. Almost no handheld shake. Static wide shots for establishing. |
| Transitions | Every cut is a ~1 s ink-bleed dissolve: an organic noise mask with a brown ink fringe. No whip pans, no hard cuts. |

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

- Azure Speech, `sk-SK-LukasNeural` (male) by default, rate `+5%`. Female alternative: `sk-SK-ViktoriaNeural`.
- One sentence per request, 0.28 s gap between sentences. Word timings come from Azure word boundaries.
- Write numbers and hard names the way they should be pronounced if Azure gets them wrong
  (e.g. "tisícdeväťstoštyridsať").
- Do not use VoiceStudio/OmniVoice for published videos: its weights are CC-BY-NC (non-commercial).

## Sound

`audio.py` in each video mixes the voice with code-generated effects (hooves, whooshes, chimes, pads).
Effects are placed at old-clock times and shifted with `toNew()`. Keep them quiet under the voice;
the final mix is loudness-normalised to −14 LUFS.
