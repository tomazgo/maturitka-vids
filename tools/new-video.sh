#!/usr/bin/env bash
# Starts a new video folder from an example: tools/new-video.sh <slug> [ink|present|youtube]
#   ink (default): Slovak literature, ink & watercolour look (examples/tri-gastanove-kone)
#   present: English (ANJ) topics, bright present-day look (examples/travelling)
#   youtube: Slovak literature with a branded 12-second website outro
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
SLUG="${1:?usage: tools/new-video.sh <slug> [ink|present|youtube]}"
STYLE="${2:-ink}"
case "$STYLE" in
  ink|present|youtube) ;;
  *) echo "unknown style: $STYLE (use ink, present or youtube)"; exit 1 ;;
esac
TARGET="$REPO/videos/$SLUG"
[ -e "$TARGET" ] && { echo "$TARGET already exists"; exit 1; }
mkdir -p "$TARGET"
if [ "$STYLE" = "present" ]; then
  cp "$REPO/examples/travelling/"{shots.js,audio.py,style.txt,voice.txt,rate.txt} "$TARGET/"
  echo '["First sentence of the script.", "Second sentence of the script."]' > "$TARGET/script.json"
elif [ "$STYLE" = "youtube" ]; then
  cp "$REPO/examples/bacik-z-chocholova/"{shots.js,audio.py,script.json} "$TARGET/"
  echo youtube > "$TARGET/style.txt"
else
  cp "$REPO/examples/tri-gastanove-kone/"{shots.js,audio.py} "$TARGET/"
  echo '["Prvá veta scenára.", "Druhá veta scenára."]' > "$TARGET/script.json"
fi
echo "created $TARGET ($STYLE): write script.json, then shots.js and audio.py for the new story"
