'use strict';
A.FX = {
  parts: [],
  add(x, y, kind, size, life, vx = 0, vy = 0) {
    if (this.parts.length > 1600) return;
    this.parts.push({ x, y, kind, size, life, max: life, vx, vy });
  },
  fire(u, t, musk, gun, dt) {
    const c = Math.cos(u.facing), s = Math.sin(u.facing);
    if (musk && Math.random() < dt * 16) {
      const off = (Math.random() - 0.5) * u.fw * 0.9;
      const x = u.frontX - s * off + c * 12, y = u.frontY + c * off + s * 12;
      this.add(x, y, 'smoke', 14 + Math.random() * 12, 2.2 + Math.random(), 6 + c * 6, -3 + s * 6);
      if (Math.random() < 0.6) this.add(x, y, 'flash', 9, 0.12);
    }
    if (gun && Math.random() < dt * Math.min(12, u.effGuns() * 0.6)) {
      const off = (Math.random() - 0.5) * u.fw * 0.9;
      const x = u.frontX - s * off + c * 16, y = u.frontY + c * off + s * 16;
      this.add(x, y, 'smoke', 30 + Math.random() * 20, 3 + Math.random() * 1.5, 7, -4);
      this.add(x, y, 'flash', 18, 0.15);
      const ix = t.x + (Math.random() - 0.5) * t.fw * 0.8, iy = t.y + (Math.random() - 0.5) * t.fd * 2;
      this.add(ix, iy, 'dust', 22 + Math.random() * 14, 1.1);
    }
  },
  dust(x, y, n) {
    for (let i = 0; i < n; i++) this.add(x + (Math.random() - 0.5) * 200, y + (Math.random() - 0.5) * 120, 'dust', 30 + Math.random() * 30, 1.6 + Math.random());
  },
  melee(x, y) {
    this.add(x + (Math.random() - 0.5) * 120, y + (Math.random() - 0.5) * 80, 'dust', 26 + Math.random() * 20, 1.4);
    if (Math.random() < 0.5) this.add(x + (Math.random() - 0.5) * 120, y + (Math.random() - 0.5) * 80, 'smoke', 16, 1.6, 5, -3);
    this.add(x + (Math.random() - 0.5) * 100, y + (Math.random() - 0.5) * 60, 'flash', 7, 0.1);
  },
  update(dt) {
    const p = this.parts;
    for (let i = p.length - 1; i >= 0; i--) {
      const q = p[i];
      q.life -= dt;
      if (q.life <= 0) { p[i] = p[p.length - 1]; p.pop(); continue; }
      q.x += q.vx * dt * 4;
      q.y += q.vy * dt * 4;
      if (q.kind !== 'flash') q.size += dt * (q.kind === 'smoke' ? 14 : 10);
    }
  },
};

