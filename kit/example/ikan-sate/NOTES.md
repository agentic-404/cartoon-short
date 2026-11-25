# Example: Ikan vs Sate Ayam (pond + underwater world, comedy)
Build: `python3 kit/tools/assemble.py kit/example/wiretap/web/main.js kit/example/ikan-sate/web/world.part.js web/main.js`, then copy `story.js`, `roman.js` (has the `sate`/`pelihara` outfits) into `web/`. 38 s voice (`voice.mp3` is yours; `words.json`/`phrases.json` are the timings used).

What to reuse
- `makeFish(kind)`: 3D fish from primitives (canvas-textured ellipsoid, tail pivot, fins, whiskers, mouth+tongue, eyes with `lookAt` pupil toward a world target). Expression params: lid, tilt, pupil, mouth, wide, blink, tint (green = sick), tongue, spiral (dizzy), roll/pitch/yaw.
- `roundCube`, the skewer group (`sate`, optional hand, `cubes` float shrinks chunks), `mkLabel` boards (MeshBasic `fog:false` so text stays readable in murk).
- Two sets in one scene: `bankG` (daytime pond bank) and `under` (offset z = UW = -2000). `L()` in story.js adds the offset for under shots; cameras use `U([..])`.
- `focusAt(f)` in story.js feeds `kit/tools/framing.mjs`.

Lessons
- Ceiling planes need `depthWrite=false` and a negative `renderOrder`, or they hide objects near the surface.
- Murky fog: keep labels below the oil-slick height (y < ~2.6) and use MeshBasic `fog:false`; set a `lightFor` murk mix, not a darker sky.
- Keep floating labels above the caption band (bottom ~30 % of the 9:16 frame) and wrap them with `fitScale`.
- Never decorate with oversized repeated textures on near ground (grass blades turned into green blobs); plain toon colour is cleaner.
- Chunks of meat read as pots unless rounded; use `roundCube`.

v5: the seller in the 'kamu' shot lip-syncs the voice (`mouth: lipAt(MOUTH, f, 1070, 1113)`; `web/mouth.js` came from `tools/lipsync.py`).
