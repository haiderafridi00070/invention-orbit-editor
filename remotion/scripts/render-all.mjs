/**
 * Renders the complete Video 2 text layer with the Remotion CLI:
 *
 *   rendered/pins/pin-<TE-id>.mov    61 transparent ProRes 4444 pin clips
 *   rendered/gfx/gfx-beat-<NN>.mp4   13 opaque graphics/text-led beats
 *   rendered/pills/pill-beat-<NN>.mov 44 transparent credit-pill tracks
 *   rendered/logo-bug.png            the constant channel bug (a Still)
 *
 * The alpha renders use the exact flags proven by the cloud POC:
 * --codec=prores --prores-profile=4444 --image-format=png
 * --pixel-format=yuva444p10le. Without the last two, transparency is
 * silently lost and the overlays come out on solid black.
 *
 * Usage:
 *   node scripts/render-all.mjs [--only TE-40] [--force]
 *
 * Existing non-empty outputs are skipped, so a failed run can resume.
 * Exit code is non-zero if any item failed.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const projectDir = join(here, "..");
const repoRoot = join(projectDir, "..");
const dataDir = join(repoRoot, "data");
const renderedDir = join(repoRoot, "rendered");

const args = process.argv.slice(2);
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const force = args.includes("--force");

const readJson = (name) =>
  JSON.parse(readFileSync(join(dataDir, name), "utf8"));
const pins = readJson("text-events.json");
const beats = readJson("beats_retimed.json");
const windows = readJson("windows.json");

const pad = (n) => String(n).padStart(2, "0");
const GFX_BEATS = [1, 7, 13, 22, 32, 35, 36, 38, 39, 41, 43, 46, 48, 50];
const ALPHA_FLAGS = [
  "--codec=prores",
  "--prores-profile=4444",
  "--image-format=png",
  "--pixel-format=yuva444p10le",
];

const items = [];
for (const p of pins) {
  items.push({
    kind: "pin",
    comp: `Pin-${p.id}`,
    out: join(renderedDir, "pins", `pin-${p.id}.mov`),
    flags: ALPHA_FLAGS,
  });
}
for (const n of GFX_BEATS) {
  items.push({
    kind: "gfx",
    comp: `GfxBeat-${pad(n)}`,
    out: join(renderedDir, "gfx", `gfx-beat-${pad(n)}.mp4`),
    flags: ["--codec=h264", "--crf=16"],
  });
}
for (const w of windows.filter((x) => x.type === "footage")) {
  items.push({
    kind: "pill",
    comp: `PillBeat-${pad(w.beat)}`,
    out: join(renderedDir, "pills", `pill-beat-${pad(w.beat)}.mov`),
    flags: ALPHA_FLAGS,
  });
}
items.push({
  kind: "still",
  comp: "LogoBug",
  out: join(renderedDir, "logo-bug.png"),
  flags: [],
});

const selected = only
  ? items.filter((i) => i.comp.includes(only) || i.out.includes(only))
  : items;

if (selected.length === 0) {
  console.error(`render-all: nothing matches --only ${only}`);
  process.exit(1);
}

for (const d of ["pins", "gfx", "pills"]) {
  mkdirSync(join(renderedDir, d), { recursive: true });
}

const failures = [];
let done = 0;
for (const item of selected) {
  if (!force && existsSync(item.out) && statSync(item.out).size > 0) {
    console.log(`skip (exists): ${item.comp}`);
    done++;
    continue;
  }
  const cmd =
    item.kind === "still"
      ? ["remotion", "still", "src/index.tsx", item.comp, item.out]
      : ["remotion", "render", "src/index.tsx", item.comp, item.out, ...item.flags];
  console.log(`\n=== [${done + 1}/${selected.length}] ${item.kind}: ${item.comp} ===`);
  try {
    execFileSync("npx", cmd, { cwd: projectDir, stdio: "inherit" });
    done++;
  } catch (e) {
    console.error(`FAILED: ${item.comp}`);
    failures.push(item.comp);
  }
}

console.log(`\nrender-all: ${done}/${selected.length} ok`);
if (failures.length) {
  console.error(`render-all: FAILED items: ${failures.join(", ")}`);
  process.exit(1);
}
