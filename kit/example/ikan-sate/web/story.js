// "Ikan vs Sate Ayam" — timed to voice.mp3 (38.16 s, 1144 frames @ 30 fps). Facts hedged in the VO. Generic cartoon people + 3D fish.
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp, lipAt } from './motion.js';
import { MOUTH } from './mouth.js';   // v5: python3 kit/tools/lipsync.py words.json web/mouth.js --total 1144
export const FPS = 30, TOTAL = 1144, DECK = -9999;
const U_ = -2000;                                   // underwater set offset (z)
const U = (p) => [p[0], p[1], p[2] + U_];
export const SHOTS = [
  { id: 'hook', a: 0, b: 97, set: 'under', light: 'under' },
  { id: 'tes', a: 98, b: 124, set: 'bank', light: 'day' },
  { id: 'skewer', a: 125, b: 168, set: 'bank', light: 'day' },
  { id: 'drop', a: 169, b: 200, set: 'bank', light: 'day' },
  { id: 'sink', a: 201, b: 209, set: 'under', light: 'under' },
  { id: 'lele', a: 210, b: 254, set: 'under', light: 'under' },
  { id: 'cichlid', a: 255, b: 306, set: 'under', light: 'under' },
  { id: 'curiga', a: 307, b: 355, set: 'under', light: 'under' },
  { id: 'serbu', a: 356, b: 385, set: 'under', light: 'under' },
  { id: 'memang', a: 386, b: 409, set: 'under', light: 'under' },
  { id: 'polos', a: 410, b: 457, set: 'under', light: 'under' },
  { id: 'polos2', a: 458, b: 504, set: 'under', light: 'under' },
  { id: 'sedikit', a: 505, b: 561, set: 'under', light: 'under' },
  { id: 'tapi', a: 562, b: 601, set: 'under', light: 'under' },
  { id: 'ing', a: 602, b: 705, set: 'under', light: 'under' },
  { id: 'ingatkan', a: 706, b: 763, set: 'bank', light: 'day' },
  { id: 'buruk', a: 764, b: 822, set: 'under', light: 'under' },
  { id: 'minyak', a: 823, b: 898, set: 'under', light: 'under' },
  { id: 'juara', a: 899, b: 974, set: 'under', light: 'under' },
  { id: 'kalah', a: 975, b: 1026, set: 'under', light: 'under' },
  { id: 'rumah', a: 1027, b: 1069, set: 'bank', light: 'day' },
  { id: 'kamu', a: 1070, b: 1113, set: 'bank', light: 'day' },
  { id: 'bukan', a: 1114, b: 1143, set: 'bank', light: 'day' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const smooth = M.smooth;
const WATER = { waterDeep: '#000', waterShal: '#000', glint: '#000' };
const DAY = { az: 60, el: 55, sky: '#bfe3ff', ground: '#7aa84e', hemi: 1.15, sun: '#fff1d6', sunI: 2.2, fog: '#cfe9ff', fogNear: 160, fogFar: 900, skyTop: '#6fb8ff', skyHor: '#d4ecff', sat: 1.1, vig: 0.2, shadowExt: 18, ...WATER };
const UNDER = { az: 100, el: 70, sky: '#8fdcf0', ground: '#2a7f9a', hemi: 1.35, sun: '#e6fbff', sunI: 1.1, fog: '#2f9ab8', fogNear: 8, fogFar: 36, skyTop: '#2f9ab8', skyHor: '#2f9ab8', sat: 1.12, vig: 0.3, shadowExt: 14, ...WATER };
export const LIGHTS = { day: DAY, under: UNDER };
const murkAt = (f) => 0.85 * smooth(ramp(f, 826, 885)) + 0.15 * smooth(ramp(f, 980, 1005));
const mix = (a, b, t) => { const h = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)); const A = h(a), B = h(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, '0')).join(''); };
export const lightFor = (S, f) => {
  const L = { ...LIGHTS[S.light] };
  if (S.light === 'under') { const k = murkAt(f); L.fog = mix(UNDER.fog, '#6c7a34', k); L.skyTop = L.skyHor = L.fog; L.sky = mix(UNDER.sky, '#c8c07a', k); L.ground = mix(UNDER.ground, '#4a5a2a', k); L.fogNear = lerp(8, 4, k); L.fogFar = lerp(36, 22, k);
    if (S.id === 'tapi') { const t = ramp(f, 562, 600); L.vig = 0.42 + 0.1 * t; L.sunI = 1.1 + 0.6 * smooth(ramp(f, 562, 575)); } }
  return L;
};

