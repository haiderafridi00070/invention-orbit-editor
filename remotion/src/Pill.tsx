import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { FONT_STACK } from "./style";

export type PillSegment = {
  /** Beat-relative start (seconds). */
  start: number;
  /** Segment duration (seconds). */
  dur: number;
  /** Credit text, consumed exactly as written in windows.json. */
  text: string;
};

export type PillBeatProps = {
  segments: PillSegment[];
};

/**
 * PillBeat — the credit pill track for one footage beat: channel name in
 * white bold on a semi-transparent black pill, top-left, changing per
 * source segment exactly as windows.json specifies.
 *
 * Segments whose credit_pill is empty or the literal "PENDING-DECISION"
 * (beats 26, 27, 33 segments from QmSzQeOsjwU and beat 55 from
 * fOdpxOWFApU — channel names the spec could not confirm) render NO
 * pill: no name is invented and no placeholder is burned into the
 * video. The segment timing is preserved, so if the parent resolves
 * those two names in data/windows.json and re-renders, the pills
 * appear in the right places with no other change.
 */
export const PillBeat: React.FC<PillBeatProps> = ({ segments }) => {
  const frame = useCurrentFrame();
  const t = frame / 30;

  const active = segments.find((s) => t >= s.start && t < s.start + s.dur);
  if (!active || !active.text || active.text === "PENDING-DECISION") {
    return null;
  }

  const localFrame = frame - Math.round(active.start * 30);
  const opacity = interpolate(localFrame, [0, 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 30,
        left: 36,
        opacity,
        background: "rgba(0,0,0,0.55)",
        borderRadius: 999,
        padding: "10px 24px",
        fontFamily: FONT_STACK,
        fontWeight: 800,
        fontSize: 30,
        letterSpacing: "0.02em",
        color: "#ffffff",
        whiteSpace: "nowrap",
      }}
    >
      {active.text}
    </div>
  );
};
