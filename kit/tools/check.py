"""Automatic artifact check over rendered frames.   python3 check.py <frames_dir> [--fps 30]
Flags: black frames, frozen runs (>=0.4 s identical), white blocks at the top (non-flash), dark horizon bands,
and abrupt single-frame luminance jumps (flicker). Exit code 1 if anything is flagged."""
import sys, glob, os, argparse
import numpy as np
from PIL import Image
from multiprocessing import Pool
ap = argparse.ArgumentParser(); ap.add_argument("frames"); ap.add_argument("--fps", type=float, default=30)
ap.add_argument("--config", default="work/checks.json", help="optional JSON: {\"flash\": [[a,b],...] intended flash/transition frames, \"ignore\": [\"dark horizon band\", ...], \"dark_world\": true}")
A = ap.parse_args()
import json
CFG = json.load(open(A.config)) if os.path.exists(A.config) else {}
IGN = [str(x).lower() for x in CFG.get("ignore", [])]; DARK_WORLD = bool(CFG.get("dark_world"))   # dark_world: night scenes, a dark ground is intended -> no horizon-band check
FLASH_OK = [tuple(r) for r in CFG.get("flash", [])]
def in_flash(n, pad=3): return any(a - pad <= n <= b + pad for a, b in FLASH_OK)
def load(p):
    im = Image.open(p).convert("L"); w, h = im.size
    return np.asarray(im.resize((w // 4, h // 4)), dtype=np.float32)
def feat(p):
    g = load(p); h, w = g.shape
    rows = g.mean(1)
    flash = g.mean() > 225
    black = g.mean() < 6
    top = g[: int(h * 0.22)]; white_top = (top > 248).mean() > 0.35 and not flash   # flat white rectangles in the sky
    band = False                                                                    # dark stripe under a bright sky band
    lim = int(h * 0.72)
    for y in range(6, lim - 4 if not DARK_WORLD else 6):
        if rows[y] < 50 and rows[max(0, y - 10):y].max() > 130 and rows[y - 1] >= 50:
            k = y
            while k < lim and rows[k] < 50: k += 1
            if k - y >= 5 and rows[y:k].mean() < 45: band = True; break
    return g, flash, black, white_top, band
if __name__ == "__main__":
    fs = sorted(glob.glob(os.path.join(A.frames, "f*.jpg")))
    with Pool(max(1, os.cpu_count() // 2)) as p: R = p.map(feat, fs, chunksize=16)
    bad = []
    def rng(lst):
        out, s, e = [], None, None
        for i in lst:
            if s is None: s = e = i
            elif i == e + 1: e = i
            else: out.append((s, e)); s = e = i
        if s is not None: out.append((s, e))
        return ", ".join(f"{a}" if a == b else f"{a}-{b}" for a, b in out)
    fn = lambda p: int(os.path.basename(p)[1:5])
    nums = [fn(p) for p in fs]
    def pick(i): return [nums[k] for k, r in enumerate(R) if r[i]]
    for name, idx in (("black frames", 2), ("white block at top (not a flash)", 3), ("dark horizon band", 4)):
        v = [n for n in pick(idx) if not (idx != 2 and in_flash(n))]
        if any(i in name.lower() or name.lower() in i for i in IGN): v = []   # v4.1: partial names work ("white block", "horizon")
        if v: bad.append(name); print(f"FLAG {name}: {rng(v)}")
    # frozen runs
    run = 1; fr = []
    for k in range(1, len(R)):
        same = np.abs(R[k][0] - R[k - 1][0]).mean() < 0.02 and not R[k][1]
        run = run + 1 if same else 1
        if run == int(A.fps * 0.4): fr.append(nums[k] - run + 1)
    if any(i in "frozen" or "frozen" in i for i in IGN): fr = []
    if fr: bad.append("frozen"); print("FLAG frozen >=0.4 s starting at frames:", rng(fr))
    # flicker: single-frame mean jump that returns
    m = np.array([r[0].mean() for r in R]); fl = [nums[k] for k in range(1, len(m) - 1) if abs(m[k] - m[k - 1]) > 18 and abs(m[k] - m[k + 1]) > 18 and not any(R[j][1] for j in range(max(0, k - 10), k + 1)) and not in_flash(nums[k])]
    if any(i in "flicker" or "flicker" in i for i in IGN): fl = []
    if fl: bad.append("flicker"); print("FLAG flicker:", rng(fl))
    fls = pick(1)
    print(f"{len(fs)} frames checked; flash frames (allowed): {rng(fls) if fls else 'none'}")
    if bad: print("(intended flashes/transitions or a deliberately dark scene? list them in work/checks.json: {\"flash\": [[441,447]], \"dark_world\": true})")
    print("OK" if not bad else "ISSUES: " + ", ".join(bad)); sys.exit(1 if bad else 0)
