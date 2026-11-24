// "Presiden Disadap: LIMS vs spyware" — timed to voice.mp3 (47.5 s, 1426 frames @ 30 fps). Generic silhouettes only; all claims shown as "diduga / belum terbukti".
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp } from './motion.js';
export const FPS = 30, TOTAL = 1426, DECK = 0;
export const SHOTS = [
  { id: 'hook', a: 0, b: 95, light: 'night' },
  { id: 'two', a: 96, b: 137, light: 'night' },
  { id: 'lims', a: 138, b: 235, light: 'night' },
  { id: 'request', a: 236, b: 300, light: 'night' },
  { id: 'relay', a: 301, b: 372, light: 'night' },
  { id: 'logs', a: 373, b: 440, light: 'night' },
  { id: 'spy1', a: 441, b: 522, light: 'dark' },
  { id: 'skip', a: 523, b: 574, light: 'dark' },
  { id: 'dive', a: 575, b: 634, light: 'dark' },
  { id: 'noclick', a: 635, b: 698, light: 'dark' },
  { id: 'polri', a: 699, b: 787, light: 'night' },
  { id: 'amat', a: 788, b: 870, light: 'dark' },
  { id: 'court', a: 871, b: 960, light: 'night' },
  { id: 'diff1', a: 961, b: 1069, light: 'night' },
  { id: 'diff2', a: 1070, b: 1161, light: 'dark' },
  { id: 'watch', a: 1162, b: 1294, light: 'night' },
  { id: 'minta', a: 1295, b: 1337, light: 'night' },
  { id: 'setuju', a: 1338, b: 1383, light: 'night' },
  { id: 'hapus', a: 1384, b: 1425, light: 'dark' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const smooth = M.smooth;
const WATER = { waterDeep: '#000', waterShal: '#000', glint: '#000' };
export const LIGHTS = {
  night: { az: 120, el: 42, sky: '#7f93c8', ground: '#2c3b56', hemi: 1.0, sun: '#b9c8ff', sunI: 1.6, fog: '#1d2f5c', fogNear: 70, fogFar: 260,
    skyTop: '#070d22', skyHor: '#1d2f5c', sat: 1.12, gain: '#f6f8ff', vig: 0.3, shadowExt: 22, ...WATER },
  dark: { az: 120, el: 38, sky: '#8a5aa8', ground: '#2c1a3c', hemi: 0.95, sun: '#ff7aa0', sunI: 1.5, fog: '#2c1240', fogNear: 70, fogFar: 260,
    skyTop: '#0a0416', skyHor: '#3c1452', sat: 1.12, gain: '#fff2f6', vig: 0.34, shadowExt: 22, ...WATER },
};
export const lightFor = (S) => ({ ...LIGHTS[S.light] });

// anchors
const PH = [9, 1.9, 1.2], POL = [-9, 2, 0.6], OPR = [0, 2, 0.6], BK = [[-9, 0.6, 5.4], [0, 0.6, 5.4], [9, 0.6, 5.4]];
const WIDE = (x = 0) => ({ pos: [x, 8, 31], look: [0, 3.6, 0], fov: 54 });
const CAMS = {
  hook: [{ f: 0, pos: [9.4, 2.3, 7.6], look: [9, 1.9, 1.2], fov: 36 }, { f: 40, pos: [9.2, 2.6, 8.4], look: [9, 2, 1.2], fov: 36 }, { f: 95, ...WIDE(1), ease: 'smooth' }],
  two: [{ f: 96, ...WIDE(1) }, { f: 137, pos: [0, 21, 27], look: [0, 3, -1], fov: 54 }],
  lims: [{ f: 138, pos: [0, 21, 27], look: [0, 3, -1], fov: 54 }, { f: 170, pos: [-1, 6.2, 22], look: [0, 5.6, -2], fov: 46 }, { f: 235, pos: [-0.4, 5.8, 19], look: [0, 5.2, -2], fov: 44 }],
  request: [{ f: 236, pos: [-9, 4.0, 16], look: [-9, 3.2, 0.6], fov: 42 }, { f: 300, pos: [-7, 3.4, 13], look: [-6.8, 1.8, 1.6], fov: 42 }],
  relay: [{ f: 301, pos: [-6.5, 3.6, 14], look: [-5.5, 1.5, 2.7], fov: 42 }, { f: 340, pos: [-0.5, 4.4, 15], look: [0, 2.8, 0.6], fov: 44 }, { f: 358, pos: [3, 8, 27], look: [3.5, 7, -2], fov: 50 }, { f: 372, pos: [9, 4, 16], look: [9, 2.4, 1.2], fov: 42 }],
  logs: [{ f: 373, pos: [-9, 3.4, 15], look: [-8.6, 1.0, 5.4], fov: 40 }, { f: 398, pos: [0, 3.4, 15], look: [0.4, 1.0, 5.4], fov: 40 }, { f: 420, pos: [9, 3.4, 15], look: [8.6, 1.0, 5.4], fov: 40 }, { f: 440, pos: [0, 8, 31], look: [0, 3.6, 2], fov: 54 }],
  spy1: [{ f: 441, pos: [-16, 8, 30], look: [-18, 13, -8], fov: 48 }, { f: 522, pos: [-8, 9, 30], look: [-8, 14, -6], fov: 48 }],
  skip: [{ f: 523, pos: [-5, 9, 30], look: [-2, 11, -4], fov: 46 }, { f: 574, pos: [2, 9, 30], look: [3, 11, -3], fov: 46 }],
  dive: [{ f: 575, pos: [-1, 8, 28], look: [3, 9, -2], fov: 48 }, { f: 610, pos: [11, 4.5, 14], look: [9, 2.6, 1.2], fov: 42 }, { f: 634, pos: [8.8, 2.6, 9.4], look: [9, 2.0, 1.2], fov: 38 }],
  noclick: [{ f: 635, pos: [8.2, 3.2, 13], look: [8, 2.4, 1.2], fov: 44 }, { f: 698, pos: [8.2, 3.2, 11.5], look: [8, 2.6, 1.2], fov: 42 }],
  polri: [{ f: 699, pos: [-9, 4.2, 16.5], look: [-9, 3.4, 0.6], fov: 42 }, { f: 787, pos: [-9, 4.0, 14.5], look: [-9, 3.6, 0.6], fov: 42 }],
  amat: [{ f: 788, pos: [3.5, 4.2, 17], look: [4.8, 3.4, 1.2], fov: 46 }, { f: 870, pos: [5, 4.2, 15], look: [5.5, 3.6, 1.2], fov: 44 }],
  court: [{ f: 871, pos: [4, 4.5, 18], look: [4, 3.4, -15], fov: 46 }, { f: 960, pos: [4, 4.2, 13], look: [4, 3.4, -14], fov: 44 }],
  diff1: [{ f: 961, ...WIDE(0) }, { f: 1002, pos: [-13, 3.2, 14], look: [-4, 0.8, 4.4], fov: 46 }, { f: 1069, pos: [-3, 3.4, 14], look: [6, 0.8, 4.4], fov: 46 }],
  diff2: [{ f: 1070, pos: [-3, 5, 20], look: [0, 1.2, 8.6], fov: 50 }, { f: 1161, pos: [3, 4.6, 19], look: [0, 1.2, 8.6], fov: 50 }],
  watch: [{ f: 1162, pos: [-9, 10, 31], look: [0, 3.4, 0], fov: 54 }, { f: 1294, pos: [9, 10, 31], look: [0, 3.4, 0], fov: 54 }],
  minta: [{ f: 1295, pos: [-9, 4.2, 16.5], look: [-9, 3.4, 0.6], fov: 42 }, { f: 1337, pos: [-9, 4.0, 14.5], look: [-9, 3.6, 0.6], fov: 42 }],
  setuju: [{ f: 1338, pos: [0, 4.2, 16.5], look: [0, 3.4, 0.6], fov: 42 }, { f: 1383, pos: [0, 4.0, 14.5], look: [0, 3.6, 0.6], fov: 42 }],
  hapus: [{ f: 1384, pos: [0, 4.4, 17], look: [0, 2.2, 5.4], fov: 44 }, { f: 1425, pos: [0, 3.4, 14.5], look: [0, 1.9, 5.4], fov: 40 }],
};
const KICKS = [{ f: 622, a: 0.05 }, { f: 1416, a: 0.06 }, { f: 541, a: 0.03 }];
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, { creep: 0.0008, kicks: KICKS });
  c.flash = [[441, 447, 0.9], [699, 705, 0.8], [961, 964, 0.35], [1384, 1389, 0.6], [622, 626, 0.5]].reduce((a, [s, e, k]) => (f >= s && f < e ? (1 - (f - s) / (e - s)) * k : a), 0);
  c.shadowAt = c.look;
  return c;
};
export const dofAt = (f) => {
  const C = camAt(f), d = Math.hypot(C.pos[0] - C.look[0], C.pos[1] - C.look[1], C.pos[2] - C.look[2]);
  return { focus: d, cinf: clamp((50 - C.fov) / 14) * 9, near: 1 };
};

