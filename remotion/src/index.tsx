import React from "react";
import { Composition, Still, registerRoot } from "remotion";
import beatsData from "../../data/beats_retimed.json";
import textEventsData from "../../data/text-events.json";
import windowsData from "../../data/windows.json";
import { GfxBeat } from "./GfxBeat";
import { LogoBug } from "./LogoBug";
import { PillBeat, type PillSegment } from "./Pill";
import { Pin, type PinData } from "./Pin";
import { FPS, HEIGHT, WIDTH, framesOf } from "./style";

/**
 * Entry point. Every composition is registered from the spec data files
 * in ../../data/, so the render list can never drift from the edit spec:
 *
 *  - Pin-<TE-id>     61 compositions — one per kinetic text pin,
 *                    transparent, exactly the pin's duration.
 *  - GfxBeat-<NN>    13 compositions — the 12 graphics beats + text-led
 *                    beat 34, opaque full-screen, exactly the beat's
 *                    retimed duration, pins rendered inside.
 *  - PillBeat-<NN>   44 compositions — one per footage beat, the credit
 *                    pill track for the beat's full duration.
 *  - LogoBug         a Still — the constant top-right channel bug.
 */

type BeatRow = {
  beat: number;
  start: number;
  end: number;
  dur: number;
  type: string;
};
type WindowRow = {
  beat: number;
  type: string;
  timeline_in: number;
  duration: number;
  segments?: { in: number; out: number; dur: number; credit_pill: string }[];
};

const beats = beatsData as unknown as BeatRow[];
const pins = textEventsData as unknown as PinData[];
const windows = windowsData as unknown as WindowRow[];

const beatById = new Map(beats.map((b) => [b.beat, b]));
const pad = (n: number) => String(n).padStart(2, "0");

const GFX_BEATS = [1, 7, 13, 22, 32, 35, 36, 38, 39, 41, 43, 46, 48, 50];

const RemotionRoot: React.FC = () => {
  return (
    <>
      {pins.map((pin) => (
        <Composition
          key={pin.id}
          id={`Pin-${pin.id}`}
          component={Pin}
          durationInFrames={framesOf(pin.timeline_out - pin.timeline_in)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ pin }}
        />
      ))}

      {GFX_BEATS.map((n) => {
        const beat = beatById.get(n);
        if (!beat) return null;
        const beatPins = pins.filter((p) => p.beat === n);
        return (
          <Composition
            key={n}
            id={`GfxBeat-${pad(n)}`}
            component={GfxBeat}
            durationInFrames={framesOf(beat.dur)}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
            defaultProps={{
              beat: n,
              start: beat.start,
              duration: beat.dur,
              pins: beatPins,
            }}
          />
        );
      })}

      {windows
        .filter((w) => w.type === "footage")
        .map((w) => {
          let cursor = 0;
          const segments: PillSegment[] = (w.segments ?? []).map((s) => {
            const seg = { start: cursor, dur: s.dur, text: s.credit_pill };
            cursor += s.dur;
            return seg;
          });
          return (
            <Composition
              key={w.beat}
              id={`PillBeat-${pad(w.beat)}`}
              component={PillBeat}
              durationInFrames={framesOf(w.duration)}
              fps={FPS}
              width={WIDTH}
              height={HEIGHT}
              defaultProps={{ segments }}
            />
          );
        })}

      <Still id="LogoBug" component={LogoBug} width={176} height={176} />
    </>
  );
};

registerRoot(RemotionRoot);
