import * as THREE from './lib/three.module.js';
import * as T from './toon.js';
import * as P from './paint.js';
import { SHOTS, TOTAL, shotAt, camAt, dofAt, LIGHTS, lightFor, actorsAt, worldAt, fxAt } from './story.js';

const RS = Math.min(1, +(new URLSearchParams(location.search).get('s') || 1));   // ?s=0.5 = half-res preview render
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
  wheat: texM(P.wheat(21), 110, 62), dirt: texM(P.redDirt(22), 70, 70),
  barn: texM(P.barnWood(24), 2, 1), ironRed: texM(P.corrugated(23, [8, 52, 46]), 3, 1), ironGrey: texM(P.corrugated(27, [200, 6, 72]), 3, 1), ironGreen: texM(P.corrugated(28, [140, 28, 40]), 3, 1),
  plaster: texM(P.plaster(8, 40), 1, 1), trunk: texM(P.trunk(26), 1, 1), canvas: texM(P.canvasCover(25), 1, 1),
  wood: toon({ color: '#7a5434' }), post: toon({ color: '#8a6a44' }), wire: toon({ color: '#d8d4c8' }), dark: toon({ color: '#2d2a2e' }), brass: toon({ color: '#d9a845' }),
  truck: toon({ color: '#6b7048' }), truckDark: toon({ color: '#4d5236' }), glass: toon({ color: '#35444f' }), tire: toon({ color: '#26262a' }), hub: toon({ color: '#b9b29a' }),
  leaf: toon({ color: '#86a05c' }), leaf2: toon({ color: '#6f9050' }), hill: toon({ color: '#cdaa62' }), hillFar: toon({ color: '#bdb27c' }),
  gunIron: toon({ color: '#4a4d55' }), gunDark: toon({ color: '#2a2c32' }), stock: toon({ color: '#8a5a34' }), shell: toon({ color: '#e0b04a' }), lead: toon({ color: '#b9b5ad' }),
  white: toon({ color: '#efe9d6' }), tankGrey: toon({ color: '#aeb4b6' }),
};
M.wheat.map.repeat.set(110, 5);
const boardMat = (lines, bg, fg, w = 512, h = 256) => toon({ map: P.tex(P.board(lines, bg, fg, w, h)) });
const crateMat = toon({ map: P.tex(P.crate('10,000')) });

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
const haze = new THREE.Mesh(new THREE.CylinderGeometry(700, 700, 12, 48, 1, true), new THREE.MeshBasicMaterial({ color: '#ecdcc0', side: THREE.BackSide, fog: false, depthWrite: false }));
haze.position.y = 1; haze.visible = false; haze.userData.sky = true; scene.add(haze);

// ---------- lights ----------
const hemi = new THREE.HemisphereLight('#ffffff', '#ffffff', 1); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffffff', 2); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2;
scene.add(sun); scene.add(sun.target);
scene.fog = new THREE.Fog('#ffffff', 40, 600);

