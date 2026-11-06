import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FONT_STACK, SOFT_SHADOW, wrapText } from "./style";

export type KineticTextProps = {
  text: string;
  subtext?: string;
  fontSize: number;
  subSize?: number;
  /** Frames between successive characters landing (style: ~2 = 67ms). */
  stagger?: number;
  /** Align lines left instead of centred. */
  align?: "center" | "left";
  /** Local frame at which a strike-through line draws across the text. */
  strikeAtFrame?: number | null;
  /** T8 hero treatment: white flash frames + strobe during assembly. */
  flash?: boolean;
  /** Local frames to wait before the first character starts. */
  startDelay?: number;
  maxWidth?: number;
};

const CHAR_SPRING = { damping: 100, stiffness: 260, mass: 0.6 };

/**
 * KineticText — the style's signature: text that ASSEMBLES character by
 * character (each character springs up from below while fading in,
 * staggered), then holds. Never a count-up. The sub-line rises in once
 * the main text has landed. White Montserrat ExtraBold, soft shadow,
 * no background box.
 */
export const KineticText: React.FC<KineticTextProps> = ({
  text,
  subtext = "",
  fontSize,
  subSize,
  stagger = 2,
  align = "center",
  strikeAtFrame = null,
  flash = false,
  startDelay = 0,
  maxWidth = 1560,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lines = wrapText(text, fontSize, maxWidth);
  const totalChars = text.replace(/\s/g, "").length;
  const sub = subSize ?? Math.round(fontSize * 0.34);

  // T8 strobe: for the first ~12 frames after the flash, the text
  // flickers hard (full / quarter opacity on alternate 2-frame blocks).
  const strobe =
    flash && frame >= 2 && frame < 14
      ? Math.floor(frame / 2) % 2 === 0
        ? 1
        : 0.22
      : 1;

  // Sub-line: starts once the last character has begun landing.
  const subDelay = startDelay + totalChars * stagger + 10;
  const subSpring = spring({
    frame: frame - subDelay,
    fps,
    config: { damping: 200 },
  });
  const subOpacity = interpolate(frame - subDelay, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subY = interpolate(subSpring, [0, 1], [26, 0]);

  // Strike-through (TE-38 / TE-39 negations in beat 36).
  const strikeProgress =
    strikeAtFrame === null
      ? 0
      : spring({
          frame: frame - strikeAtFrame,
          fps,
          config: { damping: 200, stiffness: 200 },
        });

  let charIndex = 0;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: align === "center" ? "center" : "flex-start",
        opacity: strobe,
      }}
    >
      <div style={{ position: "relative" }}>
        {lines.map((line, li) => (
          <div
            key={li}
            style={{
              display: "flex",
              justifyContent: align === "center" ? "center" : "flex-start",
              fontFamily: FONT_STACK,
              fontWeight: 800,
              fontSize,
              lineHeight: 1.08,
              letterSpacing: "0.01em",
              color: "#ffffff",
              textShadow: SOFT_SHADOW,
              whiteSpace: "nowrap",
            }}
          >
            {line.split("").map((ch, ci) => {
              if (ch === " ") {
                return (
                  <span key={ci} style={{ width: "0.32em" }}>
                    {" "}
                  </span>
                );
              }
              const idx = charIndex++;
              const delay = startDelay + idx * stagger;
              const progress = spring({
                frame: frame - delay,
                fps,
                config: CHAR_SPRING,
              });
              const opacity = interpolate(frame - delay, [0, 7], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const y = interpolate(progress, [0, 1], [38, 0]);
              return (
                <span
                  key={ci}
                  style={{
                    display: "inline-block",
                    opacity,
                    transform: `translateY(${y}px)`,
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
        ))}
        {strikeAtFrame !== null && (
          <div
            style={{
              position: "absolute",
              left: "-2%",
              right: "-2%",
              top: "52%",
              height: Math.max(6, Math.round(fontSize * 0.075)),
              background: "#ffffff",
              borderRadius: 999,
              boxShadow: "0px 3px 10px rgba(0,0,0,0.6)",
              transform: `scaleX(${strikeProgress}) rotate(-1.5deg)`,
              transformOrigin: "left center",
            }}
          />
        )}
      </div>
      {subtext ? (
        <div
          style={{
            marginTop: Math.round(fontSize * 0.22),
            fontFamily: FONT_STACK,
            fontWeight: 800,
            fontSize: sub,
            lineHeight: 1.15,
            letterSpacing: "0.04em",
            color: "#ffffff",
            textShadow: SOFT_SHADOW,
            textAlign: align,
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
            maxWidth,
          }}
        >
          {subtext}
        </div>
      ) : null}
    </div>
  );
};

/** Two-frame white flash that opens a T8 hero pin. */
export const FlashFrames: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame > 1) return null;
  return (
    <AbsoluteFill style={{ background: "#ffffff", opacity: frame === 0 ? 0.95 : 0.8 }} />
  );
};
