// Self-contained word-by-word caption style for Maturitka Formalitka videos.
// Copy this file into any Remotion project; it only needs `remotion` and `@remotion/google-fonts`.
import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

const { fontFamily: captionFontFamily } = loadFont("normal", {
  weights: ["700"],
  subsets: ["latin", "latin-ext"],
});

export type CaptionWord = {
  text: string;
  startInSeconds: number;
  endInSeconds: number;
};

export type CaptionPhrase = {
  words: CaptionWord[];
  hideAtSeconds: number;
};

export type BubbleCaptionsProps = {
  phrases: CaptionPhrase[];
  fontSizeInPixels?: number;
  distanceFromBottomInPixels?: number;
  bubbleColor?: string;
};

const UNSPOKEN_WORD_OPACITY = 0.35;
const WORD_FADE_IN_FRAMES = 4;

// One rounded bubble on a single line. Phrases swap in place with no pop-in or pop-out,
// and each word turns from translucent to solid white as it is spoken.
export function BubbleCaptions({
  phrases,
  fontSizeInPixels = 56,
  distanceFromBottomInPixels = 340,
  bubbleColor = "rgba(7, 80, 86, 0.94)",
}: BubbleCaptionsProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeInSeconds = frame / fps;
  const activePhrase = findActivePhrase(phrases, currentTimeInSeconds);

  if (!activePhrase) return null;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: distanceFromBottomInPixels,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: fontSizeInPixels * 0.28,
          whiteSpace: "nowrap",
          padding: `${fontSizeInPixels * 0.36}px ${fontSizeInPixels * 0.64}px`,
          borderRadius: 999,
          backgroundColor: bubbleColor,
          boxShadow: "0 18px 50px rgba(22, 35, 42, 0.35)",
        }}
      >
        {activePhrase.words.map((word) => (
          <CaptionWordText
            key={word.startInSeconds}
            word={word}
            currentTimeInSeconds={currentTimeInSeconds}
            fontSizeInPixels={fontSizeInPixels}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
}

function findActivePhrase(phrases: CaptionPhrase[], currentTimeInSeconds: number) {
  return phrases.find(
    (phrase) =>
      currentTimeInSeconds >= phrase.words[0].startInSeconds &&
      currentTimeInSeconds < phrase.hideAtSeconds,
  );
}

type CaptionWordTextProps = {
  word: CaptionWord;
  currentTimeInSeconds: number;
  fontSizeInPixels: number;
};

function CaptionWordText({ word, currentTimeInSeconds, fontSizeInPixels }: CaptionWordTextProps) {
  const { fps } = useVideoConfig();
  const framesSinceStart = (currentTimeInSeconds - word.startInSeconds) * fps;
  const opacity = interpolate(framesSinceStart, [0, WORD_FADE_IN_FRAMES], [UNSPOKEN_WORD_OPACITY, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <span
      style={{
        fontFamily: captionFontFamily,
        fontWeight: 700,
        fontSize: fontSizeInPixels,
        lineHeight: 1.15,
        letterSpacing: "-0.02em",
        color: "#FFFFFF",
        opacity,
      }}
    >
      {word.text}
    </span>
  );
}
