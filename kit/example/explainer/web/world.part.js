// ---------- world: explainer stage (flow diagram on a dark grid wall) ----------
import { makeExplainer } from './explainer.js';
const DECK = -9999;
const world = new THREE.Group(); scene.add(world);
const cv = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; };
{ // backdrop wall with a soft grid
  const t = P.tex(cv(1024, 1024, (g, w, h) => { g.fillStyle = '#14233a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#1f3858'; g.lineWidth = 3; for (let i = 0; i <= 16; i++) { g.beginPath(); g.moveTo(i * w / 16, 0); g.lineTo(i * w / 16, h); g.moveTo(0, i * h / 16); g.lineTo(w, i * h / 16); g.stroke(); } }), 6, 8);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 56), new THREE.MeshBasicMaterial({ map: t, fog: false })); wall.position.set(0, 4, -3); wall.userData.ndSkip = true; world.add(wall);
}
const X = makeExplainer({ THREE, world, P, cv, toon });
function worldState(S, f) { X.apply(S.explain, f); }
