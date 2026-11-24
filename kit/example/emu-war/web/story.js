// Shot plan for "The Great Emu War" — timed to voice.mp3 (38.45 s, 30 fps, 1153 frames).
// Phrase frames: 4-111 "Australia pernah mengirim tentara bersenapan mesin untuk melawan burung." | 123-153 "Burungnya yang menang." |
// 170-230 "Tahun 1932," | 242-337 "dua puluh ribu emu merusak ladang gandum di Australia Barat." | 354-470 "Maka tentara datang membawa dua senapan mesin dan sepuluh ribu peluru." |
// 483-523 "Tapi emu nggak mau berbaris." | 536-621 "Mereka pecah jadi kelompok kecil dan lari ke segala arah." | 641-689 "Menurut hitungan mayornya sendiri," |
// 699-751 "satu emu butuh sepuluh peluru." | 770-800 "Seminggu kemudian," | 807-853 "pemerintah menarik pasukannya." | 869-887 "Belakangan," |
// 899-1057 "petani dengan senapan biasa dan hadiah kecil berhasil melakukan apa yang tentara nggak bisa." | 1074-1095 "Tentara pulang." | 1112-1144 "Emu-nya tetap tinggal."
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp } from './motion.js';
export const FPS = 30, TOTAL = 1153, DECK = 0;
export const SHOTS = [
  { id: 'hook', a: 0, b: 117, light: 'day' },
  { id: 'win', a: 118, b: 169, light: 'day' },
  { id: 'year', a: 170, b: 241, light: 'day' },
  { id: 'emus', a: 242, b: 353, light: 'day' },
  { id: 'army', a: 354, b: 405, light: 'day' },
  { id: 'guns', a: 406, b: 441, light: 'day' },
  { id: 'crates', a: 442, b: 482, light: 'day' },
  { id: 'noline', a: 483, b: 535, light: 'day' },
  { id: 'scatter', a: 536, b: 640, light: 'day' },
  { id: 'major', a: 641, b: 698, light: 'day' },
  { id: 'ten', a: 699, b: 769, light: 'day' },
  { id: 'week', a: 770, b: 806, light: 'golden' },
  { id: 'out', a: 807, b: 868, light: 'golden' },
  { id: 'later', a: 869, b: 898, light: 'day' },
  { id: 'farmers', a: 899, b: 985, light: 'day' },
  { id: 'farmmcu', a: 986, b: 1073, light: 'day' },
  { id: 'home', a: 1074, b: 1111, light: 'golden' },
  { id: 'stay', a: 1112, b: 1152, light: 'golden' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
export const smooth = M.smooth;

// ---------- lights ----------
export const LIGHTS = {
  day: { az: 140, el: 52, sky: '#cfe2f6', ground: '#b08a52', hemi: 1.2, sun: '#fff0d6', sunI: 2.6, fog: '#ecdcc0', fogNear: 70, fogFar: 380,
    skyTop: '#2f78d0', skyHor: '#d6e8f6', sat: 1.12, vig: 0.2, shadowExt: 20 },
  golden: { az: 18, el: 12, sky: '#aa9ac8', ground: '#8a5a3e', hemi: 1.0, sun: '#ffaa5c', sunI: 3.0, fog: '#f2b88a', fogNear: 60, fogFar: 340,
    skyTop: '#6b6cb0', skyHor: '#ffbe78', sunDisc: '#fff0c8', sunSize: 0.0035, sat: 1.14, gain: '#fff0dc', vig: 0.26, shadowExt: 20 },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light] });

