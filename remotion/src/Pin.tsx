import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FlashFrames, KineticText } from "./Kinetic";
import { SCRIM, fitFontSize } from "./style";

export type PinData = {
  id: string;
  beat: number;
  timeline_in: number;
  timeline_out: number;
  template: string;
  text: string;
  subtext: string;
  background: string;
  note?: string;
};

/**
 * Pin — one kinetic text event rendered on transparency (ProRes 4444).
 * Layout per template, from edit-spec/text-events.md:
 *  T1      hero number, lower-centre (~25% of frame height with T8;
 *          TE-22, the verdict echo, is deliberately small)
 *  T1+T8   hero + flash/strobe treatment, then a full hold
 *  T2      phrase card, centred lower-centre; beat 56's T2s are the
 *          small "precision chips" of the old G13 ruling
 *  T3      chapter card, centred, over a ~40% dark scrim
 *  T4      name card, lower-left
 *  T5      term card, lower-third, left-aligned
 *  T6      honest-beat marker, centred over scrim (replaces a chapter card)
 */
export const Pin: React.FC<{ pin: PinData }> = ({ pin }) => {
  const frame = useCurrentFrame();
  const { template, text, subtext } = pin;
  const isHero = template.includes("T8");
  const isChip = pin.beat === 56 && template === "T2";

  // Chapter / honest-marker scrim: fades in fast, out at the pin's tail.
  const scrim = template === "T3" || template === "T6";

  let body: React.ReactNode = null;

  if (template === "T4") {
    const small = pin.id === "TE-05";
    body = (
      <div style={{ position: "absolute", left: 110, bottom: 118 }}>
        <KineticText
          text={text}
          subtext={subtext}
          fontSize={small ? 62 : 84}
          subSize={small ? 28 : 31}
          align="left"
          maxWidth={1500}
        />
      </div>
    );
  } else if (template === "T5") {
    body = (
      <div style={{ position: "absolute", left: 120, top: "63%", right: 120 }}>
        <KineticText
          text={text}
          subtext={subtext}
          fontSize={fitFontSize(text, [76, 68, 60], 2, 1640)}
          subSize={33}
          align="left"
          maxWidth={1640}
        />
      </div>
    );
  } else if (template.startsWith("T1")) {
    body = (
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: isHero ? "36%" : "44%",
        }}
      >
        <KineticText
          text={text}
          subtext={subtext}
          fontSize={isHero ? 280 : 165}
          subSize={isHero ? 56 : 44}
          flash={isHero}
        />
      </div>
    );
  } else if (isChip) {
    body = (
      <div style={{ position: "absolute", left: 0, right: 0, top: "62%" }}>
        <KineticText
          text={text}
          subtext={subtext}
          fontSize={fitFontSize(text, [66, 60, 54], 2)}
          subSize={30}
        />
      </div>
    );
  } else {
    // T2 phrase card, T3 chapter card, T6 honest marker.
    body = (
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: template === "T2" ? "46%" : "40%",
        }}
      >
        <KineticText
          text={text}
          subtext={subtext}
          fontSize={fitFontSize(
            text,
            template === "T2" ? [102, 94, 86, 78] : [118, 108, 98],
            3
          )}
          subSize={40}
        />
      </div>
    );
  }

  return (
    <AbsoluteFill>
      {isHero && <FlashFrames />}
      {scrim && (
        <AbsoluteFill
          style={{
            background: SCRIM,
            opacity: interpolate(frame, [0, 6], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        />
      )}
      {body}
    </AbsoluteFill>
  );
};