A.Render = (function () {
  const M = A.MAP, T = A.Terrain;
  const BS = 0.22;
  let cv, ctx, W = 0, H = 0, dpr = 1;
  const cam = { x: 5600, y: 8000, z: 0.06 };
  let mapCv = null, miniCv = null, fogCv, fogCtx, fogMask, fogMaskTop = -999, cloudCv, puffW, puffB, vignette;

  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const w2s = (x, y) => [(x - cam.x) * cam.z + W / 2, (y - cam.y) * cam.z + H / 2];
  const s2w = (sx, sy) => [(sx - W / 2) / cam.z + cam.x, (sy - H / 2) / cam.z + cam.y];

  // ---------------- baking ----------------
  function bake() {
    const cw = Math.round(M.W * BS), ch = Math.round(M.H * BS);
    const c = mk(cw, ch), g = c.getContext('2d');

    // base colour, stains and hill shading
    const L = 8, lw = Math.ceil(cw / L) + 1, lh = Math.ceil(ch / L) + 1;
    const lc = mk(lw, lh), lg = lc.getContext('2d'), img = lg.createImageData(lw, lh);
    const n2 = A.makeNoise(77);
    for (let j = 0; j < lh; j++) {
      for (let i = 0; i < lw; i++) {
        const wx = (i * L) / BS, wy = (j * L) / BS;
        const e = T.elev(wx, wy), [gx, gy] = T.grad(wx, wy);
        let r = 236, gg = 224, b = 196;
        const st = (A.fbm(n2, wx / 2500, wy / 2500, 4) - 0.5) * 30;
        r += st; gg += st * 0.95; b += st * 0.8;
        const h = (e - 215) / 100;
        r -= h * 10; gg -= h * 14; b -= h * 20;
        const lit = (gx + gy) * 0.6 * 7;
        if (lit > 0) { const k = Math.min(0.45, lit * 0.6); r += (252 - r) * k; gg += (246 - gg) * k; b += (228 - b) * k; }
        else { const k = Math.min(0.45, -lit * 0.8); r += (118 - r) * k; gg += (84 - gg) * k; b += (52 - b) * k; }
        const p = (j * lw + i) * 4;
        img.data[p] = r; img.data[p + 1] = gg; img.data[p + 2] = b; img.data[p + 3] = 255;
      }
    }
    lg.putImageData(img, 0, 0);
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    g.drawImage(lc, 0, 0, lw * L, lh * L);

    // paper grain
    const gr = mk(256, 256), gg2 = gr.getContext('2d'), gi = gg2.createImageData(256, 256), rr = A.rng(9);
    for (let i = 0; i < 256 * 256; i++) {
      const v = rr();
      gi.data[i * 4] = 70; gi.data[i * 4 + 1] = 50; gi.data[i * 4 + 2] = 30;
      gi.data[i * 4 + 3] = v < 0.5 ? v * 34 : 0;
    }
    gg2.putImageData(gi, 0, 0);
    g.fillStyle = g.createPattern(gr, 'repeat');
    g.fillRect(0, 0, cw, ch);

    g.setTransform(BS, 0, 0, BS, 0, 0);
    const px = (p) => p / BS;
    const R = A.rng(1805);

    // field strips
    g.lineWidth = px(0.6);
    for (let i = 0; i < 340; i++) {
      const x = R() * M.W, y = R() * M.H;
      if (T.villageAt(x, y) || T.inWoods(x, y) || T.pondAt(x, y)) continue;
      const w = 250 + R() * 500, h = 160 + R() * 380, rot = R() * Math.PI, sp = 22 + R() * 18;
      g.save();
      g.translate(x, y); g.rotate(rot);
      g.strokeStyle = `rgba(105,78,44,${0.05 + R() * 0.05})`;
      g.beginPath();
      for (let k = -h / 2; k < h / 2; k += sp) { g.moveTo(-w / 2, k); g.lineTo(w / 2, k); }
      g.stroke();
      g.strokeStyle = 'rgba(105,78,44,0.08)';
      g.strokeRect(-w / 2, -h / 2, w, h);
      g.restore();
    }

    // hachures
    const step = 34, buckets = [0, 1, 2, 3, 4].map(() => new Path2D());
    for (let y = 0; y < M.H; y += step) {
      for (let x = 0; x < M.W; x += step) {
        const hx = x + (R() - 0.5) * step * 0.8, hy = y + (R() - 0.5) * step * 0.8;
        const [gx, gy] = T.grad(hx, hy), s = Math.hypot(gx, gy);
        if (s < 0.017 || T.pondAt(hx, hy)) continue;
        const ux = gx / s, uy = gy / s, hl = (22 + Math.min(s * 200, 14)) / 2;
        const b = Math.min(4, Math.floor((s - 0.017) / 0.012));
        buckets[b].moveTo(hx - ux * hl, hy - uy * hl);
        buckets[b].lineTo(hx + ux * hl, hy + uy * hl);
      }
    }
    g.lineCap = 'round';
    g.strokeStyle = 'rgba(92,56,28,0.72)';
    [0.45, 0.7, 1.0, 1.35, 1.8].forEach((w, i) => { g.lineWidth = px(w); g.stroke(buckets[i]); });

    // vineyards
    g.fillStyle = 'rgba(80,60,40,0.55)';
    for (const poly of A.VINEYARDS) {
      const bb = A.bbox(poly);
      for (let y = bb.y0; y < bb.y1; y += 30) for (let x = bb.x0; x < bb.x1; x += 18) {
        if (A.pointInPoly(x, y, poly)) { g.beginPath(); g.arc(x, y, px(0.9), 0, 7); g.fill(); }
      }
    }

    // woods
    const trees = (poly, sp) => {
      const bb = A.bbox(poly), pts = [];
      for (let y = bb.y0; y < bb.y1; y += sp) for (let x = bb.x0; x < bb.x1; x += sp) {
        const tx = x + (R() - 0.5) * sp, ty = y + (R() - 0.5) * sp;
        if (A.pointInPoly(tx, ty, poly)) pts.push([tx, ty, 12 + R() * 9]);
      }
      g.fillStyle = 'rgba(50,40,25,0.35)';
      for (const [x, y, r] of pts) { g.beginPath(); g.arc(x + 6, y + 7, r, 0, 7); g.fill(); }
      for (const [x, y, r] of pts) {
        g.beginPath(); g.arc(x, y, r, 0, 7);
        g.fillStyle = 'rgb(122,128,78)'; g.fill();
        g.lineWidth = px(0.6); g.strokeStyle = 'rgba(48,52,28,0.9)'; g.stroke();
        g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, 7);
        g.fillStyle = 'rgba(200,200,150,0.35)'; g.fill();
      }
    };
    for (const w of A.WOODS) trees(w.poly, 46);
    trees(A.PHEASANTRY, 40);
    g.beginPath();
    A.PHEASANTRY.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.lineWidth = px(1.8); g.strokeStyle = '#5a3a22'; g.stroke();

    // ponds (frozen)
    for (const p of A.PONDS) {
      const poly = p.poly;
      let cx = 0, cy = 0;
      for (const [x, y] of poly) { cx += x; cy += y; }
      cx /= poly.length; cy /= poly.length;
      const path = (k) => {
        g.beginPath();
        const sm = poly.map(([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k]);
        sm.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
        g.closePath();
      };
      path(1); g.fillStyle = '#c3d1d1'; g.fill();
      g.lineWidth = px(1.6); g.strokeStyle = '#33505e'; g.stroke();
      g.lineWidth = px(0.7);
      [0.93, 0.85, 0.76, 0.66].forEach((k, i) => { path(k); g.strokeStyle = `rgba(51,80,94,${0.35 - i * 0.06})`; g.stroke(); });
      g.strokeStyle = 'rgba(255,255,255,0.65)';
      g.lineWidth = px(0.6);
      const bb = A.bbox(poly);
      for (let i = 0; i < 14; i++) {
        let x = bb.x0 + R() * (bb.x1 - bb.x0), y = bb.y0 + R() * (bb.y1 - bb.y0);
        if (!A.pointInPoly(x, y, poly)) continue;
        g.beginPath(); g.moveTo(x, y);
        for (let k = 0; k < 4; k++) { x += (R() - 0.5) * 160; y += (R() - 0.5) * 60; g.lineTo(x, y); }
        g.stroke();
      }
    }

    // streams
    for (const s of A.STREAMS_SMOOTH) {
      g.beginPath();
      s.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.lineJoin = 'round';
      g.lineWidth = px(5); g.strokeStyle = 'rgba(170,196,200,0.8)'; g.stroke();
      g.lineWidth = px(2.2); g.strokeStyle = '#3c6276'; g.stroke();
    }

    // roads
    for (const r of A.ROADS) {
      const pts = A.chaikin(r.pts, 2);
      g.beginPath();
      pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      if (r.main) {
        g.setLineDash([]);
        g.lineWidth = px(7); g.strokeStyle = '#5a3e24'; g.stroke();
        g.lineWidth = px(4.4); g.strokeStyle = '#ecdcb6'; g.stroke();
      } else {
        g.setLineDash([px(6), px(4)]);
        g.lineWidth = px(1.7); g.strokeStyle = 'rgba(100,72,44,0.9)'; g.stroke();
      }
    }
    g.setLineDash([]);

    // villages
    for (const v of A.VILLAGES) drawVillage(g, v, A.rng(v.x * 7 + v.y), px);

    // château de Sokolnitz
    g.save();
    g.translate(A.CASTLE.x, A.CASTLE.y); g.rotate(0.35);
    g.fillStyle = '#7c2a1c'; g.fillRect(-55, -35, 110, 70);
    g.fillStyle = '#e8dcbc'; g.fillRect(-30, -15, 60, 30);
    g.lineWidth = px(1); g.strokeStyle = '#3a120a'; g.strokeRect(-55, -35, 110, 70);
    g.restore();

    mapCv = c;
    miniCv = mk(240, Math.round((240 * M.H) / M.W));
    const mg = miniCv.getContext('2d');
    mg.imageSmoothingQuality = 'high';
    mg.drawImage(c, 0, 0, miniCv.width, miniCv.height);

    // sprites
    const sprite = (rgb) => {
      const s = mk(64, 64), sg = s.getContext('2d'), gd = sg.createRadialGradient(32, 32, 0, 32, 32, 32);
      gd.addColorStop(0, `rgba(${rgb},0.9)`); gd.addColorStop(0.5, `rgba(${rgb},0.45)`); gd.addColorStop(1, `rgba(${rgb},0)`);
      sg.fillStyle = gd; sg.fillRect(0, 0, 64, 64);
      return s;
    };
    puffW = sprite('240,238,230');
    puffB = sprite('150,120,80');
    cloudCv = mk(256, 256);
    const cg = cloudCv.getContext('2d'), ci = cg.createImageData(256, 256), cn = A.makeNoise(31);
    for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) {
      const v = A.fbm(cn, i / 32, j / 32, 4);
      const p = (j * 256 + i) * 4;
      ci.data[p] = ci.data[p + 1] = ci.data[p + 2] = 255;
      ci.data[p + 3] = A.clamp((v - 0.42) * 600, 0, 255);
    }
    cg.putImageData(ci, 0, 0);
    fogCv = mk(Math.ceil(M.W / 50), Math.ceil(M.H / 50));
    fogCtx = fogCv.getContext('2d');
  }

  function drawVillage(g, v, R, px) {
    const c = Math.cos(v.rot), s = Math.sin(v.rot);
    const L = (lx, ly) => [v.x + lx * c - ly * s, v.y + lx * s + ly * c];
    const inside = (lx, ly) => (lx / v.rx) ** 2 + (ly / v.ry) ** 2 <= 1;
    g.save();
    g.translate(v.x, v.y); g.rotate(v.rot);
    g.beginPath(); g.ellipse(0, 0, v.rx * 1.2, v.ry * 1.25, 0, 0, 7);
    g.fillStyle = 'rgba(112,122,64,0.16)'; g.fill();
    g.restore();
    const houses = [];
    const street = (ax, ay, bx, by) => {
      const len = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / len, uy = (by - ay) / len;
      for (let d = 0; d < len; d += 26 + R() * 8) {
        for (const side of [-1, 1]) {
          if (R() < 0.18) continue;
          const off = side * (24 + R() * 10);
          const lx = ax + ux * d - uy * off, ly = ay + uy * d + ux * off;
          if (inside(lx, ly)) houses.push([lx, ly, 15 + R() * 10, 11 + R() * 6, Math.atan2(uy, ux)]);
        }
      }
    };
    const k = v.small ? 0.8 : 1;
    street(-v.rx * k, 0, v.rx * k, 0);
    if (!v.small) street(0, -v.ry, 0, v.ry);
    if (v.town) { street(-v.rx, -v.ry * 0.5, v.rx, -v.ry * 0.5); street(-v.rx, v.ry * 0.5, v.rx, v.ry * 0.5); }
    const extra = Math.round((v.rx * v.ry) / 9000);
    for (let i = 0; i < extra; i++) {
      const lx = (R() - 0.5) * 2 * v.rx, ly = (R() - 0.5) * 2 * v.ry;
      if (inside(lx, ly)) houses.push([lx, ly, 14 + R() * 8, 10 + R() * 5, R() < 0.5 ? 0 : Math.PI / 2]);
    }
    g.lineWidth = px(0.5);
    g.strokeStyle = '#4a170d';
    for (const [lx, ly, w, h, a] of houses) {
      const [x, y] = L(lx, ly);
      g.save(); g.translate(x, y); g.rotate(v.rot + a);
      g.fillStyle = 'rgba(40,20,10,0.3)'; g.fillRect(-w / 2 + 3, -h / 2 + 3, w, h);
      g.fillStyle = R() < 0.15 ? '#7a2c1d' : '#a03e2a'; g.fillRect(-w / 2, -h / 2, w, h);
      g.strokeRect(-w / 2, -h / 2, w, h);
      g.restore();
    }
    if (!v.small) {
      const [x, y] = L(v.rx * 0.12, -v.ry * 0.15);
      g.save(); g.translate(x, y); g.rotate(v.rot);
      g.fillStyle = '#5e1f12'; g.fillRect(-20, -9, 40, 18); g.fillRect(16, -7, 14, 14);
      g.strokeStyle = '#2a0c05'; g.lineWidth = px(0.9);
      g.beginPath(); g.moveTo(23, -26); g.lineTo(23, -10); g.moveTo(17, -20); g.lineTo(29, -20); g.stroke();
      g.restore();
    }
    if (v.town) {
      const [x, y] = L(-v.rx * 0.4, v.ry * 0.1);
      g.save(); g.translate(x, y);
      g.fillStyle = '#6e2416'; g.fillRect(-80, -40, 160, 80);
      g.fillStyle = '#e8dcbc'; g.fillRect(-50, -18, 100, 36);
      g.restore();
    }
  }

  function buildFogMask(top) {
    const fw = fogCv.width, fh = fogCv.height;
    const c = fogMask || (fogMask = mk(fw, fh)), g = c.getContext('2d'), img = g.createImageData(fw, fh);
    for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++) {
      const e = T.elev(i * 50, j * 50);
      const a = A.smooth(top + 8, top - 16, e);
      const p = (j * fw + i) * 4;
      img.data[p] = 246; img.data[p + 1] = 244; img.data[p + 2] = 238; img.data[p + 3] = a * 255;
    }
    g.putImageData(img, 0, 0);
    fogMaskTop = top;
  }

  // ---------------- setup ----------------
  function init(canvas) {
    cv = canvas;
    ctx = cv.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  }
  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    vignette = mk(Math.max(1, W), Math.max(1, H));
    const vg = vignette.getContext('2d'), gd = vg.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    gd.addColorStop(0, 'rgba(20,12,5,0)'); gd.addColorStop(1, 'rgba(20,12,5,0.5)');
    vg.fillStyle = gd; vg.fillRect(0, 0, W, H);
    clampCam();
  }
  function clampCam() {
    const minZ = Math.min(W / M.W, H / M.H) * 0.85;
    cam.z = A.clamp(cam.z, minZ, 0.5);
    cam.x = A.clamp(cam.x, 0, M.W);
    cam.y = A.clamp(cam.y, 0, M.H);
  }

  // ---------------- drawing helpers ----------------
  function halo(text, x, y, fill, haloC = 'rgba(240,230,204,0.85)', hw = 3) {
    ctx.lineWidth = hw; ctx.strokeStyle = haloC; ctx.lineJoin = 'round';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fill; ctx.fillText(text, x, y);
  }

  const LABEL_STYLE = {
    village: { font: (p) => `italic ${p}px "IM Fell English", Georgia, serif`, col: '#2b1d12', min: 11, max: 26 },
    town: { font: (p) => `${p}px "IM Fell English SC", Georgia, serif`, col: '#2b1d12', min: 13, max: 32 },
    hill: { font: (p) => `${p}px "IM Fell English SC", Georgia, serif`, col: '#5a3518', min: 11, max: 24 },
    region: { font: (p) => `${p}px "Bodoni Moda", Didot, "Bodoni 72", serif`, col: 'rgba(84,50,22,0.42)', min: 13, max: 60 },
    water: { font: (p) => `italic ${p}px "IM Fell English", Georgia, serif`, col: '#2c5266', min: 10, max: 22 },
    road: { font: (p) => `italic ${p}px "IM Fell English", Georgia, serif`, col: '#5e4630', min: 9, max: 18 },
    small: { font: (p) => `italic ${p}px "IM Fell English", Georgia, serif`, col: '#4e3a26', min: 9, max: 16 },
  };
  function drawLabel(text, x, y, s, kind, rot = 0) {
    const st = LABEL_STYLE[kind];
    if ((kind === 'small' || kind === 'road') && cam.z < 0.05) return;
    const p = A.clamp(s * cam.z, st.min, st.max);
    const [sx, sy] = w2s(x, y);
    if (sx < -300 || sy < -100 || sx > W + 300 || sy > H + 100) return;
    ctx.save();
    ctx.translate(sx, sy); ctx.rotate(rot);
    ctx.font = st.font(Math.round(p));
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (kind === 'region') { ctx.fillStyle = st.col; ctx.fillText(text, 0, 0); }
    else halo(text, 0, 0, st.col);
    ctx.restore();
  }

  function drawFlag(sx, sy, nation, scale) {
    const N = A.NATIONS[nation], h = 15 * scale, fw = 11 * scale, fh = 7.5 * scale;
    ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx, sy - h); ctx.stroke();
    const x = sx + 0.5, y = sy - h;
    if (nation === 'F') {
      N.flag.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x + (i * fw) / 3, y, fw / 3 + 0.3, fh); });
    } else if (nation === 'R') {
      ctx.fillStyle = N.flag[0]; ctx.fillRect(x, y, fw, fh);
      ctx.strokeStyle = N.flag[1]; ctx.lineWidth = 1.4 * scale;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + fw, y + fh); ctx.moveTo(x + fw, y); ctx.lineTo(x, y + fh); ctx.stroke();
    } else {
      ctx.fillStyle = N.flag[0]; ctx.fillRect(x, y, fw, fh);
      ctx.fillStyle = N.flag[1]; ctx.beginPath(); ctx.arc(x + fw / 2, y + fh / 2, fh * 0.28, 0, 7); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(30,20,10,0.8)'; ctx.lineWidth = 0.6; ctx.strokeRect(x, y, fw, fh);
  }

  function unitScreenDims(u) {
    return [Math.max(u.fw * cam.z, 10), Math.max(u.fd * cam.z, 5)];
  }

  function drawUnitBody(u, alpha, selected, hovered) {
    const [sx, sy] = w2s(u.x, u.y);
    const [w, d] = unitScreenDims(u);
    if (sx < -w - 60 || sy < -w - 60 || sx > W + w + 60 || sy > H + w + 60) return;
    const N = A.NATIONS[u.nation];
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(u.facing + Math.PI / 2);
    ctx.globalAlpha = alpha;
    if (selected) {
      ctx.shadowColor = 'rgba(255,214,110,0.95)'; ctx.shadowBlur = 12;
    }
    ctx.fillStyle = 'rgba(30,20,10,0.28)';
    ctx.fillRect(-w / 2 + 2, -d / 2 + 2.5, w, d);
    ctx.shadowBlur = 0;
    ctx.fillStyle = N.fill;
    ctx.fillRect(-w / 2, -d / 2, w, d);
    const square = u.cls === 'inf' && u.form === 'square';
    if (square) {
      const t = Math.max(2.2, w * 0.2);
      ctx.fillStyle = 'rgba(232,220,190,0.95)';
      ctx.fillRect(-w / 2 + t, -d / 2 + t, w - 2 * t, d - 2 * t);
    }
    // glyph
    ctx.strokeStyle = N.glyph; ctx.fillStyle = N.glyph;
    ctx.lineWidth = Math.max(0.8, Math.min(1.6, d * 0.12));
    const ix = w / 2 - 1.5, iy = d / 2 - 1.5;
    if (u.cls === 'inf' && !square) {
      ctx.beginPath(); ctx.moveTo(-ix, -iy); ctx.lineTo(ix, iy); ctx.moveTo(ix, -iy); ctx.lineTo(-ix, iy); ctx.stroke();
      if (u.type === 'light') { ctx.beginPath(); ctx.arc(0, 0, Math.min(w, d) * 0.18, 0, 7); ctx.fill(); }
      if (u.type === 'grenadier') { ctx.beginPath(); ctx.moveTo(-ix, -iy + d * 0.25); ctx.lineTo(ix, -iy + d * 0.25); ctx.stroke(); }
    } else if (u.cls === 'cav') {
      ctx.beginPath(); ctx.moveTo(-ix, iy); ctx.lineTo(ix, -iy); ctx.stroke();
      if (u.type === 'cuirassier' || u.type === 'guardcav') { ctx.beginPath(); ctx.moveTo(-ix, iy - d * 0.25); ctx.lineTo(ix - w * 0.2, -iy); ctx.stroke(); }
      if (u.type === 'cossack' || u.type === 'uhlan') { ctx.beginPath(); ctx.arc(0, 0, Math.min(w, d) * 0.16, 0, 7); ctx.stroke(); }
    } else if (u.cls === 'art') {
      const r = Math.max(1.6, Math.min(w, d) * 0.3);
      const n = cam.z > 0.12 ? 3 : 1;
      for (let i = 0; i < n; i++) {
        const cx = n === 1 ? 0 : (i - 1) * w * 0.3;
        ctx.beginPath(); ctx.arc(cx, d * 0.1, r, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx, d * 0.1); ctx.lineTo(cx, -d / 2 - r * 0.6); ctx.lineWidth = r * 0.8; ctx.stroke();
      }
    }
    // outline + front edge
    ctx.lineWidth = 1.1; ctx.strokeStyle = N.dark;
    ctx.strokeRect(-w / 2, -d / 2, w, d);
    if (square) { const t = Math.max(2.2, w * 0.2); ctx.strokeRect(-w / 2 + t, -d / 2 + t, w - 2 * t, d - 2 * t); }
    else {
      ctx.lineWidth = Math.max(2, Math.min(4, d * 0.3));
      ctx.beginPath(); ctx.moveTo(-w / 2, -d / 2); ctx.lineTo(w / 2, -d / 2); ctx.stroke();
    }
    if ((u.type === 'guard' || u.type === 'guardcav') && w > 14 && d > 7) {
      ctx.strokeStyle = '#e1b84b'; ctx.lineWidth = 1.2;
      ctx.strokeRect(-w / 2 + 2, -d / 2 + 2, w - 4, d - 4);
    }
    if (u.routed) {
      ctx.strokeStyle = 'rgba(150,20,10,0.9)'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = -w; k < w; k += 5) { ctx.moveTo(k, -d / 2); ctx.lineTo(k + d, d / 2); }
      ctx.save(); ctx.clip(new Path2D(`M${-w / 2} ${-d / 2}h${w}v${d}h${-w}z`)); ctx.stroke(); ctx.restore();
    }
    if (u.formT > 0) {
      ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(255,240,200,0.9)'; ctx.lineWidth = 1;
      ctx.strokeRect(-w / 2 - 3, -d / 2 - 3, w + 6, d + 6); ctx.setLineDash([]);
    }
    if (selected || hovered) {
      ctx.setLineDash(selected ? [5, 3] : [2, 3]);
      ctx.strokeStyle = selected ? '#f2c45a' : 'rgba(255,240,200,0.8)';
      ctx.lineWidth = selected ? 1.8 : 1.2;
      ctx.strokeRect(-w / 2 - 4, -d / 2 - 4, w + 8, d + 8);
      ctx.setLineDash([]);
    }
    ctx.restore();

    // upright decorations
    ctx.save();
    ctx.globalAlpha = alpha;
    const rad = Math.max(w, d) / 2;
    if (cam.z > 0.04) {
      const bx = sx - Math.cos(u.facing) * d * 0.5 + Math.sin(u.facing) * w * 0.35;
      const by = sy - Math.sin(u.facing) * d * 0.5 - Math.cos(u.facing) * w * 0.35;
      drawFlag(bx, by, u.nation, A.clamp(cam.z * 9, 0.6, 1.2));
    }
    if (cam.z > 0.05 || selected) {
      ctx.font = `${Math.round(A.clamp(cam.z * 120, 10, 14))}px "IM Fell English SC", Georgia, serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      const ly = sy + Math.min(rad, 28) + 5;
      halo(u.cmd, sx, ly, u.side === 'F' ? '#13234a' : '#22301a');
      if (u.side === 'F' && alpha > 0.5) {
        const bw = 28, frac = u.morale / 100;
        ctx.fillStyle = 'rgba(30,20,10,0.6)'; ctx.fillRect(sx - bw / 2, ly + 15, bw, 3);
        ctx.fillStyle = frac > 0.6 ? '#4f8a3a' : frac > 0.35 ? '#d0a030' : '#b8352b';
        ctx.fillRect(sx - bw / 2, ly + 15, bw * frac, 3);
      }
    }
    if (u.melee && u.melee.length && Math.floor(performance.now() / 300) % 2 === 0) {
      const y = sy - Math.min(rad, 24) - 12;
      ctx.strokeStyle = '#a3241a'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(sx - 6, y - 6); ctx.lineTo(sx + 6, y + 6); ctx.moveTo(sx + 6, y - 6); ctx.lineTo(sx - 6, y + 6); ctx.stroke();
    }
    if (u.routed) {
      ctx.font = 'italic 12px "IM Fell English", Georgia, serif';
      ctx.textAlign = 'center';
      halo('en déroute', sx, sy - Math.min(rad, 24) - 10, '#9e1d12');
    }
    ctx.restore();
  }

  function drawStaff(u, selected, hovered) {
    const [sx, sy] = w2s(u.x, u.y);
    const r = A.clamp(70 * cam.z, 9, 16);
    ctx.save();
    if (selected) { ctx.shadowColor = 'rgba(255,214,110,1)'; ctx.shadowBlur = 14; }
    ctx.beginPath(); ctx.arc(sx, sy, r, 0, 7);
    ctx.fillStyle = '#1b2f66'; ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2.2; ctx.strokeStyle = '#d9b14d'; ctx.stroke();
    ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(sx, sy, r - 3, 0, 7); ctx.strokeStyle = 'rgba(217,177,77,0.7)'; ctx.stroke();
    ctx.fillStyle = '#e8c463';
    ctx.font = `bold ${Math.round(r * 1.25)}px "Bodoni Moda", Didot, "Bodoni 72", serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('N', sx, sy + 1);
    if (selected || hovered) {
      ctx.setLineDash([4, 3]); ctx.strokeStyle = '#f2c45a'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(sx, sy, r + 5, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.font = `${Math.round(A.clamp(cam.z * 130, 11, 15))}px "IM Fell English SC", Georgia, serif`;
    ctx.textBaseline = 'top';
    halo("L'Empereur", sx, sy + r + 4, '#13234a');
    ctx.restore();
  }

  function drawCommander(k, c) {
    const C = A.CORPS[k];
    const [sx, sy] = w2s(c.x, c.y);
    if (sx < -50 || sy < -50 || sx > W + 50 || sy > H + 50) return;
    const fr = C.side === 'F';
    ctx.save();
    ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(sx, sy + 4); ctx.lineTo(sx, sy - 18); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx + 0.5, sy - 18); ctx.lineTo(sx + 14, sy - 18); ctx.lineTo(sx + 10, sy - 14); ctx.lineTo(sx + 14, sy - 10); ctx.lineTo(sx + 0.5, sy - 10);
    ctx.closePath();
    ctx.fillStyle = fr ? C.color : '#e9e3d0'; ctx.fill();
    ctx.lineWidth = 0.8; ctx.stroke();
    if (!fr) { ctx.fillStyle = '#3f5c33'; ctx.fillRect(sx + 1, sy - 15, 11, 2); }
    ctx.beginPath(); ctx.arc(sx, sy + 4, 2.5, 0, 7); ctx.fillStyle = '#2a1a0c'; ctx.fill();
    if (cam.z > 0.045) {
      ctx.font = '11px "IM Fell English SC", Georgia, serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      halo(C.short, sx + 17, sy - 14, fr ? '#13234a' : '#22301a');
    }
    ctx.restore();
  }

  function arrowLine(x0, y0, x1, y1, col, dash) {
    ctx.save();
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.8;
    ctx.setLineDash(dash || []);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.setLineDash([]);
    const a = Math.atan2(y1 - y0, x1 - x0);
    ctx.beginPath(); ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - Math.cos(a - 0.4) * 10, y1 - Math.sin(a - 0.4) * 10);
    ctx.lineTo(x1 - Math.cos(a + 0.4) * 10, y1 - Math.sin(a + 0.4) * 10);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawCompass(x, y, r) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = '#3a2614'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.82, 0, 7); ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4, L = i % 2 ? r * 0.55 : r * 0.95;
      ctx.save(); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(0, -L); ctx.lineTo(r * 0.12, 0); ctx.lineTo(0, 0); ctx.closePath();
      ctx.fillStyle = '#3a2614'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -L); ctx.lineTo(-r * 0.12, 0); ctx.lineTo(0, 0); ctx.closePath();
      ctx.fillStyle = '#efe2c2'; ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    ctx.font = `${Math.round(r * 0.42)}px "IM Fell English SC", Georgia, serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    halo('N', 0, -r - 9, '#3a2614');
    ctx.restore();
  }

  function drawScale(x, y) {
    const opts = [250, 500, 1000, 2000, 4000];
    let m = opts[0];
    for (const o of opts) if (o * cam.z <= 170) m = o;
    const L = m * cam.z;
    ctx.save();
    ctx.fillStyle = 'rgba(236,224,196,0.85)'; ctx.fillRect(x - 8, y - 22, L + 16, 36);
    ctx.strokeStyle = '#3a2614'; ctx.strokeRect(x - 8, y - 22, L + 16, 36);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 ? '#efe2c2' : '#3a2614';
      ctx.fillRect(x + (i * L) / 4, y, L / 4, 5);
    }
    ctx.strokeRect(x, y, L, 5);
    ctx.font = '11px "IM Fell English", Georgia, serif';
    ctx.fillStyle = '#3a2614'; ctx.textAlign = 'center';
    ctx.fillText(`Échelle — ${m >= 1000 ? m / 1000 + ' km' : m + ' m'}  (${Math.round(m / 1.949)} toises)`, x + L / 2, y - 8);
    ctx.restore();
  }

  // ---------------- main draw ----------------
  function draw(ui) {
    const G = A.Game;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#1a140e';
    ctx.fillRect(0, 0, W, H);
    if (!mapCv) return;

    const [wx0, wy0] = s2w(0, 0), [wx1, wy1] = s2w(W, H);
    const x0 = Math.max(0, wx0), y0 = Math.max(0, wy0), x1 = Math.min(M.W, wx1), y1 = Math.min(M.H, wy1);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = cam.z < BS ? 'high' : 'medium';
    if (x1 > x0 && y1 > y0) {
      const [sx, sy] = w2s(x0, y0);
      ctx.drawImage(mapCv, x0 * BS, y0 * BS, (x1 - x0) * BS, (y1 - y0) * BS, sx, sy, (x1 - x0) * cam.z, (y1 - y0) * cam.z);
    }
    {
      const [ax, ay] = w2s(0, 0), [bx, by] = w2s(M.W, M.H);
      ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = 3; ctx.strokeRect(ax - 6, ay - 6, bx - ax + 12, by - ay + 12);
      ctx.lineWidth = 1; ctx.strokeRect(ax - 1, ay - 1, bx - ax + 2, by - ay + 2);
      ctx.strokeStyle = '#b58f3e'; ctx.lineWidth = 1; ctx.strokeRect(ax - 10, ay - 10, bx - ax + 20, by - ay + 20);
    }

    if (!G) return;
    const t = G.t, E = G.env;

    // morning light
    if (t < 520) { ctx.fillStyle = `rgba(70,90,130,${0.16 * (1 - A.clamp((t - 420) / 100, 0, 1))})`; ctx.fillRect(0, 0, W, H); }
    const sun = Math.exp(-(((t - 560) / 40) ** 2));
    if (sun > 0.02) { ctx.fillStyle = `rgba(255,196,110,${0.09 * sun})`; ctx.fillRect(0, 0, W, H); }

    // fog
    if (E.fog > 0.01) {
      if (Math.abs(E.fogTop - fogMaskTop) > 1.5) buildFogMask(E.fogTop);
      fogCtx.globalCompositeOperation = 'copy';
      fogCtx.drawImage(fogMask, 0, 0);
      fogCtx.globalCompositeOperation = 'destination-out';
      fogCtx.globalAlpha = 0.55;
      const off = (performance.now() / 1000) * 3;
      fogCtx.fillStyle = fogCtx.createPattern(cloudCv, 'repeat');
      fogCtx.save(); fogCtx.translate(off % 256, (off * 0.4) % 256); fogCtx.fillRect(-256, -256, fogCv.width + 512, fogCv.height + 512); fogCtx.restore();
      fogCtx.globalAlpha = 1;
      fogCtx.globalCompositeOperation = 'source-over';
      const [sx, sy] = w2s(0, 0);
      ctx.globalAlpha = 0.82 * E.fog;
      ctx.drawImage(fogCv, sx, sy, M.W * cam.z, M.H * cam.z);
      ctx.globalAlpha = 1;
    }

    // labels
    for (const v of A.VILLAGES) drawLabel(v.name, v.x, v.y - v.ry - 70, v.town ? 170 : v.small ? 90 : 135, v.town ? 'town' : v.small ? 'small' : 'village');
    for (const l of A.LABELS) drawLabel(l.t, l.x, l.y, l.s, l.kind, l.rot || 0);

    // objectives
    for (const o of G.objectives) {
      const [sx, sy] = w2s(o.x, o.y);
      const r = o.r * cam.z;
      const col = o.owner === 'F' ? '#2d4f97' : '#3f5c33';
      ctx.save();
      ctx.setLineDash([6, 6]); ctx.lineWidth = 1.2;
      ctx.strokeStyle = o.contested ? 'rgba(170,40,30,0.7)' : o.owner === 'F' ? 'rgba(45,79,151,0.45)' : 'rgba(63,92,51,0.45)';
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      const my = sy - r, mr = 9;
      ctx.beginPath(); ctx.arc(sx, my, mr, 0, 7);
      ctx.fillStyle = o.contested && Math.floor(performance.now() / 400) % 2 ? '#8e2a22' : col; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#c9a043'; ctx.stroke();
      ctx.fillStyle = '#f2e8cf'; ctx.font = 'bold 9px "Bodoni Moda", Didot, serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(A.roman(o.pts), sx, my + 0.5);
      ctx.restore();
    }

    // ghosts of last seen enemies
    for (const [uid, g] of G.lastSeen) {
      if (G.vis.F.has(uid)) continue;
      const fade = 1 - (t - g.t) / 20;
      const ghost = { ...g.u, x: g.x, y: g.y, facing: g.facing, fw: g.fw, fd: g.fd, melee: [], routed: false, formT: 0, cmd: g.u.cmd + ' ?' };
      ghost.frontX = g.x; ghost.frontY = g.y;
      drawUnitBody(ghost, 0.28 * fade, false, false);
    }

    // order lines
    for (const u of ui.selected) {
      if (u.dead || u.side !== 'F') continue;
      const [sx, sy] = w2s(u.x, u.y);
      if (u.order && u.order.type === 'move') {
        const [tx, ty] = w2s(u.order.x, u.order.y);
        arrowLine(sx, sy, tx, ty, 'rgba(25,45,110,0.85)', [7, 5]);
      } else if (u.order && u.order.type === 'attack' && !u.order.target.dead) {
        const [tx, ty] = w2s(u.order.target.x, u.order.target.y);
        arrowLine(sx, sy, tx, ty, 'rgba(160,30,20,0.9)', u.order.charge ? [] : [3, 4]);
      }
    }

    if (ui.marker) {
      const k = (performance.now() - ui.marker.t) / 700;
      if (k < 1) {
        const [mx, my] = w2s(ui.marker.x, ui.marker.y);
        ctx.strokeStyle = ui.marker.kind === 'attack' ? `rgba(170,30,20,${1 - k})` : `rgba(25,45,110,${1 - k})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(mx, my, 6 + k * 18, 0, 7); ctx.stroke();
      }
    }

    // units
    const sel = new Set(ui.selected);
    for (const u of G.units) {
      if (u.dead || u.cls === 'staff') continue;
      if (u.side === 'A' && !G.vis.F.has(u.uid)) continue;
      drawUnitBody(u, u.routed ? 0.7 : 1, sel.has(u), ui.hover === u);
    }
    for (const u of G.units) if (u.cls === 'staff' && !u.dead) drawStaff(u, sel.has(u), ui.hover === u);

    // smoke & effects
    for (const p of A.FX.parts) {
      const [sx, sy] = w2s(p.x, p.y);
      const r = Math.max(1.5, p.size * cam.z);
      if (sx < -r || sy < -r || sx > W + r || sy > H + r) continue;
      const k = p.life / p.max;
      if (p.kind === 'flash') {
        ctx.globalAlpha = k;
        ctx.fillStyle = '#ffcf6a';
        ctx.beginPath(); ctx.arc(sx, sy, Math.max(1.2, r * 0.5), 0, 7); ctx.fill();
      } else {
        ctx.globalAlpha = (p.kind === 'smoke' ? 0.7 : 0.5) * Math.min(1, k * 1.5);
        ctx.drawImage(p.kind === 'smoke' ? puffW : puffB, sx - r, sy - r, r * 2, r * 2);
      }
    }
    ctx.globalAlpha = 1;

    // commanders
    for (const k in G.cmdPos) {
      const C = A.CORPS[k];
      if (C.side === 'A' && !G.units.some((u) => u.corps === k && G.vis.F.has(u.uid))) continue;
      drawCommander(k, G.cmdPos[k]);
    }

    // selection box / order drag
    if (ui.box) {
      const b = ui.box;
      ctx.fillStyle = 'rgba(242,196,90,0.12)'; ctx.strokeStyle = '#f2c45a'; ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
      ctx.strokeRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
      ctx.setLineDash([]);
    }
    if (ui.faceDrag) {
      const f = ui.faceDrag;
      arrowLine(f.x0, f.y0, f.x1, f.y1, 'rgba(25,45,110,0.95)');
      ctx.fillStyle = 'rgba(25,45,110,0.9)';
      ctx.font = 'italic 12px "IM Fell English", serif';
      ctx.fillText('front', f.x1 + 8, f.y1);
    }

    // dusk
    if (E.light < 1) { ctx.fillStyle = `rgba(18,22,48,${(1 - E.light) * 0.85})`; ctx.fillRect(0, 0, W, H); }
    ctx.drawImage(vignette, 0, 0, W, H);

    drawCompass(W - 300, H - 70, 26);
    drawScale(W - 520, H - 40);
  }

  function drawMinimap(mc, ui) {
    const G = A.Game, g = mc.getContext('2d');
    const w = mc.width, h = mc.height, k = w / M.W;
    g.drawImage(miniCv, 0, 0, w, h);
    if (!G) return;
    if (G.env.fog > 0.01 && fogMask) { g.globalAlpha = 0.7 * G.env.fog; g.drawImage(fogMask, 0, 0, w, h); g.globalAlpha = 1; }
    for (const o of G.objectives) {
      g.fillStyle = o.owner === 'F' ? '#2d4f97' : '#3f5c33';
      g.strokeStyle = '#c9a043';
      g.beginPath(); g.arc(o.x * k, o.y * k, 3.5, 0, 7); g.fill(); g.stroke();
    }
    for (const u of G.units) {
      if (u.dead || (u.side === 'A' && !G.vis.F.has(u.uid))) continue;
      g.fillStyle = u.side === 'F' ? (ui.selected.includes(u) ? '#f2c45a' : '#1d3a85') : u.nation === 'Au' ? '#f4f0e4' : '#2e4a22';
      g.strokeStyle = '#1a1208';
      const s = u.cls === 'staff' ? 4 : 3.2;
      g.fillRect(u.x * k - s / 2, u.y * k - s / 2, s, s);
      g.lineWidth = 0.5; g.strokeRect(u.x * k - s / 2, u.y * k - s / 2, s, s);
    }
    const [ax, ay] = s2w(0, 0), [bx, by] = s2w(W, H);
    g.strokeStyle = '#f2c45a'; g.lineWidth = 1.5;
    g.strokeRect(ax * k, ay * k, (bx - ax) * k, (by - ay) * k);
  }

  return {
    init,
    bake,
    draw,
    drawMinimap,
    cam,
    w2s,
    s2w,
    clampCam,
    get W() { return W; },
    get H() { return H; },
    get mapCanvas() { return mapCv; },
    unitScreenDims,
  };
})();
