# Titulky Maturitka Formalitka (BubbleCaptions)

Jednotný štýl titulkov pre všetky videá. Celý štýl je v jednom súbore `BubbleCaptions.tsx`, ktorý sa dá skopírovať do akéhokoľvek Remotion projektu.

## Ako vyzerajú

- Jedna zaoblená bublina (pill) v brand teal `#075056` (94 % krytie) s jemným tieňom.
- Text je vždy na **jednom riadku**, Space Grotesk 700, 56 px, biely.
- Slová, ktoré ešte neboli povedané, majú 35 % krytie. Keď zaznejú, za 4 snímky zbelejú.
- Bublina nemá žiadnu animáciu príchodu ani odchodu, nič sa nezväčšuje ani nevyskakuje. Ďalšia fráza nahradí predchádzajúcu na tom istom mieste.
- Bublina je vodorovne v strede, 340 px od spodného okraja (pri videu 1080 × 1920).

## Použitie v inom projekte

1. Skopíruj `BubbleCaptions.tsx` do projektu.
2. Ak `@remotion/google-fonts` ešte nemáš, nainštaluj ho cez `npx remotion add @remotion/google-fonts`.
3. Priprav frázy s časmi slov v sekundách:

```tsx
import { BubbleCaptions, type CaptionPhrase } from "./BubbleCaptions";

const phrases: CaptionPhrase[] = [
  {
    hideAtSeconds: 2.84,
    words: [
      { text: "Maturita", startInSeconds: 0, endInSeconds: 0.86 },
      { text: "a", startInSeconds: 0.86, endInSeconds: 1.22 },
      { text: "hlava", startInSeconds: 1.22, endInSeconds: 1.52 },
      { text: "plná", startInSeconds: 1.52, endInSeconds: 1.86 },
      { text: "vzorcov?", startInSeconds: 1.86, endInSeconds: 2.76 },
    ],
  },
];

// Inside a composition, layered above the video:
<BubbleCaptions phrases={phrases} />
```

4. Voliteľné props: `fontSizeInPixels` (56), `distanceFromBottomInPixels` (340), `bubbleColor`.

## Pravidlá pre frázy

- Fráza má 2–5 slov a musí sa zmestiť na jeden riadok (pri 56 px je to približne 900 px).
- Aby prechod medzi frázami bol plynulý, nastav `hideAtSeconds` predchádzajúcej frázy presne na `startInSeconds` prvého slova ďalšej.
- Ak je medzi frázami pauza dlhšia ako asi 1 s, nechaj bublinu zmiznúť: `hideAtSeconds` bude krátko po poslednom slove.
- Časy slov získaš prepisom hlasu cez Whisper (`word_timestamps=True`). Pravopis potom oprav podľa scenára.
- Komponent počíta čas od začiatku sekvencie, v ktorej je vložený. Ak je video v `<Sequence from={…}>`, daj titulky do tej istej sekvencie.
