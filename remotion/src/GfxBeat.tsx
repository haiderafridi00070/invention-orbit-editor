import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FlashFrames, KineticText } from "./Kinetic";
import type { PinData } from "./Pin";
import { BG_DARK, BG_DARKEST, FPS, SCRIM, fitFontSize, wrapText } from "./style";

export type GfxBeatProps = {
  beat: number;
  /** Timeline start of this beat (seconds). */
  start: number;
  /** Retimed duration of this beat (seconds). */
  duration: number;
  /** All text-events.json pins whose beat is this beat. */
  pins: PinData[];
};

type Scene = {
  layout: "stack" | "slate" | "ladder";
  darkest?: boolean;
  stagger?: number;
  /** Pin ids whose on-screen hold extends to this absolute timeline second. */
  holds?: Record<string, number>;
  /** Pin ids that receive a strike-through (beat 36 negations). */
  strikes?: string[];
  /** Per-pin font-size overrides. */
  sizes?: Record<string, number>;
};

/**
 * Per-beat scenes, from edit-spec/graphics-beats.md. Beats not listed use
 * the plain centre-stack: the beat's pins appear in fixed vertical slots
 * (so nothing jumps when a pin joins or leaves), in timeline order.
 */
const SCENES: Record<number, Scene> = {
  8: { layout: "stack", holds: { "TE-23": 105.6 } }, // date stays while magnitude + place land
  21: { layout: "stack", sizes: { "TE-35": 88, "TE-36": 72, "TE-37": 124 } },
  36: {
    layout: "stack",
    holds: { "TE-40": 562.0 }, // the ₱10 hero stays while TE-41 stacks beneath it
    strikes: ["TE-38", "TE-39"],
  },
  39: { layout: "slate", sizes: { "TE-44": 118 } },
  58: { layout: "ladder" },
  62: { layout: "stack", darkest: true, stagger: 4 }, // slowest assembly, darkest bg
};

const GAP = 36;

function pinFontSize(pin: PinData, scene: Scene): number {
  if (scene.sizes?.[pin.id]) return scene.sizes[pin.id];
  // T8 heroes keep their ~25%-of-frame height even inside a graphics
  // beat (TE-40, the ₱10 reveal, lives in beat 36's dark sequence).
  if (pin.template.includes("T8")) return 250;
  if (pin.template.startsWith("T1")) return 185;
  return fitFontSize(pin.text, [96, 88, 80, 74], 2);
}

function blockHeight(pin: PinData, fontSize: number): number {
  const lines = wrapText(pin.text, fontSize).length;
  const sub = pin.subtext ? fontSize * 0.22 + 38 * 1.15 : 0;
  return lines * fontSize * 1.08 + sub;
}