// ---------- cameras ----------
// keys { f, pos, look, fov, roll, ease?, path? }; M.smooth glides, every hold creeps.
const CAMS = {
  hook: [
    { f: 0, pos: [-1.55, 1.3, 3.3], look: [-0.9, 1.25, 1.0], fov: 32 },
    { f: 22, pos: [-1.45, 1.3, 3.5], look: [-0.9, 1.25, 1.0], fov: 32 },
    { f: 78, pos: [0.35, 1.5, 10.6], look: [0.4, 1.05, 1.0], fov: 40 },
    { f: 117, pos: [0.35, 1.5, 10.0], look: [0.4, 1.05, 1.0], fov: 39 },
  ],
  win: [
    { f: 118, pos: [0.4, 1.0, 7.4], look: [0.4, 1.15, 1.0], fov: 40 },
    { f: 169, pos: [0.45, 1.05, 6.6], look: [0.45, 1.2, 1.0], fov: 38 },
  ],
  year: [
    { f: 170, pos: [-3.8, 0.8, 7.2], look: [-3.8, 1.55, -0.35], fov: 40 },
    { f: 190, pos: [-3.85, 0.85, 7.6], look: [-3.8, 1.55, -0.35], fov: 40 },
    { f: 241, pos: [-8.5, 4.2, 13], look: [2, 2.6, -24], fov: 46, path: [[-4.5, 1.8, 7]] },
  ],
  emus: [
    { f: 242, pos: [-8.5, 1.3, 5.2], look: [-1, 1.3, -8], fov: 44 },
    { f: 353, pos: [6.5, 1.5, 4.8], look: [1.5, 1.2, -9], fov: 44 },
  ],
  army: [
    { f: 354, pos: [4.5, 1.35, 10.5], look: [-10, 1.8, 4], fov: 42 },
    { f: 405, pos: [3.0, 1.45, 10.2], look: [-8, 1.8, 3.8], fov: 40 },
  ],
  guns: [
    { f: 406, pos: [-7.4, 1.35, 11.4], look: [-5.9, 0.8, 5.9], fov: 38 },
    { f: 441, pos: [-4.4, 1.3, 11.0], look: [-5.2, 0.8, 5.9], fov: 36 },
  ],
  crates: [
    { f: 442, pos: [-5.8, 1.7, 12.0], look: [-6.5, 0.7, 6.8], fov: 38 },
    { f: 482, pos: [-6.1, 1.6, 11.2], look: [-6.5, 0.8, 6.8], fov: 34 },
  ],
  noline: [
    { f: 483, pos: [-0.7, 1.6, 10.5], look: [-0.7, 1.0, 0.5], fov: 40 },
    { f: 535, pos: [-0.5, 1.5, 9.7], look: [-0.7, 1.0, 0.5], fov: 38 },
  ],
  scatter: [
    { f: 536, pos: [-1.1, 1.3, 5.6], look: [0, 1.0, -8], fov: 46 },
    { f: 572, pos: [-1.1, 1.3, 5.3], look: [0, 1.0, -8], fov: 46 },
    { f: 592, pos: [-1.1, 1.35, 5.3], look: [7, 1.0, -7], fov: 46, ease: 'easeOut' },
    { f: 640, pos: [-0.5, 5.5, 8.5], look: [0, 0.2, -10], fov: 52 },
  ],
  major: [
    { f: 641, pos: [0.1, 1.2, 4.6], look: [0.05, 1.1, 1.0], fov: 32 },
    { f: 698, pos: [0.1, 1.2, 4.0], look: [0.05, 1.1, 1.0], fov: 30, roll: 2 },
  ],
  ten: [
    { f: 699, pos: [-0.1, 1.15, 7.2], look: [0, 1.1, 1.2], fov: 42 },
    { f: 769, pos: [-0.1, 1.1, 6.4], look: [0, 1.1, 1.2], fov: 38 },
  ],
  week: [
    { f: 770, pos: [3.2, 1.0, 7.0], look: [0.8, 0.95, 1.2], fov: 40 },
    { f: 806, pos: [2.8, 1.0, 6.2], look: [0.8, 0.95, 1.2], fov: 38 },
  ],
  out: [
    { f: 807, pos: [3.0, 1.8, 13.0], look: [-4, 1.5, 3.8], fov: 44 },
    { f: 868, pos: [4.5, 1.8, 12.5], look: [2.5, 1.6, 3.8], fov: 44 },
  ],
  later: [
    { f: 869, pos: [-1.6, 1.4, 8.8], look: [-2.2, 1.25, 0.9], fov: 42 },
    { f: 898, pos: [-1.8, 1.4, 7.6], look: [-2.2, 1.25, 0.9], fov: 40 },
  ],
  farmers: [
    { f: 899, pos: [-0.2, 1.3, 9.0], look: [-0.5, 1.2, 0.5], fov: 46 },
    { f: 985, pos: [0.1, 1.3, 8.0], look: [-0.3, 1.2, 0.5], fov: 44 },
  ],
  farmmcu: [
    { f: 986, pos: [0.1, 1.3, 3.4], look: [0.3, 1.25, 1.0], fov: 30 },
    { f: 1073, pos: [0.15, 1.3, 3.0], look: [0.3, 1.25, 1.0], fov: 27, roll: -2 },
  ],
  home: [
    { f: 1074, pos: [-8, 1.4, 11], look: [-2, 1.6, 3.8], fov: 44 },
    { f: 1111, pos: [-6, 1.4, 11], look: [3, 1.6, 3.8], fov: 44 },
  ],
  stay: [
    { f: 1112, pos: [0.2, 1.3, 13.5], look: [0.1, 1.2, 1.5], fov: 36 },
    { f: 1152, pos: [0.1, 1.35, 6.8], look: [0.05, 1.4, 1.5], fov: 33 },
  ],
};
const KICKS = [{ f: 121, a: 0.05 }, { f: 172, a: 0.03 }, { f: 406, a: 0.04 }, { f: 442, a: 0.04 }, { f: 548, a: 0.03 }, { f: 554, a: 0.03 }, { f: 560, a: 0.03 }, { f: 575, a: 0.04 }, { f: 1139, a: 0.05 }];
const FLASHES = [[170, 6, 0.9], [770, 6, 0.9], [869, 6, 0.9]];
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, { kicks: KICKS });
  c.flash = 0;
  for (const [a, n, k] of FLASHES) if (f >= a && f < a + n) c.flash = (1 - (f - a) / n) * k;
  if (S.id === 'scatter') c.shadowAt = [0, 0, -4];
  else if (S.id === 'emus') c.shadowAt = [0, 0, -4];
  else if (S.id === 'year') c.shadowAt = [-2, 0, -4];
  return c;
};

