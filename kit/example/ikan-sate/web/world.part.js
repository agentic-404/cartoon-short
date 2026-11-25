// ---------- world: "Ikan vs Sate Ayam" (pond bank + underwater) ----------
const DECK = -9999;               // no ground blobs under cards
const world = new THREE.Group(); scene.add(world);
const cv = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; };
const glow = (col, extra = {}) => new THREE.MeshBasicMaterial({ color: col, ...extra });
const rng = P.rng;
const labelTex = (text, bg, fg, w = 640, h = 220, fs = 112) => P.tex(cv(w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = '#120a1a'; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14);
  g.textAlign = 'center'; g.textBaseline = 'middle'; const lines = text.split('\n'); let fz = fs;
  for (let k = 0; k < 40; k++) { g.font = `900 ${fz}px Arial Black, Arial`; if (Math.max(...lines.map((t) => g.measureText(t).width)) <= w - 56) break; fz -= 4; }
  g.fillStyle = fg; fs = fz; lines.forEach((t, i) => g.fillText(t, w / 2, h / 2 + (i - (lines.length - 1) / 2) * fz * 1.05));
}));
const boardWith = (tex, w, h) => {
  const side = toon({ color: '#1a1022' }), front = new THREE.MeshBasicMaterial({ map: tex, fog: false });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.18), [side, side, side, side, front, side]);
  m.castShadow = false; m.userData.w = w; return m;
};
const board = (text, bg, fg, w, h, px = 640, py = 220, fs = 112) => boardWith(labelTex(text, bg, fg, px, py, fs), w, h);
const bankG = new THREE.Group(); world.add(bankG);
const UW = -2000; const under = new THREE.Group(); under.position.set(0, 0, UW); world.add(under);
const PI = Math.PI;

// ================= BANK (above water) =================
const grass = add(new THREE.PlaneGeometry(700, 700), toon({ color: '#6fae4a' }), 0, 0, 0, bankG, { cast: false }); grass.rotation.x = -PI / 2;
const RIM = toon({ color: '#d6cfbf' });
const PX = 4.6, PZ0 = -7.2, PZ1 = -1.2;
const rimH = 0.34;
add(tbox(PX * 2 + 1.4, rimH, 0.7, 1.5), RIM, 0, rimH / 2, PZ1 - 0.35, bankG);
add(tbox(PX * 2 + 1.4, rimH, 0.7, 1.5), RIM, 0, rimH / 2, PZ0 + 0.35, bankG);
for (const s of [-1, 1]) add(tbox(0.7, rimH, PZ1 - PZ0, 1.5), RIM, s * (PX + 0.35), rimH / 2, (PZ0 + PZ1) / 2, bankG);
const pondW = add(new THREE.PlaneGeometry(PX * 2, PZ1 - PZ0 - 0.0), toon({ color: '#2fa3c0' }), 0, 0.2, (PZ0 + PZ1) / 2, bankG, { cast: false }); pondW.rotation.x = -PI / 2;
const glints = []; { const r = rng(8); for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.22), glow('#e8fbff', { transparent: true, opacity: 0.8 })); m.rotation.x = -PI / 2; m.userData.ndSkip = true; m.userData.p = [(r() - 0.5) * 8, PZ0 + 0.6 + r() * 4.6, r() * 6]; m.position.y = 0.22; bankG.add(m); glints.push(m); } }
// lily pads
{ const r = rng(5); const lp = toon({ color: '#4c9a3a' }); for (let i = 0; i < 6; i++) { const c = add(new THREE.CircleGeometry(0.4 + r() * 0.25, 12), lp, (r() - 0.5) * 8, 0.23, PZ0 + 0.9 + r() * 4.3, bankG, { cast: false }); c.rotation.x = -PI / 2; c.userData.ndSkip = true; } }
// ripples + splash
const ripples = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 56), glow('#ffffff', { transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false })); m.rotation.x = -PI / 2; m.position.y = 0.26; m.userData.ndSkip = true; m.visible = false; bankG.add(m); return m; });
const drops = []; { for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), glow('#d8f6ff')); m.userData.ndSkip = true; m.visible = false; bankG.add(m); drops.push(m); } }
const crown = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 14, 1, true), glow('#e6faff', { transparent: true, opacity: 0.8, side: THREE.DoubleSide })); crown.userData.ndSkip = true; crown.visible = false; bankG.add(crown);
// bamboo fence + sign
{ const bam = toon({ color: '#c9a74a' }), bamD = toon({ color: '#a8872f' }); for (let x = -13; x <= 13; x += 0.55) add(new THREE.CylinderGeometry(0.08, 0.08, 1.9 + ((x * 7) % 3) * 0.05, 8), bam, x, 0.95, -10.2, bankG);
  for (const y of [0.6, 1.4]) add(new THREE.CylinderGeometry(0.06, 0.06, 28, 8), bamD, 0, y, -10.0, bankG).rotation.z = PI / 2; }
const kolamSign = board('KOLAM IKAN', '#2f8f5a', '#fff', 3.6, 1.0, 640, 190, 120); kolamSign.position.set(-5.2, 2.7, -9.9); bankG.add(kolamSign);
// banana plants + palms
const leafM = toon({ color: '#58a83c' }), leafD = toon({ color: '#3f8a2e' }), trunkM = toon({ color: '#7a5a3a' });
const banana = (x, z, sc = 1) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(sc); bankG.add(g); add(new THREE.CylinderGeometry(0.16, 0.22, 2.2, 8), toon({ color: '#9bbf5a' }), 0, 1.1, 0, g);
  for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2; const L = add(new THREE.SphereGeometry(1, 10, 6), i % 2 ? leafM : leafD, Math.cos(a) * 0.95, 2.35 + (i % 3) * 0.12, Math.sin(a) * 0.95, g); L.scale.set(1.5, 0.05, 0.45); L.rotation.y = -a; L.rotation.z = Math.cos(a * 0 + 0) * 0; L.rotation.set(0, -a, -0.38); } return g; };
