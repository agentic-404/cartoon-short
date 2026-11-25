// Motion helpers: smooth, continuous, "animated" movement for cameras and cards.
// Import in story.js:  import { M } from './motion.js';
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const lerp3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
export const ramp = (f, a, b) => clamp((f - a) / (b - a));
export const M = {
  smooth: (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); },           // smootherstep (glides)
  linear: (t) => clamp(t),                                                                // constant speed (use when the camera must track a steadily moving card)
  easeOut: (t) => 1 - Math.pow(1 - clamp(t), 3),                                          // fast start, soft land (reference "burst" moves)
  easeIn: (t) => Math.pow(clamp(t), 3),
  back: (t, s = 1.7) => { t = clamp(t) - 1; return t * t * ((s + 1) * t + s) + 1; },        // overshoot then settle (pops, arrivals)
  anticip: (t, s = 0.12) => { t = clamp(t); return t < 0.25 ? -s * Math.sin(t / 0.25 * Math.PI) : M.back((t - 0.25) / 0.75); }, // wind-up then go
  spring: (t, freq = 3, damp = 5) => { t = Math.max(0, t); return 1 - Math.exp(-damp * t) * Math.cos(freq * 2 * Math.PI * t); },  // settle wobble (t in s)
};
/** Centripetal Catmull-Rom through 3D points; u in [0,1] over the whole path (constant-ish speed). */
export const spline = (pts, u) => {
  const n = pts.length - 1, x = clamp(u) * n, i = Math.min(n - 1, Math.floor(x)), t = x - i;
  const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)];
  return p1.map((_, k) => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t * t * t));
};
/** Camera from keys {f,pos,look,fov,roll,ease?}. 3+ keys inside one glide use a spline (no corners).
 *  Every hold creeps (push-in) so nothing ever freezes; add kicks for impacts. */
export const camFromKeys = (K, f, { creep = 0.0012, kicks = [] } = {}) => {
  let c;
  if (f <= K[0].f) c = { ...K[0] };
  else if (f >= K[K.length - 1].f) c = { ...K[K.length - 1] };
  else {
    const i = K.findIndex((k, j) => f >= k.f && f <= K[j + 1].f), a = K[i], b = K[i + 1];
    const ease = M[b.ease || 'smooth'], t = ease((f - a.f) / (b.f - a.f));
    if (b.path) { // optional via-points for curved moves: b.path = [[x,y,z], ...]
      const pts = [a.pos, ...b.path, b.pos]; c = { pos: spline(pts, t), look: lerp3(a.look, b.look, t), fov: lerp(a.fov, b.fov, t), roll: lerp(a.roll || 0, b.roll || 0, t) };
    } else c = { pos: lerp3(a.pos, b.pos, t), look: lerp3(a.look, b.look, t), fov: lerp(a.fov, b.fov, t), roll: lerp(a.roll || 0, b.roll || 0, t) };
  }
  c.fov *= 1 - creep * Math.max(0, f - K[0].f) * 0.15; // gentle push-in during holds
  for (const k of kicks) { const d = f - k.f; if (d >= 0 && d < 7) { const s = (d % 2 ? -1 : 1) * k.a * (1 - d / 7); c.look = [c.look[0], c.look[1] + s * 3, c.look[2] + s * 2]; c.roll = (c.roll || 0) + s * 20; } }
  return c;
};
/** Idle life for a card: breathing bob + small sway, deterministic per seed. Use on EVERY on-screen character. */
export const idle = (f, seed = 1) => ({
  bob: 0.006 * Math.sin((f + seed * 11) * 0.11),
  tilt: 1.2 * Math.sin((f + seed * 7) * 0.05),
  headTilt: 1.5 * Math.sin((f + seed * 5) * 0.037 + 1),
});
/** Blink: 4-frame lid every 0.5-2.3 s. */
export const blinkAt = (f, seed) => { const per = 38 + (seed * 17) % 31, ph = (f + seed * 13) % per; return ph < 2 ? 0.5 : ph < 4 ? 1 : 0; };
/** Walk: phase for step cycles + planted travel. speed m/s, stride m. */
export const walk = (f, f0, speed = 1.1, stride = 0.8) => { const t = Math.max(0, f - f0) / 30; return { dist: t * speed, phase: (t * speed / (2 * stride)) % 1 }; };
/** Round values used in card keys so canvas redraws happen only when the pose visibly changes. */
export const q = (x, n = 2) => Math.round(x * 10 ** n) / 10 ** n;

/** v4: largest scale (<=1) at which a flat board/label of world width `w` (m) still fits the frame at `pos` for camera `C` {pos,look,fov}.
 *  Vertical frame: half-width = d * tan(fov/2) * (1080/1920). margin 0.9 leaves a little air at the edges. Use it for every floating text board. */