// ---------- lens ----------
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  switch (S.id) {
    case 'hook': return f < 60 ? { focus: dist(C.pos, [-0.8, 1.2, 1.0]), cinf: lerp(11, 0, smooth(ramp(f, 30, 70))) } : { focus: 8, cinf: 0 };
    case 'win': return { focus: dist(C.pos, [1.0, 1.4, 1.0]), cinf: 7 };
    case 'year': return { focus: f < 195 ? dist(C.pos, [-3.8, 1.6, -0.35]) : 28, cinf: f < 195 ? 9 : lerp(9, 2, smooth(ramp(f, 195, 235))) };
    case 'emus': return { focus: 14, cinf: 3 };
    case 'army': return { focus: 14, cinf: 3 };
    case 'guns': return { focus: dist(C.pos, [-5.1, 0.8, 6.0]), cinf: 13 };
    case 'crates': return { focus: dist(C.pos, [-6.2, 0.9, 7.0]), cinf: 12 };
    case 'noline': return { focus: dist(C.pos, [-1.2, 1.1, 1.5]), cinf: 4 };
    case 'scatter': return { focus: dist(C.pos, [0, 1, -6]), cinf: 3 };
    case 'major': return { focus: dist(C.pos, [0.05, 1.2, 1.0]), cinf: 12 };
    case 'ten': return { focus: dist(C.pos, [0, 1.0, 1.0]), cinf: 12 };
    case 'week': return { focus: dist(C.pos, [-1.1, 1.0, 1.2]), cinf: 8 };
    case 'out': return { focus: 14, cinf: 2 };
    case 'later': return { focus: dist(C.pos, [-1.8, 1.2, 1.0]), cinf: 8 };
    case 'farmers': return { focus: dist(C.pos, [0, 1.2, 0.5]), cinf: 3 };
    case 'farmmcu': return { focus: dist(C.pos, [0.3, 1.25, 1.0]), cinf: 13 };
    case 'home': return { focus: 14, cinf: 3 };
    case 'stay': return { focus: dist(C.pos, [0.05, 1.15, 1.5]), cinf: lerp(0, 11, smooth(ramp(f, 1118, 1146))) };
  }
  return { focus: 10, cinf: 0 };
};

// ---------- deterministic rng + layouts ----------
const rngf = (seed) => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const FLOCK = (() => { const r = rngf(404); return Array.from({ length: 44 }, (_, i) => ({
  x: (r() - 0.5) * 24, z: i < 26 ? -3.5 - r() * 12 : -16 - r() * 22, seed: i + 1, flip: r() < 0.5, v: i % 3, ph: r() * 6 })); })();
const TRUCK_STOP = [-6.6, 3.9];
const truckAt = (f) => {
  let x, spin = 0;
  if (f < 354) return null;
  if (f <= 405) { const t = clamp((f - 354) / 52); x = lerp(-34, TRUCK_STOP[0], M.easeOut(t)); spin = x * 1.8; }
  else if (f < 828) { x = TRUCK_STOP[0]; spin = x * 1.8; }
  else if (f <= 868) { const t = (f - 828) / 30; x = TRUCK_STOP[0] + 0.5 * 5.5 * t * t * 2.2; spin = x * 1.8; }
  else if (f < 1074) return null;
  else if (f <= 1111) { x = lerp(-13, 17, (f - 1074) / 37); spin = x * 1.8; }
  else return null;
  const z = f >= 1074 ? 3.0 : TRUCK_STOP[1];
  return { x, z, spin, yaw: 0 };
};