// ---------- world: a Western Australian wheat farm, 1932 ----------
const DECK = 0; // ground height (cards stand with soles at y=0)
const world = new THREE.Group(); scene.add(world);
const mergeGeos = (geos) => {
  let nv = 0, ni = 0; for (const g of geos) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = new Uint32Array(ni); let ov = 0, oi = 0;
  for (const g of geos) { const n = g.attributes.position.count; pos.set(g.attributes.position.array, ov * 3); nor.set(g.attributes.normal.array, ov * 3); uv.set(g.attributes.uv.array, ov * 2);
    if (g.index) { for (let i = 0; i < g.index.count; i++) idx[oi + i] = g.index.array[i] + ov; oi += g.index.count; } else { for (let i = 0; i < n; i++) idx[oi + i] = ov + i; oi += n; } ov += n; }
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); m.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); m.setIndex(new THREE.BufferAttribute(idx, 1)); return m;
};
const flatNd = waterNd; // constant-normal depth material: no crease noise (used for wheat and wire)
// ground: red dirt everywhere, wheat field behind the fence line
const dirtPl = add(new THREE.PlaneGeometry(900, 450), M.dirt, 0, 0, 224.4, world, { cast: false }); dirtPl.rotation.x = -Math.PI / 2;
const wheatPl = add(new THREE.PlaneGeometry(900, 40), M.wheat, 0, 0.012, -20.6, world, { cast: false }); wheatPl.rotation.x = -Math.PI / 2;
M.wheatFar = toon({ color: '#d2a23c' });
const wheatFar = add(new THREE.PlaneGeometry(1400, 800), M.wheatFar, 0, 0.012, -440.6, world, { cast: false }); wheatFar.rotation.x = -Math.PI / 2;
// the track (soldiers, truck) a little paler
const track = add(new THREE.PlaneGeometry(260, 7), M.dirt, 0, 0.008, 3.6, world, { cast: false }); track.rotation.x = -Math.PI / 2; track.material = track.material.clone(); track.material.color.set('#e8b890');
// 3D wheat clumps near the fence (merged into one mesh)
{ const r = P.rng(55), geos = [];
  for (let i = 0; i < 2400; i++) {
    const x = (r() - 0.5) * 56, z = -1.6 - Math.pow(r(), 1.3) * 34, sc = 0.7 + r() * 0.6;
    for (let k = 0; k < 4; k++) {
      const g = new THREE.ConeGeometry(0.07, 0.8, 5, 1); g.translate(0, 0.4, 0);
      const m4 = new THREE.Matrix4().compose(new THREE.Vector3(x + (r() - 0.5) * 0.35, 0, z + (r() - 0.5) * 0.35), new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.4, r() * 6, (r() - 0.5) * 0.4)), new THREE.Vector3(sc, sc * (0.8 + r() * 0.5), sc));
      g.applyMatrix4(m4); geos.push(g);
    }
  }
  const m = add(mergeGeos(geos), toon({ color: '#e3bc58' }), 0, 0, 0, world, { cast: false }); m.userData.nd = flatNd; }
// fence along the field edge (posts + three wires), with a gap for the gate
{ const geos = [], wires = [];
  for (let x = -60; x <= 60; x += 3) { if (x > 2 && x < 7) continue; const g = new THREE.BoxGeometry(0.14, 1.25, 0.14); g.translate(x, 0.62, -0.9); geos.push(g); }
  add(mergeGeos(geos), M.post, 0, 0, 0, world);
  for (const y of [0.45, 0.8, 1.15]) for (const [a, b] of [[-60, 1.9], [7.1, 60]]) { const g = new THREE.BoxGeometry(b - a, 0.025, 0.025); g.translate((a + b) / 2, y, -0.9); wires.push(g); }
  const w = add(mergeGeos(wires), M.wire, 0, 0, 0, world, { cast: false }); w.userData.nd = flatNd; }
// signs: "WESTERN AUSTRALIA 1932" at the field, "BOUNTY" (story-controlled)
import { makeProps } from './props.js';
const PR = makeProps({ THREE, add, box, tbox, M, P, world, scene, boardMat, crateMat });
const { signGroup, barn, house, tank, gum, makeGun } = PR;
const sign1932 = signGroup([['WESTERN AUSTRALIA', 40], ['1932', 150]], '#d8c08a', '#2a1a0e', 512, 256, 2.6, 1.3); sign1932.position.set(-3.8, 0, -0.35);
const signBounty = signGroup([['BOUNTY', 112], ['PER EMU', 52]], '#e8d9a4', '#7a1a14', 512, 256, 2.6, 1.3); signBounty.position.set(-2.5, 0, 0.9); signBounty.visible = false;
barn(-24, -40, 0.25);
house(-44, -33, -0.1);
tank(-32, -33);
const { mill, wheel } = PR.makeWindmill(16, -44);
{ const r = P.rng(66); [[-12, -26], [9, -30], [27, -22], [-36, -18], [42, -36], [-6, -54], [32, -62], [-20, -66], [-58, -50], [54, -20], [4, -80], [-40, -80]].forEach(([x, z]) => gum(x, z, 6 + r() * 3));
  for (let i = 0; i < 26; i++) gum((r() - 0.5) * 220, -34 - r() * 110, 6 + r() * 4); }
