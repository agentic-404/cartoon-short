// props.js: reusable world/prop builders (copy into web/, import in main.js).
// ctx = { THREE, add, box, tbox, M, P, world, scene, boardMat, crateMat }
// Each builder only creates geometry; the story decides where/when (position, visible, rotation).
export function makeProps({ THREE, add, box, tbox, M, P, world, scene, boardMat, crateMat }) {
  /** two-post wooden sign with a painted board: signGroup([[text,size],...], bgColor, fgColor, canvasW, canvasH, boardW, boardH) */
const signGroup = (lines, bg, fg, w, h, bw, bh) => {
  const g = new THREE.Group(); world.add(g);
  for (const dx of [-bw * 0.42, bw * 0.42]) add(new THREE.CylinderGeometry(0.07, 0.08, 2.2, 8), M.post, dx, 1.1, 0, g);
  const mats = [M.wood, M.wood, M.wood, M.wood, boardMat(lines, bg, fg, w, h), M.wood];
  add(new THREE.BoxGeometry(bw, bh, 0.1), mats, 0, 1.55, 0.06, g); return g;
};
  /** farm barn (10 x 14 m footprint, corrugated roof): barn(x, z, rotY) */
const barn = (x, z, rot) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; world.add(g);
  add(tbox(10, 4.6, 14, 2), M.barn, 0, 2.3, 0, g);
  for (const s of [-1, 1]) { const rf = add(tbox(6.4, 0.25, 14.6, 2), M.ironGrey, s * 2.5, 5.4, 0, g); rf.rotation.z = -s * 0.5; }
  add(tbox(10.2, 0.3, 0.3, 2), M.white, 0, 4.7, 7.05, g); add(box(3, 3.6, 0.1), M.white, 0, 1.8, 7.02, g, { cast: false }); add(box(2.6, 3.2, 0.12), M.barn, 0, 1.6, 7.05, g, { cast: false }); return g; };
  /** weatherboard farmhouse with verandah: house(x, z, rotY) */
const house = (x, z, rot) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rot; world.add(g);
  add(tbox(9, 3.2, 6.4, 2), M.plaster, 0, 1.6, 0, g);
  const rf = add(new THREE.ConeGeometry(6.4, 2.2, 4), M.ironGreen, 0, 4.3, 0, g); rf.rotation.y = Math.PI / 4; rf.scale.set(1.05, 1, 0.78);
  add(tbox(9.6, 0.2, 2.2, 2), M.ironGreen, 0, 2.7, 4.1, g);
  for (const dx of [-4.2, -1.4, 1.4, 4.2]) add(new THREE.CylinderGeometry(0.07, 0.07, 2.7, 6), M.post, dx, 1.35, 5.0, g);
  add(box(1.1, 2, 0.1), M.wood, 0, 1, 3.22, g, { cast: false }); for (const s of [-1, 1]) add(box(1, 1, 0.1), M.glass, s * 2.8, 1.8, 3.22, g, { cast: false }); return g; };
  /** corrugated water tank: tank(x, z) */
const tank = (x, z) => { const g = new THREE.Group(); g.position.set(x, 0, z); world.add(g);
  add(new THREE.CylinderGeometry(2.1, 2.1, 3.4, 20), M.ironGrey, 0, 1.7, 0, g); add(new THREE.CylinderGeometry(2.2, 2.2, 0.2, 20), M.ironRed, 0, 3.5, 0, g); return g; };
  /** windmill with spinning wheel. Returns { mill, wheel }; story spins wheel.rotation.z */
  const makeWindmill = (x, z) => {
    const mill = new THREE.Group(); mill.position.set(x, 0, z); world.add(mill);
{ for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = add(tbox(0.16, 11, 0.16, 2), M.post, dx * 0.9, 5.4, dz * 0.9, mill); l.rotation.z = -dx * 0.07; l.rotation.x = dz * 0.07; }
  for (const y of [3, 6, 9]) add(tbox(2.2 - y * 0.08, 0.12, 2.2 - y * 0.08, 2), M.post, 0, y, 0, mill);
  add(tbox(0.5, 0.5, 1.4, 2), M.dark, 0, 11, 0.4, mill); }
const wheel = new THREE.Group(); wheel.position.set(0, 11, 1.2); mill.add(wheel);
for (let i = 0; i < 14; i++) { const b = add(tbox(0.55, 1.9, 0.05, 1), M.ironGrey, 0, 0, 0, wheel); b.geometry.translate(0, 1.5, 0); b.rotation.z = i / 14 * Math.PI * 2; }
add(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 10), M.dark, 0, 0, 0, wheel).rotation.x = Math.PI / 2;
{ const tail = add(tbox(3.6, 0.1, 0.1, 1), M.post, 0, 11, -1.8, mill); tail.rotation.y = Math.PI / 2; add(tbox(0.06, 1.3, 1.2, 1), M.ironRed, 0, 11, -3.6, mill); }
    return { mill, wheel };
  };
  /** ghost gum tree: gum(x, z, height) */
