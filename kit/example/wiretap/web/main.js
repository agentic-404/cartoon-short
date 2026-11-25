import * as THREE from './lib/three.module.js';
import * as T from './toon.js';
import * as P from './paint.js';
import { spline, fitScale } from './motion.js';
import { SHOTS, TOTAL, shotAt, camAt, dofAt, LIGHTS, lightFor, actorsAt, worldAt, fxAt } from './story.js';

const RS = Math.min(1, +(new URLSearchParams(location.search).get('s') || 1));   // ?s=0.5 = half-res preview render (render.mjs SCALE=0.5)
const W = Math.round(1080 * RS), H = Math.round(1920 * RS);
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.08, 1500);
const rx = (a) => a * Math.PI / 180;

// ---------- materials ----------
const grad = (() => { const d = new Uint8Array([90, 90, 90, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 2, 1); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const toon = (opts) => new THREE.MeshToonMaterial({ gradientMap: grad, ...opts });
const texM = (c, rx_ = 1, ry_ = 1, color = '#ffffff') => toon({ map: P.tex(c, rx_, ry_), color });
const M = {
  plank: texM(P.planks(1), 1, 6), beam: texM(P.beam(2), 1, 2), beamDark: texM(P.beam(3, [28, 36, 30]), 1, 2),
  rot: texM(P.rotten(4), 1, 1), rotB: texM(P.rotten(14), 1, 1),
  stone: texM(P.stone(4), 1, 1), stoneMoss: texM(P.mossy(P.stone(4), 5, 1.2), 1, 1),
  grass: texM(P.grass(6), 40, 40), dirt: texM(P.dirt(7), 6, 30), plaster: texM(P.plaster(8), 1, 1), plaster2: texM(P.plaster(18, 28), 1, 1),
  roof: texM(P.roof(9), 2, 2), marble: texM(P.marble(10), 1, 1), marbleTop: toon({ color: '#ece2cf' }),
  trunk: toon({ color: '#6a4a32' }), cypress: toon({ color: '#3f6b36' }), pine: toon({ color: '#5c8a3c' }), bush: toon({ color: '#6c9a42' }),
  hill: toon({ color: '#7aa64c' }), hillFar: toon({ color: '#86ad60' }), mount: toon({ color: '#8fa7b8' }), snow: toon({ color: '#f4f6fa' }),
  iron: toon({ color: '#5c5a57' }), bronze: toon({ color: '#b08a4a' }), wood: toon({ color: '#7a5434' }), door: toon({ color: '#5a3a24' }),
  window: toon({ color: '#2b2430' }), red: toon({ color: '#b8282b' }),
};
M.banner = new THREE.MeshToonMaterial({ gradientMap: grad, map: P.tex(P.banner()), alphaTest: 0.5, side: THREE.DoubleSide });
// helmet
const helmetIn = P.tex(P.helmetInside()); helmetIn.wrapS = helmetIn.wrapT = THREE.ClampToEdgeWrapping;
M.helmIn = new THREE.MeshToonMaterial({ gradientMap: grad, map: helmetIn, side: THREE.BackSide });
M.helmOut = toon({ color: '#8f8a7e' });

// ---------- ink / normal-depth contract ----------
const NOINK = 'noink'; // userData flag: never outlined (cards, fx, water handled specially)
const ndMat = new THREE.ShaderMaterial({
  vertexShader: `varying vec3 vN; varying float vD; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vD = -mv.z; gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `varying vec3 vN; varying float vD; void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; gl_FragColor = vec4(n*.5+.5, vD); }`,
  side: THREE.DoubleSide,
});
const cardNd = (map) => new THREE.ShaderMaterial({
  uniforms: { map: { value: map } },
  vertexShader: `varying vec2 vUv; varying float vD; void main(){ vUv=uv; vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying float vD; void main(){ if(texture2D(map,vUv).a<.5) discard; gl_FragColor=vec4(0.,0.,0.,vD); }`,
  side: THREE.DoubleSide,
});
const waterNd = new THREE.ShaderMaterial({
  vertexShader: `varying float vD; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `varying float vD; void main(){ gl_FragColor=vec4(.5,1.,.5,vD); }`,
});

// ---------- helpers ----------
const add = (geo, mat, x = 0, y = 0, z = 0, parent = scene, opts = {}) => {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = opts.cast ?? true; m.receiveShadow = true; parent.add(m); return m;
};
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const uvScale = (geo, su, sv) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return geo; };
/** box with world-scaled UVs per face (texel density 1 tile per `t` metres) */
const tbox = (w, h, d, t = 2) => {
  const g = box(w, h, d), uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / t, uv.getY(i) * dims[f][1] / t); }
  return g;
};

