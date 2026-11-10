#!/usr/bin/env bash
# Starts a new video folder from the example: tools/new-video.sh <slug>
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
SLUG="${1:?usage: tools/new-video.sh <slug>}"
TARGET="$REPO/videos/$SLUG"
[ -e "$TARGET" ] && { echo "$TARGET already exists"; exit 1; }
mkdir -p "$TARGET"
cp "$REPO/examples/tri-gastanove-kone/"{shots.js,audio.py} "$TARGET/"
echo '["Prvá veta scenára.", "Druhá veta scenára."]' > "$TARGET/script.json"
echo "created $TARGET: write script.json, then shots.js and audio.py for the new story"