export const frameHalfWidth = (C, pos) => {
  const f = [C.look[0] - C.pos[0], C.look[1] - C.pos[1], C.look[2] - C.pos[2]], l = Math.hypot(...f) || 1;
  const d = ((pos[0] - C.pos[0]) * f[0] + (pos[1] - C.pos[1]) * f[1] + (pos[2] - C.pos[2]) * f[2]) / l;   // depth along the view axis
  return Math.max(0.05, d) * Math.tan(C.fov * Math.PI / 360) * (1080 / 1920);
};
export const fitScale = (C, pos, w, margin = 0.9) => Math.min(1, (2 * frameHalfWidth(C, pos) * margin) / w);

/** v5 lip-sync: `MOUTH` is the per-frame string written by tools/lipsync.py (web/mouth.js). lipAt returns a mouth kind for the card
 *  option `mouth` ('dash' closed, 'o' small round, 'O' open, 'grin' wide) or undefined when nobody is speaking (keep the expression's mouth).
 *  Use only for the character who is "saying" the line:  man('grin', pos, { mouth: lipAt(MOUTH, f, 1070, 1113) }). */
export const lipAt = (MOUTH, f, a = 0, b = 1e9) => (f < a || f > b || f >= MOUTH.length ? undefined : ({ c: 'dash', o: 'o', O: 'O', g: 'grin' })[MOUTH[f]]);

/** v5 camera presets: each returns an array of keys for camFromKeys (concatenate with spread: [...CAM.dolly({...}), ...CAM.orbit({...})]; later keys win at shared frames).
 *  target = [x,y,z] the camera looks at. All moves are smooth (camFromKeys eases); holds still creep. Distances are metres; angles radians.
 *  dolly      push in/out along a line            CAM.dolly({ f0, f1, target, from, to, fov })
 *  orbit      arc around target (spline path)     CAM.orbit({ f0, f1, target, r, h, a0, a1, fov })       a=0 is +z side, positive turns toward +x
 *  whip       fast pan A -> B with a roll kick    CAM.whip({ f0, f1, a:{pos,look}, b:{pos,look}, fov })  (f1-f0 ~ 5-8 frames)
 *  crane      rise (or sink) while looking at it  CAM.crane({ f0, f1, target, pos, dy, fov })
 *  shoulder   over-the-shoulder: camera behind and beside a foreground actor looking past them at target  CAM.shoulder({ f0, f1, actor, target, side, dist, fov })
 *  dutch      tilted establishing hold            CAM.dutch({ f0, f1, pos, look, roll, fov }) */
export const CAM = {
  dolly: ({ f0, f1, target, from, to, fov = 36, fov2 }) => [{ f: f0, pos: from, look: target, fov }, { f: f1, pos: to, look: target, fov: fov2 ?? fov }],
  orbit: ({ f0, f1, target, r = 6, h = 1.6, a0 = -0.5, a1 = 0.5, fov = 36 }) => {
    const P = (a) => [target[0] + r * Math.sin(a), h, target[2] + r * Math.cos(a)], mid = [0.25, 0.5, 0.75].map((u) => P(lerp(a0, a1, u)));
    return [{ f: f0, pos: P(a0), look: target, fov }, { f: f1, pos: P(a1), look: target, fov, path: mid }];
  },
  whip: ({ f0, f1, a, b, fov = 36, roll = 8 }) => [{ f: f0, pos: a.pos, look: a.look, fov }, { f: (f0 + f1) >> 1, pos: lerp3(a.pos, b.pos, 0.5), look: lerp3(a.look, b.look, 0.5), fov: fov * 1.1, roll, ease: 'easeIn' }, { f: f1, pos: b.pos, look: b.look, fov, roll: 0, ease: 'easeOut' }],
  crane: ({ f0, f1, target, pos, dy = 3, fov = 38 }) => [{ f: f0, pos, look: target, fov }, { f: f1, pos: [pos[0], pos[1] + dy, pos[2]], look: target, fov }],
  shoulder: ({ f0, f1, actor, target, side = 1, dist = 2.2, fov = 34 }) => {
    const d = [target[0] - actor[0], 0, target[2] - actor[2]], l = Math.hypot(d[0], d[2]) || 1, u = [d[0] / l, 0, d[2] / l], n = [-u[2], 0, u[0]];
    const pos = [actor[0] - u[0] * dist + n[0] * 0.55 * side, actor[1] + 1.5, actor[2] - u[2] * dist + n[2] * 0.55 * side];
    return [{ f: f0, pos, look: target, fov }, { f: f1, pos: [pos[0] + u[0] * 0.25, pos[1], pos[2] + u[2] * 0.25], look: target, fov: fov * 0.96 }];
  },
  dutch: ({ f0, f1, pos, look, roll = 9, fov = 40 }) => [{ f: f0, pos, look, fov, roll }, { f: f1, pos, look, fov: fov * 0.96, roll: roll * 0.8 }],
};