// low dry hills far away
{ const r = P.rng(77); for (let i = 0; i < 18; i++) { const a = Math.PI + (r() - 0.5) * 2.4, d = 230 + r() * 140; const h = add(new THREE.SphereGeometry(48 + r() * 50, 20, 10), i % 2 ? M.hill : M.hillFar, Math.cos(a) * d + 0, -70, Math.sin(a) * d - 40, world, { cast: false }); h.scale.set(1.8, 0.45 + r() * 0.2, 1); } }

// clouds: painted billboards far away (no fog, no ink)
const clouds = [];
{ const r = P.rng(90);
  for (let i = 0; i < 14; i++) {
    const c = document.createElement('canvas'); c.width = 600; c.height = 400; const pen = new T.Pen(c.getContext('2d')); pen.ol = 0;
    pen.g.translate(300, 200); pen.g.scale(1.4, 1.2); pen.g.translate(-300, -200); T.fxCloud(pen, i + 1);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.667), new THREE.MeshBasicMaterial({ map: P.tex(c), transparent: true, fog: false, depthWrite: false }));
    const a = Math.PI + (r() - 0.5) * 3.2, d = 650 + r() * 250; m.position.set(Math.cos(a) * d, 120 + r() * 160, Math.sin(a) * d); m.scale.setScalar(160 + r() * 140);
    m.userData.ndSkip = true; m.renderOrder = -1; m.visible = false; scene.add(m); clouds.push(m);
  } }

// ---------- props (story-driven) ----------
// army truck, front toward +x
const { truck, wheels } = PR.makeTruck();
const guns = [makeGun(), makeGun()];
const crates = PR.makeCrates();
const { bullets, bulletGrp } = PR.makeBullets();


// ---------- cards ----------
const CW = 1200, CH = 2000, CM = 2.25; // canvas px, card height in metres (design 600x1000 -> 2.25 m)
const cardGeo = new THREE.PlaneGeometry(CM * 0.6, CM); cardGeo.translate(0, CM / 2 - CM * 0.025, 0);
const blobTex = P.tex(P.radial('20,14,30', 0.6));
class Card {
  constructor(scale = 1) {
    [this.c, this.g] = (() => { const c = document.createElement('canvas'); c.width = CW * scale; c.height = CH * scale; return [c, c.getContext('2d')]; })();
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
    const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.c.width, this.c.height); g.setTransform(this.c.width / 600, 0, 0, this.c.height / 1000, 0, 0);
    const p = new T.Pen(g); fn(p); this.t.needsUpdate = true;
  }
}
const cards = [], lowCards = [];

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
      if (!(d > 30. && !card && dot(n, ns) > .995)) e = max(e, smoothstep(.006, .02, (ds - d)/d));  // depth jump, near side only (not along flat ground)
      if (!card && abs(ds-d)/d < .06) e = max(e, smoothstep(.88, .72, dot(n, ns)) * .9); // crease
    }
    return e * (1. - smoothstep(110., 260., d));
  }
  void main(){
    vec3 c = texture2D(col, vUv).rgb;
    float e = edgeAt(vUv, px);
    { float dd = texture2D(nd, vUv).a; if (dd > 0.) c = mix(c, fogCol, smoothstep(120., 380., dd)*.92); }
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
  inkU.fogCol.value.set(L.fog); haze.material.color.set(L.fog);
  skyU.top.value.set(L.skyTop); skyU.hor.value.set(L.skyHor); skyU.sunCol.value.set(L.sunDisc || '#000'); skyU.sunSize.value = L.sunSize || 0;
  inkU.sat.value = L.sat; inkU.gain.value.set(L.gain || '#ffffff'); inkU.lift.value.set(L.lift || '#000000');
}
function placeSun(L, focus) {
  // sun direction from azimuth/elevation in world space
  const az = rx(L.az), el = rx(L.el); tmpV.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  skyU.sunDir.value.copy(tmpV);
  sun.position.copy(focus).addScaledVector(tmpV, 80); sun.target.position.copy(focus);
  const ext = L.shadowExt || 30, sc = sun.shadow.camera; sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 200; sc.updateProjectionMatrix();
}