[[-9, -8.2, 1.2], [8.5, -8, 1.1], [-12, -3, 1.0], [12.5, -4, 1.3]].forEach(([x, z, s]) => banana(x, z, s));
const palm = (x, z, h = 8) => { const g = new THREE.Group(); g.position.set(x, 0, z); bankG.add(g); const t = add(new THREE.CylinderGeometry(0.28, 0.4, h, 8), trunkM, 0, h / 2, 0, g); t.rotation.z = 0.08;
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; const L = add(new THREE.SphereGeometry(1, 10, 6), i % 2 ? leafM : leafD, Math.cos(a) * 1.7 + 0.5, h + 0.1, Math.sin(a) * 1.7, g); L.scale.set(2.2, 0.08, 0.5); L.rotation.set(0, -a, -0.35); } return g; };
[[-16, -16], [15, -14], [-22, -6], [24, -9], [-26, -24], [30, -26]].forEach(([x, z], i) => palm(x, z, 8 + (i % 3) * 1.5));
{ const r = rng(77); for (let i = 0; i < 12; i++) { const a = r() * PI * 2, d = 140 + r() * 120; const h = add(new THREE.SphereGeometry(30 + r() * 30, 18, 10), i % 2 ? M.hill : M.hillFar, Math.cos(a) * d, -9, -Math.abs(Math.sin(a)) * d - 40, bankG, { cast: false }); h.scale.y = 0.45 + r() * 0.3; }
  for (let i = 0; i < 6; i++) { const x = -330 + i * 130 + r() * 30, hh = 45 + r() * 40; const g = new THREE.Group(); g.position.set(x, -4, -430 - r() * 100); bankG.add(g); add(new THREE.ConeGeometry(130 + r() * 40, hh, 8), toon({ color: '#6f95b8' }), 0, hh / 2, 0, g, { cast: false }); } }
// clouds
{ const r = rng(90); for (let i = 0; i < 8; i++) { const c = document.createElement('canvas'); c.width = 600; c.height = 400; const pen = new T.Pen(c.getContext('2d')); pen.ol = 0; pen.g.translate(300, 200); pen.g.scale(1.4, 1.2); pen.g.translate(-300, -200); T.fxCloud(pen, i + 1);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.667), new THREE.MeshBasicMaterial({ map: P.tex(c), transparent: true, fog: false, depthWrite: false })); m.position.set((r() - 0.5) * 900, 100 + r() * 120, -600 - r() * 200); m.scale.setScalar(170 + r() * 120); m.userData.ndSkip = true; m.renderOrder = -1; bankG.add(m); } }
// charcoal grill + skewers + smoke (the satay seller's stall)
const grill = new THREE.Group(); grill.position.set(5.6, 0, 1.0); bankG.add(grill);
add(tbox(2.2, 0.7, 0.8, 1), toon({ color: '#3c3a3a' }), 0, 0.5, 0, grill); add(tbox(2.0, 0.08, 0.6, 1), glow('#ff7a2a'), 0, 0.82, 0, grill).userData.ndSkip = true;
for (const x of [-0.7, 0.7]) for (const z of [-0.3, 0.3]) add(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 6), toon({ color: '#3c3a3a' }), x, 0.12, z, grill);
for (let i = 0; i < 6; i++) { const sk = new THREE.Group(); sk.position.set(-0.85 + i * 0.34, 0.95, 0); grill.add(sk); add(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 5), toon({ color: '#d9b77a' }), 0, 0, 0, sk).rotation.x = PI / 2; for (let k = 0; k < 3; k++) add(new THREE.SphereGeometry(0.1, 8, 6), toon({ color: '#b87a3e' }), 0, 0, -0.25 + k * 0.22, sk); }
const smoke = []; for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), glow('#f2f2f2', { transparent: true, opacity: 0.5, depthWrite: false })); m.userData.ndSkip = true; bankG.add(m); smoke.push(m); }
const peeks = [0, 1].map((i) => { const g = new THREE.Group(); bankG.add(g); const m = toon({ color: i ? '#ff9a3a' : '#f2c230' });
  const b = add(new THREE.SphereGeometry(0.55, 16, 12), m, 0, 0, 0, g); b.scale.set(1, 0.8, 0.9);
  for (const s of [-1, 1]) { add(new THREE.SphereGeometry(0.22, 12, 10), toon({ color: '#ffffff' }), s * 0.27, 0.22, 0.4, g); add(new THREE.SphereGeometry(0.14, 10, 8), toon({ color: '#14101c' }), s * 0.25, 0.25, 0.57, g); const h = add(new THREE.SphereGeometry(0.04, 6, 4), glow('#ffffff'), s * 0.22, 0.31, 0.7, g); h.userData.ndSkip = true; }
  const mo = add(new THREE.SphereGeometry(0.12, 10, 8), toon({ color: '#3a1420' }), 0, -0.14, 0.5, g); mo.scale.set(1.2, 0.5, 0.5); g.visible = false; return g; });

