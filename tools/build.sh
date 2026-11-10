#!/usr/bin/env bash
# Builds one video: tools/build.sh videos/<slug>
#   voice (Azure) -> words.js -> sound mix (audio.py) -> shots rendered in parallel -> <slug>.mp4
# SKIP_VOICE=1 reuses the existing voice. WORKERS=4 sets parallel render processes.
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
VIDEO_DIR="$(cd "${1:?usage: tools/build.sh videos/<slug>}" && pwd)"
SLUG="$(basename "$VIDEO_DIR")"
WORKERS="${WORKERS:-4}"
PYTHON="$REPO/.venv/bin/python"
cd "$VIDEO_DIR"

assemble_web() {
  mkdir -p web
  rsync -a "$REPO/engine/" web/
  cp shots.js web/shots.js
}

assemble_web
[ "${SKIP_VOICE:-0}" = "1" ] || "$PYTHON" "$REPO/tools/vo_azure.py"
"$PYTHON" audio.py

mkdir -p seg; find seg -type f -delete
N=$(grep -c "SHOTS.push" web/shots.js)
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
  -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$SLUG.mp4"
echo "done: $VIDEO_DIR/$SLUG.mp4"
