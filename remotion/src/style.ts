import { FONT_FAMILY } from "./fonts";

/** Style constants for the whole text layer (from edit-spec/text-events.md). */
export const FONT_STACK = `${FONT_FAMILY}, "Arial Black", Arial, Helvetica, sans-serif`;

/** White text, soft black shadow, NO background box — the style's rule. */
export const SOFT_SHADOW =
  "0px 10px 28px rgba(0,0,0,0.55), 0px 4px 10px rgba(0,0,0,0.65)";

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/** Graphics-beat backgrounds: near-black blue-grey (graphics-beats.md). */
export const BG_DARK = "#0a0d13";
export const BG_DARKEST = "#05070a";

/** ~40% dark scrim behind chapter cards (T3) and the honest marker (T6). */
export const SCRIM = "rgba(3,5,9,0.42)";

export const framesOf = (seconds: number): number =>
  Math.max(1, Math.round(seconds * FPS));

/**
 * Greedy word-wrap for ExtraBold caps text. Character width for Montserrat
 * ExtraBold uppercase averages ~0.60em; we wrap so the estimated line
 * width stays within maxWidth.
 */
export function wrapText(
  text: string,
  fontSize: number,
  maxWidth = 1560
): string[] {
  const maxChars = Math.max(4, Math.floor(maxWidth / (0.6 * fontSize)));
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w;
    if (candidate.length <= maxChars || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Pick the largest size (from a descending list) whose wrap fits maxLines. */
export function fitFontSize(
  text: string,
  sizes: number[],
  maxLines: number,
  maxWidth = 1560
): number {
  for (const s of sizes) {
    if (wrapText(text, s, maxWidth).length <= maxLines) return s;
  }
  return sizes[sizes.length - 1];
}
