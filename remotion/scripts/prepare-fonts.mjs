/**
 * Copies the self-hosted Montserrat ExtraBold (weight 800) font files from
 * the @fontsource/montserrat npm package into public/fonts/, so Remotion
 * can serve them with staticFile() during renders.
 *
 * Two subsets are needed:
 *  - latin      — everything ordinary (letters, £, ·, —, ')
 *  - latin-ext  — carries the peso sign ₱ (U+20B1), which the latin
 *                 subset does NOT contain (verified with fontTools).
 *
 * No Google Fonts CDN is used anywhere: the CDN fetch fails in the local
 * VM's headless browser, and the self-hosted files work identically on
 * GitHub runners.
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const projectDir = join(here, "..");
const srcDir = join(
  projectDir,
  "node_modules",
  "@fontsource",
  "montserrat",
  "files"
);
const destDir = join(projectDir, "public", "fonts");

const FILES = [
  "montserrat-latin-800-normal.woff2",
  "montserrat-latin-ext-800-normal.woff2",
];

mkdirSync(destDir, { recursive: true });
for (const f of FILES) {
  const from = join(srcDir, f);
  if (!existsSync(from)) {
    console.error(
      `prepare-fonts: missing ${from} — run "npm install" in remotion/ first.`
    );
    process.exit(1);
  }
  copyFileSync(from, join(destDir, f));
  console.log(`prepare-fonts: copied ${f}`);
}
