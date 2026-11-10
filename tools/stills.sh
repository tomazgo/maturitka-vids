#!/usr/bin/env bash
# Renders check frames without building the whole video: tools/stills.sh videos/<slug> 1.5,6,12
# Frames land in videos/<slug>/stills/ plus a contact sheet stills/sheet.jpg.
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
VIDEO_DIR="$(cd "${1:?usage: tools/stills.sh videos/<slug> 1.5,6,12}" && pwd)"
TIMES="${2:?pass comma separated seconds}"
cd "$VIDEO_DIR"
mkdir -p web && rsync -a "$REPO/engine/" web/
[ -f style.txt ] && rsync -a "$REPO/engine-$(cat style.txt)/" web/
cp shots.js web/shots.js
[ -f web/words.js ] || { echo "run the voice first: tools/build.sh or .venv/bin/python tools/vo_azure.py"; exit 1; }
rm -f stills/s_*.jpg
node "$REPO/tools/render.js" stills "$TIMES"
inputs=(); for f in stills/s_*.jpg; do inputs+=(-i "$f"); done
count=$(( ${#inputs[@]} / 2 ))
if [ "$count" -ge 2 ]; then
  layout=""; for ((i = 0; i < count; i++)); do layout="${layout:+$layout|}$(( (i % 2) * 1920 ))_$(( (i / 2) * 1080 ))"; done
  ffmpeg -v error -y "${inputs[@]}" -filter_complex "xstack=inputs=$count:layout=$layout:fill=black,scale=1600:-1" -frames:v 1 stills/sheet.jpg
fi
ls stills
