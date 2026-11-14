#!/usr/bin/env python3
"""
plan.py — turns the edit-spec data files (data/) into the concrete
FFmpeg plans that assemble.sh executes:

  work/segments.tsv   one row per beat: beat, kind, frames, source, ss
                      (kind: footage | diagram | gfx; ss only for diagram)
  work/inputs.txt     overlay/audio inputs for the final pass, in order:
                      "file <path>" lines, one "loop <path>" for the bug
  work/filter.txt     the -filter_complex_script for the final pass
  work/indices.env    shell variables (TOTAL_S, BEAT49_START, ...)

It also verifies that every asset the build needs exists, and exits
non-zero listing what's missing — a cloud run must fail loudly here
rather than assemble a partial video.

Overlay rules (from the spec):
  - Only pins with background == "footage" are overlaid (the 39 dark
    pins live inside the opaque graphics-beat renders).
  - Every footage beat gets its credit-pill track at the beat's start.
  - The logo bug runs the whole video EXCEPT beat 49, whose source
    already carries its own top-right title bug (text-events.md).
  - Audio: narration at full level; the music bed looped at low static
    gain with head/tail fades (Video 1's softer ducking); the mix is
    loudnorm'd to about -14 LUFS.
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
WORK = os.path.join(ROOT, "work")
FPS = 30
TOTAL_S = 824.40

def load(name):
    with open(os.path.join(DATA, name), encoding="utf-8") as f:
        return json.load(f)

def main():
    beats = load("beats_retimed.json")
    pins = load("text-events.json")
    windows = load("windows.json")
    os.makedirs(WORK, exist_ok=True)

    beat_by_id = {b["beat"]: b for b in beats}
    type_by_id = {b["beat"]: b["type"] for b in beats}  # V3: type lives in beats_retimed.json
    d1_start = beat_by_id[24]["start"]  # diagram asset covers beat 24 only

    missing = []

    # ---- segments.tsv -------------------------------------------------
    rows = []
    for b in beats:
        n = b["beat"]
        kind = type_by_id[n]
        frames = round(b["dur"] * FPS)
        if kind == "footage":
            src, ss = f"clips/beat-{n:02d}.mp4", "-"
        elif kind == "diagram":
            src, ss = "assets/diagram-D1.mp4", f"{b['start'] - d1_start:.3f}"
        else:  # graphics | text-led
            src, ss = f"rendered/gfx/gfx-beat-{n:02d}.mp4", "-"
            kind = "gfx"
        if not os.path.exists(os.path.join(ROOT, src)):
            missing.append(src)
        rows.append((n, kind, frames, src, ss))
    with open(os.path.join(WORK, "segments.tsv"), "w") as f:
        for r in rows:
            f.write("\t".join(str(x) for x in r) + "\n")

    # ---- overlay inputs + filter -------------------------------------
    inputs = [("file", "work/base.mp4")]
    chains = []
    prev = "0:v"
    step = 0

    def add_overlay(path, offset, extra=""):
        nonlocal prev, step
        inputs.append(("file", path))
        idx = len(inputs) - 1
        step += 1
        lbl = f"p{step}"
        out = f"v{step}"
        chains.append(f"[{idx}:v]setpts=PTS+{offset:.3f}/TB[{lbl}]")
        chains.append(f"[{prev}][{lbl}]overlay=0:0:format=auto:eof_action=pass{extra}[{out}]")
        prev = out

    for p in pins:
        if p["background"] != "footage":
            continue
        path = f"rendered/pins/pin-{p['id']}.mov"
        if not os.path.exists(os.path.join(ROOT, path)):
            missing.append(path)
        add_overlay(path, p["timeline_in"])

    for w in windows:
        if w["type"] != "footage":
            continue
        path = f"rendered/pills/pill-beat-{w['beat']:02d}.mov"
        if not os.path.exists(os.path.join(ROOT, path)):
            missing.append(path)
        add_overlay(path, w["timeline_in"])

    # Logo bug: looped still, runs the whole video (no Video 3 source
    # carries its own top-right bug, so there is no exclusion window).
    bug_path = "rendered/logo-bug.png"
    if not os.path.exists(os.path.join(ROOT, bug_path)):
        missing.append(bug_path)
    inputs.append(("loop", bug_path))
    bug_idx = len(inputs) - 1
    step += 1
    chains.append(f"[{bug_idx}:v]fps=30[bug]")
    chains.append(
        f"[{prev}][bug]overlay=x=W-w-36:y=36:format=auto:eof_action=pass[vout]"
    )

    # Audio: narration + looped music bed.
    for a in ("assets/narration.mp3", "assets/music_loop.wav"):
        if not os.path.exists(os.path.join(ROOT, a)):
            missing.append(a)
    inputs.append(("file", "assets/narration.mp3"))
    narr_idx = len(inputs) - 1
    inputs.append(("file", "assets/music_loop.wav"))
    mus_idx = len(inputs) - 1

    fade_out_start = TOTAL_S - 6.0
    chains.append(f"[{narr_idx}:a]aresample=48000[narr]")
    chains.append(
        f"[{mus_idx}:a]aloop=loop=-1:size=2147483647,atrim=0:{TOTAL_S:.3f},"
        f"aresample=48000,volume=0.10,"
        f"afade=t=in:st=0:d=2.5,afade=t=out:st={fade_out_start:.3f}:d=6[musb]"
    )
    chains.append(
        "[narr][musb]amix=inputs=2:duration=first:dropout_transition=0,"
        "loudnorm=I=-14:TP=-1.5:LRA=11[aout]"
    )

    with open(os.path.join(WORK, "inputs.txt"), "w") as f:
        for kind, path in inputs:
            f.write(f"{kind}\t{path}\n")
    with open(os.path.join(WORK, "filter.txt"), "w") as f:
        f.write(";\n".join(chains) + "\n")
    with open(os.path.join(WORK, "indices.env"), "w") as f:
        f.write(f"TOTAL_S={TOTAL_S}\n")
        f.write(f"OVERLAY_INPUTS={len(inputs)}\n")

    if missing:
        print("plan.py: MISSING ASSETS:", file=sys.stderr)
        for m in sorted(set(missing)):
            print(f"  - {m}", file=sys.stderr)
        sys.exit(1)

    total_frames = sum(r[2] for r in rows)
    print(
        f"plan.py: {len(rows)} beats, {total_frames} frames "
        f"({total_frames / FPS:.3f}s), {step} video overlays, "
        f"{len(inputs)} ffmpeg inputs."
    )

if __name__ == "__main__":
    main()
