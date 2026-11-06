# Invention Orbit — Video 2 (Sentinel): Cloud Production Package

Everything needed to render Video 2's kinetic text layer in the cloud and
assemble the finished video with FFmpeg — in the "Quietly Obsolete"
editing style the channel adopted for this video (kinetic per-character
text assembly over literal footage; no burned-in captions; no count-ups).

One button runs it all: **Actions → "Video 2 — Render and Assemble" →
Run workflow**. It produces one artifact, **`video2-final`**, containing
`out/final.mp4` (1920×1080 @ 30fps, H.264 + AAC, 966.048s).

---

## Repo layout

```
.github/workflows/video2-render.yml   the one-button workflow
assemble.sh                           FFmpeg assembly (steps 1-3 below)
scripts/plan.py                       turns data/ into FFmpeg plans;
                                      refuses to run if an asset is missing
data/
  beats_retimed.json                  the fixed 62-beat timeline (966.048s)
  text-events.json                    the 61 kinetic text pins (source of truth)
  windows.json                        per-beat segments + credit-pill texts
clips/beat-NN.mp4                     44 pre-cut footage beats — PARENT ADDS
assets/
  diagram-D1.mp4                      mechanism diagram, beats 28-32 — PARENT ADDS
  narration.mp3                       966.048s Casper narration — PARENT ADDS
  music_loop.wav                      Video 1's gentle music bed — PARENT ADDS
remotion/                             the Remotion project (see below)
rendered/                             created by the render step (git-ignored)
  pins/pin-<TE-id>.mov                61 transparent ProRes 4444 pin clips
  gfx/gfx-beat-<NN>.mp4               13 opaque graphics/text-led beats
  pills/pill-beat-<NN>.mov            44 transparent credit-pill tracks
  logo-bug.png                        the constant channel bug (176x176)
out/final.mp4                         the finished video (git-ignored)
```

## Assets the parent must add before pushing

| Path | What | Notes |
|---|---|---|
| `clips/beat-01.mp4` … (44 files) | Pre-cut footage beats: 1–7, 11, 12, 14–20, 22–27, 33, 35, 37, 38, 40, 42, 44–51, 53–57, 59–61 | 1920×1080 @ 30fps, silent, each exactly its beat's retimed duration, cut per `data/windows.json` |
| `assets/diagram-D1.mp4` | The existing D1 mechanism diagram | Covers timeline 419.869–500.976s (beats 28–32); assemble.sh cuts each beat's span out of it |
| `assets/narration.mp3` | The joined narration | 966.048s; timings are fixed and never retimed |
| `assets/music_loop.wav` | Video 1's music bed | Looped under the narration at low static gain with head/tail fades |

The three `data/*.json` files are already in this package (exact copies
of the edit-spec files). The 26 full source videos and the old G1–G13
renders are **not** part of the build — all 13 old graphics were
replaced by text events in the spec; only D1 is reused.

## How the pieces run

1. **Workflow** (`.github/workflows/video2-render.yml`): checkout →
   Node 20 → headless-browser libraries → FFmpeg (not preinstalled on
   the runner image; installed with apt-get, as the POC proved
   necessary) → `npm install` → browser ensure → fonts → render →
   assemble → upload artifact `video2-final`.
