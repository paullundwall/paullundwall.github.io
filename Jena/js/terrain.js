'use strict';
A.Terrain = (function () {
  const M = A.MAP;
  const G = 40;
  const GW = Math.ceil(M.W / G) + 1, GH = Math.ceil(M.H / G) + 1;
  const noise = A.makeNoise(1806);
  let grid = null;

  const pondBoxes = A.PONDS.map((p) => A.bbox(p.poly));
  const woodPolys = A.WOODS.map((w) => w.poly);
  const woodBoxes = woodPolys.map(A.bbox);

  function gauss(x, y, cx, cy, s) {
    const dx = x - cx, dy = y - cy;
    return Math.exp(-(dx * dx + dy * dy) / (2 * s * s));
  }

  // The Ilm–Saale plateau stands at about 320 m. It ends in the steep slopes of the
  // Saale valley (Jena about 155 m) and is cut by the Mühltal; the Landgrafenberg
  // and Windknollen (about 360 m) overlook Jena from the north-west.
  function rawElev(x, y) {
    let e = 318;
    e += 42 * gauss(x, y, 12150, 5950, 850); // Windknollen, Landgrafenberg
    e += 18 * gauss(x, y, 10250, 3300, 650); // Dornberg
    e += 12 * gauss(x, y, 6800, 4900, 700); // Sperlingsberg
    e -= 38 * gauss(x, y, 1960, 3780, 1300); // Kapellendorf hollow
    e -= 20 * (1 - A.smooth(0, 1800, y)) * A.smooth(8000, 13000, x);
    e += 30 * gauss(x, y, 11600, 9600, 1500); // high ground south of the Mühltal
    const saale = 168 * A.smooth(12900, 14350, x) * (1 - A.smooth(15000, 15900, x));
    const dm = A.polyDist(x, y, A.STREAMS[1].pts);
    const muehl = 125 * Math.exp(-((dm / 650) ** 2)) * A.smooth(7400, 11800, x);
    e -= Math.max(saale, muehl);
    e += 35 * A.smooth(15300, 16600, x); // the Jenzig across the Saale
    e += (A.fbm(noise, x / 1600, y / 1600, 3) - 0.5) * 18;
    return e;
  }

  function build() {
    grid = new Float32Array(GW * GH);
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) grid[j * GW + i] = rawElev(i * G, j * G);
  }

  function elev(x, y) {
    const fx = A.clamp(x / G, 0, GW - 1.001), fy = A.clamp(y / G, 0, GH - 1.001);
    const i = Math.floor(fx), j = Math.floor(fy), u = fx - i, v = fy - j;
    const k = j * GW + i;
    const a = grid[k], b = grid[k + 1], c = grid[k + GW], d = grid[k + GW + 1];
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  function grad(x, y) {
    const h = 25;
    return [(elev(x + h, y) - elev(x - h, y)) / (2 * h), (elev(x, y + h) - elev(x, y - h)) / (2 * h)];
  }

  function pondAt(x, y) {
    for (let i = 0; i < A.PONDS.length; i++) {
      const b = pondBoxes[i];
      if (x < b.x0 || x > b.x1 || y < b.y0 || y > b.y1) continue;
      if (A.pointInPoly(x, y, A.PONDS[i].poly)) return A.PONDS[i];
    }
    return null;
  }

  function inWoods(x, y) {
    for (let i = 0; i < woodPolys.length; i++) {
      const b = woodBoxes[i];
      if (x < b.x0 || x > b.x1 || y < b.y0 || y > b.y1) continue;
      if (A.pointInPoly(x, y, woodPolys[i])) return true;
    }
    return false;
  }

  function villageAt(x, y) {
    for (const v of A.VILLAGES) {
      const dx = x - v.x, dy = y - v.y;
      if (Math.abs(dx) > v.rx + 40 || Math.abs(dy) > v.rx + 40) continue;
      const c = Math.cos(-v.rot), s = Math.sin(-v.rot);
      const lx = dx * c - dy * s, ly = dx * s + dy * c;
      if ((lx / v.rx) ** 2 + (ly / v.ry) ** 2 <= 1) return v;
    }
    return null;
  }

  function streamDist(x, y) {
    return Math.min(A.polyDist(x, y, A.STREAMS[0].pts), A.polyDist(x, y, A.STREAMS[1].pts));
  }

  function roadDist(x, y) {
    let m = Infinity;
    for (const r of A.ROADS) {
      const d = A.polyDist(x, y, r.pts);
      if (d < m) m = d;
    }
    return m;
  }

  function nearCastle(x, y) {
    return A.dist(x, y, A.CASTLE.x, A.CASTLE.y) < 140;
  }

  return {
    build,
    elev,
    grad,
    pondAt,
    inWoods,
    villageAt,
    streamDist,
    roadDist,
    onIce: (x, y) => !!pondAt(x, y),
    moveFactor(x, y) {
      if (pondAt(x, y)) return 0.35;
      let f = 1;
      if (inWoods(x, y)) f *= 0.65;
      else if (villageAt(x, y)) f *= 0.8;
      if (streamDist(x, y) < 35) f *= 0.5;
      else if (roadDist(x, y) < 35) f *= 1.15;
      return f;
    },
    cover(x, y) {
      if (nearCastle(x, y)) return 0.45;
      if (villageAt(x, y)) return 0.55;
      if (inWoods(x, y)) return 0.65;
      return 1;
    },
    meleeDef(x, y) {
      if (nearCastle(x, y)) return 1.8;
      if (villageAt(x, y)) return 1.5;
      if (inWoods(x, y)) return 1.25;
      return 1;
    },
    describe(x, y) {
      if (nearCastle(x, y)) return A.CASTLE.name;
      const v = villageAt(x, y);
      if (v) return v.town ? 'Ville d’' + v.name : 'Village de ' + v.name;
      if (inWoods(x, y)) return 'Bois';
      if (A.polyDist(x, y, A.STREAMS[0].pts) < 35) return 'Bords de la Saale';
      if (streamDist(x, y) < 35) return 'Gué du Mühlbach';
      const e = elev(x, y);
      if (e > 348 && A.dist(x, y, 12150, 5950) < 1300) return 'Landgrafenberg';
      if (e < 245 && A.polyDist(x, y, A.STREAMS[1].pts) < 700) return 'Mühltal';
      if (e < 230) return 'Vallée de la Saale';
      return 'Plateau';
    },
  };
})();
