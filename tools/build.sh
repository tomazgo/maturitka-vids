#!/usr/bin/env bash
# Builds one video: tools/build.sh videos/<slug>
#   voice (Azure) -> words.js -> sound mix (audio.py) -> shots rendered in parallel -> hotove-videa/<slug>.mp4
# Finished videos land in <repo>/hotove-videa/, which git ignores (too big for GitHub).
# SKIP_VOICE=1 reuses the existing voice. WORKERS=n overrides the number of parallel render processes.
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
VIDEO_DIR="$(cd "${1:?usage: tools/build.sh videos/<slug>}" && pwd)"
SLUG="$(basename "$VIDEO_DIR")"
# Default: all cores but two (one for ffmpeg encoding, one for the system).
CPU_COUNT="$(sysctl -n hw.ncpu 2>/dev/null || nproc)"
WORKERS="${WORKERS:-$(( CPU_COUNT > 3 ? CPU_COUNT - 2 : 1 ))}"
PYTHON="$REPO/.venv/bin/python"
OUTPUT_DIR="$REPO/hotove-videa"
mkdir -p "$OUTPUT_DIR"
cd "$VIDEO_DIR"

# style.txt in the video folder picks the look: missing = ink (engine/), "present" = engine/ + engine-present/ on top
assemble_web() {
  mkdir -p web
  rsync -a "$REPO/engine/" web/
  [ -f style.txt ] && rsync -a "$REPO/engine-$(cat style.txt)/" web/
  cp shots.js web/shots.js
}

assemble_web
[ "${SKIP_VOICE:-0}" = "1" ] || "$PYTHON" "$REPO/tools/vo_azure.py"
"$PYTHON" audio.py

mkdir -p seg; find seg -type f -delete
N=$(node "$REPO/tools/render.js" count | tail -1)
pids=()
for ((w = 0; w < WORKERS; w++)); do
  ids=""; for ((i = w; i < N; i += WORKERS)); do ids="${ids:+$ids,}$i"; done
  [ -n "$ids" ] && { node "$REPO/tools/render.js" segments "$ids" > "seg/log$w.txt" 2>&1 & pids+=($!); }
done
for p in "${pids[@]}"; do wait "$p"; done
for f in seg/shot_??.mp4; do echo "file '$PWD/$f'"; done > seg/list.txt
ffmpeg -v error -y -f concat -safe 0 -i seg/list.txt -c copy silent.mp4
ffmpeg -v error -y -i silent.mp4 -i audio/mix.wav -map 0:v -map 1:a -c:v copy \
  -af "alimiter=limit=0.8:attack=2:release=60,loudnorm=I=-14:TP=-1.5:LRA=9" \
  -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$OUTPUT_DIR/$SLUG.mp4"
rm -f silent.mp4
echo "done: $OUTPUT_DIR/$SLUG.mp4"
