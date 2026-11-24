"""Animated word-by-word captions burned onto rendered frames.
usage: python3 captions.py <frames_in> <frames_out> <words.json> [--style pop|karaoke] [--y 1440] [--fps 30]
words.json = [{"w":"Australia","s":0.164,"e":0.609}, ...] (timing.py writes work/words.json)
Chunks of <=3 words (break on , . ! ?), uppercase, white with black outline; the spoken word turns yellow and pops."""
import sys, os, json, glob, argparse
from multiprocessing import Pool
from PIL import Image, ImageDraw, ImageFont
ap = argparse.ArgumentParser(); ap.add_argument("fin"); ap.add_argument("fout"); ap.add_argument("words")
ap.add_argument("--y", type=int, default=1440); ap.add_argument("--fps", type=float, default=30); ap.add_argument("--size", type=int, default=92)
ap.add_argument("--font", default=""); ap.add_argument("--max", type=int, default=3)
A = ap.parse_args()
FONTS = [A.font, "/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]
FONT = next(f for f in FONTS if f and os.path.exists(f))
W = json.load(open(A.words))
# --- chunking
chunks, cur = [], []
for i, w in enumerate(W):
    cur.append(i)
    brk = w["w"][-1] in ",.!?:;" or len(cur) >= A.max or (len(cur) >= 2 and sum(len(W[j]["w"]) for j in cur) > 16)
    if brk: chunks.append(cur); cur = []
if cur: chunks.append(cur)
spans = []
for k, c in enumerate(chunks):
    s = W[c[0]]["s"] - 0.05
    e = (W[chunks[k + 1][0]]["s"] - 0.02) if k + 1 < len(chunks) else W[c[-1]]["e"] + 0.4
    e = min(e, W[c[-1]]["e"] + 0.45); spans.append((s, e))
def active(t):
    for k, (s, e) in enumerate(spans):
        if s <= t < e: return k
    return None
_cache = {}
def font(sz):
    if sz not in _cache: _cache[sz] = ImageFont.truetype(FONT, sz)
    return _cache[sz]
def layer(k, cw, pop):
    """RGBA layer (1080x~400) for chunk k, current word index cw (or -1), pop scale 1..1.18"""
    c = chunks[k]; words = [W[i]["w"].strip(",.!?:;").upper() for i in c]
    f0 = font(A.size); gap = 26; maxw = 960
    # wrap into lines
    lines, line, lw = [], [], 0
    for j, t in enumerate(words):
        wd = f0.getlength(t)
        if line and lw + gap + wd > maxw: lines.append(line); line, lw = [], 0
        line.append(j); lw += (gap if lw else 0) + wd
    lines.append(line)
    H = int(len(lines) * A.size * 1.35) + 80
    img = Image.new("RGBA", (1080, H), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    y = 40
    for ln in lines:
        tw = sum(font(int(A.size * (pop if j == cw else 1.0))).getlength(words[j]) for j in ln) + gap * (len(ln) - 1); x = (1080 - tw) / 2
        for j in ln:
            sz = int(A.size * (pop if j == cw else 1.0)); f = font(sz); wd = f0.getlength(words[j])
            col = (255, 214, 10, 255) if j == cw else ((255, 255, 255, 255) if j < cw or cw < 0 else (255, 255, 255, 195))
            off = (f.getlength(words[j]) - wd) / 2; yy = y - (sz - A.size) * 0.5
            d.text((x, yy), words[j], font=f, fill=col, stroke_width=9, stroke_fill=(10, 8, 12, 255 if (j <= cw or cw < 0) else 170))
            x += f.getlength(words[j]) - off * 0 + gap
        y += int(A.size * 1.35)
    return img
def cur_word(k, t):
    c = chunks[k]; cw = -1
    for n, i in enumerate(c):
        if W[i]["s"] - 0.02 <= t: cw = n
    return cw
def job(f):
    t = f / A.fps; src = os.path.join(A.fin, "f%04d.jpg" % f); dst = os.path.join(A.fout, "f%04d.jpg" % f)
    k = active(t)
    if k is None: Image.open(src).save(dst, quality=95); return
    cw = cur_word(k, t); ts = W[chunks[k][max(cw, 0)]]["s"]; age = t - ts
    pop = 1.0 + 0.18 * max(0.0, 1 - age / 0.14) if cw >= 0 else 1.0
    pop = round(pop * 20) / 20
    L = layer(k, cw, pop); im = Image.open(src).convert("RGBA"); im.alpha_composite(L, (0, A.y - L.height // 2))
    # tiny fade-in on chunk start
    im.convert("RGB").save(dst, quality=95)
if __name__ == "__main__":
    os.makedirs(A.fout, exist_ok=True)
    fs = sorted(int(os.path.basename(p)[1:5]) for p in glob.glob(os.path.join(A.fin, "f*.jpg")))
    with Pool(max(1, os.cpu_count() // 2)) as p: p.map(job, fs, chunksize=8)
    print("captions:", len(fs), "frames,", len(chunks), "chunks ->", A.fout)
