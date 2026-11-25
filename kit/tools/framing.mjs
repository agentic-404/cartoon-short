// Pre-render framing check: flags shots whose important points leave the frame, sit in the caption zone, or are tiny.
// usage: node framing.mjs web/story.js [--step 6] [--caption-y 0.70]
// Items with opt:true (background actors that may leave the frame on purpose) are reported only with --all.
// story.js must export camAt(f) -> {pos,look,fov,roll} and TOTAL; optional focusAt(f) -> [{n:'name', p:[x,y,z], r:metres}] (absolute world coords).
// Without focusAt only camera sanity (fov/look) is checked. Frame is 9:16: half-width = d*tan(fov/2)*0.5625. The caption band starts at --caption-y (fraction of frame height).
import path from 'path'; import { pathToFileURL } from 'url';
const a = process.argv.slice(2), file = a.find((x) => !x.startsWith('--')) || 'web/story.js';
const opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? +a[i + 1] : d; };
const ALL = a.includes('--all'), STEP = opt('step', 6), CAP = opt('caption-y', 0.70), MINR = 0.035;
const S = await import(pathToFileURL(path.resolve(file)).href);
const sub = (u, v) => u.map((x, i) => x - v[i]), dot = (u, v) => u.reduce((s, x, i) => s + x * v[i], 0), cr = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
const norm = (v) => { const l = Math.hypot(...v) || 1; return v.map((x) => x / l); };
function project(C, p) {   // -> {x,y (NDC, +y up), d, rpx (radius scale per metre in NDC-y)}
  const fw = norm(sub(C.look, C.pos)), rt = norm(cr(fw, [0, 1, 0])), up = cr(rt, fw), v = sub(p, C.pos), d = dot(v, fw);
  if (d <= 0.05) return null;
  const th = Math.tan(C.fov * Math.PI / 360), ex = d * th * (1080 / 1920), ey = d * th, r = C.roll ? C.roll * Math.PI / 180 : 0;
  let x = dot(v, rt) / ex, y = dot(v, up) / ey; if (r) { const c = Math.cos(r), s = Math.sin(r); [x, y] = [x * c - y * s, x * s + y * c]; }
  return { x, y, d, k: 1 / ey };
}
const issues = new Map();   // key -> [frames]
const note = (k, f) => { if (!issues.has(k)) issues.set(k, []); issues.get(k).push(f); };
for (let f = 0; f < S.TOTAL; f += STEP) {
  const sh = S.shotAt ? S.shotAt(f).id : '?', C = S.camAt(f);
  if (!(C.fov > 8 && C.fov < 100)) note(`${sh}: odd fov ${C.fov.toFixed(1)}`, f);
  if (!S.focusAt) continue;
  for (const o of S.focusAt(f)) {
    if (o.opt && !ALL) continue;
    const q = project(C, o.p); const nm = `${sh}: ${o.n}`;
    if (!q) { note(`${nm} behind camera`, f); continue; }
    const r = (o.r || 0.3) * q.k;
    if (Math.abs(q.x) - r * 0.5625 > 1.0 || Math.abs(q.y) - r > 1.0) note(`${nm} outside frame`, f);
    else if (Math.abs(q.x) + r * 0.5625 > 1.0) note(`${nm} cut by frame edge`, f);
    if ((1 - q.y) / 2 > CAP && (1 - q.y) / 2 < 1.1) note(`${nm} in caption zone`, f);
    if (r < MINR) note(`${nm} tiny on screen`, f);
  }
}
const rng = (l) => { const o = []; let s = l[0], e = l[0]; for (const v of l.slice(1)) { if (v - e <= STEP) e = v; else { o.push(s === e ? `${s}` : `${s}-${e}`); s = e = v; } } o.push(s === e ? `${s}` : `${s}-${e}`); return o.join(', '); };
for (const [k, l] of issues) console.log(`FLAG ${k}: frames ${rng(l)}`);
console.log(issues.size ? `${issues.size} framing flags (review; "tiny" and "caption zone" can be intended for establishing shots)` : 'framing OK');
process.exit(issues.size ? 1 : 0);
