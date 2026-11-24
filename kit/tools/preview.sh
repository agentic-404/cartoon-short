#!/usr/bin/env bash
# Fast look at framing + timing + sound: half-res every Nth frame, played back at the right speed with the mixed audio.
#   bash preview.sh [scale=0.5] [step=3] [range="0-<N-1>"]       (SCALE/STEP also fine as env)
# Needs: mix_raw.wav (run audio.py + mix.py first; if it is missing the preview is silent).
set -e; SC="${1:-0.5}"; ST="${2:-3}"; N=$(python3 -c "import json;print(json.load(open('work/phrases.json'))['frames30'])"); R="${3:-0-$((N-1))}"
rm -rf prev && mkdir -p prev
SCALE="$SC" node render.mjs prev "$R" "$ST" 0.8 | tail -1
# renumber to a continuous sequence
i=0; for f in $(ls prev/f*.jpg | sort); do mv "$f" "prev/p$(printf %05d $i).jpg"; i=$((i+1)); done
FPS=$(( 30 / ST )); [ "$FPS" -lt 1 ] && FPS=1
A=""; [ -f mix_raw.wav ] && A="-i mix_raw.wav -map 1:a:0 -c:a aac -b:a 128k -shortest"
ffmpeg -v error -y -framerate "$FPS" -i prev/p%05d.jpg $A -map 0:v:0 -c:v libx264 -preset veryfast -crf 26 -pix_fmt yuv420p out/preview.mp4
echo "out/preview.mp4  (${i} frames at ${FPS} fps, scale $SC: audio stays in sync; resolution and frame rate are reduced)"