// ---------- cameras ----------
const CAMS = {
  hook: [{ f: 0, pos: U([-0.2, 0.4, 9.4]), look: U([0.45, 0.2, 2.2]), fov: 38 }, { f: 97, pos: U([0.2, 0.45, 8.0]), look: U([0.7, 0.35, 2.0]), fov: 36 }],
  tes: [{ f: 98, pos: [0.6, 1.45, 5.0], look: [1.7, 1.25, -0.6], fov: 36 }, { f: 124, pos: [0.9, 1.45, 4.5], look: [1.7, 1.3, -0.6], fov: 34 }],
  skewer: [{ f: 125, pos: [0.7, 1.75, 4.6], look: [1.5, 1.5, 0.3], fov: 32 }, { f: 168, pos: [1.0, 1.8, 4.2], look: [1.5, 1.45, 0.3], fov: 32 }],
  drop: [{ f: 169, pos: [3.4, 3.4, 7.2], look: [1.0, 1.4, -2.0], fov: 46 }, { f: 200, pos: [2.6, 2.8, 6.4], look: [0.9, 0.6, -3.0], fov: 46 }],
  sink: [{ f: 201, pos: U([0.2, 1.0, 11]), look: U([0.7, 1.2, 0]), fov: 46 }, { f: 209, pos: U([0.0, 0.9, 10.5]), look: U([0.7, 1.0, 0]), fov: 46 }],
  lele: [{ f: 210, pos: U([-1.2, 0.5, 8]), look: U([-0.7, 0.2, 0]), fov: 38 }, { f: 254, pos: U([-0.9, 0.5, 6.8]), look: U([-0.7, 0.25, 0]), fov: 36 }],
  cichlid: [{ f: 255, pos: U([1.8, 0.55, 8]), look: U([1.2, 0.2, 0]), fov: 38 }, { f: 306, pos: U([1.4, 0.55, 6.8]), look: U([1.2, 0.25, 0]), fov: 36 }],
  curiga: [{ f: 307, pos: U([0.0, 0.35, 9.5]), look: U([0, 0.3, 0]), fov: 46 }, { f: 355, pos: U([0, 0.4, 7.8]), look: U([0, 0.35, 0]), fov: 46 }],
  serbu: [{ f: 356, pos: U([0, 0.5, 12.5]), look: U([0, 0.4, 0]), fov: 52 }, { f: 385, pos: U([0.2, 0.55, 9.5]), look: U([0.4, 0.45, 0]), fov: 50 }],
  memang: [{ f: 386, pos: U([0.3, 0.55, 6.2]), look: U([0.45, 0.4, 0]), fov: 38 }, { f: 409, pos: U([0.5, 0.6, 5.6]), look: U([0.5, 0.42, 0]), fov: 36 }],
  polos: [{ f: 410, pos: U([-0.6, 0.7, 6.0]), look: U([0.3, 0.45, 0]), fov: 40 }, { f: 457, pos: U([0.4, 0.8, 6.4]), look: U([0.3, 0.5, 0]), fov: 40 }],
  polos2: [{ f: 458, pos: U([0.9, 0.7, 7.2]), look: U([0.1, 0.5, 0]), fov: 44 }, { f: 504, pos: U([-0.2, 0.8, 7.8]), look: U([0.1, 0.5, 0]), fov: 44 }],
  sedikit: [{ f: 505, pos: U([0, 0.7, 9.5]), look: U([0, 0.6, 0]), fov: 46 }, { f: 561, pos: U([0, 0.75, 8.4]), look: U([0, 0.6, 0]), fov: 46 }],
  tapi: [{ f: 562, pos: U([0.7, 0.55, 6.2]), look: U([0.0, 0.5, 0]), fov: 36, roll: 0 }, { f: 601, pos: U([0.25, 0.5, 2.8]), look: U([0.0, 0.6, 0]), fov: 34, roll: 4, ease: 'easeIn' }],
  ing: [{ f: 602, pos: U([0, 1.3, 13.4]), look: U([0, 1.3, 0]), fov: 46 }, { f: 705, pos: U([0, 1.3, 12.6]), look: U([0, 1.3, 0]), fov: 46 }],
  ingatkan: [{ f: 706, pos: [-0.9, 1.5, 5.2], look: [-1.6, 1.25, -0.4], fov: 36 }, { f: 763, pos: [-1.1, 1.5, 4.6], look: [-1.6, 1.3, -0.4], fov: 34 }],
  buruk: [{ f: 764, pos: U([0, 0.45, 8.8]), look: U([0, 0.25, 0]), fov: 44 }, { f: 822, pos: U([0, 0.5, 7.6]), look: U([0, 0.3, 0]), fov: 44, roll: -2 }],
  minyak: [{ f: 823, pos: U([0, 0.9, 9.2]), look: U([0, 0.9, 0]), fov: 46 }, { f: 850, pos: U([0, 1.2, 9]), look: U([0, 2.8, 0]), fov: 46 }, { f: 880, pos: U([0, 1.2, 8.8]), look: U([0, 2.8, 0]), fov: 46 }, { f: 898, pos: U([0, 0.5, 9.0]), look: U([0, 0.3, 0]), fov: 46 }],
  juara: [{ f: 899, pos: U([0, 0.9, 9.0]), look: U([0, 0.7, 0]), fov: 42 }, { f: 974, pos: U([0.2, 0.9, 7.2]), look: U([0, 0.8, 0]), fov: 40 }],
  kalah: [{ f: 975, pos: U([0, 0.4, 8.6]), look: U([0, 0.1, 0]), fov: 42 }, { f: 1026, pos: U([0, 0.9, 11.5]), look: U([0, 0.0, 0]), fov: 46 }],
  rumah: [{ f: 1027, pos: [0.35, 1.6, 6.8], look: [0.2, 1.6, -0.2], fov: 37 }, { f: 1069, pos: [0.35, 1.6, 6.2], look: [0.2, 1.6, -0.2], fov: 35 }],
  kamu: [{ f: 1070, pos: [0.2, 1.6, 6.2], look: [0.55, 1.65, 0], fov: 37 }, { f: 1113, pos: [0.3, 1.6, 5.4], look: [0.6, 1.7, 0], fov: 36 }],
  bukan: [{ f: 1114, pos: [0.0, 1.5, 6.4], look: [0.2, 1.2, -0.6], fov: 42 }, { f: 1143, pos: [0.0, 1.5, 7.0], look: [0.2, 1.1, -0.6], fov: 42 }],
};
export const camAt = (f) => {
  const S = shotAt(f);
  const kicks = S.id === 'serbu' ? [{ f: 358, a: 0.3 }, { f: 372, a: 0.25 }] : S.id === 'tapi' ? [{ f: 563, a: 0.4 }] : S.id === 'memang' ? [{ f: 392, a: 0.25 }] : [];
  const c = camFromKeys(CAMS[S.id], f, { creep: 0.0008, kicks }); c.shadowAt = c.look; return c;
};
export const dofAt = (f) => {
  const C = camAt(f), d = Math.hypot(C.pos[0] - C.look[0], C.pos[1] - C.look[1], C.pos[2] - C.look[2]);
  const S = shotAt(f); const wide = ['serbu', 'ing', 'sink', 'drop', 'kalah', 'juara', 'sedikit', 'minyak'].includes(S.id);
  return { focus: d, cinf: wide ? 3 : clamp((50 - C.fov) / 14) * 8, near: 1 };
};

