# Vendored / fetched dependencies

- `toon.ts` — the Pen / head / face drawing library from
  [mromidev/claude-animated-shorts](https://github.com/mromidev/claude-animated-shorts)
  (MIT). Ships in this folder; `setup.sh` re-fetches it from that repo if it is
  missing.
- three.js r160 — NOT vendored here. `setup.sh` fetches the module build at
  project-setup time (`npm pack three@0.160.0`, or a sparse git clone of
  [mrdoob/three.js](https://github.com/mrdoob/three.js) branch `r160` as a
  fallback). three.js is MIT licensed.
