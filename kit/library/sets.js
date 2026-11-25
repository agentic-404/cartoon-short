// sets.js (v5): themed set builders from primitives, toon-shaded. Each returns { group, update(f) } placed at the origin (move/rotate the group; stack several by offsetting z like the "under" set in example/ikan-sate).
//   import { makeSets } from './sets.js';   const SETS = makeSets({ THREE, world, toon });
//   const office = SETS.office();  office.group.position.set(0, 0, -2000);   // then toggle office.group.visible per shot, office.update(f) in worldState
// Sets: office (open-plan: desks, monitors, plants, window), lab (benches, flasks, screens, hazard sign), serverRoom (racks with deterministic blinking LEDs, cable runs, floor grid),
//       netMap (floating network: nodes, links, a scanning ring), nightStreet (road, kerb, lamp posts, two simple buildings with lit windows).
// Scale: 1 unit = 1 m, floor at y = 0, front of the set faces +z (camera at z ~ 6..12, y ~ 1.6). Keep each set within x +-8, z -10..2.
export function makeSets({ THREE, world, toon }) {
  const mat = (c) => toon({ color: c }), glow = (c) => new THREE.MeshBasicMaterial({ color: c });
  const bx = (g, w, h, d, c, x, y, z, basic = false) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), basic ? glow(c) : mat(c)); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  const cyl = (g, rt, rb, h, c, x, y, z, seg = 12) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(c)); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  const floorWall = (g, floor, wall, w = 16, d = 12, h = 4) => { bx(g, w, 0.1, d, floor, 0, -0.05, -d / 2 + 2); bx(g, w, h, 0.15, wall, 0, h / 2, -d + 2); };
  const root = () => { const g = new THREE.Group(); world.add(g); return g; };
  const sets = {
    office() {
      const g = root(), mons = []; floorWall(g, '#8a8f99', '#d9dfe8');
      bx(g, 5, 2, 0.08, '#8fd0ff', 4.2, 2.2, -9.9, true);                                              // window
      for (let i = 0; i < 4; i++) { const x = -5 + i * 3.3, z = -4 - (i % 2) * 2.4;
        bx(g, 2.2, 0.08, 1.0, '#c7a77a', x, 0.75, z); for (const dx of [-1, 1]) bx(g, 0.08, 0.75, 0.9, '#6b6f78', x + dx, 0.37, z);
        const m = bx(g, 0.9, 0.55, 0.05, '#101822', x, 1.15, z - 0.2); mons.push(bx(g, 0.8, 0.45, 0.02, '#4fd1ff', x, 1.15, z - 0.17, true));
        bx(g, 0.14, 0.3, 0.14, '#444', x, 0.9, z - 0.2); cyl(g, 0.28, 0.22, 0.5, '#3a4a6a', x, 0.45, z + 0.9); }
      cyl(g, 0.2, 0.15, 0.4, '#a0522d', -7, 0.2, -3); const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), mat('#3f9a4a')); leaf.position.set(-7, 0.8, -3); g.add(leaf);
      return { group: g, update: (f) => mons.forEach((m, i) => m.material.color.set((f + i * 17) % 90 < 45 ? '#4fd1ff' : '#6fe0a0')) };
    },
    lab() {
      const g = root(), liq = []; floorWall(g, '#c9d2d8', '#e9f0f2'); bx(g, 14, 0.08, 1.3, '#4a5560', 0, 1.0, -6); for (const x of [-6, -2, 2, 6]) bx(g, 0.2, 1.0, 1.1, '#5d6975', x, 0.5, -6);
      ['#ff6f91', '#7ae582', '#ffd166', '#6ec6ff', '#c792ea'].forEach((c, i) => { const x = -5 + i * 2.4; cyl(g, 0.22, 0.3, 0.55, '#dff3ff', x, 1.32, -6); liq.push(cyl(g, 0.2, 0.28, 0.3 + (i % 3) * 0.08, c, x, 1.22 + 0.0, -6)); cyl(g, 0.07, 0.07, 0.3, '#dff3ff', x, 1.7, -6); });
      bx(g, 3, 1.6, 0.08, '#101822', -3, 2.8, -9.9); bx(g, 2.8, 1.4, 0.02, '#2a6a4a', -3, 2.8, -9.84, true);
      bx(g, 1.3, 1.3, 0.06, '#ffd23f', 4, 2.8, -9.9, true); bx(g, 0.9, 0.9, 0.02, '#201a10', 4, 2.8, -9.84);
      return { group: g, update: (f) => liq.forEach((m, i) => { m.position.y += 0.0008 * Math.sin(f * 0.15 + i); }) };
    },
    serverRoom() {
      const g = root(), leds = []; floorWall(g, '#2a2f3a', '#1a2030', 16, 12, 4);
      for (let r = 0; r < 5; r++) { const x = -6 + r * 3, z = -6; bx(g, 1.6, 3.0, 1.1, '#2d3646', x, 1.5, z);
        for (let u = 0; u < 12; u++) { bx(g, 1.4, 0.2, 0.05, '#1b2230', x, 0.3 + u * 0.24, z + 0.56); for (let k = 0; k < 3; k++) leds.push({ m: bx(g, 0.07, 0.07, 0.03, '#39ff88', x - 0.5 + k * 0.14, 0.3 + u * 0.24, z + 0.6, true), s: r * 7 + u * 3 + k }); } }
      for (let i = 0; i < 6; i++) bx(g, 0.1, 0.03, 8, '#555', -7.5 + i * 3, 3.6, -3);
      return { group: g, update: (f) => leds.forEach(({ m, s }) => m.material.color.set(((f * 0.7 + s * 5.3) % 24) < 14 ? '#39ff88' : (((f + s) % 53) < 3 ? '#ff4a4a' : '#143a24'))) };
    },
    netMap() {
      const g = root(), nodes = [[-3, 4, -2], [0, 6, -3], [3, 4.5, -2], [-1.5, 2.5, -1], [1.8, 2.2, -1.5]], pts = [];
      nodes.forEach((p, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 10), glow(['#4fd1ff', '#c792ea', '#ffd166', '#7ae582', '#ff6f91'][i])); m.position.set(...p); g.add(m); pts.push(m); });
      [[0, 1], [1, 2], [0, 3], [3, 4], [2, 4], [1, 3]].forEach(([a, b]) => { const A = new THREE.Vector3(...nodes[a]), B = new THREE.Vector3(...nodes[b]), l = A.distanceTo(B); const m = new THREE.Mesh(new THREE.BoxGeometry(l, 0.04, 0.04), glow('#2f4a6a')); m.position.copy(A).lerp(B, 0.5); m.rotation.z = Math.atan2(B.y - A.y, B.x - A.x); g.add(m); });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.0, 48), new THREE.MeshBasicMaterial({ color: '#4fd1ff', transparent: true, side: THREE.DoubleSide })); g.add(ring);
      return { group: g, update: (f, hot = 3) => { const k = (f % 90) / 90; ring.position.set(...nodes[hot]); ring.scale.setScalar(0.4 + 2.2 * k); ring.material.opacity = 1 - k; pts.forEach((m, i) => m.scale.setScalar(i === hot ? 1.25 + 0.15 * Math.sin(f * 0.3) : 1)); } };
    },
    nightStreet() {
      const g = root(), wins = []; bx(g, 30, 0.1, 14, '#1d3a4a', 0, -0.05, -4); bx(g, 30, 0.12, 4.2, '#2a2f3d', 0, 0.0, 0.5); bx(g, 30, 0.14, 0.16, '#e8d890', 0, 0.01, 0.5, true);
      [[-6, -9, 4, 9], [4, -10, 5, 12]].forEach(([x, z, w, h]) => { bx(g, w, h, 4, '#34445e', x, h / 2, z); for (let y = 1.2; y < h - 1; y += 1.7) for (let xx = -w / 2 + 0.8; xx < w / 2 - 0.5; xx += 1.2) wins.push({ m: bx(g, 0.6, 0.8, 0.05, '#ffd88a', x + xx, y, z + 2.03, true), s: x * 13 + y * 7 + xx * 3 }); });
      for (const x of [-9, -2, 5, 11]) { cyl(g, 0.07, 0.09, 4.2, '#222', x, 2.1, -1.5); bx(g, 0.5, 0.18, 0.5, '#ffe9a0', x, 4.25, -1.5, true); }
      return { group: g, update: (f) => wins.forEach(({ m, s }) => m.material.color.set((Math.floor(s) % 5 === 0 && (f + s) % 160 < 70) ? '#2a3550' : '#ffd88a')) };
    },
  };
  return sets;
}