// ================= UNDER (underwater) =================
const sand = add(new THREE.PlaneGeometry(400, 400), toon({ color: '#dcc48a' }), 0, -3.5, 0, under, { cast: false }); sand.rotation.x = -PI / 2;
{ const r = rng(3); const sp = toon({ color: '#c8ab6c' }); for (let i = 0; i < 40; i++) { const c = add(new THREE.CircleGeometry(0.8 + r() * 2.2, 12), sp, (r() - 0.5) * 36, -3.49, 14 - r() * 42, under, { cast: false }); c.rotation.x = -PI / 2; c.userData.ndSkip = true; } }
{ const r = rng(15); const rk = [toon({ color: '#6c7f8c' }), toon({ color: '#58697a' })]; for (let i = 0; i < 16; i++) { const m = add(new THREE.DodecahedronGeometry(0.6 + r() * 1.3, 0), rk[i % 2], (r() - 0.5) * 24, -3.4 + r() * 0.2, 6 - r() * 24, under); m.rotation.set(r() * 3, r() * 3, r() * 3); m.scale.y = 0.7; } }
const weeds = []; { const r = rng(9); const wg = [toon({ color: '#3f9a52' }), toon({ color: '#2f7d44' }), toon({ color: '#58b05a' })];
  for (let i = 0; i < 22; i++) { const g = new THREE.Group(); g.position.set((r() - 0.5) * 22, -3.5, 5 - r() * 22); under.add(g); const hgt = 2 + r() * 3; const cn = add(new THREE.ConeGeometry(0.28, hgt, 6), wg[i % 3], 0, hgt / 2, 0, g); cn.scale.z = 0.45; g.userData.ph = r() * 6.3; g.userData.k = 0.1 + r() * 0.08; weeds.push(g); } }
const ceilM = new THREE.MeshBasicMaterial({ color: '#b9ecff', side: THREE.DoubleSide, fog: false });
const ceil = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), ceilM); ceilM.depthWrite = false; ceil.renderOrder = -5; ceil.rotation.x = PI / 2; ceil.position.y = 3.2; ceil.userData.ndSkip = true; under.add(ceil);
const rays = []; { const r = rng(12); for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4 + r() * 1.2, 16), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); m.position.set(-8 + i * 2.8 + r(), -0.4, -8 - r() * 8); m.rotation.z = 0.22; m.userData.ndSkip = true; m.userData.ph = r() * 6; under.add(m); rays.push(m); } }
const bubs = []; { const r = rng(31); for (let i = 0; i < 46; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.06 + r() * 0.1, 8, 6), glow('#eafcff', { transparent: true, opacity: 0.8 })); m.userData.ndSkip = true; m.userData.b = [(r() - 0.5) * 12, r() * 7, 3 - r() * 12, 0.02 + r() * 0.035]; under.add(m); bubs.push(m); } }
const oilSlick = new THREE.Mesh(new THREE.CircleGeometry(1, 40), glow('#e3b32c', { transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false, fog: false })); oilSlick.rotation.x = PI / 2; oilSlick.position.y = 3.15; oilSlick.userData.ndSkip = true; under.add(oilSlick);
const oilBlobs = []; { const r = rng(52); const cc = ['#c9a02a', '#f0c53a', '#a8801c', '#e8b82a']; for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.CircleGeometry(1, 30), glow(cc[i % 4], { transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, fog: false })); m.rotation.x = PI / 2; m.position.set((r() - 0.5) * 16, 3.14 - i * 0.002, (r() - 0.5) * 12 - 2); m.userData.ndSkip = true; m.userData.k = [r(), r() * 6]; under.add(m); oilBlobs.push(m); } }
const oilDrops = []; { const r = rng(44); for (let i = 0; i < 22; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.1 + r() * 0.16, 10, 8), glow('#f0c53a', { transparent: true, opacity: 0.85 })); m.userData.ndSkip = true; m.userData.o = [(r() - 0.5) * 8, r() * 6.5, 2 - r() * 6, 0.02 + r() * 0.03]; under.add(m); oilDrops.push(m); } }

// ---- the satay skewer ----
const sate = new THREE.Group(); world.add(sate); sate.visible = false;
const sateM = { stick: toon({ color: '#e0bf82' }), meat: toon({ color: '#c98a4b' }), char: toon({ color: '#6a3f22' }), sauce: toon({ color: '#8a5326' }), chili: toon({ color: '#d4302b' }), skin: toon({ color: '#e3b88f' }) };
add(new THREE.CylinderGeometry(0.05, 0.05, 3.3, 8), sateM.stick, 0, 0.4, 0, sate);
add(new THREE.ConeGeometry(0.05, 0.3, 8), sateM.stick, 0, 2.2, 0, sate);
const roundCube = (w, h, d) => { const g = new THREE.BoxGeometry(w, h, d, 4, 4, 4); const p = g.attributes.position, v = new THREE.Vector3(); const r = Math.min(w, h, d) * 0.5;
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const hx = w / 2 - r * 0.5, hy = h / 2 - r * 0.5, hz = d / 2 - r * 0.5; const c = new THREE.Vector3(Math.max(-hx, Math.min(hx, v.x)), Math.max(-hy, Math.min(hy, v.y)), Math.max(-hz, Math.min(hz, v.z)));
    const dir = v.clone().sub(c); if (dir.length() > 1e-5) { dir.normalize().multiplyScalar(r * 0.5); v.copy(c).add(dir); } p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g; };
