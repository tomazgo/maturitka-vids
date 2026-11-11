#!/usr/bin/env bash
# Builds one video: tools/build.sh videos/<slug>
#   voice (Azure) -> words.js -> sound mix (audio.py) -> shots rendered in parallel -> hotove-videa/<slug>.mp4
# YouTube style exports <slug>-web.mp4 and <slug>-youtube.mp4 from the same render.
# Finished videos land in <repo>/hotove-videa/, which git ignores (too big for GitHub).
# SKIP_VOICE=1 reuses the existing voice. WORKERS=n overrides the number of parallel render processes.
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
VIDEO_DIR="$(cd "${1:?usage: tools/build.sh videos/<slug>}" && pwd)"
SLUG="$(basename "$VIDEO_DIR")"
STYLE="$(cat "$VIDEO_DIR/style.txt" 2>/dev/null || echo ink)"
# Default: all cores but two (one for ffmpeg encoding, one for the system).
CPU_COUNT="$(sysctl -n hw.ncpu 2>/dev/null || nproc)"
WORKERS="${WORKERS:-$(( CPU_COUNT > 3 ? CPU_COUNT - 2 : 1 ))}"
PYTHON="$REPO/.venv/bin/python"
OUTPUT_DIR="$REPO/hotove-videa"
mkdir -p "$OUTPUT_DIR"
cd "$VIDEO_DIR"

# style.txt selects an overlay: missing = ink, present = ANJ, youtube = ink + branded outro.
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

export_video() {
  local output="$1" audio="$2" count="$3" index
  for ((index = 0; index < count; index++)); do
    printf "file '%s/seg/shot_%02d.mp4'\n" "$PWD" "$index"
  done > seg/list.txt
  ffmpeg -v error -y -f concat -safe 0 -i seg/list.txt -c copy silent.mp4
  ffmpeg -v error -y -i silent.mp4 -i "$audio" -map 0:v -map 1:a -c:v copy \
    -af "alimiter=limit=0.8:attack=2:release=60,loudnorm=I=-14:TP=-1.5:LRA=9,apad" \
    -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$output"
  rm -f silent.mp4
  echo "done: $output"
}

if [ "$STYLE" = "youtube" ]; then
  node "$REPO/tools/render.js" timing
  "$PYTHON" "$REPO/tools/youtube_audio.py"
  export_video "$OUTPUT_DIR/$SLUG-web.mp4" audio/mix.wav "$((N - 1))"
  export_video "$OUTPUT_DIR/$SLUG-youtube.mp4" audio/youtube-mix.wav "$N"
else
  export_video "$OUTPUT_DIR/$SLUG.mp4" audio/mix.wav "$N"
fi