// ---------- world state ----------
const pathAt = (u) => { // paper route along the road: police door -> operator door
  const P0 = [-7.4, 1.0, 2.7], P1 = [-0.4, 1.0, 2.7]; return [lerp(P0[0], P1[0], u), 0.9 + 0.12 * Math.sin(u * 20), 2.7];
};
const spyU = (f) => f < 463 ? 0 : f < 541 ? M.smooth((f - 463) / 78) * 0.5 : f < 575 ? 0.5 + (f - 541) / 34 * 0.1 : f < 622 ? 0.6 + M.easeIn((f - 575) / 47) * 0.4 : 1;
export const worldAt = (f) => {
  const S = shotAt(f), W = { labels: [], logOn: [0, 0, 0], logT: [0, 0, 0] };
  const L = (id, x, y, z, f0, s = 1, ry = 0) => { if (f >= f0) W.labels.push({ id, x, y, z, s: s * M.back((f - f0) / 9, 1.9), ry }); };
  const lit = f >= 1384 ? [1, 1, 1] : [1, 1, 1];
  // paper (LIMS request)
  if (f >= 243 && f < 345) {
    let pos;
    if (f < 286) pos = [-8.0, 1.7 + 0.08 * Math.sin(f * 0.2), 1.3]; // in the officer's hand
    else if (f < 301) { const t = M.smooth((f - 286) / 15); pos = [lerp(-8.0, -7.4, t), lerp(1.7, 1.0, t), lerp(1.3, 2.7, t)]; }
    else if (f < 340) pos = pathAt(M.smooth((f - 301) / 39));
    else pos = [lerp(-0.4, 0, ramp(f, 340, 345)), lerp(1.0, 2.3, ramp(f, 340, 345)), 2.0];
    W.paper = { pos, ry: f * 0.04, rz: 0.15 * Math.sin(f * 0.15), s: 0.8 };
  }
  if (f >= 1295 && f < 1338) W.paper = { pos: [-8.0, 1.7 + 0.08 * Math.sin(f * 0.2), 1.3], ry: f * 0.04, rz: 0.15 * Math.sin(f * 0.15), s: 0.8 };
  if (f >= 345 && f < 373) W.packets = ramp(f, 345, 372) * 1.7;
  if (f >= 1338 && f < 1384) W.packets = ((f - 1338) / 24) % 1.7;
  W.beacon = (f >= 345 && f < 441) || (f >= 699 && f < 788) || (f >= 1338 && f < 1384) ? 1 : 0;
  // logs
  const logs = [[385, 400, 415], [0, 0, 0]][0];
  if (f >= 373) logs.forEach((t, i) => { if (f >= t) { W.logOn[i] = 1; W.logT[i] = clamp((f - t) / 16); } });
  if ((f >= 441 && f < 1384) && f >= 441) W.logOn = [1, 1, 1];
  if (f >= 1162) W.logOn = [1, 1, 1];
  if (f >= 1384) { W.logOn = [1, 1, 1]; W.logDel = M.smooth(ramp(f, 1388, 1416)); }
  if (f >= 373 && f < 441) W.lampsL = ramp(f, 376, 416);
  if (f >= 441) W.lampsL = f >= 1002 ? ramp(f, 1002, 1052) : (f >= 961 ? 0 : 1);
  if (f >= 1162) W.lampsL = 1;
  // spyware
  if (f >= 463 && f < 635) W.spy = { u: spyU(f), s: 2.0 };
  if (f >= 788 && f < 871) W.spy = { pos: [8.0, 3.3 + 0.15 * Math.sin(f * 0.1), 1.0], s: 0.55 };
  if (f >= 1070 && f < 1162) W.spy = { pos: [lerp(-14, 14, M.smooth(ramp(f, 1072, 1150))), 2.0, 8.6], s: 0.8 };
  W.infected = f >= 622 && f < 700;
  // labels
  switch (S.id) {
    case 'hook': L('q', 9, 5.3, 1.2, 54, 1); break;
    case 'two': L('one', -5, 6.2, 4.3, 99, 1.2); L('two', 5, 20, -4, 119, 1.3); break;
    case 'lims': L('lims', 0, 8.8, 0.8, 165, 1.1); L('izin', -9, 6.2, 0.5, 200, 0.9); break;
    case 'request': L('minta', -9, 6.9, 0.5, 243, 0.78); L('izin', -9, 5.7, 0.5, 245, 0.6); break;
    case 'relay': L('lims', 0, 6.2, 1.2, 305, 0.55); break;
    case 'logs': L('log', 0, 4.4, 5.4, 410, 1); break;
    case 'spy1': L('spy', -17, 22, -8, 466, 1); break;
    case 'skip': L('spy', -2, 20, -4, 523, 0.6); L('lims', 0, 18.2, -5, 523, 0.45); break;
    case 'noclick': L('noclick', 8, 5.4, 1.2, 640, 0.7); break;
    case 'polri': L('polri', -9, 6.6, 0.5, 703, 1); break;
    case 'amat': L('amat', 5, 6.4, 0.6, 792, 1); break;
    case 'court': L('court', 4, 8.8, -12, 871, 1); L('belum', 4, 4.8, -9.5, 893, 0.95); L('lims', -2.2, 7.4, -9.5, 925, 0.4); L('spy', 10.2, 7.4, -9.5, 925, 0.4); L('q', -2.2, 5.6, -9.5, 930, 0.5); L('q', 10.2, 5.6, -9.5, 934, 0.5); break;
    case 'diff1': L('one', 0, 5, 4.6, 962, 0.9); L('log', 0, 3.4, 5.6, 1002, 0.9); break;
    case 'diff2': L('two', 0, 5.4, 8.6, 1072, 0.9); L('nolog', 0, 3.6, 8.6, 1108, 0.75); break;
    case 'watch': L('izin', -9, 6.8, 0.5, 1195, 0.9); L('log', 0, 3.4, 5.6, 1247, 0.9); break;
    case 'minta': L('minta', -9, 6.9, 0.5, 1295, 1); break;
    case 'setuju': L('setuju', 0, 5.6, 0.6, 1338, 0.62); break;
    case 'hapus': L('hapus', 0, 3.9, 5.6, 1384, 0.38); break;
  }
  return W;
};