const chunks = [];
for (let i = 0; i < 4; i++) {
  const g = new THREE.Group(); g.position.set(0, -0.25 + i * 0.52, 0); g.rotation.y = i * 0.5; sate.add(g);
  const m = add(roundCube(0.62, 0.46, 0.58), sateM.meat, 0, 0, 0, g);
  add(new THREE.BoxGeometry(0.5, 0.045, 0.03), sateM.char, 0, 0.06, 0.295, g).rotation.z = 0.5; add(new THREE.BoxGeometry(0.5, 0.045, 0.03), sateM.char, 0.05, -0.09, 0.295, g).rotation.z = 0.5;
  const sc = add(new THREE.SphereGeometry(0.3, 12, 8), sateM.sauce, 0.04, 0.23, 0.04, g); sc.scale.set(0.95, 0.26, 0.9);
  add(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 6), sateM.chili, -0.1, 0.33, 0.1, g).rotation.z = 0.9;
  add(new THREE.SphereGeometry(0.07, 8, 6), sateM.sauce, 0.2, -0.03, 0.31, g).scale.set(0.8, 1.5, 0.6);
  chunks.push(g);
}
const handG = new THREE.Group(); handG.position.set(0, -1.05, 0); sate.add(handG);
add(new THREE.SphereGeometry(0.2, 14, 10), sateM.skin, 0, 0, 0, handG).scale.set(1, 1.2, 1);
add(new THREE.SphereGeometry(0.09, 10, 8), sateM.skin, 0.15, 0.14, 0.1, handG);
for (let i = 0; i < 3; i++) add(new THREE.SphereGeometry(0.065, 8, 6), sateM.skin, -0.11 + i * 0.11, 0.16, 0.16, handG);

// ---- ingredient props (floating near the skewer) ----
const ing = [new THREE.Group(), new THREE.Group(), new THREE.Group(), new THREE.Group()];
ing.forEach((g) => { g.visible = false; under.add(g); });
{ // 0: peanut sauce pile
  const sc = add(new THREE.SphereGeometry(0.7, 16, 10), toon({ color: '#8a5326' }), 0, 0.1, 0, ing[0]); sc.scale.set(1.15, 0.6, 1.1);
  const r = rng(2); for (let i = 0; i < 8; i++) { const a = r() * 6.28, d = r() * 0.45; add(new THREE.SphereGeometry(0.13, 8, 6), toon({ color: '#d8b070' }), Math.cos(a) * d, 0.42 + r() * 0.1, Math.sin(a) * d, ing[0]).scale.set(1.3, 1, 1); }
  // 1: salt shaker
  add(new THREE.CylinderGeometry(0.34, 0.38, 0.9, 14), toon({ color: '#f4f6f8' }), 0, 0, 0, ing[1]);
  add(new THREE.SphereGeometry(0.34, 14, 8, 0, PI * 2, 0, PI / 2), toon({ color: '#aab4bd' }), 0, 0.45, 0, ing[1]);
  for (let i = 0; i < 5; i++) add(new THREE.SphereGeometry(0.03, 6, 4), toon({ color: '#3c4650' }), Math.cos(i * 1.26) * 0.14, 0.76, Math.sin(i * 1.26) * 0.14, ing[1]);
  // 2: kecap bottle
  add(new THREE.CylinderGeometry(0.34, 0.38, 1.0, 14), toon({ color: '#2a1810' }), 0, -0.15, 0, ing[2]);
  add(new THREE.CylinderGeometry(0.14, 0.3, 0.4, 12), toon({ color: '#2a1810' }), 0, 0.55, 0, ing[2]);
  add(new THREE.CylinderGeometry(0.16, 0.16, 0.2, 10), toon({ color: '#d4302b' }), 0, 0.85, 0, ing[2]);
  add(new THREE.BoxGeometry(0.5, 0.45, 0.02), toon({ color: '#f1e3b4' }), 0, -0.15, 0.37, ing[2]);
  // 3: oil bottle
  add(new THREE.CylinderGeometry(0.32, 0.36, 1.0, 14), toon({ color: '#e8b82a' }), 0, -0.15, 0, ing[3]);
  add(new THREE.CylinderGeometry(0.13, 0.3, 0.4, 12), toon({ color: '#e8b82a' }), 0, 0.55, 0, ing[3]);
  add(new THREE.CylinderGeometry(0.15, 0.15, 0.18, 10), toon({ color: '#f4f6f8' }), 0, 0.84, 0, ing[3]);
  const dr = add(new THREE.SphereGeometry(0.16, 10, 8), toon({ color: '#f0c53a' }), 0.55, 0.1, 0, ing[3]); dr.scale.set(0.8, 1.2, 0.8);
}