/** Beat 21: faint blueprint building cross-section + the hairline crack. */
const Blueprint: React.FC<{ relCrackFrame: number }> = ({ relCrackFrame }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const drift = Math.sin((frame / durationInFrames) * Math.PI * 2) * 6;
  const crack = interpolate(
    frame,
    [relCrackFrame, relCrackFrame + 48],
    [100, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const stroke = "rgba(150,180,230,0.20)";
  const faint = "rgba(150,180,230,0.12)";
  return (
    <svg
      width={1920}
      height={1080}
      style={{ position: "absolute", left: 0, top: 0 }}
    >
      <g transform={`translate(${drift},0)`}>
        <rect x={1080} y={180} width={620} height={720} fill="none" stroke={stroke} strokeWidth={2} />
        {[360, 540, 720].map((y) => (
          <line key={y} x1={1080} y1={y} x2={1700} y2={y} stroke={faint} strokeWidth={2} />
        ))}
        {[1140, 1300, 1460, 1620].map((x) => (
          <line key={x} x1={x} y1={200} x2={x} y2={880} stroke={faint} strokeWidth={2} strokeDasharray="14 10" />
        ))}
        <line x1={1080} y1={240} x2={1700} y2={240} stroke={faint} strokeWidth={2} />
        <line x1={1080} y1={840} x2={1700} y2={840} stroke={faint} strokeWidth={2} />
        <polyline
          points="1390,190 1418,300 1398,420 1432,540 1412,660 1440,790"
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={3}
          pathLength={100}
          strokeDasharray={100}
          strokeDashoffset={crack}
        />
      </g>
    </svg>
  );
};

/** Beat 62 flourish: a thin resistance-graph line under the final pin. */
const GraphLine: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const drawn = interpolate(
    frame,
    [startFrame, durationInFrames - 6],
    [100, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const pts: string[] = [];
  let y = 884;
  for (let x = 210; x <= 1710; x += 60) {
    pts.push(`${x},${y}`);
    y += ((x * 7919) % 13) - 6;
    pts.push(`${x + 60},${y}`);
  }
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth={2.5}
        pathLength={100}
        strokeDasharray={100}
        strokeDashoffset={drawn}
      />
    </svg>
  );
};

/** Minimal code-drawn line icons for beat 58's three steps. */
const StepIcon: React.FC<{ kind: number }> = ({ kind }) => {
  const s = "rgba(255,255,255,0.75)";
  return (
    <svg width={58} height={58} viewBox="0 0 58 58">
      {kind === 0 && (
        <g stroke={s} strokeWidth={3} fill="none">
          <rect x={10} y={6} width={38} height={46} rx={4} />
          <path d="M19 20 l5 5 l9 -10" />
          <line x1={19} y1={36} x2={40} y2={36} />
          <line x1={19} y1={44} x2={34} y2={44} />
        </g>
      )}
      {kind === 1 && (
        <g stroke={s} strokeWidth={3} fill="none">
          <rect x={8} y={8} width={42} height={42} rx={3} />
          <rect x={22} y={22} width={14} height={14} />
          <path d="M29 8 v14 M29 36 v14 M8 29 h14 M36 29 h14" />
        </g>
      )}
      {kind === 2 && (
        <g stroke={s} strokeWidth={3} fill="none">
          <path d="M12 52 V14 l17 -8 v46 M29 20 l17 6 v26" />
          <path d="M19 24 h4 M19 33 h4 M19 42 h4 M36 34 h4 M36 43 h4" />
        </g>
      )}
    </svg>
  );
};

/**
 * GfxBeat — one graphics beat (or text-led beat 34) as an OPAQUE
 * full-screen clip: dark background with the beat's full pin sequence
 * rendered inside, per graphics-beats.md. No still images anywhere —
 * every background element is drawn in code and moves.
 */
export const GfxBeat: React.FC<GfxBeatProps> = ({ beat, start, duration, pins }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scene: Scene = SCENES[beat] ?? { layout: "stack" };
  const stagger = scene.stagger ?? 2;

  const rel = pins.map((p) => {
    const effOut = scene.holds?.[p.id] ?? p.timeline_out;
    return {
      pin: p,
      inF: Math.round((p.timeline_in - start) * FPS),
      outF: Math.round((effOut - start) * FPS),
    };
  });
  const chapterPins = rel.filter((r) => r.pin.template === "T3" || r.pin.template === "T6");
  const bodyPins = rel.filter((r) => !(r.pin.template === "T3" || r.pin.template === "T6"));

  const active = (inF: number, outF: number) => frame >= inF && frame < outF;

  // ----- slot geometry for stack & slate -----
  const sizes = bodyPins.map((r) => pinFontSize(r.pin, scene));
  const heights = bodyPins.map((r, i) => blockHeight(r.pin, sizes[i]));
  const totalH = heights.reduce((a, b) => a + b, 0) + GAP * Math.max(0, bodyPins.length - 1);
  let cursor = (1080 - totalH) / 2;
  const slotTops = heights.map((h) => {
    const top = cursor;
    cursor += h + GAP;
    return top;
  });

  return (
    <AbsoluteFill style={{ background: scene.darkest ? BG_DARKEST : BG_DARK }}>
      {beat === 21 && <Blueprint relCrackFrame={Math.round((322 - start) * FPS)} />}
      {beat === 62 && (
        <GraphLine
          startFrame={Math.round((pins[pins.length - 1].timeline_in - start) * FPS)}
        />
      )}

      {scene.layout === "ladder" ? (
        // Beat 58: three steps build down the left third; a finished step
        // dims to ~40% as the next lands; all return to full brightness
        // together in the final half-second.
        bodyPins.map((r, i) => {
          if (!active(r.inF, durationInFrames)) return null;
          const next = bodyPins[i + 1];
          const dimmed =
            next && frame >= next.inF && frame < durationInFrames - 15;
          return (
            <div
              key={r.pin.id}
              style={{
                position: "absolute",
                left: 130,
                top: 290 + i * 205,
                display: "flex",
                alignItems: "flex-start",
                gap: 26,
                opacity: dimmed ? 0.4 : 1,
              }}
            >
              <div style={{ marginTop: 6 }}>
                <StepIcon kind={i} />
              </div>
              {/* Render relative to the pin's own start: nested Sequence
                  semantics via frame offset is handled by Remotion's
                  <Sequence> — here we cheat with a keyed subtree whose
                  internal useCurrentFrame still counts from the beat
                  start, so pass startDelay instead. */}
              <KineticText
                text={r.pin.text}
                subtext={r.pin.subtext}
                fontSize={54}
                subSize={29}
                align="left"
                stagger={stagger}
                startDelay={r.inF}
                maxWidth={1150}
              />
            </div>
          );
        })
      ) : scene.layout === "slate" ? (
        // Beat 39: results slate, left-aligned, pins accumulate.
        bodyPins.map((r, i) =>
          active(r.inF, r.outF) ? (
            <div key={r.pin.id} style={{ position: "absolute", left: 150, top: slotTops[i] }}>
              <KineticText
                text={r.pin.text}
                subtext={r.pin.subtext}
                fontSize={sizes[i]}
                subSize={38}
                align="left"
                stagger={stagger}
                startDelay={r.inF}
                flash={r.pin.template.includes("T8")}
                maxWidth={1620}
              />
            </div>
          ) : null
        )
      ) : (
        // Centre stack (beats 8, 9, 10, 13, 21, 34, 36, 41, 43, 52, 62).
        bodyPins.map((r, i) =>
          active(r.inF, r.outF) ? (
            <div
              key={r.pin.id}
              style={{ position: "absolute", left: 0, right: 0, top: slotTops[i] }}
            >
              <KineticText
                text={r.pin.text}
                subtext={r.pin.subtext}
                fontSize={sizes[i]}
                subSize={38}
                stagger={stagger}
                startDelay={r.inF}
                flash={r.pin.template.includes("T8")}
                strikeAtFrame={
                  scene.strikes?.includes(r.pin.id)
                    ? r.inF + Math.round((r.outF - r.inF) * 0.55)
                    : null
                }
              />
            </div>
          ) : null
        )
      )}

      {/* Chapter cards (T3) / honest marker (T6) overlay the scene. */}
      {chapterPins.map((r) =>
        active(r.inF, r.outF) ? (
          <AbsoluteFill key={r.pin.id}>
            <AbsoluteFill style={{ background: SCRIM }} />
            {r.pin.template.includes("T8") && <FlashFrames />}
            <div style={{ position: "absolute", left: 0, right: 0, top: "40%" }}>
              <KineticText
                text={r.pin.text}
                subtext={r.pin.subtext}
                fontSize={118}
                subSize={40}
                stagger={stagger}
                startDelay={r.inF}
              />
            </div>
          </AbsoluteFill>
        ) : null
      )}
    </AbsoluteFill>
  );
};
