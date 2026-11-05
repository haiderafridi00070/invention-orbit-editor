# Invention Orbit — Cloud Editor (Proof of Concept)

This is a small test project. It proves one thing end-to-end, for free, in the cloud:

1. **Remotion** renders our signature **kinetic text** — big, extra-bold white text whose
   characters slide up and fade in one by one until the whole number has "assembled"
   (about 0.6 seconds), then hold — as a **transparent video** (you can see through
   everything except the text itself).
2. **FFmpeg** lays that transparent text video over a normal video clip and produces
   one finished MP4.

Nothing renders on your computer. Everything runs on GitHub's machines
(GitHub Actions) when you press one button: **Run workflow**.

---

## The files, one by one

| File | What it is |
|---|---|
| `package.json` | The project's shopping list. It names the tools to install (Remotion 4.0.541, React) and defines the `render` command. |
| `src/index.tsx` | The entry point. It registers one composition (one "scene") called **KineticNumber**: 1920×1080, 30 frames per second, 4 seconds long, with the default text `$ 10,800` / `PER TON`. |
| `src/KineticNumber.tsx` | The star of the show. This is the text animation itself: Montserrat ExtraBold, white, soft black drop shadow, each character springs in with a ~60 ms stagger, then the smaller unit line (`PER TON`) rises in underneath. The text is set through **props**, so the same component can later show any number or phrase without code changes. The background is fully transparent. |
| `assets/sample-bg.mp4` | A 6-second, 720p background clip (no sound) used only for this test, so the workflow has something to lay the text over. |
| `.github/workflows/render-test.yml` | The instruction sheet GitHub follows when you press "Run workflow" (explained step by step below). |
| `package-lock.json` | A receipt that pins the exact version of every installed package, so every run installs identical tools. (Created by `npm install`; safe to upload with everything else.) |

## How a run works

When you click **Run workflow** on the repo's **Actions** tab, GitHub starts a fresh
Ubuntu computer in the cloud and follows the workflow file:

1. **Check out the repository** — downloads these files onto the cloud computer.
2. **Set up Node.js 20** — installs the JavaScript runtime Remotion needs.
3. **Install system libraries (best effort)** — a few libraries the built-in
   headless browser needs. If this step grumbles, the run carries on anyway.
4. **Install the project packages** — `npm install` fetches Remotion and friends.
5. **Download the headless browser** — Remotion renders by filming web pages with a
   small built-in Chrome browser; this step downloads it.
6. **Render the overlay** — Remotion films the KineticNumber scene and saves it as
   `out/kinetic.mov`, a **ProRes 4444** video. ProRes 4444 keeps the transparency
   (the "alpha channel"), so the file is text floating on nothing. Two flags in
   that command are what protect the transparency — `--image-format=png` and
   `--pixel-format=yuva444p10le`. Leave them in: without them the text would
   come out on a solid black box instead of floating over the footage.
7. **Composite with FFmpeg** — FFmpeg shrinks the overlay to 720p, lays it over
   `assets/sample-bg.mp4`, keeps the first 4 seconds, and saves `final-test.mp4`.
8. **Upload the artifact** — `final-test.mp4` is attached to the run as a
   downloadable **artifact** named `final-test-video`. Open the finished run on the
   Actions tab and click the artifact to download the video.

## What you should see in the test video

Over the background clip, the text **$ 10,800** assembles character by character
in big bold white letters in the lower-centre of the frame, the smaller line
**PER TON** appears underneath, and both hold steady until the clip ends —
exactly the text style this channel is copying.

## Notes and next steps

- The text is data, not hard-coded pictures: changing `defaultProps` in
  `src/index.tsx` (or passing props at render time later) changes what the
  overlay says. This one component becomes the template for number cards,
  phrase cards and name cards in full videos.
- A public repo gets unlimited free GitHub Actions minutes on standard
  runners, which is why this repo is public.
- This is only a proof of concept: 4 seconds, one text event, one sample clip.
  The full editor will feed real clips, narration timings and many text
  events through the same two tools (Remotion for graphics, FFmpeg for assembly).