// ---- fish ----
const fishTex = (kind) => {
  const c = cv(512, 256, (g, w, h) => {
    const base = { lele: ['#4e5b66', '#aeb7bf'], cichlid: ['#f2c230', '#ffe9a0'], koi: ['#fbf6ee', '#ffffff'] }[kind];
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, base[0]); gr.addColorStop(0.55, base[0]); gr.addColorStop(1, base[1]); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const R = rng(kind.length * 17);
    const both = (u, v, fn) => { fn(u * w, v * h); fn((1 - u) * w, v * h); };
    if (kind === 'cichlid') { g.fillStyle = '#2b2a38'; for (const u of [0.14, 0.2, 0.26, 0.32, 0.38]) both(u, 0.5, (x) => g.fillRect(x - 11, 0, 22, h * 0.82)); }
    if (kind === 'lele') { g.fillStyle = '#39434d'; for (let i = 0; i < 22; i++) both(0.1 + R() * 0.35, 0.2 + R() * 0.45, (x, y) => { g.beginPath(); g.arc(x, y, 5 + R() * 9, 0, 6.3); g.fill(); }); }
    if (kind === 'koi') { g.fillStyle = '#ff7a1a'; both(0.2, 0.3, (x, y) => { g.beginPath(); g.ellipse(x, y, 60, 42, 0.3, 0, 6.3); g.fill(); }); both(0.34, 0.42, (x, y) => { g.beginPath(); g.ellipse(x, y, 38, 30, 0, 0, 6.3); g.fill(); }); both(0.43, 0.22, (x, y) => { g.beginPath(); g.ellipse(x, y, 34, 26, 0, 0, 6.3); g.fill(); }); g.fillStyle = '#1a1a1a'; both(0.28, 0.58, (x, y) => { g.beginPath(); g.ellipse(x, y, 22, 17, 0, 0, 6.3); g.fill(); }); both(0.12, 0.45, (x, y) => { g.beginPath(); g.ellipse(x, y, 18, 14, 0, 0, 6.3); g.fill(); }); }
  });
  return P.tex(c);
};
const spiralTex = P.tex(cv(256, 256, (g, w, h) => { g.fillStyle = '#ffffff'; g.beginPath(); g.arc(128, 128, 126, 0, 6.3); g.fill(); g.strokeStyle = '#1a1022'; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); for (let a = 0; a < 18; a += 0.15) { const r = 6 + a * 6.2; const x = 128 + Math.cos(a) * r, y = 128 + Math.sin(a) * r; a === 0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); }));
const FISH = {
  lele: { rx: 1.05, ry: 0.5, rz: 0.5, eye: 0.3, fin: '#3a4650', tail: [1.1, 0.95], dorsal: [2.4, 0.4], whisk: true, mouth: [0.42, 0.55] },
  cichlid: { rx: 0.9, ry: 0.72, rz: 0.4, eye: 0.3, fin: '#e8962a', tail: [0.9, 1.0], dorsal: [1.7, 0.75], whisk: false, mouth: [0.3, 0.3] },
  koi: { rx: 1.0, ry: 0.55, rz: 0.46, eye: 0.28, fin: '#ff9a3a', tail: [1.0, 1.05], dorsal: [1.2, 0.5], whisk: true, mouth: [0.3, 0.32] },
};
const finG = (a, b, c) => new THREE.ConeGeometry(a, b, 4);
function makeFish(kind) {
  const D = FISH[kind], g = new THREE.Group(), P_ = { kind, D };
  P_.root = g; under.add(g);
  const bodyMat = toon({ map: fishTex(kind), color: '#ffffff' }); P_.bodyMat = bodyMat;
  const body = add(new THREE.SphereGeometry(1, 28, 18), bodyMat, 0, 0, 0, g); body.scale.set(D.rx, D.ry, D.rz); P_.body = body;
  const finMat = toon({ color: D.fin }); P_.finMat = finMat;
  // tail (pivot at the back of the body)
  const tp = new THREE.Group(); tp.position.set(-D.rx * 0.92, 0, 0); g.add(tp); P_.tail = tp;
  const tl = add(new THREE.ConeGeometry(0.5, D.tail[0], 4), finMat, -D.tail[0] / 2 + 0.05, 0, 0, tp); tl.rotation.z = -PI / 2; tl.scale.set(D.tail[1] * D.ry * 1.6, 1, 0.1);
  const df = add(new THREE.ConeGeometry(0.5, 1, 4), finMat, -D.rx * 0.05, D.ry * 0.88, 0, g); df.scale.set(D.dorsal[0] * D.rx * 0.5, D.dorsal[1] * D.ry * 1.0, 0.1); df.rotation.z = 0.0;
  for (const s of [-1, 1]) { const pf = add(new THREE.ConeGeometry(0.25, 0.7, 4), finMat, D.rx * 0.2, -D.ry * 0.55, s * D.rz * 0.8, g); pf.rotation.set(s * 0.6, 0, 0.9); pf.scale.z = 0.25; }
  // mouth
  const mouth = add(new THREE.SphereGeometry(1, 14, 10), toon({ color: '#3a1420' }), D.rx * 0.93, -D.ry * 0.12, 0, g); mouth.scale.set(0.12, D.mouth[0] * 0.5, D.mouth[1] * D.rz * 1.1); P_.mouth = mouth; P_.mouth0 = mouth.scale.clone();
  const tongue = add(new THREE.SphereGeometry(1, 10, 8), toon({ color: '#ff7a9a' }), D.rx * 1.02, -D.ry * 0.28, 0, g); tongue.scale.set(0.2, 0.1, 0.22); tongue.visible = false; P_.tongue = tongue;
  // whiskers
  P_.whisk = [];
  if (D.whisk) for (const s of [-1, 1]) for (const k of [0, 1]) { const w = new THREE.Group(); w.position.set(D.rx * 0.9, -D.ry * 0.12 + k * 0.1, s * D.rz * (0.4 + k * 0.25)); g.add(w); const cyl = add(new THREE.CylinderGeometry(0.025, 0.012, 0.75, 5), toon({ color: kind === 'koi' ? '#e8d8b8' : '#2c333b' }), 0.45, 0, 0, w); cyl.rotation.z = PI / 2; cyl.position.x = 0.36; w.userData.s = s; w.userData.k = k; P_.whisk.push(w); }
  // eyes
  P_.eyes = [];
  const er = D.eye;
  for (const s of [-1, 1]) {
    const n = new THREE.Vector3(0.55, 0.35, 0.78 * s).normalize();
    const pos = new THREE.Vector3(D.rx * 0.6, D.ry * 0.3, D.rz * 0.7 * s);
    const eg = new THREE.Group(); eg.position.copy(pos); eg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n); g.add(eg);
    const white = add(new THREE.SphereGeometry(er, 18, 12), toon({ color: '#ffffff' }), 0, 0, 0, eg);
    const pup = add(new THREE.SphereGeometry(er * 0.55, 12, 10), toon({ color: '#14101c' }), 0, 0, er * 0.62, eg);
    const hl = add(new THREE.SphereGeometry(er * 0.16, 8, 6), glow('#ffffff'), er * 0.12, er * 0.14, er * 1.08, eg); hl.userData.ndSkip = true;
    const lid = add(new THREE.SphereGeometry(er * 1.09, 16, 10, 0, PI * 2, 0, PI / 2), bodyMat, 0, 0, 0, eg); lid.castShadow = false;
    const sp = new THREE.Mesh(new THREE.CircleGeometry(er * 0.92, 24), new THREE.MeshBasicMaterial({ map: spiralTex, side: THREE.DoubleSide })); sp.position.z = er * 1.0; sp.userData.ndSkip = true; sp.visible = false; eg.add(sp);
    P_.eyes.push({ eg, white, pup, hl, lid, sp, s, er });
  }
  g.visible = false; return P_;
}
const fishes = [makeFish('lele'), makeFish('cichlid'), makeFish('koi')];
const smalls = []; { const cols = ['#ff8a3c', '#ffb23c', '#5fa8ff', '#ff6a8a', '#ffd23c']; for (let i = 0; i < 6; i++) { const g = new THREE.Group(); under.add(g); const m = toon({ color: cols[i % 5] }); const b = add(new THREE.SphereGeometry(1, 12, 8), m, 0, 0, 0, g); b.scale.set(0.38, 0.2, 0.15); const t = add(new THREE.ConeGeometry(0.2, 0.3, 4), m, -0.38, 0, 0, g); t.rotation.z = -PI / 2; t.scale.z = 0.2; add(new THREE.SphereGeometry(0.05, 8, 6), toon({ color: '#14101c' }), 0.22, 0.05, 0.1, g); g.visible = false; smalls.push(g); } }