// ---------- fish choreography ----------
const FS = (f, seed, o) => ({ x: 0, y: 0, z: 0, yaw: 0, roll: 0, pitch: 0, s: 1, rate: 0.22, amp: 0.35, lid: 0, tilt: 0, pupil: [0, 0], mouth: 0, wide: 1, blink: blinkAt(f, seed) > 0.4, ...o });
const bob = (f, ph, a = 0.1) => a * Math.sin(f * 0.06 + ph);
const SATE_Y = (f) => lerp(3.4, 0.45, M.easeOut(ramp(f, 201, 310)));
const cubesAt = (f) => 4 - ramp(f, 392, 402) - 0.6 * ramp(f, 440, 452) - 0.5 * ramp(f, 520, 534);
const mouthCycle = (f, f0, f1, per = 8) => (f >= f0 && f < f1) ? 0.5 + 0.5 * Math.sin((f - f0) / per * Math.PI * 2) : 0;

export const worldAt = (f) => {
  const S = shotAt(f), W = { set: S.set, labels: [], fish: [], smalls: [] };
  const L = (id, x, y, z0, f0, s = 1, f1 = 1e9) => { const z = z0 + (S.set === 'under' ? U_ : 0); if (f >= f0 && f < f1) W.labels.push({ id, x, y, z, s: s * M.back((f - f0) / 9, 1.9) * (f1 < 1e9 ? 1 - M.easeIn(ramp(f, f1 - 5, f1)) : 1) }); };
  const sw = (i, extra) => { W.fish[i] = extra; };
  W.murk = murkAt(f);
  switch (S.id) {
    case 'hook': { // lele face close-up; the skewer slides in on "sate ayam"
      const t = ramp(f, 66, 90), se = M.easeOut(t);
      sw(0, FS(f, 1, { x: 0.35, y: 0.15 + bob(f, 0), z: 2.2, yaw: -1.0, s: 0.8, pupil: [0.5 + 0.5 * se, 0.2 + 0.4 * se], lid: f < 40 ? 0 : 0.0, wide: 1.1 + 0.15 * se, rate: 0.15, amp: 0.2, mouth: 0.1 }));
      sw(1, FS(f, 2, { x: 3.2, y: 0.9 + bob(f, 1), z: -3, yaw: -2.6, s: 0.9, rate: 0.17, pupil: [0.3, 0] }));
      sw(2, FS(f, 3, { x: -3.4, y: 1.5 + bob(f, 2), z: -5, yaw: -0.3, s: 1.0, rate: 0.15 }));
      L('q', 0.9, 1.45 + 0.08 * Math.sin(f * 0.1), 2.9, 4, 0.5, 98);
      if (f >= 62) W.sate = { pos: U([lerp(5, 1.9, se), lerp(5, 0.5, se), 3.0]), rot: [0.3, f * 0.04, lerp(-0.9, -0.2, se)], s: 0.8, cubes: 4, hand: false };
      break; }
    case 'tes': L('uji', 1.2, 3.9, -0.6, 100, 0.9, 125); break;
    case 'skewer': { const sp = 0.03 * (f - 125); W.sate = { pos: [1.35, 1.35 + 0.03 * Math.sin(f * 0.1), 0.4], rot: [0.12, sp, -0.18 + 0.05 * Math.sin(f * 0.08)], s: 0.55, cubes: 4, hand: true }; break; }
    case 'drop': {
      const t0 = 169, tR = 182, tHit = 189;
      let pos, rot = [0.2, f * 0.05, -0.25];
      if (f < tR) { const u = M.smooth(ramp(f, t0, tR)); pos = [lerp(1.35, 0.9, u), lerp(1.7, 3.0, u), lerp(0.4, -3.2, u)]; rot = [0.1, 0, lerp(-0.2, 0, u)]; }
      else { const t = (f - tR) / 30, y = 3.0 - 4.9 * t * t * 1.6; pos = [0.9, Math.max(0.05, y), -3.2]; rot = [0.2 * (f - tR) * 0.1, (f - tR) * 0.1, 0.1 * (f - tR) * 0.1]; }
      const sunk = f >= tHit; W.sate = sunk ? null : { pos, rot, s: 0.5, cubes: 4, hand: f < tR };
      if (f >= tHit) W.splash = { x: 0.9, z: -3.2, t: (f - tHit) / 30 };
      if (f >= 195 && f < 200) {} break; }
    case 'sink': { W.sate = { pos: U([0.9, SATE_Y(f), 0]), rot: [0.1, f * 0.03, -0.15 + 0.12 * Math.sin(f * 0.07)], s: 0.9, cubes: 4 };
      sw(0, FS(f, 1, { x: -3.2, y: -0.5, z: -3, yaw: -0.2, s: 1.0, rate: 0.16, pupil: [0.4, 0.5] })); sw(1, FS(f, 2, { x: 3.4, y: 0.6, z: -3, yaw: -2.9, s: 0.9, pupil: [0.4, 0.5] })); sw(2, FS(f, 3, { x: 0.3, y: -1.2, z: -6, yaw: -0.5, s: 1.0 }));
      break; }
    case 'lele': case 'cichlid': case 'curiga': case 'serbu': case 'memang': case 'polos': case 'polos2': case 'sedikit': case 'tapi': {
      W.sate = { pos: U([0.9 - 0.7 * smooth(ramp(f, 270, 310)), SATE_Y(f) + 0.04 * Math.sin(f * 0.07), 0]), rot: [0.1, f * 0.03, -0.15 + 0.12 * Math.sin(f * 0.07)], s: 0.9, cubes: S.id === 'tapi' ? 4 : cubesAt(f) };
      if (S.id === 'tapi') W.sate.pos = U([0, 0.5 + 0.03 * Math.sin(f * 0.1), 0]), W.sate.s = 1.1;
      const sx = W.sate.pos[0], sy = W.sate.pos[1];
      // --- lele / cichlid intro ---
      if (S.id === 'lele') { const ex = M.back(ramp(f, 212, 222), 1.8);
        sw(0, FS(f, 1, { x: -0.7, y: 0.15 + bob(f, 0), z: 0, yaw: -0.85, s: 1.0 + 0.04 * ex, pupil: [0.7, 0.4], rate: 0.14, amp: 0.2, mouth: 0.15 }));
        sw(1, FS(f, 2, { x: 3.0, y: 0.9 + bob(f, 1), z: -4, yaw: -2.6, s: 0.9, pupil: [0.4, 0.3], rate: 0.17 })); sw(2, FS(f, 3, { x: -3, y: 1.4 + bob(f, 2), z: -5, yaw: -0.4, s: 1.0, rate: 0.15 }));
        L('lele', -0.9, 1.75 + 0.05 * Math.sin(f * 0.1), 0.6, 214, 0.85); }
      else if (S.id === 'cichlid') { const ex = M.back(ramp(f, 257, 267), 1.8);
        sw(1, FS(f, 2, { x: 1.2, y: 0.2 + bob(f, 1), z: 0, yaw: -2.35, s: 1.0 + 0.04 * ex, pupil: [0.7, 0.4], rate: 0.2, amp: 0.3, mouth: 0.1 }));
        sw(0, FS(f, 1, { x: -2.6, y: -0.5 + bob(f, 0), z: -4, yaw: -0.5, s: 1.0, rate: 0.16, pupil: [0.5, 0.2] })); sw(2, FS(f, 3, { x: 3, y: 1.6 + bob(f, 2), z: -5, yaw: -2.7, s: 1.0, rate: 0.15 }));
        L('cichlid', 1.1, 1.8 + 0.05 * Math.sin(f * 0.1), 0.6, 259, 0.8); }
      else if (S.id === 'curiga') { const t = ramp(f, 307, 330), sh = ramp(f, 346, 355);
        const sq = 0.5 * smooth(t) * (1 - sh);
        sw(0, FS(f, 1, { x: -1.3 + 0.1 * Math.sin(f * 0.1), y: 0.2 + bob(f, 0), z: 0, yaw: -0.7, s: 0.85, lid: sq, tilt: 0.55, pupil: [0.9, -0.1], rate: 0.1, amp: 0.15, wide: 1 + 0.5 * sh, pupilS: 1 - 0.4 * sh }));
        sw(1, FS(f, 2, { x: 1.3 + 0.1 * Math.sin(f * 0.1 + 1), y: 0.3 + bob(f, 1), z: 0, yaw: -2.45, s: 0.85, lid: sq, tilt: 0.55, pupil: [0.9, -0.1], rate: 0.12, amp: 0.2, wide: 1 + 0.5 * sh, pupilS: 1 - 0.4 * sh }));
        sw(2, FS(f, 3, { x: 0.2, y: 1.9 + bob(f, 2), z: -4, yaw: -1.0, s: 0.9, lid: sq, tilt: 0.5, pupil: [0.5, 0] }));
        L('curiga', 0, 2.3 + 0.06 * Math.sin(f * 0.12), 0.5, 314, 0.9, 350); }
      else if (S.id === 'serbu') { const u = M.easeIn(ramp(f, 357, 380)), jit = (a) => a * Math.sin(f * 1.7);
        sw(0, FS(f, 1, { x: lerp(-1.7, sx - 0.95, u), y: lerp(0.2, sy - 0.05, u), z: lerp(0, 0.2, u), yaw: -0.6 + 0.0, s: 1.0, rate: 0.5, amp: 0.55, mouth: 0.9 * u, wide: 1.4, pupil: [1, 0] }));
        sw(1, FS(f, 2, { x: lerp(1.7, sx + 0.9, u), y: lerp(0.3, sy + 0.1, u), z: lerp(0, 0.4, u), yaw: -2.5, s: 1.0, rate: 0.55, amp: 0.55, mouth: 0.9 * u, wide: 1.4, pupil: [1, 0] }));
        sw(2, FS(f, 3, { x: lerp(0.2, sx + 0.1, u), y: lerp(1.9, sy + 1.2, u), z: lerp(-4, -1, u), yaw: -1.57 + 0.4, s: 0.9, rate: 0.5, amp: 0.55, mouth: 0.8 * u, wide: 1.3, pupil: [0, -0.8] }));
        for (let i = 0; i < 6; i++) { const ui = M.easeIn(ramp(f, 358 + i * 2, 382)); W.smalls[i] = { x: lerp(-6 + i * 2.4, sx + (i % 2 ? 0.6 : -0.6), ui), y: lerp(-1.2 + (i % 3) * 1.2, sy + 0.3 * (i % 3 - 1), ui), z: lerp(-3 - i * 0.6, -0.5, ui), yaw: i % 2 ? -0.2 + 3.14 : -0.2, s: 0.8 }; if (i % 2) W.smalls[i].yaw = 3.14 + 0.2 - 0.0; }
        L('serbu', 0, 3.0 + 0.08 * Math.sin(f * 0.5), 0.5, 358, 1.0, 380); }
      else if (S.id === 'memang') { const bite = mouthCycle(f, 388, 404, 7);
        sw(0, FS(f, 1, { x: sx - 0.95, y: sy - 0.02, z: 0.25, yaw: -0.4, s: 1.05, rate: 0.35, amp: 0.3, mouth: bite, lid: 0.18 * ramp(f, 400, 409), pupil: [1, 0.2], wide: 1.1 }));
        sw(1, FS(f, 2, { x: sx + 1.4, y: sy + 0.15, z: -1, yaw: -2.7, s: 0.9, rate: 0.3, pupil: [-0.6, 0], mouth: 0.1 })); sw(2, FS(f, 3, { x: sx - 0.4, y: sy + 1.6, z: -3.2, yaw: -0.9, s: 0.9, rate: 0.25, pupil: [0.4, -0.6] })); }
      else if (S.id === 'polos') { const ch = mouthCycle(f, 410, 457, 9), calm = ramp(f, 410, 430);
        sw(0, FS(f, 1, { x: sx - 0.98, y: sy - 0.02 + bob(f, 0, 0.04), z: 0.2, yaw: -0.38, s: 1.05, rate: 0.22, amp: 0.25, mouth: ch, lid: 0.32 * calm, tilt: -0.1, pupil: [0.6, 0.2] }));
        sw(1, FS(f, 2, { x: sx + 1.5, y: sy + 0.35 + bob(f, 1), z: -1.2, yaw: -2.7, s: 0.9, rate: 0.2, pupil: [-0.7, 0.1], mouth: 0.15 })); sw(2, FS(f, 3, { x: sx - 0.2, y: sy + 1.8, z: -3, yaw: -1.0, s: 0.9, rate: 0.2, pupil: [0.3, -0.5], mouth: 0.1 }));
        L('polos', 0.0, 1.95, 0.8, 419, 0.9, 505); }
      else if (S.id === 'polos2') { const ch = mouthCycle(f, 462, 504, 10), ch2 = mouthCycle(f, 470, 504, 12);
        sw(1, FS(f, 2, { x: sx + 1.0, y: sy - 0.05 + bob(f, 1, 0.04), z: 0.2, yaw: -2.75, s: 1.0, rate: 0.25, amp: 0.3, mouth: ch, lid: 0.28, tilt: -0.1, pupil: [-0.6, 0.2] }));
        sw(0, FS(f, 1, { x: sx - 1.2, y: sy - 0.5 + bob(f, 0, 0.06), z: -0.6, yaw: -0.5, s: 1.0, rate: 0.22, mouth: ch2, lid: 0.3, tilt: -0.1, pupil: [0.6, 0.3] }));
        sw(2, FS(f, 3, { x: sx + 0.1, y: sy + 1.5 + bob(f, 2), z: -1.4, yaw: -1.4, s: 0.9, rate: 0.2, mouth: mouthCycle(f, 478, 504, 11), lid: 0.25, pupil: [0.1, -0.6] })); }
      else if (S.id === 'sedikit') { const fb = (n) => 0.25 + 0.2 * Math.sin(f * 0.07 + n);
        sw(0, FS(f, 1, { x: sx - 1.9, y: sy - 0.2 + bob(f, 0), z: 0, yaw: -0.55, s: 1.0, rate: 0.16, amp: 0.2, lid: 0.35, tilt: -0.1, pupil: [0.5, 0.1], mouth: 0.15, tongue: (f % 60) > 40 ? 1 : 0 }));
        sw(1, FS(f, 2, { x: sx + 1.9, y: sy + 0.1 + bob(f, 1), z: 0, yaw: -2.6, s: 1.0, rate: 0.18, amp: 0.25, lid: 0.35, tilt: -0.1, pupil: [-0.5, 0.1], mouth: 0.15, tongue: ((f + 25) % 60) > 40 ? 1 : 0 }));
        sw(2, FS(f, 3, { x: sx, y: sy + 1.9 + bob(f, 2), z: -2, yaw: -1.4, s: 0.9, rate: 0.16, lid: 0.3, pupil: [0, -0.4], mouth: 0.15 }));
        L('sedikit', 0, 3.4, 0.5, 508, 1.0, 560); }
      else if (S.id === 'tapi') { const t = ramp(f, 562, 575), sh = M.back(t, 2.2);
        sw(0, FS(f, 1, { x: -2.3, y: 0.4, z: -2.6, yaw: -0.8, s: 1.1, rate: 0.05, amp: 0.05, wide: 1.5 * sh + 0.2, pupilS: 0.5, pupil: [0.9, 0], mouth: 0.8 }));
        sw(1, FS(f, 2, { x: 2.3, y: 0.5, z: -2.6, yaw: -2.35, s: 1.1, rate: 0.05, amp: 0.05, wide: 1.5 * sh + 0.2, pupilS: 0.5, pupil: [0.9, 0], mouth: 0.8 }));
        sw(2, FS(f, 3, { x: 0, y: 2.0, z: -4, yaw: -1.5, s: 1.0, rate: 0.05, amp: 0.05, wide: 1.4, pupilS: 0.5, pupil: [0, -0.8], mouth: 0.7 })); }
      break; }
    case 'ing': {
      const P0 = f >= 604, pop = (f0) => (f >= f0 ? M.back((f - f0) / 12, 2.0) : 0);
      W.sate = { pos: U([0, 1.3 + 0.04 * Math.sin(f * 0.08), 0]), rot: [0.05, f * 0.025, 0.05], s: 1.0, cubes: 4 };
      W.ing = [{ x: -1.7, y: 4.5, z: 0, s: pop(604) * 1.3 }, { x: 1.7, y: 4.5, z: 0, s: pop(639) * 1.3 }, { x: -1.7, y: 1.7, z: 0, s: pop(661) * 1.3 }, { x: 1.7, y: 1.7, z: 0, s: pop(676) * 1.3 }];
      L('kacang', -1.7, 2.95, 0.5, 606, 0.85); L('garam', 1.7, 2.95, 0.5, 641, 0.85); L('kecap', -1.7, 0.15, 0.5, 663, 0.85); L('minyak', 1.7, 0.15, 0.5, 678, 0.85);
      const ill = ramp(f, 640, 700);
      sw(0, FS(f, 1, { x: -2.6, y: -0.6 + bob(f, 0), z: -6, yaw: -0.8, s: 1.0, rate: 0.14, amp: 0.2, lid: 0.2 * ill, tilt: 0.3, pupil: [0.7, 0.5], mouth: 0.1 }));
      sw(1, FS(f, 2, { x: 2.7, y: -0.4 + bob(f, 1), z: -6, yaw: -2.4, s: 1.0, rate: 0.16, lid: 0.2 * ill, tilt: 0.3, pupil: [-0.7, 0.5], mouth: 0.1 }));
      break; }
    case 'ingatkan': break;
    case 'buruk': { const g = ramp(f, 764, 790), tint = mix('#ffffff', '#9ee07a', g);
      W.sate = { pos: U([0, 0.3, -2]), rot: [0.05, f * 0.02, 0.05], s: 1.0, cubes: 2.0 };
      sw(0, FS(f, 1, { x: -1.5, y: 0.0 + bob(f, 0, 0.14), z: 0, yaw: -0.75, s: 1.0, tint, rate: 0.1, amp: 0.15, lid: 0.45, tilt: -0.35, pupil: [0.2, -0.6], mouth: 0.4 + 0.3 * Math.sin(f * 0.2), tongue: 1, tongueY: -0.1, pitch: 0.12 * Math.sin(f * 0.08) }));
      sw(1, FS(f, 2, { x: 1.5, y: 0.1 + bob(f, 1, 0.14), z: 0, yaw: -2.4, s: 1.0, tint, rate: 0.1, amp: 0.15, lid: 0.45, tilt: -0.35, pupil: [-0.2, -0.6], mouth: 0.4 + 0.3 * Math.sin(f * 0.2 + 1), tongue: 1, tongueY: -0.1, pitch: -0.12 * Math.sin(f * 0.08) }));
      sw(2, FS(f, 3, { x: 0.1, y: 1.9 + bob(f, 2, 0.12), z: -2.2, yaw: -1.2, s: 0.9, tint, rate: 0.1, amp: 0.15, lid: 0.4, tilt: -0.3, pupil: [0, -0.6], mouth: 0.4 }));
      L('tidakbaik', 0, 2.7, 0.8, 768, 1.0, 818); break; }
    case 'minyak': { const o = smooth(ramp(f, 826, 885)), tint = '#9ee07a';
      W.oil = o; W.oilDrops = smooth(ramp(f, 826, 850));
      const cough = (n) => 0.5 + 0.5 * Math.sin(f * 0.35 + n);
      sw(0, FS(f, 1, { x: -1.7, y: -0.2 + bob(f, 0, 0.1), z: 0, yaw: -0.75, s: 1.0, tint, rate: 0.12, amp: 0.15, lid: 0.35, tilt: -0.3, pupil: [0.5, 0.4], mouth: cough(0) * 0.8, tongue: 1, tongueY: -0.1 }));
      sw(1, FS(f, 2, { x: 1.7, y: 0.0 + bob(f, 1, 0.1), z: 0, yaw: -2.4, s: 1.0, tint, rate: 0.12, amp: 0.15, lid: 0.35, tilt: -0.3, pupil: [-0.5, 0.4], mouth: cough(2) * 0.8 }));
      sw(2, FS(f, 3, { x: 0.2, y: 1.2 + bob(f, 2, 0.1), z: -2.5, yaw: -1.3, s: 0.9, tint, rate: 0.12, amp: 0.15, lid: 0.35, tilt: -0.3, pupil: [0, 0.4], mouth: cough(4) * 0.8 }));
      L('kotor', 0, 3.6, 0.5, 836, 0.95, 896); break; }
    case 'juara': { const tint = mix('#ffffff', '#c9e8a0', 0.4), up = M.back(ramp(f, 900, 925), 1.6);
      W.oil = 1; W.oilDrops = 0.6; W.podium = [0, 2.0, 0]; W.medal = { pos: [0.32, 1.05, 1.0], s: 0.9, ry: 0.0 }; W.confetti = f >= 925 ? f - 925 : 0;
      sw(0, FS(f, 1, { x: 0, y: lerp(-0.2, 1.55, up) + bob(f, 0, 0.04), z: 0.2, yaw: -1.35, s: 1.1, tint, rate: 0.2, amp: 0.2, lid: 0.45, tilt: -0.2, pupil: [0.3, 0.3], mouth: 0.6, tongue: 1, tongueY: -0.12 + 0.05 * Math.sin(f * 0.3) }));
      sw(1, FS(f, 2, { x: 2.3, y: -0.9, z: -0.5, yaw: -2.4, s: 0.8, tint, rate: 0.1, amp: 0.1, lid: 0.3, tilt: 0.4, pupil: [-0.5, 0.3], mouth: 0.1 }));
      sw(2, FS(f, 3, { x: -2.3, y: -0.8, z: -0.5, yaw: -0.7, s: 0.8, tint, rate: 0.1, amp: 0.1, lid: 0.3, tilt: 0.4, pupil: [0.5, 0.3], mouth: 0.1 }));
      L('juara', 0, 2.55, 0.6, 926, 0.95); break; }
    case 'kalah': { const tint = '#9ee07a', t = ramp(f, 975, 1000);
      W.oil = 1; W.oilDrops = 0.8;
      sw(0, FS(f, 1, { x: -1.5, y: lerp(0.6, -1.15, M.easeIn(t)), z: 0, yaw: -0.7, s: 1.0, tint, rate: 0.06, amp: 0.1, spiral: true, roll: lerp(0, 0.55, t), mouth: 0.4, tongue: 1, tongueY: -0.1 }));
      sw(1, FS(f, 2, { x: 1.6, y: lerp(0.7, -1.0, M.easeIn(t)), z: 0, yaw: -2.4, s: 1.0, tint, rate: 0.06, amp: 0.1, spiral: true, roll: lerp(0, -0.5, t), mouth: 0.4, tongue: 1, tongueY: -0.1 }));
      sw(2, FS(f, 3, { x: 0.1, y: lerp(1.6, -0.2, M.easeIn(t)), z: -2.4, yaw: -1.3, s: 0.9, tint, rate: 0.06, amp: 0.1, spiral: true, roll: lerp(0, 0.4, t) + 0.1 * Math.sin(f * 0.1), mouth: 0.4 }));
      L('kalah', 0, 2.4, 0.5, 980, 0.95); break; }
    case 'rumah': W.noSign = { pos: [-0.25, 2.65, 0.7], s: 0.62 * M.back(ramp(f, 1030, 1042), 1.9), ry: 0.12, rz: 0.04 * Math.sin(f * 0.1) }; break;
    case 'kamu': { W.sate = { pos: [0.4, 2.15, 0.2], rot: [0.0, f * 0.02, 0.06 + 0.04 * Math.sin(f * 0.1)], s: 0.6, cubes: 4, hand: true }; L('kamu', 1.4, 3.6, -0.2, 1073, 0.95, 1112); break; }
    case 'bukan': { const bt = (f0) => M.smooth(ramp(f, f0, f0 + 6)); W.sate = { pos: [0.1 + 0.05 * (bt(1119) + bt(1130)), 1.41, 0.7], rot: [0.0, 0.3, -1.5 + 0.03 * Math.sin(f * 0.4)], s: 0.6, cubes: 4 - 0.8 * bt(1119) - 0.8 * bt(1130), hand: false };
      W.peek = [{ x: -2.6, z: -1.9, rise: M.back(ramp(f, 1116, 1128), 1.7) }, { x: -1.3, z: -2.4, rise: M.back(ramp(f, 1121, 1133), 1.7) }];
      break; }
  }
  if (W.sate && S.set === 'under') { const p = W.sate.pos; W.fish.forEach((st) => { if (st && !st.spiral && !st.noLook) st.lookAt = st.lookAt || [p[0], p[1] + 0.3, p[2] - U_]; }); }
  return W;
};