// ---------- sky ----------
const skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() }, sunSize: { value: 0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 top, hor, sunDir, sunCol; uniform float sunSize; varying vec3 vP;
    void main(){ float h = clamp(vP.y,0.,1.); vec3 c = mix(hor, top, pow(h, .55)); if(vP.y<0.) c = hor;
      float s = dot(normalize(vP), normalize(sunDir)); c += sunCol * (smoothstep(1.-sunSize, 1.-sunSize*.6, s) + .35*pow(max(s,0.), 24.)*step(.001,sunSize));
      gl_FragColor = vec4(c,1.); }`,
}));
sky.userData.sky = true; scene.add(sky);

// ---------- lights ----------
const hemi = new THREE.HemisphereLight('#ffffff', '#ffffff', 1); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffffff', 2); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2;
scene.add(sun); scene.add(sun.target);
scene.fog = new THREE.Fog('#ffffff', 40, 600);

const waterU = { deep: { value: new THREE.Color() }, shal: { value: new THREE.Color() }, glint: { value: new THREE.Color() } };

// @@WORLD-BEGIN
// ---------- world: "jalur sadap" explainer stage ----------
const DECK = 0;
const world = new THREE.Group(); scene.add(world);
const cv = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; };
const glow = (col) => new THREE.MeshBasicMaterial({ color: col });
const G = {
  ground: toon({ color: '#1d3a4a' }), road: toon({ color: '#2a2f3d' }), dash: glow('#e8d890'), curb: toon({ color: '#3b4a5e' }),
  police: toon({ color: '#3f6aa8' }), policeR: toon({ color: '#233a63' }), oper: toon({ color: '#2e8a80' }), operR: toon({ color: '#1b524d' }),
  house: toon({ color: '#c9a36a' }), houseR: toon({ color: '#9b4a3a' }), steel: toon({ color: '#8c98a8' }), steelD: toon({ color: '#4d5868' }),
  stone: toon({ color: '#d8d0c0' }), stoneD: toon({ color: '#a79f90' }), door: toon({ color: '#3a2a22' }),
  paper: toon({ color: '#fff7e0' }), stampR: toon({ color: '#d63a3a' }), bookC: toon({ color: '#7a3a2a' }), bookP: toon({ color: '#f1ead2' }),
  sky1: toon({ color: '#14213f' }), sky2: toon({ color: '#1b2c52' }), sky3: toon({ color: '#101a33' }),
  bodyBlack: toon({ color: '#5a2a7a' }), spike: glow('#ff3b5c'), eye: glow('#ffffff'), pupil: glow('#111111'),
  lampOff: toon({ color: '#3a4152' }), lampOn: glow('#6dff9c'), lampRed: glow('#ff4a4a'), beacOff: toon({ color: '#5a2a2a' }), beacOn: glow('#7dffb0'),
};
// ground: flat colour (no texture beyond 40 m), road on top
const gnd = add(new THREE.PlaneGeometry(400, 400), G.ground, 0, 0, 0, world, { cast: false }); gnd.rotation.x = -Math.PI / 2;
const road = add(new THREE.PlaneGeometry(60, 3.2), G.road, 0, 0.02, 2.7, world, { cast: false }); road.rotation.x = -Math.PI / 2;
for (let x = -26; x <= 26; x += 3) add(new THREE.PlaneGeometry(1.4, 0.16), G.dash, x, 0.03, 2.7, world, { cast: false }).rotation.x = -Math.PI / 2;
for (const z of [1.05, 4.35]) add(tbox(60, 0.14, 0.22, 1), G.curb, 0, 0.07, z, world, { cast: false });
// textured sign / window helpers
const winTex = (c1, c2) => P.tex(cv(256, 256, (g, w, h) => { g.fillStyle = c1; g.fillRect(0, 0, w, h); const r = P.rng(5); for (let y = 12; y < h - 20; y += 40) for (let x = 12; x < w - 20; x += 36) { g.fillStyle = r() > 0.7 ? c2 : '#1c2a4c'; g.fillRect(x, y, 20, 24); } }), 1, 1);
const labelTex = (text, bg, fg, w = 640, h = 220, fs = 112) => P.tex(cv(w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = '#120a1a'; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14);
  g.fillStyle = fg; g.font = `900 ${fs}px Arial Black, Arial`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const lines = text.split('\n'); lines.forEach((t, i) => g.fillText(t, w / 2, h / 2 + (i - (lines.length - 1) / 2) * fs * 1.05));
}));
const board = (text, bg, fg, w, h, px = 640, py = 220, fs = 112) => {
  const side = toon({ color: '#1a1022' }), front = new THREE.MeshBasicMaterial({ map: labelTex(text, bg, fg, px, py, fs) });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.18), [side, side, side, side, front, side]);
  m.castShadow = false; m.userData.w = w; return m;
};
// buildings
const building = (x, z, w, h, d, wall, roof, label) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); world.add(g);
  add(tbox(w, h, d, 2), wall, 0, h / 2, 0, g);
  add(tbox(w + 0.5, 0.4, d + 0.5, 2), roof, 0, h + 0.2, 0, g);
  add(box(1.0, 1.9, 0.12), G.door, 0, 0.95, d / 2 + 0.04, g, { cast: false });
  for (const s of [-1, 1]) add(box(0.9, 0.9, 0.1), glow('#ffe9a8'), s * w * 0.3, h * 0.6, d / 2 + 0.04, g, { cast: false });
  if (label) { const b = board(label, '#f1e6c4', '#1a2a4a', w * 0.62, w * 0.62 * 0.3); b.position.set(0, h + 1.3, d / 2 + 0.1); g.add(b); }
  return g;
};
const police = building(-9, -2, 5.2, 4.2, 4, G.police, G.policeR, 'PENYIDIK');
const oper = building(0, -2, 5.2, 3.2, 4, G.oper, G.operR, 'OPERATOR');
const hseG = new THREE.Group(); hseG.position.set(9, 0, -2); world.add(hseG);
add(tbox(4.8, 3, 4, 2), G.house, 0, 1.5, 0, hseG);
{ const r = add(new THREE.ConeGeometry(4.2, 1.8, 4), G.houseR, 0, 3.9, 0, hseG); r.rotation.y = Math.PI / 4; r.scale.set(1.05, 1, 0.9); }
add(box(0.9, 1.8, 0.12), G.door, 1.1, 0.9, 2.04, hseG, { cast: false });
add(box(1.0, 1.0, 0.1), glow('#ffe9a8'), -1.2, 1.9, 2.04, hseG, { cast: false });
// telecom tower behind the operator
const tower = new THREE.Group(); tower.position.set(0, 0, -5.2); world.add(tower);
for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const leg = add(new THREE.CylinderGeometry(0.08, 0.16, 12.4, 6), G.steel, sx * 0.9, 6.1, sz * 0.9, tower); leg.rotation.z = -sx * 0.065; leg.rotation.x = sz * 0.065; }
for (let y = 1.5; y < 12; y += 1.9) { const k = 1 - y / 12 * 0.6; for (const [a, b, c2, d2] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]) { const L = Math.hypot((c2 - a), (d2 - b)) * 0.9 * k; const m = add(tbox(L, 0.08, 0.08, 1), G.steelD, (a + c2) / 2 * 0.9 * k, y, (b + d2) / 2 * 0.9 * k, tower); m.rotation.y = Math.atan2(-(d2 - b), (c2 - a)); } }
add(new THREE.CylinderGeometry(0.1, 0.1, 2.4, 6), G.steel, 0, 13.4, 0, tower);
for (const s of [-1, 1]) { const d = add(new THREE.CylinderGeometry(0.7, 0.2, 0.5, 14), G.stone, s * 0.9, 11.3, 0.4, tower); d.rotation.z = Math.PI / 2 * s; }
const beacon = add(new THREE.SphereGeometry(0.42, 14, 10), G.beacOff, 0, 14.8, 0, tower);
// logs: three open books with a lamp each
const books = [];
for (const x of [-9, 0, 9]) {
  const g = new THREE.Group(); g.position.set(x, 0, 5.4); world.add(g);
  add(tbox(2.1, 0.2, 1.5, 1), G.bookC, 0, 0.1, 0, g);
  const pages = add(tbox(1.9, 0.26, 1.3, 1), G.bookP, 0, 0.3, 0, g);
  const rr = P.rng(x + 40); for (let i = 0; i < 5; i++) add(tbox(1.4 - rr() * 0.5, 0.02, 0.07, 1), G.bookC, -0.15, 0.45, -0.45 + i * 0.22, g, { cast: false });
  add(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6), G.steelD, 1.35, 0.8, 0, g);
  const lamp = add(new THREE.SphereGeometry(0.22, 12, 10), G.lampOff, 1.35, 1.7, 0, g);
  books.push({ g, pages, lamp, lines: g.children.filter((c) => c.geometry && c.geometry.parameters && c.geometry.parameters.height === 0.02) });
}
// paper "surat izin" (travels along the road)
const paper = new THREE.Group(); world.add(paper); paper.visible = false;
add(tbox(1.5, 0.05, 1.0, 1), G.paper, 0, 0, 0, paper);
for (let i = 0; i < 4; i++) add(tbox(1.0, 0.01, 0.07, 1), G.steelD, -0.1, 0.04, -0.3 + i * 0.2, paper, { cast: false });
{ const st = add(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 16), G.stampR, 0.42, 0.05, 0.22, paper); }
// signal packets (tower -> phone)
const packets = []; for (let i = 0; i < 6; i++) { const m = add(box(0.3, 0.3, 0.3), glow('#7dffb0'), 0, 0, 0, world, { cast: false }); m.visible = false; packets.push(m); }
// phone (big)
const phone = new THREE.Group(); phone.position.set(9, 0, 1.2); phone.rotation.y = -0.18; world.add(phone);
add(tbox(1.7, 3.3, 0.22, 1), toon({ color: '#252b3a' }), 0, 1.75, 0, phone);
const chatTex = P.tex(cv(256, 512, (g, w, h) => { g.fillStyle = '#e9f1f7'; g.fillRect(0, 0, w, h); g.fillStyle = '#2e8a80'; g.fillRect(0, 0, w, 56);
  const bub = (y, x, bw, col) => { g.fillStyle = col; g.fillRect(x, y, bw, 46); }; bub(80, 20, 150, '#ffffff'); bub(142, 86, 150, '#9ee7c2'); bub(204, 20, 180, '#ffffff'); bub(266, 60, 176, '#9ee7c2'); bub(328, 20, 120, '#ffffff'); g.fillStyle = '#b8c2cc'; g.fillRect(20, 440, 216, 40); }));
const badTex = P.tex(cv(256, 512, (g, w, h) => { g.fillStyle = '#1a0710'; g.fillRect(0, 0, w, h); const r = P.rng(9); for (let i = 0; i < 26; i++) { g.fillStyle = r() > 0.5 ? '#ff3b5c' : '#4a0f24'; g.fillRect(r() * 200, r() * 480, 30 + r() * 120, 10 + r() * 24); }
  g.fillStyle = '#ff3b5c'; g.font = '900 120px Arial Black, Arial'; g.textAlign = 'center'; g.fillText('!', w / 2, 300); }));
const screenMat = new THREE.MeshBasicMaterial({ map: chatTex });
const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 3.0), screenMat); screen.position.set(0, 1.75, 0.12); phone.add(screen); screen.userData.ndSkip = false;
// spyware critter
const spy = new THREE.Group(); world.add(spy); spy.visible = false;
add(new THREE.IcosahedronGeometry(0.95, 1), G.bodyBlack, 0, 0, 0, spy);
for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, b = (i % 3 - 1) * 0.7; const c = add(new THREE.ConeGeometry(0.18, 0.7, 5), G.spike, Math.cos(a) * 1.05 * Math.cos(b), Math.sin(b) * 1.05, Math.sin(a) * 1.05 * Math.cos(b), spy, { cast: false }); c.lookAt(c.position.clone().multiplyScalar(3)); c.rotateX(Math.PI / 2); }
for (const s of [-1, 1]) { add(new THREE.SphereGeometry(0.26, 10, 8), G.eye, s * 0.34, 0.2, 0.82, spy, { cast: false }); add(new THREE.SphereGeometry(0.11, 8, 6), G.pupil, s * 0.34, 0.2, 1.04, spy, { cast: false }); }
// courthouse (background)
const court = new THREE.Group(); court.position.set(4, 0, -16); world.add(court);
add(tbox(9, 0.5, 6, 2), G.stoneD, 0, 0.25, 0, court); add(tbox(8, 0.4, 5, 2), G.stoneD, 0, 0.7, 0.2, court);
add(tbox(7, 3.4, 4, 2), G.stone, 0, 2.6, -0.6, court);
for (let i = 0; i < 5; i++) add(new THREE.CylinderGeometry(0.32, 0.36, 3.6, 12), G.stone, -3.2 + i * 1.6, 2.7, 2, court);
add(tbox(8.2, 0.6, 5, 2), G.stoneD, 0, 4.8, 0.2, court);
{ const ps = new THREE.Shape(); ps.moveTo(-4.2, 0); ps.lineTo(4.2, 0); ps.lineTo(0, 1.8); ps.closePath(); add(new THREE.ExtrudeGeometry(ps, { depth: 4.6, bevelEnabled: false }), G.stone, 0, 5.1, -2.1, court); }
// skyline (flat colours, lit windows)
{ const r = P.rng(21); for (let i = 0; i < 26; i++) { const w = 5 + r() * 7, h = 10 + r() * 26, x = -80 + i * 6.4 + r() * 3, z = -34 - r() * 40; const m = toon({ map: winTex(i % 2 ? '#14213f' : '#18284a', '#ffd98a'), color: '#ffffff' }); m.map.repeat.set(w / 8, h / 8); add(tbox(w, h, 6, 8), m, x, h / 2, z, world, { cast: false }); } }
// lamp rows (compare shot): green = recorded trail, grey = no trail
const lampsL = [], lampsS = [];
for (let i = 0; i < 10; i++) { const x = -11 + i * 2.45; lampsL.push(add(new THREE.SphereGeometry(0.2, 10, 8), G.lampOff, x, 0.5, 4.35, world, { cast: false })); lampsS.push(add(new THREE.SphereGeometry(0.2, 10, 8), G.lampOff, x, 0.5, 8.6, world, { cast: false })); }
// floating labels (story switches them on)
const LBL = {};
const mkLabel = (id, text, bg, fg, w, h, fs = 112, px = 640, py = 220) => { const b = board(text, bg, fg, w, h, px, py, fs); b.visible = false; world.add(b); LBL[id] = b; };
mkLabel('lims', 'LIMS', '#2e8a80', '#ffffff', 5, 1.7, 150);
mkLabel('spy', 'SPYWARE', '#b0203f', '#ffffff', 6.2, 1.7, 124);
mkLabel('one', '1', '#2e8a80', '#fff', 1.7, 1.7, 170, 220, 220);
mkLabel('two', '2', '#b0203f', '#fff', 1.7, 1.7, 170, 220, 220);
mkLabel('q', '?', '#e8c14a', '#241726', 1.7, 1.7, 170, 220, 220);
mkLabel('minta', 'MEMINTA', '#3f6aa8', '#fff', 5.8, 1.6, 112);
mkLabel('setuju', 'MENYETUJUI', '#2e8a80', '#fff', 6.8, 1.6, 100);
mkLabel('hapus', 'MENGHAPUS', '#b0203f', '#fff', 6.8, 1.6, 100);
mkLabel('polri', 'POLRI:\nLIMS', '#3f6aa8', '#fff', 4.2, 2.4, 96, 520, 300);
mkLabel('amat', 'PENGAMAT:\nSPYWARE?', '#6a2a8a', '#fff', 4.8, 2.4, 80, 560, 300);
mkLabel('belum', 'BELUM\nTERBUKTI', '#e8c14a', '#241726', 5.2, 2.6, 100, 560, 300);
mkLabel('court', 'PENGADILAN', '#d8d0c0', '#241726', 6.4, 1.4, 92);
mkLabel('log', 'TERCATAT', '#2e8a80', '#fff', 5, 1.3, 100);
mkLabel('nolog', 'TANPA JEJAK', '#241726', '#ff6b8a', 6.4, 1.4, 92);
mkLabel('noclick', 'TANPA KLIK', '#b0203f', '#fff', 6, 1.4, 100);
mkLabel('izin', 'IZIN', '#e8c14a', '#241726', 3.2, 1.3, 120);

const ease = (t) => t * t * (3 - 2 * t);
function worldState(S, f) {
  // labels
  for (const k in LBL) LBL[k].visible = false;
  (S.labels || []).forEach((l) => { const b = LBL[l.id]; b.visible = true; b.position.set(l.x, l.y, l.z); b.scale.setScalar(Math.max(0.001, Math.min(l.s ?? 1, (l.s ?? 1) * fitScale(window.__cam, [l.x, l.y, l.z], b.userData.w * (l.s ?? 1))))); b.rotation.set(0, l.ry || 0, l.rz || 0); });
  // paper
  paper.visible = !!S.paper; if (S.paper) { paper.position.set(...S.paper.pos); paper.rotation.set(S.paper.rx || 0, S.paper.ry || 0, S.paper.rz || 0); paper.scale.setScalar(S.paper.s || 1.4); }
  // packets
  const pk = S.packets || 0; packets.forEach((m, i) => { const u = (pk - i * 0.12); m.visible = pk > 0 && u > 0 && u < 1; if (m.visible) { const a = [0, 12.4, -5.2], b = [9, 2.4, 1.2]; const e = ease(u); m.position.set(a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e + Math.sin(u * 3.1) * 2.2, a[2] + (b[2] - a[2]) * e); m.rotation.set(u * 6, u * 5, 0); } });
  beacon.material = (S.beacon || 0) > 0 ? G.beacOn : G.beacOff; beacon.scale.setScalar(1 + (S.beacon || 0) * 0.5 * Math.sin(f * 0.6));
  // logs
  books.forEach((b, i) => { const on = (S.logOn || [0, 0, 0])[i], del = S.logDel || 0;
    b.lamp.material = del > 0.02 ? G.lampRed : on > 0.5 ? G.lampOn : G.lampOff; b.lamp.scale.setScalar(on > 0.5 ? 1 + 0.35 * Math.max(0, 1 - ((S.logT || [0, 0, 0])[i])) : 1);
    b.pages.scale.y = 1 - del * 0.85; b.lines.forEach((l) => { l.visible = on > 0.5 && del < 0.5; }); });
  // lamps
  lampsL.forEach((l, i) => { l.material = i < (S.lampsL || 0) * 10 ? G.lampOn : G.lampOff; });
  lampsS.forEach((l, i) => { l.material = G.lampOff; });
  // spyware critter
  spy.visible = !!S.spy; if (S.spy) { const P_ = S.spy.pos || spline([[-26, 15, -9], [-15, 19, -6], [-4, 17, -4.6], [3, 11, -1.5], [8.2, 3.4, 1.0]], S.spy.u); spy.position.set(...P_); spy.rotation.set(f * 0.07, f * 0.11, 0); spy.scale.setScalar(S.spy.s || 1); }
  screenMat.map = S.infected ? badTex : chatTex; phone.position.x = 9 + (S.infected ? 0.05 * Math.sin(f * 1.7) : 0); phone.rotation.z = S.infected ? 0.03 * Math.sin(f * 2.3) : 0;
}

// @@WORLD-END (everything above this marker down to WORLD-BEGIN is replaceable; see kit/tools/assemble.py)
// ---------- cards ----------
const CW = 1200, CH = 2000, CM = 2.25; // canvas px, card height in metres (design 600x1000 -> 2.25 m)
const cardGeo = new THREE.PlaneGeometry(CM * 0.6, CM); cardGeo.translate(0, CM / 2 - CM * 0.025, 0);
const blobTex = P.tex(P.radial('20,14,30', 0.6));
class Card {
  constructor(scale = 1) {
    [this.c, this.g] = (() => { const c = document.createElement('canvas'); c.width = CW; c.height = CH; return [c, c.getContext('2d')]; })();
    this.t = new THREE.CanvasTexture(this.c); this.t.colorSpace = THREE.SRGBColorSpace; this.t.anisotropy = 4;
    this.mat = new THREE.MeshBasicMaterial({ map: this.t, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, fog: true });
    this.mesh = new THREE.Mesh(cardGeo, this.mat); this.mesh.userData.nd = cardNd(this.t); this.mesh.castShadow = true;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.t, alphaTest: 0.5 });
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, fog: true }));
    this.blob.rotation.x = -Math.PI / 2; this.blob.userData.ndSkip = true; this.blob.renderOrder = 1;
    scene.add(this.mesh); scene.add(this.blob); this.key = ''; this.mesh.visible = this.blob.visible = false;
  }
  draw(key, fn) {
    if (key === this.key) return; this.key = key;
    const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); g.setTransform(CW / 600, 0, 0, CH / 1000, 0, 0);
    const p = new T.Pen(g); fn(p); this.t.needsUpdate = true;
  }
}
const cards = []; const getCard = (i) => cards[i] || (cards[i] = new Card());

// ---------- render targets & post ----------
const rtColor = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
const rtNd = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const rtInk = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), fsGeo = new THREE.PlaneGeometry(2, 2);
const fs = (mat) => { const s = new THREE.Scene(); s.add(new THREE.Mesh(fsGeo, mat)); return s; };
const inkU = { col: { value: rtColor.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, px: { value: 1.6 * RS }, fogCol: { value: new THREE.Color() },
  sat: { value: 1.08 }, lift: { value: new THREE.Color(0, 0, 0) }, gain: { value: new THREE.Color(1, 1, 1) }, vig: { value: 0.22 }, flash: { value: 0 } };
const inkScene = fs(new THREE.ShaderMaterial({ uniforms: inkU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D col, nd; uniform vec2 res; uniform float px, sat, vig, flash; uniform vec3 fogCol, lift, gain; varying vec2 vUv;
  float edgeAt(vec2 uv, float r){
    vec4 c = texture2D(nd, uv); if (dot(c.rgb,c.rgb) < .01) return 0.; float d = c.a; vec3 n = c.rgb*2.-1.;
    float e = 0.; float rr = r * clamp(7./d, .62, 1.25);
    for (int i=0;i<16;i++){ float a = float(i)*.785398 + (i>7 ? .39 : 0.); float k = i>7 ? .5 : 1.;
      vec2 o = vec2(cos(a), sin(a))*rr*k/res; vec4 s = texture2D(nd, uv+o);
      float ds = s.a; bool card = dot(s.rgb,s.rgb) < .01;
      if (card && ds > 0.) continue;            // character cards: never outlined by the world ink
      if (card) ds = 1e4;                        // sky
      vec3 ns = s.rgb*2.-1.;
      if (!(d > 30. && !card && dot(n, ns) > .995)) e = max(e, smoothstep(.006, .02, (ds - d)/d));  // depth jump, near side only (skipped for same-normal neighbours beyond 30 m: a grazing ground plane would otherwise turn solid black near the horizon)
      if (!card && abs(ds-d)/d < .06) e = max(e, smoothstep(.88, .72, dot(n, ns)) * .9); // crease
    }
    return e * (1. - smoothstep(110., 260., d));
  }
  void main(){
    vec3 c = texture2D(col, vUv).rgb;
    float e = edgeAt(vUv, px);
    c = mix(c, vec3(.012,.01,.014), e);
    if (flash < -0.5) c = vec3(e);
    float l = dot(c, vec3(.299,.587,.114)); c = mix(vec3(l), c, sat);
    c = c*gain + lift;
    vec2 q = vUv-.5; c *= 1. - vig*dot(q*vec2(1.,.75), q*vec2(1.,.75))*2.2;
    c = mix(c, vec3(1.), flash);
    gl_FragColor = vec4(c,1.); }` }));
