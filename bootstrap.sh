#!/usr/bin/env bash
# One-shot environment check for cartoon-short.   bash bootstrap.sh
# Checks node >= 22.6, python3 + numpy + Pillow, ffmpeg, git and a usable Chrome, then writes ./.env.cartoon
# with CHROME_PATH. Source it before rendering:  source .env.cartoon
set -u
# v4.1: `bash bootstrap.sh --update` pulls the latest kit from GitHub first (git pull --ff-only), then runs the checks.
if [ "${1:-}" = "--update" ]; then git -C "$(dirname "$0")" pull --ff-only && echo "kit updated: $(cat "$(dirname "$0")/VERSION")" || echo "update failed (offline or local changes?) - continuing with the local kit"; fi
ok=1; say(){ printf '%-14s %s\n' "$1" "$2"; }; bad(){ ok=0; say "$1" "MISSING - $2"; }
if command -v node >/dev/null; then
  v=$(node -p "process.versions.node"); IFS=. read -r a b _ <<<"$v"
  if [ "$a" -gt 22 ] || { [ "$a" -eq 22 ] && [ "$b" -ge 6 ]; }; then say node "$v ok"; else bad node "need >= 22.6 (have $v)"; fi
else bad node "install Node 22.6+"; fi
if python3 -c "import numpy, PIL" 2>/dev/null; then say python3 "numpy + Pillow ok"; else bad python3 "pip install numpy pillow --break-system-packages"; fi
command -v ffmpeg >/dev/null && say ffmpeg ok || bad ffmpeg "install ffmpeg"
command -v git >/dev/null && say git ok || bad git "install git"
CH=""
for c in "${CHROME_PATH:-}" /usr/bin/google-chrome /usr/bin/google-chrome-stable /usr/bin/chromium /usr/bin/chromium-browser; do
  [ -n "$c" ] && [ -x "$c" ] && { CH="$c"; break; }
done
if [ -z "$CH" ]; then
  CH=$(node -e "try{console.log(require('$(npm root -g 2>/dev/null)/playwright').chromium.executablePath())}catch(e){}" 2>/dev/null)
  [ -n "$CH" ] && [ -x "$CH" ] || CH=""
fi
if [ -n "$CH" ]; then say chrome "$CH"; echo "export CHROME_PATH=\"$CH\"" > .env.cartoon; say env "wrote .env.cartoon (source it)"
else bad chrome "install google-chrome, or: npm i -g playwright && npx playwright install chromium"; fi
CORES=$(nproc 2>/dev/null || echo 1); say cores "$CORES (render uses WORKERS=min(2,cores); raise with WORKERS=n)"
[ $ok -eq 1 ] && echo "ready. next: bash kit/tools/setup.sh <project_dir>" || { echo "fix the MISSING items above, then re-run."; exit 1; }