// ---------- people (cards) ----------
const R = (T, key, o, pos, extra = {}) => ({ key: key + JSON.stringify(o), draw: (p) => T.romanFront(p, key, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
export const actorsAt = (f, T) => {
  const S = shotAt(f), id = (seed) => { const i = idle(f, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1) }; };
  const base = (seed, expr, extra = {}) => ({ seed, expr, blink: blinkAt(f, seed), look: 0.2, L: 'hang', R: 'hang', ...id(seed), ...extra });
  const man = (expr, pos, ex = {}, ax = {}) => R(T, 'sate', base(7, expr, ex), pos, { s: 1.0, ...ax });
  const keeper = (expr, pos, ex = {}, ax = {}) => R(T, 'pelihara', base(5, expr, ex), pos, { s: 1.0, ...ax });
  switch (S.id) {
    case 'tes': return [man('grin', [1.8, 0, -0.6], { L: 'point', look: -0.7 })];
    case 'skewer': return [man('smile', [1.8, 0, -0.6], { L: 'hang', R: 'up', look: -0.4 })];
    case 'drop': { const rel = f >= 184; return [man(rel ? 'laugh' : 'grin', [1.6, 0, -0.5], { R: rel ? 'wave' : 'up', wv: f * 0.25, L: 'hang', look: -0.6 })]; }
    case 'ingatkan': { const w = Math.sin(f * 0.3); return [keeper('stern', [-1.6, 0, -0.4], { R: 'point', L: 'hip', look: 0.4, headTilt: q(w * 2, 1) })]; }
    case 'rumah': return [man('stern', [0.6, 0, -0.2], { L: 'cross', R: 'cross', look: 0 })];
    case 'kamu': return [man('grin', [0.7, 0, 0], { L: 'lift', R: 'point', look: 0, mouth: lipAt(MOUTH, f, 1070, 1113) })];
    case 'bukan': { const bite = f >= 1119 && f < 1150; return [man(bite ? 'laugh' : 'grin', [0.9, 0, 0], { L: 'lift', R: 'hang', look: -0.5 })]; }
  }
  return [];
};
export const fxAt = (f, T) => [];

// v4.1: optional hook for kit/tools/framing.mjs -> world points that must stay visible (label centres, skewer, fish).
// Return [{ n:'name', p:[x,y,z] (absolute world), r: radius in metres (optional) }].
export const focusAt = (f) => {
  const W = worldAt(f), out = [], uw = W.set === 'under' ? U_ : 0;
  for (const l of W.labels) if (l.s > 0.3) out.push({ n: 'label:' + l.id, p: [l.x, l.y, l.z], r: 0.5 });
  if (W.sate) out.push({ n: 'sate', p: W.sate.pos, r: 0.5 });
  W.fish.forEach((fi, i) => { if (fi && fi.s) out.push({ n: 'fish' + i, p: [fi.x, fi.y, fi.z + uw], r: 0.5 * fi.s, opt: true }); });
  return out;
};
