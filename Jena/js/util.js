'use strict';
const A = (window.A = {});

A.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
A.lerp = (a, b, t) => a + (b - a) * t;
A.smooth = (e0, e1, x) => {
  const t = A.clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
A.dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
A.angDiff = (a, b) => {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
};

A.rng = function (seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

A.makeNoise = (seed) => {
  const r = A.rng(seed);
  const N = 256;
  const p = new Float32Array(N * N);
  for (let i = 0; i < N * N; i++) p[i] = r();
  const g = (i, j) => p[(j & 255) * N + (i & 255)];
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = g(xi, yi), b = g(xi + 1, yi), c = g(xi, yi + 1), d = g(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
};

A.fbm = (noise, x, y, oct) => {
  let s = 0, a = 0.5, f = 1, n = 0;
  for (let i = 0; i < oct; i++) {
    s += a * noise(x * f, y * f);
    n += a;
    a *= 0.5;
    f *= 2;
  }
  return s / n;
};

A.segDist = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay;
  const l = dx * dx + dy * dy;
  let t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0;
  t = A.clamp(t, 0, 1);
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};

A.polyDist = (px, py, pts) => {
  let m = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = A.segDist(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    if (d < m) m = d;
  }
  return m;
};

A.pointInPoly = (x, y, poly) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};

A.bbox = (poly) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of poly) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return { x0, y0, x1, y1 };
};

// Chaikin smoothing for open polylines
A.chaikin = (pts, iter = 3) => {
  let p = pts;
  for (let k = 0; k < iter; k++) {
    const out = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const [ax, ay] = p[i], [bx, by] = p[i + 1];
      out.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25]);
      out.push([ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]);
    }
    out.push(p[p.length - 1]);
    p = out;
  }
  return p;
};

A.blob = (cx, cy, rx, ry, rot, seed, n = 48) => {
  const r = A.rng(seed);
  const ph = [r() * 6, r() * 6, r() * 6];
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + 0.12 * Math.sin(3 * a + ph[0]) + 0.07 * Math.sin(5 * a + ph[1]) + 0.04 * Math.sin(9 * a + ph[2]);
    const lx = Math.cos(a) * rx * k, ly = Math.sin(a) * ry * k;
    pts.push([cx + lx * Math.cos(rot) - ly * Math.sin(rot), cy + lx * Math.sin(rot) + ly * Math.cos(rot)]);
  }
  return pts;
};

A.rect = (cx, cy, w, h, rot) => {
  const c = Math.cos(rot), s = Math.sin(rot);
  return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]);
};

A.fmtClock = (t) => {
  const h = Math.floor(t / 60), m = Math.floor(t % 60);
  return h + ' h ' + String(m).padStart(2, '0');
};
A.dayPart = (t) => (t < 720 ? 'du matin' : t < 1050 ? "de l'après-midi" : 'du soir');
A.fmtNum = (n) => Math.round(n).toLocaleString('fr-FR');
A.roman = (n) => ['', 'I', 'II', 'III', 'IV', 'V', 'VI'][n] || String(n);
