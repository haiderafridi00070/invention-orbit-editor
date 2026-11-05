import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";

// Montserrat ExtraBold (weight 800) — the heavy bold sans used for every
// text event in this style. Falls back to system heavy sans if needed.
const { fontFamily } = loadFont("normal", {
  weights: ["800"],
  subsets: ["latin"],
});

const FONT_STACK = `${fontFamily}, "Arial Black", Arial, Helvetica, sans-serif`;

// Soft black drop shadow so white text stays readable on any footage.
const SOFT_SHADOW =
  "0px 10px 28px rgba(0,0,0,0.55), 0px 4px 10px rgba(0,0,0,0.65)";

export type KineticNumberProps = {
  /** The hero text, e.g. "$ 10,800" — assembles character by character. */
  mainText: string;
  /** The smaller unit line under it, e.g. "PER TON" — appears after. */
  unitText: string;
};

/**
 * KineticNumber — the "Quietly Obsolete" style signature text event.
 *
 * Transparent background (no fill). The main text assembles per character:
 * each character springs up from below while fading in, staggered ~60 ms
 * apart, so the whole value is assembled in roughly 0.6 s and then holds.
 * The unit line rises in once the main text has landed.
 *
 * Text is parameterised through props (defaultProps in src/index.tsx), so
 * later templates can reuse this component with different numbers/phrases.
 */
export const KineticNumber: React.FC<KineticNumberProps> = ({
  mainText,
  unitText,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const chars = mainText.split("");
  const STAGGER_FRAMES = 2; // 2 frames @30fps = ~67 ms between characters

  // The unit line starts once the last character has begun landing.
  const unitDelay = chars.length * STAGGER_FRAMES + 8;
  const unitSpring = spring({
    frame: frame - unitDelay,
    fps,
    config: { damping: 200 },
  });
  const unitOpacity = interpolate(frame - unitDelay, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const unitY = interpolate(unitSpring, [0, 1], [26, 0]);

  return (
    <AbsoluteFill>
      {/* Lower-centre placement, matching the reference style. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "54%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: FONT_STACK,
            fontWeight: 800,
            fontSize: 215,
            lineHeight: 1.05,
            letterSpacing: "0.01em",
            color: "#ffffff",
            textShadow: SOFT_SHADOW,
          }}
        >
          {chars.map((ch, i) => {
            const delay = i * STAGGER_FRAMES;
            const progress = spring({
              frame: frame - delay,
              fps,
              config: { damping: 100, stiffness: 260, mass: 0.6 },
            });
            const opacity = interpolate(frame - delay, [0, 7], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const y = interpolate(progress, [0, 1], [64, 0]);
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  opacity,
                  transform: `translateY(${y}px)`,
                  whiteSpace: "pre",
                }}
              >
                {ch === " " ? "\u00A0" : ch}
              </span>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 28,
            fontFamily: FONT_STACK,
            fontWeight: 800,
            fontSize: 66,
            letterSpacing: "0.32em",
            // Compensate for the trailing letter-spacing so it looks centred.
            paddingLeft: "0.32em",
            color: "#ffffff",
            textShadow: SOFT_SHADOW,
            opacity: unitOpacity,
            transform: `translateY(${unitY}px)`,
          }}
        >
          {unitText}
        </div>
      </div>
    </AbsoluteFill>
  );
};
