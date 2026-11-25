// Explainer demo (16 s): "Pesan -> Server -> Penerima" with a travelling packet. Copy the pattern: nodes pop in (M.back), arrows draw (ramp), packets loop.
import { M, camFromKeys, CAM, clamp, lerp, ramp } from './motion.js';
export const FPS = 30, TOTAL = 480, DECK = -9999;
export const SHOTS = [{ id: 'a', a: 0, b: 150, light: 'night' }, { id: 'b', a: 151, b: 330, light: 'night' }, { id: 'c', a: 331, b: 479, light: 'night' }];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const NIGHT = { az: 60, el: 55, sky: '#14233a', ground: '#14233a', hemi: 1.0, sun: '#ffffff', sunI: 0.5, fog: '#14233a', fogNear: 200, fogFar: 900, skyTop: '#14233a', skyHor: '#14233a', sat: 1.05, vig: 0.25, shadowExt: 10, waterDeep: '#000', waterShal: '#000', glint: '#000' };
export const LIGHTS = { night: NIGHT };
export const lightFor = (S, f) => NIGHT;
const K = { a: [{ f: 0, pos: [0, 4.9, 11], look: [0, 4.9, 0], fov: 38 }, { f: 150, pos: [0, 4.9, 10.2], look: [0, 4.9, 0], fov: 38 }],
  b: CAM.dolly({ f0: 151, f1: 330, target: [0, 4.9, 0], from: [0, 4.9, 10.2], to: [0.2, 4.9, 9.0] }),
  c: CAM.dutch({ f0: 331, f1: 479, pos: [-0.3, 4.9, 9.6], look: [0, 4.9, 0], roll: 3 }) };
export const camAt = (f) => { const c = camFromKeys(K[shotAt(f).id], f, { creep: 0.0008 }); c.shadowAt = c.look; return c; };
export const dofAt = (f) => ({ focus: 9, cinf: 0, near: 1 });
export const worldAt = (f) => {
  const pop = (f0) => M.back((f - f0) / 9, 1.9), W = { set: 'main', labels: [], explain: { nodes: [], arrows: [], packets: [] } }, E = W.explain;
  const P1 = [-0.8, 6.4], P2 = [0.8, 4.9], P3 = [-0.8, 3.5];   // vertical zig-zag: the 9:16 frame is only ~4 m wide at 11 m
  E.nodes.push({ x: P1[0], y: P1[1], w: 1.9, h: 0.9, text: 'PESAN', sub: 'dari kamu', bg: '#2e8a80', s: f > 10 ? pop(10) : 0, bob: 1 });
  E.nodes.push({ x: P2[0], y: P2[1], w: 1.9, h: 0.9, text: 'SERVER', sub: 'perantara', bg: '#7a5ac8', s: f > 60 ? pop(60) : 0, bob: 1 });
  E.nodes.push({ x: P3[0], y: P3[1], w: 1.9, h: 0.9, text: 'TUJUAN', sub: 'teman', bg: '#c8742a', s: f > 150 ? pop(150) : 0, bob: 1 });
  E.arrows.push({ a: [-0.3, 5.9], b: [0.3, 5.45], u: ramp(f, 70, 95), col: '#e8d890' }); E.arrows.push({ a: [0.3, 4.4], b: [-0.3, 3.95], u: ramp(f, 160, 185), col: '#e8d890' });
  if (f >= 100 && f < 330) E.packets.push({ a: [-0.3, 5.9], b: [0.3, 5.45], u: ((f - 100) % 45) / 45, arc: 0.15, col: '#ff3b5c', size: 0.2 });
  if (f >= 190 && f < 479) E.packets.push({ a: [0.3, 4.4], b: [-0.3, 3.95], u: ((f - 190) % 45) / 45, arc: 0.15, col: '#ffd84a', size: 0.2 });
  return W;
};
export const actorsAt = () => []; export const fxAt = () => [];