// ---- prohibition sign, medal, podium, confetti ----
const noTex = P.tex(cv(512, 512, (g, w, h) => { g.fillStyle = '#ffffff'; g.beginPath(); g.arc(256, 256, 244, 0, 6.3); g.fill();
  g.strokeStyle = '#d4302b'; g.lineWidth = 46; g.beginPath(); g.arc(256, 256, 208, 0, 6.3); g.stroke();
  g.save(); g.translate(256, 256); g.rotate(-0.55); g.fillStyle = '#d9b77a'; g.fillRect(-150, -7, 300, 14); g.fillStyle = '#b87a3e'; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(-60 + i * 62, 0, 30, 36, 0, 0, 6.3); g.fill(); } g.restore();
  g.strokeStyle = '#d4302b'; g.lineWidth = 46; g.beginPath(); g.moveTo(256 - 148, 256 - 148); g.lineTo(256 + 148, 256 + 148); g.stroke(); g.strokeStyle = '#120a1a'; g.lineWidth = 8; g.beginPath(); g.arc(256, 256, 244, 0, 6.3); g.stroke(); }));
const noSign = new THREE.Group(); bankG.add(noSign); noSign.visible = false;
{ const disc = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.12, 40), [toon({ color: '#1a1022' }), new THREE.MeshBasicMaterial({ map: noTex }), toon({ color: '#1a1022' })]); disc.rotation.x = PI / 2; disc.userData.w = 2; noSign.add(disc); noSign.userData.disc = disc;
  add(new THREE.CylinderGeometry(0.07, 0.07, 2.2, 8), toon({ color: '#7a5a3a' }), 0, -2.0, -0.1, noSign); }
const podium = new THREE.Group(); under.add(podium); podium.visible = false;
add(tbox(1.8, 1.0, 1.6, 1), toon({ color: '#e8c14a' }), 0, -3.0, 0, podium); add(tbox(1.5, 0.3, 1.4, 1), toon({ color: '#c9a02e' }), 0, -2.35, 0, podium);
const medal = new THREE.Group(); under.add(medal); medal.visible = false;
add(new THREE.CylinderGeometry(0.34, 0.34, 0.09, 24), toon({ color: '#ffd23c' }), 0, 0, 0, medal).rotation.x = PI / 2; add(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 20), toon({ color: '#e8a81c' }), 0, 0, 0.02, medal).rotation.x = PI / 2;
const confetti = []; { const r = rng(61); const cc = ['#ff4d6d', '#ffd23c', '#4dd2ff', '#7dff6a', '#c77dff']; for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.1), glow(cc[i % 5], { side: THREE.DoubleSide })); m.userData.ndSkip = true; m.userData.c = [(r() - 0.5) * 7, r() * 8, -r() * 4, 0.025 + r() * 0.03, r() * 6]; m.visible = false; under.add(m); confetti.push(m); } }

// ---- labels ----
const LBL = {};
const mkLabel = (id, text, bg, fg, w, h, fs = 112, px = 640, py = 220) => { const b = board(text, bg, fg, w, h, px, py, fs); b.visible = false; world.add(b); LBL[id] = b; };
mkLabel('q', '?', '#e8c14a', '#241726', 1.7, 1.7, 170, 220, 220);
mkLabel('uji', 'UJI COBA', '#e8c14a', '#241726', 4.4, 1.3, 120);
mkLabel('lele', 'LELE', '#4e5b66', '#fff', 3.4, 1.2, 130);
mkLabel('cichlid', 'CICHLID', '#e8962a', '#241726', 4.2, 1.2, 120);
mkLabel('curiga', 'HMM...', '#6a2a8a', '#fff', 3.6, 1.2, 130);
mkLabel('serbu', 'SERBU!!', '#d4302b', '#fff', 4.4, 1.4, 130);
mkLabel('polos', 'AYAM MATANG\nPOLOS', '#2e9a5a', '#fff', 5, 2.2, 100, 640, 300);
mkLabel('sedikit', 'SEDIKIT SAJA', '#2e8a80', '#fff', 5, 1.3, 100);
mkLabel('ok', 'AMAN', '#2e9a5a', '#fff', 3.2, 1.2, 130);
mkLabel('sate', 'SATE!', '#d4302b', '#fff', 3.6, 1.4, 150);
mkLabel('kacang', 'BUMBU\nKACANG', '#8a5326', '#fff', 2.3, 1.3, 90, 560, 300);
mkLabel('garam', 'GARAM', '#7a8a9a', '#fff', 2.2, 0.9, 100);
mkLabel('kecap', 'KECAP', '#2a1810', '#ffe9a0', 2.2, 0.9, 100);
mkLabel('minyak', 'MINYAK', '#e8b82a', '#241726', 2.2, 0.9, 100);
mkLabel('tidakbaik', 'TIDAK BAIK!', '#d4302b', '#fff', 4.6, 1.3, 110);
mkLabel('kotor', 'AIR KOTOR', '#8a7a2a', '#fff', 4.2, 1.2, 110);
mkLabel('juara', 'JUARA LIDAH', '#e8c14a', '#241726', 5.2, 1.3, 110);
mkLabel('kalah', 'KALAH DI KOLAM', '#6a2a8a', '#fff', 5.6, 1.3, 100);
mkLabel('rumah', 'JANGAN COBA\nDI RUMAH', '#d4302b', '#fff', 5.2, 2.3, 90, 640, 300);
mkLabel('kamu', 'UNTUK KAMU', '#e8c14a', '#241726', 4.8, 1.2, 110);
mkLabel('bukan', 'BUKAN UNTUK IKAN', '#2e8a80', '#fff', 6.0, 1.2, 90);

