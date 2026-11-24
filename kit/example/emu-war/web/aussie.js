// ---------------- Emu War cast: Australian soldiers & farmers (slouch hats) + the emu ----------------
const KHAKI = "#a39a62";
OUTFITS.gunner = { tunic: KHAKI, skin: "#f5c9a0", slouch: "#85804f", brim: "#6b6740", belt: true };
OUTFITS.gunnerB = { tunic: "#9a9558", skin: "#e8bd96", slouch: "#7a7648", brim: "#625e3a", belt: true, moustache: "#4a3020" };
OUTFITS.gunnerC = { tunic: "#a89f68", skin: "#d9a97e", slouch: "#8b8553", brim: "#6b6740", belt: true };
OUTFITS.major = { tunic: "#7f8a54", skin: "#f3c79d", slouch: "#6c7745", brim: "#55603a", belt: true, moustache: "#5a3a24", stout: true };
OUTFITS.farmA = { tunic: "#4f7fb8", skin: "#eec4a0", slouch: "#8a6a3c", brim: "#6f5430", apron: "#c9b88a" };
OUTFITS.farmB = { tunic: "#b0492f", skin: "#f0c8a2", slouch: "#c9a45a", brim: "#a88540", moustache: "#6a4a30", stout: true };
OUTFITS.farmC = { tunic: "#e8dfc4", skin: "#d9a97e", slouch: "#5a4a34", brim: "#463a28", apron: "#7a5a3a" };

/** Australian slouch hat: wide brim, soft dome, band, one side pinned up */
const slouchHat = (p, O, H, cx, hc, light, ow, u, facing) => {
  const by = hc - H.b * 0.42, side = facing >= 0 ? -1 : 1;
  const brim = ellPts(cx, by, H.a * 1.62, H.b * 0.2, 0, 360, 0, 40);
  p.shadedFill(brim, O.slouch, mul(O.slouch, [0.66, 0.66, 0.72]), light, H.a * 1.4, 0.3);
  p.inkRing(brim, ow * 0.8, thickAngle(light));
  const dome = ellPts(cx, by - 2 * u, H.a * 1.0, H.b * 0.78, 180, 360, 0, 44);
  p.shadedFill(dome, O.slouch, mul(O.slouch, [0.62, 0.62, 0.7]), light, H.a, 0.4);
  p.clip(dome, () => { p.stroke(ellPts(cx - 12 * u, by - H.b * 0.5, 0.35 * H.a, 0.2 * H.b, 200, 330, 0, 14), 4 * u, "#ffffff40"); });
  p.inkRing(dome, ow * 0.85, thickAngle(light));
  p.band([[cx - H.a * 1.0, by - 4 * u], [cx + H.a * 1.0, by - 4 * u]], O.brim, 9 * u, 1.6 * u, "round");
  // pinned-up brim side
  const sx = cx + side * H.a * 1.5;
  p.poly([[sx - side * 26 * u, by - 3 * u], [sx + side * 4 * u, by - 20 * u], [sx + side * 12 * u, by + 4 * u]], O.brim, 2 * u);
  p.dot(sx - side * 8 * u, by - 6 * u, 2.4 * u, "#e6c068");
};