const gum = (x, z, h = 7) => { const g = new THREE.Group(); g.position.set(x, 0, z); world.add(g);
  const t = add(new THREE.CylinderGeometry(0.22, 0.38, h, 8), M.trunk, 0, h / 2, 0, g); t.rotation.z = (x % 3) * 0.04;
  for (let i = 0; i < 4; i++) { const b = add(new THREE.SphereGeometry(1, 10, 8), i % 2 ? M.leaf : M.leaf2, Math.cos(i * 1.9) * 1.7, h + 0.4 + (i % 2) * 0.7, Math.sin(i * 1.9) * 1.3, g); b.scale.set(2.3, 0.9, 2.0); }
  return g; };
  /** army truck, front toward +x. Returns { truck, wheels } (spin wheels[i].rotation.z while moving); starts hidden */
  const makeTruck = () => {
const truck = new THREE.Group(); scene.add(truck); const wheels = [];
{ add(tbox(5.8, 0.35, 1.7, 2), M.truckDark, 0, 0.95, 0, truck);
  add(tbox(3.7, 0.14, 2.05, 2), M.wood, -1.1, 1.22, 0, truck);
  for (const s of [-1, 1]) add(tbox(3.7, 0.55, 0.1, 2), M.truck, -1.1, 1.58, s * 1.0, truck);
  add(tbox(0.1, 0.55, 2.05, 2), M.truck, -2.95, 1.58, 0, truck);
  add(tbox(1.7, 1.55, 2.05, 2), M.truck, 1.5, 1.95, 0, truck); add(tbox(1.72, 0.12, 2.1, 2), M.truckDark, 1.5, 2.78, 0, truck);
  add(tbox(0.05, 0.7, 1.7, 1), M.glass, 2.37, 2.25, 0, truck);
  for (const s of [-1, 1]) add(tbox(0.9, 0.6, 0.05, 1), M.glass, 1.6, 2.25, s * 1.04, truck);
  add(tbox(1.6, 0.9, 1.85, 2), M.truck, 3.15, 1.7, 0, truck); add(tbox(0.12, 0.7, 1.4, 1), M.dark, 3.98, 1.65, 0, truck); add(tbox(0.2, 0.2, 2.1, 1), M.dark, 4.05, 1.0, 0, truck);
  for (const [x, z] of [[2.9, 1.05], [2.9, -1.05], [-1.7, 1.12], [-1.7, -1.12], [-0.7, 1.12], [-0.7, -1.12]]) { if (x < 0 && x > -1) continue;
    const piv = new THREE.Group(); piv.position.set(x, 0.55, z); truck.add(piv); wheels.push(piv);
    const w = add(new THREE.CylinderGeometry(0.55, 0.55, 0.36, 16), M.tire, 0, 0, 0, piv); w.rotation.x = Math.PI / 2;
    const hb = add(new THREE.CylinderGeometry(0.22, 0.22, 0.4, 10), M.hub, 0, 0, 0, piv); hb.rotation.x = Math.PI / 2;
    const sp = add(tbox(0.7, 0.07, 0.4, 1), M.hub, 0, 0, 0, piv); } }
truck.visible = false;
    return { truck, wheels };
  };
  /** Lewis machine gun, barrel along +x; starts hidden */
const makeGun = () => { const g = new THREE.Group(); scene.add(g);
  add(new THREE.CylinderGeometry(0.06, 0.06, 1.0, 12), M.gunIron, 0.45, 0, 0, g).rotation.z = Math.PI / 2;
  add(new THREE.CylinderGeometry(0.028, 0.028, 0.5, 8), M.gunDark, 1.15, 0, 0, g).rotation.z = Math.PI / 2;
  add(tbox(0.55, 0.2, 0.16, 1), M.gunIron, -0.15, -0.02, 0, g);
  add(new THREE.CylinderGeometry(0.22, 0.22, 0.09, 18), M.gunDark, -0.05, 0.2, 0, g); add(new THREE.CylinderGeometry(0.06, 0.06, 0.11, 8), M.gunIron, -0.05, 0.2, 0, g);
  add(tbox(0.55, 0.13, 0.1, 1), M.stock, -0.62, -0.05, 0, g).rotation.z = -0.1;
  for (const [dx, dz] of [[0.35, 0.42], [0.35, -0.42], [-0.35, 0]]) { const l = add(new THREE.CylinderGeometry(0.02, 0.025, 0.85, 6), M.gunDark, dx, -0.4, dz * 0.6, g); l.rotation.z = (dx > 0 ? 1 : -1) * 0.25; l.rotation.x = dz * 0.45; }
  g.visible = false; return g; };
  /** stack of 3 ammo crates (crateMat says "10,000"); starts hidden. Returns the group */
  const makeCrates = () => {
const crates = new THREE.Group(); scene.add(crates); crates.visible = false;
for (const [x, y, z, r] of [[0, 0.3, 0, 0.1], [0.75, 0.3, 0.1, -0.15], [0.35, 0.9, 0.05, 0.05]]) { const c = add(tbox(0.7, 0.6, 0.55, 0.7), crateMat, x, y, z, crates); c.rotation.y = r; }
    return crates;
  };
  /** ten rifle rounds standing in a row group; story shows b.visible one by one. Returns { bullets, bulletGrp } */
  const makeBullets = () => {
const bullets = []; const bulletGrp = new THREE.Group(); scene.add(bulletGrp);
for (let i = 0; i < 10; i++) { const b = new THREE.Group(); bulletGrp.add(b); add(new THREE.CylinderGeometry(0.05, 0.055, 0.2, 10), M.shell, 0, 0.1, 0, b); const tip = add(new THREE.ConeGeometry(0.05, 0.12, 10), M.lead, 0, 0.26, 0, b); add(new THREE.CylinderGeometry(0.06, 0.06, 0.025, 10), M.brass, 0, 0.0125, 0, b); b.visible = false; bullets.push(b); }
bulletGrp.visible = false;
    return { bullets, bulletGrp };
  };
  return { signGroup, barn, house, tank, makeWindmill, gum, makeTruck, makeGun, makeCrates, makeBullets };
}
