# Changelog

## 5.0
- **Lip-sync:** `kit/tools/lipsync.py words.json web/mouth.js` turns word timings into a per-frame mouth string (closed / small round / open / wide, syllable-based, tuned for Indonesian). `lipAt(MOUTH, f, a, b)` in `motion.js` returns the mouth kind; pass it as the actor option `mouth` (`roman.js` overrides the current expression's mouth for that draw only). Demo: the seller in `example/ikan-sate`.
- **Camera presets:** `CAM.dolly / orbit / whip / crane / shoulder / dutch` in `motion.js` return key arrays for `camFromKeys` (spread several into one shot list).
- **Music presets:** `kit/tools/musicpresets.py`, `Music().add('ceria'|'tegang'|'misterius'|'dokumenter'|'sedih'|'epik', t0, t1)` replaces rewriting a bed per video; `mix.py` still sets the levels. (Synth-only; audition the style before committing.)
- **Explainer mode:** `kit/library/explainer.js` (`makeExplainer`: nodes, drawing arrows, travelling packets on flat boards) plus `kit/example/explainer/` (vertical zig-zag layout for 9:16).
- **Themed sets:** `kit/library/sets.js` with `office`, `lab`, `serverRoom` (blinking racks), `netMap` (scanning ring) and `nightStreet`. Starter quality: plain geometry, meant to be dressed per story.
- `setup.sh` copies `explainer.js` and `sets.js` into `web/`.

## 4.1
Fixes and tools found while building "Ikan vs Sate Ayam" (a pond + underwater comedy).
- **check.py:** names in `checks.json` `ignore` now match partially (`"white block"`, `"horizon"`, `"flicker"`, `"frozen"`). Before, the full printed name was required, so shorter entries silently did nothing.
- **framing.mjs (new):** `node framing.mjs web/story.js` flags labels/props that leave the frame, are cut by the edge, sit in the caption band, or are tiny, before the long render. Feed it with an optional `focusAt(f)` export in `story.js` (`opt:true` for background actors; `--all` includes them).
- **assemble.py (new):** builds `web/main.js` from a base file and your `world.part.js` using `// @@WORLD-BEGIN` / `// @@WORLD-END` markers (added to the wiretap example). No more line-number slicing.
- **captions.py:** `--hl sate,ikan` (or a word file) colours keywords orange.
- **render.mjs:** opt-in duplicate skipping via `window.frameKey(f)`; a clean progress line reports copied duplicates.
- **bootstrap.sh --update:** pulls the latest kit (`git pull --ff-only`) before checking dependencies.
- **motion.js:** `M.linear` easing (constant speed for cameras tracking a steadily moving card).
- **Fourth example:** `kit/example/ikan-sate/` (pond bank + underwater set, 3D fish with eye tracking, skewer prop, murky fog, podium/medal, prohibition sign) with `NOTES.md` of lessons: caption-safe layout, ceiling depth order, labels in fog.
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