// ---------- actors ----------
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const SIL = '#3a4266', SILD = '#4a2a58';
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [], dark = S.light === 'dark', tint = dark ? SILD : SIL;
  const id = (seed) => { const i = idle(f, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1) }; };
  // officer at the police door
  const handing = (f >= 243 && f < 286) || (f >= 1295 && f < 1338);
  const copPose = S.id === 'polri' ? { L: 'hang', R: 'up' } : handing ? { L: 'hang', R: 'lift' } : { L: 'hang', R: 'hang' };
  out.push(R(T, 'cop', { seed: 51, expr: S.id === 'polri' ? 'stern' : 'neutral', blink: blinkAt(f, 51), look: 0.4, ...copPose, ...id(51) }, [-9.4, DECK, 1.0], { tint, s: 1.4 }));
  // operator technician
  const tPose = (f >= 523 && f < 575) ? { L: 'cheek', R: 'cheek' } : (f >= 301 && f < 345) ? { L: 'reach', R: 'hang', lift: 0.3 } : { L: 'hang', R: 'hang' };
  out.push(R(T, 'tech', { seed: 52, expr: (f >= 523 && f < 575) ? 'shock' : 'neutral', blink: blinkAt(f, 52), look: -0.3, ...tPose, ...id(52) }, [-1.7, DECK, 1.0], { tint, s: 1.4 }));
  // the user next to the big phone
  const hit = f >= 622 && f < 700;
  out.push(R(T, 'user', { seed: 53, expr: hit ? 'nervous' : f >= 54 && f < 96 ? 'nervous' : 'neutral', blink: blinkAt(f, 53), look: 0.5, L: 'hang', R: 'hang', ...id(53) }, [6.8, DECK, 1.3], { s: 1.4 }));
  // pengamat (two silhouettes) in the "amat" shot
  if (S.id === 'amat' || S.id === 'court') {
    out.push(R(T, 'cop', { seed: 61, expr: 'squint', L: 'point', R: 'hang', facing: 1, look: 0.4, ...id(61) }, [3.6, DECK, 1.4], { tint: SILD, s: 1.4 }));
    out.push(R(T, 'tech', { seed: 62, expr: 'squint', L: 'temple', R: 'hang', facing: -1, swirl: q((f * 0.3) % 6.28, 1), ...id(62) }, [5.4, DECK, 1.6], { tint: SILD, s: 1.4 }));
  }
  return out;
};

