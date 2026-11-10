#!/usr/bin/env bash
# One-time setup: Node (Playwright + Chromium), Python venv (numpy, scipy, soundfile, Azure Speech SDK), ffmpeg check.
set -euo pipefail
cd "$(dirname "$0")/.."
command -v ffmpeg >/dev/null || { echo "install ffmpeg first (brew install ffmpeg)"; exit 1; }
npm install
npx playwright install chromium
command -v uv >/dev/null && uv venv .venv && uv pip install --python .venv/bin/python -r requirements.txt \
  || { python3 -m venv .venv && .venv/bin/pip install -r requirements.txt; }
[ -f .env ] || cp .env.example .env
echo "setup done. Put your Azure key into .env"