function worldState(S, f) {
  const R = (o, a, b) => { o.position.set(a, b[0], b[1]); };
  mill.rotation.y = 0; wheel.rotation.z = -f * 0.05;
  sign1932.visible = S.sign1932 !== false; signBounty.visible = !!S.signBounty;
  if (S.signBounty) { const k = S.signBounty; signBounty.scale.setScalar(Math.max(0.01, k) * 0.75); }
  const T_ = S.truck; truck.visible = !!T_;
  if (T_) { truck.position.set(T_.x, 0, T_.z); truck.rotation.y = T_.yaw || 0; for (const w of wheels) w.rotation.z = -T_.spin; }
  guns.forEach((g, i) => { const G = S.guns && S.guns[i]; g.visible = !!G; if (G) { g.position.set(G.x - (G.rec || 0) * Math.cos(G.yaw), G.y, G.z + (G.rec || 0) * Math.sin(G.yaw)); g.rotation.set(0, G.yaw, G.pitch || 0); } });
  crates.visible = !!S.crates; if (S.crates) crates.position.set(...S.crates);
  bulletGrp.visible = !!S.bullets; if (S.bullets) { const B = S.bullets; bulletGrp.position.set(B.x, B.y, B.z);
    bullets.forEach((b, i) => { const t = Math.max(0, Math.min(1, B.n - i)); b.visible = t > 0; const k = t > 0 ? Math.max(0.01, (1 - Math.pow(1 - t, 3)) * (1 + 0.35 * Math.sin(t * Math.PI))) : 0; b.scale.setScalar(k * B.s); b.position.set((i - 4.5) * 0.17 * B.s, 0, 0); }); }
}

function drawActors(list, cam) {
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; }); lowCards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  let nh = 0, nl = 0;
  list.forEach((a) => {
    const low = !!a.low, c = low ? (lowCards[nl] || (lowCards[nl] = new Card(0.5))) : (cards[nh] || (cards[nh] = new Card(1))); if (low) nl++; else nh++;
    c.draw(a.key, a.draw);
    c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z);
    const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
    c.mesh.rotation.set(0, Math.atan2(cam.position.x - a.x, cam.position.z - a.z) + (a.yaw || 0), a.roll || 0);
    c.mat.color.set(a.tint || '#ffffff'); c.mat.opacity = a.alpha ?? 1;
    c.mesh.castShadow = a.shadow !== false;
    c.mesh.renderOrder = a.order || 2;
    if (a.blob !== false && a.y < DECK + 0.5) { c.blob.visible = true; c.blob.position.set(a.x, (a.ground ?? DECK) + 0.03, a.z); c.blob.scale.set(0.95 * s, 0.6 * s, 1); }
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
window.__world = world; window.__scene = scene;
window.renderFrame = (f) => {
  if (location.hash.startsWith('#h')) { const hs = location.hash.slice(2).split(',').map(Number); world.children.forEach((c, i) => { if (hs.includes(i)) c.visible = false; }); }
  const S = shotAt(f), L = lightFor(S, f), C = camAt(f);
  applyLight(L, f);
  camera.position.set(...C.pos); camera.up.set(0, 1, 0); camera.lookAt(...C.look); camera.rotateZ(rx(C.roll || 0));
  camera.fov = C.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  const W_ = worldAt(f); worldState(W_, f);
  placeSun(L, new THREE.Vector3(...(C.shadowAt || C.look)));
  drawActors([...actorsAt(f, T), ...fxAt(f, T)], camera);
  sky.position.copy(camera.position); haze.position.x = camera.position.x; haze.position.z = camera.position.z;
  for (const c of clouds) c.quaternion.copy(camera.quaternion);
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