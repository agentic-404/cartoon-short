#!/usr/bin/env bash
# Finish + publishing pack (+ optional 1:1 and 16:9 variants) in one command. Run inside the project dir.
#   TITLE="PRESIDEN DISADAP" POST_TITLE="..." DESC="..." TAGS="#a #b" HOOK=60 [CAPTIONS=work/words.json] [VARIANTS=1] \
#     bash export.sh "Short Title"
set -e; T="${1:?short title}"; F="out/${T// /-}.mp4"
bash finish.sh "$T"
FR=frames; [ -n "${CAPTIONS:-}" ] && FR=frames_cap
python3 publish.py --frames "$FR" --frame "${HOOK:-60}" --title "${TITLE:-$T}" --post-title "${POST_TITLE:-$T}" \
  --desc "${DESC:-}" --tags "${TAGS:-}" --out out/publish
if [ -n "${VARIANTS:-}" ]; then   # blurred-background pads: square (feeds) and 16:9 (YouTube / web)
  for spec in "sq:1080:1080" "wide:1920:1080"; do IFS=: read -r n w h <<<"$spec"
    ffmpeg -v error -y -i "$F" -filter_complex "[0:v]split[a][b];[a]scale=$w:$h:force_original_aspect_ratio=increase,crop=$w:$h,boxblur=30:5[bg];[b]scale=-2:$h[fg];[bg][fg]overlay=(W-w)/2:0,format=yuv420p" \
      -c:v libx264 -preset medium -crf 20 -c:a copy -movflags +faststart "out/${T// /-}-$n.mp4"; echo "variant: out/${T// /-}-$n.mp4"; done
fi
echo "done: $F  + out/publish/{thumbnail.jpg,thumbnail_cover_4x5.jpg,publish.txt}"