// ---------- 2D effects ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [];
  const ring = (pos, t0, s, tint, per = 36) => { const t = q((((f - t0) % per) + per) % per / per, 2); out.push(FX('ring' + t, (p) => T.fxRing(p, t), [pos[0], pos[1] - 1.52 * s, pos[2] + 0.4], s, { tint })); };
  if (f < 54) ring([9, 2.0, 1.2], 0, 2.2, '#9ec8ff');
  if (f >= 345 && f < 373) ring([9, 2.0, 1.2], 360, 1.6, '#7dffb0', 14);
  if (f >= 622 && f < 660) ring([9, 2.0, 1.2], 622, 2.4, '#ff4a6a', 18);
  if (f >= 1384 && f < 1426) { const t = q(ramp(f, 1388, 1418), 2); if (t > 0) [-1.1, 1.1].forEach((dx) => out.push(FX('dust' + t + dx, (p) => T.fxDust(p, t, '#cfc8d8'), [dx, 0.4 - 1.02 * 1.2, 5.6], 1.2, { tint: '#ffd0d8' }))); }
  if (f >= 1416) { const t = q((f - 1416) / 9, 2); out.push(FX('ring' + t, (p) => T.fxRing(p, t), [0, 0.8 - 1.52 * 2.5, 5.9], 2.5, { tint: '#ff4a6a' })); }
  return out;
};
