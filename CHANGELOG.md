# Changelog

## 4.0
- **Parallel render:** `render.mjs` splits frames into blocks across `WORKERS` processes (default min(2, cores)); about 1.6x faster on 2 cores. `RESUME=1` still works; GL-driver noise is filtered.
- **Label auto-fit:** `fitScale(cam, pos, width)` in `engine/motion.js` shrinks floating text boards so they never crop at the vertical frame edge (the wiretap example's `main.js` shows the wiring).
- **check.py config:** `work/checks.json` with `flash` (frame ranges where bright flashes are intended), `ignore`, `dark_world` (stops false "dark horizon band"/"flicker" flags on night scenes). `setup.sh` writes a template.
- **`bootstrap.sh`:** checks node/python/ffmpeg/git/Chrome and writes `.env.cartoon` with `CHROME_PATH`.
- **`export.sh`:** finish + publishing pack in one command; `VARIANTS=1` adds 1:1 and 16:9 blurred-pad versions.
- **Third worked example:** `kit/example/wiretap/` (night city, silhouette actors, floating labels, data-packet props) with `NOTES.md` of lessons.
- `setup.sh` copies `export.sh`.

## 3.0
Half-res preview, prop library, flat-ground ink fix, `finish.sh` in setup.