// ---------- world state ----------
export const worldAt = (f) => {
  const S = shotAt(f), W = { truck: truckAt(f), guns: null, crates: null, bullets: null, signBounty: 0, sign1932: true };
  const gunFire = (f0, f1) => { let rec = 0; for (let t = f0; t <= f1; t += 3) { const d = f - t; if (d >= 0 && d < 3) rec = 0.05 * (1 - d / 3); } return rec; };
  if (['year'].includes(S.id)) W.sign1932 = true;
  if (S.id === 'hook') W.guns = [{ x: -0.1, y: 0.74, z: 1.5, yaw: 0.05 }];
  if (S.id === 'guns' || S.id === 'crates') { W.guns = [{ x: -5.9, y: 0.74, z: 6.1, yaw: -0.05 }, { x: -5.2, y: 0.74, z: 5.5, yaw: -0.1 }]; }
  if (S.id === 'crates') W.crates = [-6.9, 0, 6.6];
  if (S.id === 'noline') W.guns = [{ x: -3.4, y: 0.74, z: 2.6, yaw: Math.PI / 2 - 0.2 }];
  if (S.id === 'scatter') W.guns = [{ x: -1.0, y: 0.74, z: 2.4, yaw: Math.PI / 2 - 0.05, rec: gunFire(548, 600) + gunFire(604, 628) }];
  if (S.id === 'week') W.guns = [{ x: 2.3, y: 0.12, z: 2.4, yaw: 2.9, pitch: 0.0 }];
  if (S.id === 'ten') W.bullets = { x: 0, y: 0, z: 2.9, s: 1.25, n: clamp((f - 712) / 3.6 + 1, 0, 10) };
  if (S.id === 'later') W.signBounty = M.back(ramp(f, 872, 884));
  if (['farmers', 'farmmcu'].includes(S.id)) W.signBounty = 1;
  return W;
};

// ---------- actors (2D cards) ----------
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], s: 0.9, ...extra });
const camRight = (f) => { const C = camAt(f), fx = C.look[0] - C.pos[0], fz = C.look[2] - C.pos[2]; const l = Math.hypot(fx, fz) || 1; return [-fz / l, fx / l]; };
const EMU = (f, T, id, x, z, o = {}) => {
  const steps = 8, ph = Math.floor((((o.phase ?? 0) % 1) + 1) % 1 * steps) / steps;
  const opts = { phase: ph, neck: o.neck ?? 0.65, head: o.head ?? 0, eye: o.eye ?? 'open', run: o.run ? 1 : 0, v: o.v ?? 0, blink: o.blink ?? 0, peck: o.peck ?? 0 };
  return { key: 'emu' + JSON.stringify(opts), draw: (p) => T.emuSide(p, opts), x, y: o.y ?? 0, z, s: o.s ?? 1.15, flip: !!o.flip, low: !o.hi, shadow: o.shadow ?? true, tint: o.tint, order: o.order };
};
const q4 = (x) => Math.round(x * 4) / 4;
const grazing = (f, e, flip) => ({ peck: q4(clamp(0.55 + 0.9 * Math.sin(f * 0.11 + e.seed * 5), 0, 1)), neck: 0.55, v: e.v, flip: flip ?? e.flip, blink: blinkAt(f, e.seed) ? 1 : 0, phase: 0 });