// ---------------- the emu: side profile facing RIGHT (flip the card to face left) ----------------
FACE.emuOpen = null;
export const emuSide = (p, o = {}) => {
  const { phase = 0, neck = 0.6, head = 0, eye = "open", run = 0, v = 0, blink = 0, peck = 0 } = o;
  const body = ["#6e5a48", "#5e5043", "#7a6450"][v % 3], shade = mul(body, [0.66, 0.64, 0.7]), hi = mix(body, "#c9b08e", 0.35);
  const NECK = "#8d98a3", LEG = "#8c8f96", sole = 975, light = rad(-120), thick = thickAngle(light);
  const g = p.g, hipY = 640, bob = Math.sin(phase * Math.PI * 2 * 2) * 8 * (run ? 1 : 0.3);
  const legs = (side, col) => {
    const ph = (phase + (side ? 0.5 : 0)) % 1, hx = 300 + (side ? -26 : 26);
    const sw = (run ? 70 : 42) * Math.cos(ph * Math.PI * 2), lift = Math.max(0, Math.sin(ph * Math.PI * 2 + 0.2)) * (run ? 80 : 46);
    const fx = hx + sw, fy = sole - 14 - lift, hockX = (hx + fx) / 2 - 38, hockY = (hipY + fy) / 2 + 16 - bob;
    p.band([[hx, hipY - bob], [hockX + 8, hockY], [hockX, hockY + 4]], mix(col, body, 0.2), 38, 4.5, "round");
    p.band([[hockX, hockY + 2], [fx - 6, fy - 20], [fx, fy]], col, 15, 4, "round");
    for (const t of [-1, 0, 1]) p.band([[fx, fy], [fx + 34 + t * 5, fy + 12 + t * 8]], col, 8, 2.6, "round");
    p.dot(fx + 6, fy + 6, 7, col);
  };
  legs(1, mul(LEG, [0.72, 0.72, 0.76]));
  // tail poof
  p.poly(ellPts(150, 560 - bob, 90, 70, 0, 360, -20, 24), shade, 6);
  // body
  const bp = ellPts(285, 560 - bob, 165, 112, 0, 360, 0, 54);
  p.shadedFill(bp, body, shade, light, 190, 0.4);
  p.clip(bp, () => {
    for (let i = 0; i < 70; i++) { const a = i * 2.39996, rr = Math.sqrt(i / 70); const x = 285 + Math.cos(a) * 150 * rr, y = 560 - bob + Math.sin(a) * 98 * rr; p.stroke([[x, y], [x - 20, y + 16 + (i % 3) * 3]], 3.4, i % 3 ? mix(body, "#241726", 0.35) : hi); }
    p.stroke(ellPts(250, 520 - bob, 80, 40, 200, 300, 0, 14), 7, "#ffffff22");
  });
  p.inkRing(bp, 8, thick);
  // near leg
  legs(0, LEG);
  // neck: S-curve from chest to head; peck = head to the ground
  const nk = neck, hd = head, pk = peck;
  const base = [405, 515 - bob];
  const topX = 440 + 40 * (1 - pk) + 30 * pk, topY = 270 + (1 - nk) * 150 + pk * 590;
  const mid = [base[0] + 60 + 12 * Math.sin(phase * 6.283) * (run ? 1 : 0.2), (base[1] + topY) / 2 + 20];
  const mid2 = [mid[0] - 8 + 18 * (1 - nk), mid[1] - 40];
  const nPts = [base, [mid[0] - 25, mid[1] + 36], mid, [mid2[0] + 14, mid2[1] - 50], [topX, topY]];
  p.band(nPts, NECK, 36, 6, "round");
  p.stroke([[base[0] + 8, base[1] - 8], [mid[0] - 10, mid[1] + 30], [mid[0] + 8, mid[1]]], 10, "#ffffff2a");
  for (let i = 0; i < 8; i++) { const t = i / 8, x = base[0] + (topX - base[0]) * t + 10 * Math.sin(t * 6), y = base[1] + (topY - base[1]) * t; p.stroke([[x - 12, y + 6], [x - 3, y]], 3, mix(body, "#241726", 0.2)); }
  // head
  const hx = topX + 20, hy = topY - 12 + hd * 10;
  p.poly(ellPts(hx, hy, 40, 30, 0, 360, -10, 28), NECK, 5);
  p.poly([[hx + 28, hy - 8], [hx + 82, hy - 2 + pk * 6], [hx + 76, hy + 14], [hx + 24, hy + 16]], "#5a5a62", 4.5);
  p.dot(hx + 70, hy + 2, 2.2, "#10101a");
  // eye
  const ex = hx + 12, ey = hy - 8;
  if (eye === "closed" || blink) p.stroke([[ex - 10, ey], [ex + 10, ey + 2]], 5);
  else {
    const big = eye === "wide" ? 15 : 11;
    p.ell(ex, ey, big, big, "#f2a52c", 4);
    p.dot(ex + (eye === "side" ? 4 : 2), ey, eye === "wide" ? 5 : 6, "#10101a");
    p.dot(ex - 2, ey - 3, 2.4, "#ffffff");
    if (eye === "smug") p.poly([[ex - 15, ey - 17], [ex + 15, ey - 6], [ex + 15, ey - 18], [ex - 15, ey - 18]], NECK, 0), p.stroke([[ex - 14, ey - 5], [ex + 14, ey - 1]], 4.5);
    if (eye === "angry") p.stroke([[ex - 14, ey - 18], [ex + 13, ey - 4]], 5.5);
  }
  p.stroke([[hx - 28, hy - 22], [hx - 36, hy - 34]], 3, "#6a6068");
};

export const fxCoin = (p) => { p.ell(300, 500, 60, 60, "#f2c94c", 9); p.ell(300, 500, 36, 36, "#e0a92a", 5); p.stroke([[300, 478], [300, 522]], 7, "#b9811a"); };
export const fxTally = (p, n) => {
  p.poly(rrect(120, 330, 480, 760, 18), "#f6efd6", 12);
  p.stroke([[170, 380], [430, 380]], 5, "#7aa6d0");
  for (let k = 0; k < 4; k++) p.stroke([[170, 470 + k * 70], [430, 470 + k * 70]], 3, "#a8c4e0");
  const place = (i) => { const row = Math.floor(i / 5), col = i % 5; return [row, col]; };
  for (let i = 0; i < n; i++) {
    const [row, col] = place(i), y0 = 410 + row * 70;
    if (col < 4) p.stroke([[190 + col * 38, y0], [190 + col * 38, y0 + 48]], 9, "#241726");
    else p.stroke([[170, y0 + 40], [345, y0 + 4]], 9, "#241726");
  }
};
export const fxRifle = (p) => {
  p.band([[40, 560], [560, 520]], "#7a5030", 34, 6, "round");
  p.band([[300, 540], [560, 522]], "#4c4f58", 20, 5, "round");
  p.band([[120, 560], [330, 548]], "#4c4f58", 12, 4, "round");
  p.poly([[60, 556], [150, 530], [175, 590], [80, 604]], "#6a4326", 6);
};
export const fxFlash = (p, t) => {
  const g = p.g; g.save(); g.globalAlpha = Math.max(0, 1 - t);
  const s = 1 + t * 0.8, pts = [];
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, r = (i % 2 ? 70 : 210) * s; pts.push([300 + Math.cos(a) * r, 500 + Math.sin(a) * r]); }
  p.poly(pts, "#ffd35a", 10); p.ell(300, 500, 70 * s, 70 * s, "#fff6c8", 0);
  g.restore();
};
export const fxZip = (p, t) => { const g = p.g; g.save(); g.globalAlpha = 1 - t * t; for (let i = 0; i < 3; i++) p.stroke([[80, 460 + i * 40], [520 - t * 40, 460 + i * 40]], 14, i ? "#f4ead0" : "#ffffff"); g.restore(); };
