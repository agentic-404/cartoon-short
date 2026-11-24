"""Publishing pack: thumbnail (frame + big title) and a ready-to-paste text file with platform limit checks.
usage: python3 publish.py --frames frames_cap --frame 60 --title "PERANG EMU" --post-title "Tentara Kalah Lawan Burung" \\
         --desc "..." --tags "#sejarah #faktaunik" [--out out/publish]
Writes <out>/thumbnail.jpg, <out>/thumbnail_cover_4x5.jpg (1080x1350 crop for feed grids) and <out>/publish.txt"""
import argparse, os, textwrap
from PIL import Image, ImageDraw, ImageFont
ap = argparse.ArgumentParser()
ap.add_argument("--frames", required=True); ap.add_argument("--frame", type=int, default=60)
ap.add_argument("--title", required=True, help="big text on the thumbnail (short, uppercase works best)")
ap.add_argument("--post-title", default=""); ap.add_argument("--desc", default=""); ap.add_argument("--tags", default="")
ap.add_argument("--out", default="out/publish"); ap.add_argument("--font", default="")
A = ap.parse_args(); os.makedirs(A.out, exist_ok=True)
FONT = next(f for f in (A.font, "/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf") if f and os.path.exists(f))
im = Image.open(os.path.join(A.frames, "f%04d.jpg" % A.frame)).convert("RGBA")
# darken top for legibility
sh = Image.new("RGBA", im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(sh)
for y in range(0, 700): d.line([(0, y), (1080, y)], fill=(0, 0, 0, int(150 * (1 - y / 700))))
im.alpha_composite(sh)
d = ImageDraw.Draw(im); size = 150
while True:
    f = ImageFont.truetype(FONT, size); lines = textwrap.wrap(A.title.upper(), width=max(6, int(1000 / (size * 0.62))))
    if max(f.getlength(l) for l in lines) <= 960 or size < 70: break
    size -= 6
y = 150
for l in lines:
    x = (1080 - f.getlength(l)) / 2
    d.text((x, y), l, font=f, fill=(255, 214, 10, 255), stroke_width=12, stroke_fill=(10, 8, 12, 255)); y += int(size * 1.2)
im = im.convert("RGB"); im.save(os.path.join(A.out, "thumbnail.jpg"), quality=94)
im.crop((0, 285, 1080, 1635)).save(os.path.join(A.out, "thumbnail_cover_4x5.jpg"), quality=94)
tags = A.tags.split(); body = A.desc.strip()
txt = f"""TITLE (YouTube Shorts, max 100): {A.post_title}
TIKTOK / REELS CAPTION (max 2200):
{body}

{' '.join(tags)}
"""
warn = []
if len(A.post_title) > 100: warn.append(f"post-title {len(A.post_title)} > 100 (YouTube)")
if len(body + ' ' + ' '.join(tags)) > 2200: warn.append("caption > 2200")
if len(tags) > 30: warn.append("more than 30 hashtags (Instagram limit)")
if len(tags) > 5: warn.append("tip: YouTube/TikTok reach does not improve past ~5 hashtags")
open(os.path.join(A.out, "publish.txt"), "w").write(txt + ("\n# NOTES\n" + "\n".join("- " + w for w in warn) + "\n" if warn else ""))
print("ok ->", A.out, "|", "; ".join(warn) if warn else "no warnings")