export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [], gold = S.light === 'golden', tint = gold ? '#ffe2c8' : '#ffffff';
  const hero = (who, o, pos, extra = {}) => out.push(R(T, who, { seed: 3, blink: blinkAt(f, 3), ...o }, pos, { tint, ...extra }));
  const soldierIdle = (seed) => { const i = idle(f, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1) }; };
  switch (S.id) {
    case 'hook': {
      const slow = M.smooth(ramp(f, 80, 100));
      hero('gunner', { seed: 3, L: 'hang', R: 'point', expr: f < 80 ? 'stern' : 'nervous', facing: 1, look: 0.6, ...soldierIdle(3) }, [-0.75, 0, 1.0]);
      out.push(EMU(f, T, 1, 1.55, 1.0, { flip: true, neck: 0.95, eye: f > 84 ? 'angry' : 'side', v: 1, hi: true, blink: blinkAt(f, 5) ? 1 : 0, head: q(slow, 1) }));
      break;
    }
    case 'win': {
      const kick = M.back(ramp(f, 119, 134));
      hero('gunner', { seed: 3, L: 'cheek', R: 'cheek', expr: 'dazed', facing: 1, look: 0, headTilt: q(10 + 2 * Math.sin(f * 0.1), 1), tilt: -3, bob: -0.01 }, [-0.55, 0, 1.0], { order: 2 });
      out.push(EMU(f, T, 1, 0.95, 1.0, { flip: true, neck: q(0.75 + 0.25 * kick, 2), eye: 'smug', v: 1, hi: true, s: 1.05, blink: blinkAt(f, 5) ? 1 : 0, head: q(Math.sin(f * 0.2) * 0.5, 1) }));
      break;
    }
    case 'year': {
      // a lone emu shuffling past the sign, small
      out.push(EMU(f, T, 2, -1.2 + (f - 170) * 0.01, 1.0, { flip: false, neck: 0.5, peck: q4(clamp(0.5 + 0.8 * Math.sin(f * 0.12), 0, 1)), v: 0, shadow: false }));
      break;
    }
    case 'emus': {
      FLOCK.forEach((e) => out.push(EMU(f, T, e.seed, e.x + Math.sin(f * 0.01 + e.ph) * 0.4, e.z, { ...grazing(f, e), shadow: e.z > -10, s: 1.15 })));
      hero('farmA', { seed: 5, L: 'up', R: 'wave', wv: q(f * 0.35, 1), expr: 'pained', facing: 1, look: -0.5, ...soldierIdle(5) }, [0.9, 0, 0.1], { order: 3 });
      hero('farmB', { seed: 6, L: 'cheek', R: 'cheek', expr: f > 300 ? 'shock' : 'nervous', facing: -1, look: 0.5, blink: blinkAt(f, 6), ...soldierIdle(6) }, [2.5, 0, 0.35], { order: 3 });
      break;
    }
    case 'army': case 'out': case 'home': {
      const T_ = truckAt(f); if (!T_) break;
      const slots = S.id === 'home' ? [-2.2, -1.2, -0.2] : [-2.3, -1.4, -0.5];
      const who = ['gunner', 'gunnerB', 'gunnerC'];
      const hop = S.id === 'out' ? ramp(f, 807, 826) : 1;
      slots.forEach((dx, i) => {
        const sx = T_.x + dx, sz = T_.z + (i % 2 ? 0.35 : -0.3), tx = sx, from = [-3.5 - i * 1.0, 0, 5.5];
        const k = S.id === 'out' ? M.smooth(clamp(hop * 1.25 - i * 0.12)) : 1, jump = S.id === 'out' ? Math.sin(Math.PI * clamp(k)) * 0.5 : 0;
        const pos = [lerp(from[0], tx, k), 1.29 * k + jump, lerp(from[2], sz, k)];
        const sad = S.id === 'out' || S.id === 'home';
        hero(who[i], { seed: 3 + i * 2, L: sad ? 'cheek' : 'hang', R: 'hang', expr: sad ? 'dazed' : 'stern', facing: 1, look: 0.3, headTilt: sad ? q(10 + 2 * Math.sin(f * 0.1 + i), 1) : q(2 * Math.sin(f * 0.1 + i), 1), tilt: q(1.5 * Math.sin(f * 0.07 + i), 1), blink: blinkAt(f, 7 + i), bob: q(0.006 * Math.sin(f * 0.4 + i), 3) }, pos, { order: 3, blob: false });
      });
      break;
    }
    case 'guns': case 'crates': {
      hero('gunner', { seed: 3, L: 'hang', R: 'hang', expr: 'stern', facing: 1, look: 0.4, blink: blinkAt(f, 3), ...soldierIdle(3) }, [-8.0, 0, 7.4], { order: 2 });
      hero('gunnerB', { seed: 5, L: 'hip', R: 'hang', expr: 'neutral', facing: 1, look: 0.2, blink: blinkAt(f, 5), ...soldierIdle(5) }, [-4.0, 0, 7.2], { order: 2 });
      break;
    }
    case 'noline': {
      const who = ['gunner', 'gunnerB', 'gunnerC'];
      [-2.1, -1.3, -0.5].forEach((x, i) => hero(who[i], { seed: 3 + i * 2, L: 'hang', R: 'hang', expr: 'stern', facing: 1, look: 0.5, blink: blinkAt(f, 3 + i), ...soldierIdle(3 + i) }, [x, 0, 1.6 - (i % 2) * 0.02], { order: 3 }));
      const E = [[0.6, -2.0], [-1.9, -3.4], [1.5, -3.0], [-0.4, -5.0], [2.2, -5.2], [-2.7, -6.2], [0.9, -7.6], [-1.3, -8.4]];
      E.forEach(([x, z], i) => {
        const t = f - 483, dir = i % 2 ? 1 : -1, wander = Math.sin(t * 0.04 + i) * 0.7;
        const turn = i === 0 && t > 20; // the nearest emu turns its back on the soldiers
        out.push(EMU(f, T, 20 + i, x + wander * 0.6, z + (i % 3) * Math.sin(t * 0.03 + i) * 0.5, { flip: turn ? false : i % 3 === 1 ? true : dir > 0, neck: 0.6 + 0.2 * Math.sin(t * 0.05 + i), peck: i % 2 ? q4(clamp(0.5 + 0.9 * Math.sin(t * 0.1 + i), 0, 1)) : 0, eye: turn ? 'smug' : 'open', phase: i % 2 ? 0 : Math.floor(t / 6) / 8, v: i % 3, blink: blinkAt(f, 11 + i) ? 1 : 0 }));
      });
      break;
    }
    case 'scatter': {
      hero('gunner', { seed: 3, L: 'point', R: 'point', expr: f < 548 ? 'stern' : 'shock', facing: 1, look: 0.2, ...soldierIdle(3), bob: f >= 548 && f % 3 === 0 && f < 628 ? 0.012 : 0 }, [-1.7, 0, 2.5], { order: 3 });
      hero('gunnerB', { seed: 5, L: 'hang', R: 'hip', expr: 'nervous', facing: 1, look: 0.2, ...soldierIdle(5) }, [-2.8, 0, 2.2], { order: 3 });
      const t = f - 556;
      FLOCK.slice(0, 22).forEach((e, i) => {
        const ang = ((i % 6) / 6) * Math.PI * 2 + 0.4 + (i % 3) * 0.2, bx = (i % 5 - 2) * 0.8, bz = -8 - (i % 4) * 0.9;
        const dirx = Math.cos(ang), dirz = Math.sin(ang) * 0.8 - 0.25, run = t > i * 0.8, tt = Math.max(0, t - i * 0.8), sp = 0.19 + (i % 4) * 0.02;
        const x = run ? bx + dirx * tt * sp * 1.3 : bx, z = run ? bz + dirz * tt * sp * 1.3 : bz;
        const flipRun = (dirx * camRight(f)[0] + dirz * camRight(f)[1]) < 0;
        out.push(EMU(f, T, e.seed, x, z, { run: run, phase: run ? tt * 0.11 : 0, neck: run ? 0.8 : 0.9, eye: run ? 'wide' : f > 546 ? 'wide' : 'open', flip: run ? flipRun : e.flip, v: e.v, shadow: i < 12 }));
      });
      break;
    }
    case 'major': {
      const writing = Math.sin(f * 0.45) > 0 ? 'down' : 'up';
      hero('major', { seed: 8, L: 'belly', R: 'belly', expr: f > 672 ? 'dazed' : 'stern', facing: 0, look: -0.4, ...soldierIdle(8), blink: blinkAt(f, 8) }, [0.05, 0, 1.0], { order: 2 });
      const n = Math.floor(ramp(f, 645, 690) * 10);
      out.push({ key: 'tally' + n, draw: (p) => T.fxTally(p, n), x: 0.12, y: 0.36, z: 1.5, s: 0.55, blob: false, shadow: false, order: 4, roll: q((-4 + (writing === 'down' ? 1.5 : 0)) * Math.PI / 180, 3) });
      break;
    }
    case 'ten': {
      out.push(EMU(f, T, 1, 0, 1.0, { flip: true, neck: 0.85, eye: f > 748 ? 'smug' : f > 722 ? 'wide' : 'open', v: 1, hi: true, s: 1.25, head: q(Math.sin(f * 0.15) * 0.4, 1), blink: blinkAt(f, 5) && f < 722 ? 1 : 0 }));
      break;
    }
    case 'week': {
      const who = ['gunner', 'gunnerB'];
      [[0.1, 1.5], [1.2, 1.2]].forEach(([x, z], i) => hero(who[i], { seed: 3 + i * 2, L: 'cheek', R: 'hang', expr: i ? 'pained' : 'dazed', facing: 1, look: 0, headTilt: q(14 + 2 * Math.sin(f * 0.09 + i), 1), tilt: q(-4 + Math.sin(f * 0.05 + i), 1), bob: -0.015, blink: blinkAt(f, 3 + i) }, [x, 0, z], { order: 3 }));
      const E = [[2.6, -2.0], [0.6, -4.5], [-1.6, -3.6], [3.4, -6.0], [-0.9, -8.0]];
      E.forEach(([x, z], i) => out.push(EMU(f, T, 40 + i, x, z, { flip: i % 2 === 0, neck: 0.55, peck: q4(clamp(0.5 + 0.9 * Math.sin(f * 0.1 + i * 2), 0, 1)), v: i % 3, blink: blinkAt(f, 3 + i) ? 1 : 0, tint })));
      // one emu strolls through the foreground
      out.push(EMU(f, T, 99, 5.2 - (f - 770) * 0.11, 3.6, { flip: true, neck: 0.78, phase: (f - 770) * 0.03, eye: 'smug', v: 2, tint }));
      break;
    }
    case 'later': {
      const swing = Math.sin((f - 872) * 0.7), hit = swing > 0.7 && f > 876;
      hero('farmB', { seed: 6, L: hit ? 'up' : 'wave', R: 'hang', wv: q(f * 0.7, 1), expr: 'grin', facing: 1, look: 0.7, blink: blinkAt(f, 6), ...soldierIdle(6) }, [-1.2, 0, 1.4], { order: 3 });
      hero('farmA', { seed: 5, L: 'hang', R: 'point', expr: 'smile', facing: -1, look: -0.5, blink: blinkAt(f, 5), ...soldierIdle(5) }, [-3.7, 0, 1.0], { order: 3 });
      break;
    }
    case 'farmers': {
      const who = ['farmA', 'farmB', 'farmC'];
      [[-1.3, 0.5], [0.0, 0.9], [1.3, 0.4]].forEach(([x, z], i) => {
        hero(who[i], { seed: 5 + i, L: 'hang', R: 'hang', expr: f > 930 ? 'grin' : 'stern', facing: 1, look: 0.3, blink: blinkAt(f, 5 + i), ...soldierIdle(5 + i), tilt: q(-3 + Math.sin(f * 0.06 + i), 1) }, [x, 0, z], { order: 3 });
        out.push({ key: 'rifle', draw: (p) => T.fxRifle(p), x: x + 0.45, y: 0.62, z: z + 0.1, s: 0.55, blob: false, shadow: false, order: 4, roll: q(0.18 + 0.02 * Math.sin(f * 0.1 + i), 2), flip: false });
      });
      // emus flee into the wheat
      FLOCK.slice(0, 14).forEach((e, i) => {
        const t = f - 899, run = t > i * 3, tt = Math.max(0, t - i * 3);
        const ang = ((i % 7) / 7) * Math.PI - Math.PI * 0.05 - 0.2, dirx = Math.cos(ang) * (i % 2 ? 1 : -1), dirz = -0.5 - (i % 3) * 0.1;
        const x0 = (i % 5 - 2) * 1.5, z0 = -4.5 - (i % 4) * 1.1, x = x0 + dirx * tt * 0.2, z = z0 + dirz * tt * 0.18;
        const flipRun = (dirx * camRight(f)[0] + dirz * camRight(f)[1]) < 0;
        out.push(EMU(f, T, e.seed, run ? x : x0, run ? z : z0, { run, phase: run ? tt * 0.12 : 0, neck: run ? 0.82 : 0.6, peck: run ? 0 : q4(clamp(0.5 + 0.9 * Math.sin(f * 0.1 + i), 0, 1)), eye: run ? 'wide' : 'open', flip: run ? flipRun : e.flip, v: e.v, shadow: i < 8 }));
      });
      break;
    }
    case 'farmmcu': {
      const t = f - 986;
      hero('farmB', { seed: 6, L: 'thumb', R: 'hang', expr: f > 1010 ? 'laugh' : 'grin', facing: 0, look: -0.2, blink: blinkAt(f, 6), ...soldierIdle(6), bob: q(0.006 * Math.sin(f * 0.3), 3) }, [0.3, 0, 1.0], { order: 2 });
      out.push({ key: 'rifle', draw: (p) => T.fxRifle(p), x: 0.75, y: 0.5, z: 1.2, s: 0.7, blob: false, shadow: false, order: 4, roll: 1.1 });
      hero('farmA', { seed: 5, L: 'up', R: 'up', expr: 'laugh', facing: -1, look: 0, ...soldierIdle(5), bob: q(Math.abs(Math.sin(f * 0.3)) * 0.02, 3) }, [-1.2, 0, 0.0], { order: 2 });
      hero('farmC', { seed: 7, L: 'wave', R: 'hang', wv: q(f * 0.4, 1), expr: 'grin', facing: -1, look: 0, ...soldierIdle(7) }, [1.9, 0, -0.2], { order: 2 });
      for (let i = 0; i < 3; i++) { const k = (t - 22 - i * 16) / 28; if (k > 0 && k < 1) out.push({ key: 'coin', draw: (p) => T.fxCoin(p), x: 0.0 + i * 0.28, y: 0.9 + Math.sin(k * Math.PI) * 0.85, z: 1.9, s: 0.34, blob: false, shadow: false, order: 5, roll: q(k * 12, 1) }); }
      break;
    }
    case 'stay': {
      const k = f - 1112, turn = M.smooth(ramp(f, 1130, 1142));
      out.push(EMU(f, T, 1, 0.05, 1.5, { flip: turn < 0.5, neck: q(0.75 + 0.2 * Math.sin(Math.max(0, f - 1132) * 0.3) * (f > 1132 ? 1 : 0), 2), eye: f > 1128 ? 'smug' : 'open', v: 1, hi: true, s: 1.3, tint, head: q(Math.sin(f * 0.2) * 0.5, 1), blink: (f > 1144 && f < 1148) || (f < 1126 && blinkAt(f, 5)) ? 1 : 0 }));
      break;
    }
  }
  return out;
};