const ease = (t) => t * t * (3 - 2 * t);
const tmp = new THREE.Vector3();
function worldState(S, f) {
  const bank = S.set === 'bank'; under.updateMatrixWorld(true);
  bankG.visible = bank; under.visible = !bank;
  for (const k in LBL) LBL[k].visible = false;
  (S.labels || []).forEach((l) => { const b = LBL[l.id]; b.visible = true; b.position.set(l.x, l.y, l.z); b.scale.setScalar(Math.max(0.001, Math.min(l.s ?? 1, (l.s ?? 1) * fitScale(window.__cam, [l.x, l.y, l.z], b.userData.w * (l.s ?? 1))))); b.rotation.set(0, l.ry || 0, l.rz || 0); });
  const T_ = f;
  if (bank) {
    glints.forEach((m) => { const p = m.userData.p; m.position.x = p[0] + Math.sin(f * 0.03 + p[2]) * 0.4; m.position.z = p[1]; m.scale.set(0.5 + 0.5 * Math.abs(Math.sin(f * 0.07 + p[2])), 1, 1); });
    smoke.forEach((m, i) => { const t = ((f * 0.012 + i / 8) % 1); m.position.set(5.6 + 0.2 * Math.sin(f * 0.05 + i) + t * 0.6, 1.2 + t * 3.2, 1.0 + 0.1 * Math.sin(i)); m.scale.setScalar(0.4 + t * 1.1); m.material.opacity = 0.5 * (1 - t); });
    // splash + ripples
    const sp = S.splash; drops.forEach((m, i) => { m.visible = false; });
    ripples.forEach((m) => { m.visible = false; }); crown.visible = false;
    if (sp) { const t = sp.t; // seconds since impact
      if (t >= 0) { crown.visible = t < 0.5; const ct = Math.min(1, t / 0.5); crown.position.set(sp.x, 0.3 + 0.9 * Math.sin(ct * PI) * 0.8, sp.z); crown.scale.set(1.0 + ct * 1.6, 0.5 + 0.9 * Math.sin(ct * PI), 1.0 + ct * 1.6); crown.material.opacity = 0.85 * (1 - ct);
        drops.forEach((m, i) => { const a = i / drops.length * PI * 2, v = 2.2 + (i % 3) * 0.9, y = 0.25 + v * 1.6 * t - 4.9 * t * t; m.visible = y > 0.2 && t < 1.4; m.position.set(sp.x + Math.cos(a) * v * 0.42 * t, y, sp.z + Math.sin(a) * v * 0.42 * t); });
        ripples.forEach((m, i) => { const tt = t - i * 0.22; m.visible = tt > 0 && tt < 1.6; if (m.visible) { m.position.set(sp.x, 0.26, sp.z); m.scale.setScalar(0.3 + tt * 2.4); m.material.opacity = 0.9 * (1 - tt / 1.6); } }); } }
    peeks.forEach((g, i) => { const Pk = (S.peek || [])[i]; g.visible = !!Pk; if (Pk) { g.position.set(Pk.x, 0.05 + 0.5 * Pk.rise + 0.03 * Math.sin(f * 0.1 + i), Pk.z); g.rotation.y = 0.45 - i * 0.25; } });
    noSign.visible = !!S.noSign; if (S.noSign) { noSign.position.set(...S.noSign.pos); noSign.scale.setScalar(Math.max(0.001, S.noSign.s)); noSign.rotation.set(0, S.noSign.ry || 0, S.noSign.rz || 0); }
  } else {
    // underwater ambience
    weeds.forEach((g) => { g.rotation.z = Math.sin(f * 0.05 + g.userData.ph) * g.userData.k; g.rotation.x = Math.cos(f * 0.04 + g.userData.ph) * g.userData.k * 0.5; });
    rays.forEach((m) => { m.material.opacity = 0.07 + 0.06 * Math.sin(f * 0.04 + m.userData.ph); m.position.x += 0; });
    bubs.forEach((m) => { const b = m.userData.b; m.position.set(b[0] + Math.sin(f * 0.06 + b[1]) * 0.15, -3.4 + ((b[1] + f * b[3] * 1.6) % 6.6), b[2]); });
    const murk = S.murk || 0; ceilM.color.set('#b9ecff').lerp(new THREE.Color('#b8a850'), murk);
    oilSlick.visible = (S.oil || 0) > 0.01; if (oilSlick.visible) { oilSlick.scale.setScalar(2 + S.oil * 40); oilSlick.material.opacity = 0.35 + 0.35 * S.oil; }
    oilBlobs.forEach((m) => { m.visible = (S.oil || 0) > 0.01; m.scale.setScalar(Math.max(0.01, (S.oil || 0) * (1.2 + 3.2 * m.userData.k[0]) * (1 + 0.06 * Math.sin(f * 0.05 + m.userData.k[1])))); });
    oilDrops.forEach((m) => { const o = m.userData.o; m.visible = (S.oilDrops || 0) > 0.02; m.scale.setScalar(Math.min(1, S.oilDrops || 0)); m.position.set(o[0] + Math.sin(f * 0.05 + o[1]) * 0.2, 3 - ((o[1] + f * o[3]) % 6.4), o[2]); });
  }
  // skewer lives in world space (story gives absolute coordinates)
  if (S.sate) { sate.visible = true; sate.position.set(...S.sate.pos); sate.rotation.set(...(S.sate.rot || [0, 0, 0])); sate.scale.setScalar(S.sate.s || 1); handG.visible = !!S.sate.hand;
    const cubes = S.sate.cubes ?? 4; chunks.forEach((c, i) => { const k = Math.max(0, Math.min(1, cubes - (3 - i))); c.visible = k > 0.02; c.scale.setScalar(Math.max(0.05, k)); }); }
  else sate.visible = false;
  // ingredients
  ing.forEach((g, i) => { const I = (S.ing || [])[i]; g.visible = !!I && !bank; if (I) { g.position.set(I.x, I.y + 0.08 * Math.sin(f * 0.07 + i * 2), I.z); g.scale.setScalar(Math.max(0.001, I.s)); g.rotation.set(0, I.ry ?? 0.4 * Math.sin(f * 0.03 + i), 0.12 * Math.sin(f * 0.05 + i)); } });
  // fish
  fishes.forEach((F, i) => {
    const st = (S.fish || [])[i]; F.root.visible = !!st && !bank; if (!st || bank) return;
    F.root.position.set(st.x, st.y, st.z); F.root.rotation.set(st.roll || 0, st.yaw || 0, st.pitch || 0, 'YXZ'); F.root.scale.setScalar(st.s || 1); F.root.updateMatrixWorld(true);
    F.tail.rotation.y = Math.sin(f * (st.rate || 0.22)) * (st.amp ?? 0.35);
    F.body.rotation.y = Math.sin(f * (st.rate || 0.22) + 0.6) * (st.amp ?? 0.35) * 0.1;
    F.bodyMat.color.set(st.tint || '#ffffff'); F.finMat.color.set(F.D.fin).lerp(new THREE.Color(st.tint || '#ffffff'), st.tint ? 0.35 : 0);
    const mo = Math.max(0, st.mouth || 0); F.mouth.scale.set(F.mouth0.x * (1 + mo * 0.4), F.mouth0.y * (0.3 + mo * 0.95), F.mouth0.z * (0.8 + mo * 0.2));
    F.tongue.visible = !!st.tongue; if (st.tongue) { F.tongue.scale.set(0.2, 0.1, 0.22); F.tongue.position.x = F.D.rx * (1.0 + 0.1 * Math.min(1, st.tongue)); F.tongue.position.y = -F.D.ry * 0.3 + (st.tongueY || 0); }
    F.whisk.forEach((w) => { w.rotation.z = Math.sin(f * 0.19 + w.userData.k * 1.7) * 0.18 - 0.5 - w.userData.k * 0.25; w.rotation.y = w.userData.s * (0.9 + w.userData.k * 0.35) + Math.sin(f * 0.17 + w.userData.s) * 0.1; });
    F.eyes.forEach((E) => {
      const wide = st.wide ?? 1, bl = st.blink ? 0.12 : 1; E.eg.scale.set(wide, wide * bl, wide);
      let px = (st.pupil?.[0] ?? 0), py = (st.pupil?.[1] ?? 0);
      if (st.lookAt) { tmp.set(st.lookAt[0], st.lookAt[1], st.lookAt[2] + UW); E.eg.worldToLocal(tmp); tmp.normalize(); px = Math.max(-1, Math.min(1, tmp.x * 2.2)); py = Math.max(-1, Math.min(1, tmp.y * 2.2)); } E.pup.position.set(px * E.er * 0.34, py * E.er * 0.34, E.er * (0.66 - 0.12 * (Math.abs(px) + Math.abs(py))));
      E.pup.scale.setScalar(st.pupilS ?? 1); E.pup.visible = !st.spiral; E.hl.visible = !st.spiral;
      E.sp.visible = !!st.spiral; E.sp.rotation.z = -f * 0.3 * (E.s);
      const c = st.lid || 0; E.lid.visible = c > 0.03; E.lid.position.set(0, E.er * (1 - 2 * c), 0); E.lid.rotation.set(0, 0, (st.tilt || 0) * -E.s);
    });
  });
  smalls.forEach((g, i) => { const st = (S.smalls || [])[i]; g.visible = !!st && !bank; if (st) { g.position.set(st.x, st.y + 0.05 * Math.sin(f * 0.2 + i), st.z); g.rotation.y = st.yaw || 0; g.scale.setScalar(st.s || 1); } });
  podium.visible = !!S.podium && !bank; if (S.podium) podium.position.set(...S.podium);
  medal.visible = !!S.medal && !bank; if (S.medal) { medal.position.set(...S.medal.pos); medal.rotation.set(0.1, S.medal.ry || 0, 0); medal.scale.setScalar(S.medal.s || 1); }
  confetti.forEach((m) => { const c = m.userData.c; m.visible = !!S.confetti && !bank; if (m.visible) { const t = S.confetti; m.position.set(c[0] + Math.sin(f * 0.07 + c[4]) * 0.4, 5 - ((c[1] + t * c[3] * 30) % 9), c[2]); m.rotation.set(f * 0.1 + c[4], f * 0.08, f * 0.13); } });
}