2. **Fonts** (`remotion/scripts/prepare-fonts.mjs`): copies the
   self-hosted Montserrat ExtraBold woff2 files out of the
   `@fontsource/montserrat` package into `remotion/public/fonts/`.
   No Google Fonts CDN is used anywhere (its fetch fails in the local
   VM's headless browser; the self-hosted files work everywhere).
3. **Render** (`remotion/scripts/render-all.mjs`): drives the Remotion
   CLI once per item, reading the item list from `data/` so it can
   never drift from the spec. Alpha renders use the POC-proven flags
   `--codec=prores --prores-profile=4444 --image-format=png
   --pixel-format=yuva444p10le` — without the last two, transparency
   is silently lost. Finished items are skipped, so a re-run resumes.
   `--only TE-40` renders a subset; `--force` re-renders.
4. **Assembly** (`assemble.sh` + `scripts/plan.py`):
   - *Step 1* — every beat is normalised to exactly its retimed frame
     count (footage from `clips/`, beats 28–32 cut from the diagram,
     graphics beats from `rendered/gfx/`).
   - *Step 2* — the 62 beats are concatenated; the base must measure
     966.048s ± 0.5s or the build stops.
   - *Step 3* — one FFmpeg pass overlays the 22 footage pins and the
     44 credit-pill tracks at their timeline positions, lays the logo
     bug over the whole video **except beat 49** (whose source already
     carries its own top-right title bug), then mixes narration at
     full level with the music loop ducked low underneath and
     loudnorms the mix to about −14 LUFS.

## The text layer (remotion/src/)

Compositions are registered from the data files — 61 `Pin-*`, 13
`GfxBeat-*`, 44 `PillBeat-*`, plus the `LogoBug` still (119 items).

- `Kinetic.tsx` — the signature component: characters spring in one by
  one (~67ms stagger), then hold; the sub-line rises in after. Heroes
  (T1+T8: TE-15, TE-40) get a two-frame white flash + strobe, then a
  full hold at 280px (~25% of frame height). White Montserrat
  ExtraBold, soft shadow, no background box — ever.
- `Pin.tsx` — one pin on transparency, laid out by template: T1 hero
  lower-centre, T2 phrase card (beat 56's are the small precision
  chips), T3 chapter card over a ~40% scrim, T4 name card lower-left,
  T5 term card lower-third, T6 honest-beat marker.
- `GfxBeat.tsx` — the 12 graphics beats + text-led beat 34 as opaque
  full-screen clips, with their pins rendered inside in fixed slots.
  Per-beat scenes from `graphics-beats.md`: beat 8's date stays while
  magnitude and place land; beat 21 has the code-drawn blueprint
  section with the hairline crack drawing itself at ~322s; beat 36's
  two negations are struck through and the ₱10 hero holds while the
  ≈$0.15 line stacks beneath it; beat 39 is a left-aligned results
  slate; beat 58's three steps build as a ladder (finished steps dim
  to 40%, all return to full in the final half-second); beat 62 is
  the darkest background, the slowest assembly, with the thin
  resistance-graph flourish under the final pin.
- `Pill.tsx` — credit pills: white bold channel name on a
  semi-transparent black pill, top-left, changing per segment exactly
  as `windows.json` specifies.
- `LogoBug.tsx` — circular INVENTION ORBIT badge.

## Assumptions and flags (read before the run)

1. **PENDING-DECISION credit pills render as NO pill.** Two sources'
   channel names were never confirmed from their footage, and
   `windows.json` carries the literal text `PENDING-DECISION` for
   them: every QmSzQeOsjwU segment (beats 26, 27, 33) and every
   fOdpxOWFApU segment (beat 55). No name was invented and no
   placeholder is burned into the video — those segments simply show
   no pill. To fix: put the real names in `data/windows.json` and
   re-run; only the affected pill tracks change.
2. **The 39 "dark" pins are rendered twice by design.** Each exists
   as a transparent pin clip (the full 61-pin deliverable) *and* is
   rendered inside its opaque graphics beat. Assembly uses only the
   22 footage pins as overlays, so nothing is ever double-rendered
   on screen.
3. **Montserrat has no ≈ glyph** (verified in every subset with
   fontTools). TE-41 and TE-50's subtext keep the spec's exact "≈"
   character; it falls back to the browser's default sans for that
   single character — visually near-identical at subtext size.
   The ₱ sign *is* covered, via the latin-ext face (U+20B1).
4. **Pill segment timing** is the cumulative sum of segment durations
   in `windows.json` order (the file lists segments in timeline
   order, and each beat's sum matches its retimed duration per the
   spec's own validation).
5. **Music ducking is a static low gain** (0.10) with fades, matching
   Video 1's softer ducking — no sidechain, per the build brief.
6. **Beat 49's logo-bug drop** is implemented (the spec's sanctioned
   option), via the overlay's `enable` window in `plan.py`.
7. Renders are ProRes 4444 and **large** (~37 MB for a 4s hero pin).
   `rendered/` is git-ignored and must not be committed; the workflow
   regenerates it on the runner's disk.

## Local validation performed

- `npm install` (Remotion 4.0.541) + `npx remotion compositions`:
  all 118 render compositions + the LogoBug still list cleanly,
  with durations matching the spec (both hero pins exactly 4.00s).
- Rendered and frame-checked locally: the ₱10 hero pin (real ₱ glyph
  in Montserrat, alpha `yuva444p12le`, exactly 4.000s — kept as
  `proof-pin.mov` in this folder, git-ignored), graphics beat 36
  (strike-throughs, hero stack), credit pill for beat 1, logo bug.
- Assembly smoke test with dummy media (stand-in clips, the real
  narration, and the four real sample renders): `assemble.sh` ran
  end-to-end — 62 beats normalised, base measured 965.932s (target
  966.048s, inside the ±0.5s gate), final pass with 70 inputs / 67
  overlays produced a 966.102s H.264 + AAC file at −14.57 LUFS
  integrated. Frames verified: beat 1 carries the "Aldrei Ong" pill
  and the logo bug; a frame inside beat 49 correctly shows NO bug.
  (One post-test tweak: `-ac 2` was added to the final encode so the
  AAC comes out stereo even though the narration is mono — it only
  affects the output channel layout.)