// ---------- 2D effects ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [], gold = S.light === 'golden', col = gold ? '#e8b890' : '#e3b890';
  // truck dust
  const T_ = truckAt(f);
  if (T_ && (S.id === 'army' || S.id === 'out' || S.id === 'home')) {
    const moving = S.id === 'army' ? f < 400 : S.id === 'out' ? f > 832 : true;
    if (moving) for (let i = 0; i < 4; i++) { const k = q(((f * 0.045 + i / 4) % 1), 2); out.push(FX('dust' + k, (p) => T.fxDust(p, k, col), [T_.x - 3.3 - k * 3.2, 0.5 + k * 0.5, T_.z + (i % 2 ? 0.4 : -0.4)], 1.4 + k * 1.2, { low: true, alpha: 0.9 - k * 0.5 })); }
  }
  // gunfire flashes
  const burst = (f0, f1, pos, step = 3) => { for (let t = f0; t <= f1; t += step) { const d = f - t; if (d >= 0 && d < 2) out.push(FX('flash' + d, (p) => T.fxFlash(p, d / 2), pos, 0.7, { low: true })); } };
  if (S.id === 'scatter') { burst(548, 600, [-1.0, 0.8, 1.05], 3); burst(604, 628, [-1.0, 0.8, 1.05], 4); }
  if (S.id === 'farmers') for (let i = 0; i < 3; i++) burst(910 + i * 7, 980, [[-1.3, 0.95, 0.4], [0.0, 0.95, 0.8], [1.3, 0.95, 0.3]][i].map((v, k) => k === 0 ? v + 1.05 : v), 21);
  // dust from running emus
  if (S.id === 'scatter' && f > 556) for (let i = 0; i < 8; i++) { const k = q(((f * 0.07 + i / 8) % 1), 2), a = FLOCK[i]; const ang = ((i % 6) / 6) * Math.PI * 2 + 0.4 + (i % 3) * 0.2, tt = Math.max(0, f - 556 - i * 0.8); const x = (i % 5 - 2) * 0.8 + Math.cos(ang) * tt * 0.25, z = -8 - (i % 4) * 0.9 + (Math.sin(ang) * 0.8 - 0.25) * tt * 0.25; out.push(FX('ed' + k, (p) => T.fxDust(p, k, col), [x - 0.3, 0.2, z], 0.5 + k * 0.4, { low: true, alpha: 0.7 })); }
  // hammer-bonk puff
  if (S.id === 'later' && f > 876) { const sw = Math.sin((f - 872) * 0.7); if (sw > 0.7) { const t = q(((f - 872) % 9) / 9, 2); out.push(FX('puff' + t, (p) => { p.g.translate(150, 600); T.fxPuff(p, t); }, [-1.9, 1.5, 1.5], 0.35, { low: true })); } }
  // time-jump motes
  if (S.id === 'stay') for (let i = 0; i < 3; i++) { const k = q(((f * 0.03 + i / 3) % 1), 2); out.push(FX('mote' + k, (p) => T.fxDust(p, k, col), [1.2 + i * 0.8, 0.2, 8.5 - k * 3], 0.7 + k, { low: true, alpha: 0.5 - k * 0.3 })); }
  return out;
};
