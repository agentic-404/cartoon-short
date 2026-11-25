// explainer.js (v5): animated flow diagrams (boxes, arrows, travelling packets) as flat boards in the 3D world, for process / "how does X work" shorts.
// Copy to web/, import in world.part.js:   import { makeExplainer } from './explainer.js';   (or paste the file above your worldState)
//   const X = makeExplainer({ THREE, world, P, cv, toon });          // pools; nothing is visible until a shot asks for it
//   in worldState(S, f):  X.apply(S.explain, f);                     // S.explain comes from story.js worldAt(f)
// story.js worldAt(f) returns e.g.
//   W.explain = { nodes: [{ x:-2.4, y:2.6, text:'PESAN', sub:'WhatsApp', bg:'#2e8a80', fg:'#fff', s: M.back((f-100)/9) }, ...],
//                 arrows: [{ a:[-1.2,2.6], b:[1.2,2.6], u: ramp(f,110,130), col:'#e8d890' }],
//                 packets:[{ a:[-1.2,2.6], b:[1.2,2.6], u:(f%40)/40, col:'#ff3b5c', size:0.22 }] }
// Positions are metres on the z = 0 plane (camera at z ~ 9, fov ~ 38 shows about +-2.6 m wide: keep nodes within x +-2 and above the caption band, y 1.6..5).
// Node width w default 2.2, height h 1.0. Use fitScale() from motion.js on s if a node must never crop.
export function makeExplainer({ THREE, world, P, cv, toon, nodes = 10, arrows = 10, packets = 8 }) {
  const root = new THREE.Group(); world.add(root);
  const mk = (n, make) => Array.from({ length: n }, () => { const o = make(); o.visible = false; root.add(o); return o; });
  const geo = new THREE.PlaneGeometry(1, 1);
  const N = mk(nodes, () => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ transparent: true, fog: false })); m.userData.key = ''; m.userData.ndSkip = false; return m; });
  const shaftG = new THREE.BoxGeometry(1, 0.1, 0.1), headG = new THREE.ConeGeometry(0.2, 0.42, 4);
  const A = mk(arrows, () => { const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: '#e8d890' });
    const s = new THREE.Mesh(shaftG, mat), h = new THREE.Mesh(headG, mat); h.rotation.z = -Math.PI / 2; g.add(s, h); g.userData = { s, h, mat }; return g; });
  const PK = mk(packets, () => new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), new THREE.MeshBasicMaterial({ color: '#ff3b5c' })));
  const tex = (n) => P.tex(cv(640, 290, (g, w, h) => {
    const r = 36; g.fillStyle = n.bg || '#2e8a80'; g.beginPath(); g.moveTo(r, 0); g.arcTo(w, 0, w, h, r); g.arcTo(w, h, 0, h, r); g.arcTo(0, h, 0, 0, r); g.arcTo(0, 0, w, 0, r); g.fill();
    g.lineWidth = 12; g.strokeStyle = '#120a1a'; g.stroke(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = n.fg || '#fff';
    const big = n.sub ? 0.5 : 0.62; let fz = h * big; for (let k = 0; k < 30; k++) { g.font = `900 ${fz}px Arial Black, Arial`; if (g.measureText(n.text).width <= w - 70) break; fz -= 4; }
    g.fillText(n.text, w / 2, n.sub ? h * 0.42 : h / 2); if (n.sub) { g.font = `700 ${h * 0.22}px Arial`; g.globalAlpha = 0.85; g.fillText(n.sub, w / 2, h * 0.78); }
  }));
  return {
    apply(E, f) {
      const ns = E?.nodes || [], as = E?.arrows || [], ps = E?.packets || [];
      N.forEach((m, i) => { const n = ns[i]; m.visible = !!n && (n.s ?? 1) > 0.01; if (!m.visible) return;
        const key = [n.text, n.sub, n.bg, n.fg].join('|'); if (m.userData.key !== key) { m.userData.key = key; m.material.map?.dispose(); m.material.map = tex(n); m.material.needsUpdate = true; }
        const w = n.w || 2.2, h = n.h || 1.0, s = n.s ?? 1; m.scale.set(w * s, h * s, 1); m.position.set(n.x, n.y + (n.bob ? 0.04 * Math.sin(f * 0.1 + i) : 0), n.z || 0); m.rotation.z = n.rz || 0; });
      A.forEach((g, i) => { const a = as[i]; g.visible = !!a && (a.u ?? 1) > 0.02; if (!g.visible) return;
        const [ax, ay] = a.a, [bx, by] = a.b, L = Math.hypot(bx - ax, by - ay), u = Math.min(1, a.u ?? 1), len = Math.max(0.01, L * u), hh = 0.42;
        g.position.set(ax, ay, a.z ?? 0.05); g.rotation.z = Math.atan2(by - ay, bx - ax); g.userData.mat.color.set(a.col || '#e8d890');
        const sl = Math.max(0.01, len - hh * 0.8); g.userData.s.scale.x = sl; g.userData.s.position.x = sl / 2; g.userData.h.position.x = sl + hh * 0.35; g.userData.h.visible = u > 0.15; });
      PK.forEach((m, i) => { const p = ps[i]; m.visible = !!p; if (!p) return; const u = p.u;
        m.position.set(p.a[0] + (p.b[0] - p.a[0]) * u, p.a[1] + (p.b[1] - p.a[1]) * u + (p.arc ? Math.sin(u * Math.PI) * p.arc : 0), p.z ?? 0.15); m.scale.setScalar((p.size || 0.2) * (1 + 0.12 * Math.sin(f * 0.5 + i))); m.material.color.set(p.col || '#ff3b5c'); });
    },
  };
}
