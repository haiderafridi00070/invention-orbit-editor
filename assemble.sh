#!/usr/bin/env bash
# assemble.sh — builds out/final.mp4 for Invention Orbit Video 2.
#
#   Step 1  Normalise every beat to exactly its retimed frame count
#           (1920x1080 @ 30fps): footage beats from clips/, beats 28-32
#           cut out of assets/diagram-D1.mp4, graphics/text-led beats
#           from the Remotion renders in rendered/gfx/.
#   Step 2  Concatenate the 62 beats into the base video and check the
#           total is 966.048s (±0.5s) — timings are never retimed.
#   Step 3  One FFmpeg pass: overlay every footage pin and credit-pill
#           track at its timeline position, the logo bug throughout
#           (except beat 49), then mix narration + ducked music and
#           loudnorm to about -14 LUFS.
#
# scripts/plan.py runs first and refuses to continue if any asset is
# missing, so a run can never silently produce a partial video.
set -euo pipefail
cd "$(dirname "$0")"

command -v ffmpeg >/dev/null || { echo "assemble: ffmpeg not found" >&2; exit 1; }
command -v python3 >/dev/null || { echo "assemble: python3 not found" >&2; exit 1; }

mkdir -p work out
python3 scripts/plan.py
# shellcheck disable=SC1091
source work/indices.env

echo "== Step 1: normalising beats =="
while IFS=$'\t' read -r beat kind frames src ss; do
  printf -v nn "%02d" "$beat"
  out="work/beat-${nn}.mp4"
  ssargs=()
  if [ "$kind" = "diagram" ]; then ssargs=(-ss "$ss"); fi
  ffmpeg -nostdin -y -v error "${ssargs[@]}" -i "$src" \
    -vf "scale=1920:1080:force_original_aspect_ratio=disable,fps=30,setsar=1,format=yuv420p,tpad=stop_mode=clone:stop_duration=30,trim=end_frame=${frames},setpts=N/(30*TB)" \
    -frames:v "$frames" -c:v libx264 -preset veryfast -crf 16 -an "$out"
done < work/segments.tsv

echo "== Step 2: concatenating base video =="
: > work/concat.txt
for f in work/beat-*.mp4; do echo "file '$(basename "$f")'" >> work/concat.txt; done
ffmpeg -nostdin -y -v error -f concat -safe 0 -i work/concat.txt -c copy work/base.mp4

dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 work/base.mp4)
python3 - "$dur" "$TOTAL_S" <<'EOF'
import sys
dur, total = float(sys.argv[1]), float(sys.argv[2])
print(f"assemble: base duration {dur:.3f}s (target {total:.3f}s)")
if abs(dur - total) > 0.5:
    print("assemble: ERROR — base video off target by more than 0.5s", file=sys.stderr)
    sys.exit(1)
EOF

echo "== Step 3: overlays + audio mix =="
inputs=()
while IFS=$'\t' read -r kind path; do
  if [ "$kind" = "loop" ]; then inputs+=(-loop 1 -framerate 30); fi
  inputs+=(-i "$path")
done < work/inputs.txt

ffmpeg -nostdin -y -v error "${inputs[@]}" \
  -filter_complex_script work/filter.txt \
  -map "[vout]" -map "[aout]" \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -ac 2 -c:a aac -b:a 192k -movflags +faststart \
  out/final.mp4

ffprobe -v error -show_entries format=duration,size \
  -show_entries stream=codec_name,width,height \
  -of default=noprint_wrappers=1 out/final.mp4
echo "assemble: done — out/final.mp4"