const dofU = { src: { value: rtInk.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, focus: { value: 5 }, cinf: { value: 0 }, near: { value: 1 } };
const dofScene = fs(new THREE.ShaderMaterial({ uniforms: dofU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D src, nd; uniform vec2 res; uniform float focus, cinf, near; varying vec2 vUv;
  float coc(vec2 uv){ float d = texture2D(nd, uv).a; if (d <= 0.) d = 2000.; float k = 1. - focus/d; return k > 0. ? cinf*k : min(-k*cinf*near, cinf*1.4); }
  void main(){
    float c0 = coc(vUv);
    if (cinf < .5 || c0 < .6) { gl_FragColor = linearToOutputTexel(vec4(texture2D(src, vUv).rgb, 1.)); return; }
    vec3 acc = vec3(0.); float wsum = 0.;
    for (int i=0;i<48;i++){ float fi = float(i); float r = sqrt((fi+.5)/48.); float a = fi*2.39996;
      vec2 o = vec2(cos(a), sin(a))*r*c0/res; float cs = coc(vUv+o);
      float w = smoothstep(r*c0-1.5, r*c0+.5, cs + .5);
      acc += texture2D(src, vUv+o).rgb*w; wsum += w; }
    gl_FragColor = linearToOutputTexel(vec4(acc/max(wsum,1e-3), 1.)); }` }));
// final copy with sRGB handled by the renderer output (we render to screen with linear->sRGB in the shader chunk)
dofScene.children[0].material.toneMapped = false;

// ---------- per-frame state ----------
const tmpV = new THREE.Vector3();
function applyLight(L, f) {
  hemi.color.set(L.sky); hemi.groundColor.set(L.ground); hemi.intensity = L.hemi;
  sun.color.set(L.sun); sun.intensity = L.sunI;
  scene.fog.color.set(L.fog); scene.fog.near = L.fogNear; scene.fog.far = L.fogFar;
  inkU.fogCol.value.set(L.fog);
  skyU.top.value.set(L.skyTop); skyU.hor.value.set(L.skyHor); skyU.sunCol.value.set(L.sunDisc || '#000'); skyU.sunSize.value = L.sunSize || 0;
  inkU.sat.value = L.sat; inkU.gain.value.set(L.gain || '#ffffff'); inkU.lift.value.set(L.lift || '#000000');
  waterU.deep.value.set(L.waterDeep); waterU.shal.value.set(L.waterShal); waterU.glint.value.set(L.glint);
}
function placeSun(L, focus) {
  // sun direction from azimuth/elevation in world space
  const az = rx(L.az), el = rx(L.el); tmpV.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  skyU.sunDir.value.copy(tmpV);
  sun.position.copy(focus).addScaledVector(tmpV, 80); sun.target.position.copy(focus);
  const ext = L.shadowExt || 30, sc = sun.shadow.camera; sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 200; sc.updateProjectionMatrix();
}

function drawActors(list, cam) {
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  list.forEach((a, i) => {
    const c = getCard(i);
    c.draw(a.key, a.draw);
    c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z);
    const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
    c.mesh.rotation.set(0, Math.atan2(cam.position.x - a.x, cam.position.z - a.z) + (a.yaw || 0), a.roll || 0);
    c.mat.color.set(a.tint || '#ffffff'); c.mat.opacity = a.alpha ?? 1;
    c.mesh.castShadow = a.shadow !== false;
    c.mesh.renderOrder = a.order || 2;
    if (a.blob !== false && a.y < DECK + 0.5) { c.blob.visible = true; c.blob.position.set(a.x, (a.ground ?? DECK) + 0.02, a.z); c.blob.scale.set(0.95 * s, 0.6 * s, 1); }
  });
}

const swapForNd = (on) => {
  scene.traverse((o) => {
    if (!o.isMesh) return;
    if (on) {
      o.userData.mat0 = o.material;
      if (o.userData.ndSkip) { o.userData.vis0 = o.visible; o.visible = false; return; }
      if (o === sky || o.userData.sky) { o.userData.vis0 = o.visible; o.visible = false; return; }
      o.material = o.userData.nd || ndMat;
    } else {
      o.material = o.userData.mat0; if (o.userData.vis0 !== undefined) { o.visible = o.userData.vis0; delete o.userData.vis0; }
    }
  });
};

window.renderFrame = (f) => {
  const S = shotAt(f), L = lightFor(S, f), C = camAt(f);
  applyLight(L, f);
  camera.position.set(...C.pos); camera.up.set(0, 1, 0); camera.lookAt(...C.look); camera.rotateZ(rx(C.roll || 0));
  camera.fov = C.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  window.__cam = C; const W_ = worldAt(f); worldState(W_, f);
  placeSun(L, new THREE.Vector3(...(C.shadowAt || C.look)));
  drawActors([...actorsAt(f, T), ...fxAt(f, T)], camera);
  sky.position.copy(camera.position);
    // pass A: colour
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
  // pass B: normal + depth
  const fog = scene.fog; scene.fog = null; const sm = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false; renderer.shadowMap.autoUpdate = false;
  swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false);
  scene.fog = fog; renderer.shadowMap.enabled = sm; renderer.shadowMap.autoUpdate = true;
  if (window.DEBUG_ND) { const dm = new THREE.MeshBasicMaterial({ map: rtNd.texture }); const ds = fs(dm); renderer.setRenderTarget(null); renderer.render(ds, fsCam); return true; }
  // ink + grade
  const D = dofAt(f);
  inkU.px.value = 2.5 * RS; inkU.flash.value = window.DEBUG_E ? -1 : (C.flash || 0); inkU.vig.value = L.vig ?? 0.22;
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  // lens
  dofU.focus.value = D.focus; dofU.cinf.value = D.cinf * RS; dofU.near.value = D.near ?? 1;
  renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  return true;
};
window.TOTAL = TOTAL;
window.ready = true;
