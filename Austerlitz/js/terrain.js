'use strict';
A.Terrain = (function () {
  const M = A.MAP;
  const G = 40;
  const GW = Math.ceil(M.W / G) + 1, GH = Math.ceil(M.H / G) + 1;
  const noise = A.makeNoise(1805);
  let grid = null;

  const pondBoxes = A.PONDS.map((p) => A.bbox(p.poly));
  const woodPolys = A.WOODS.map((w) => w.poly).concat([A.PHEASANTRY]);
  const woodBoxes = woodPolys.map(A.bbox);

  function gauss(x, y, cx, cy, s) {
    const dx = x - cx, dy = y - cy;
    return Math.exp(-(dx * dx + dy * dy) / (2 * s * s));
  }

  // Pratzen plateau axis: from the Pratzeberg (SSW) to Staré Vinohrady (NNE)
  const PAX = 7740 - 6060, PAY = 6400 - 9660, PAL = Math.hypot(PAX, PAY);
  const PUX = PAX / PAL, PUY = PAY / PAL;

  function rawElev(x, y) {
    let e = 224;
    const dx = x - 6900, dy = y - 8030;
    const u = dx * PUX + dy * PUY, v = -dx * PUY + dy * PUX;
    const q = Math.sqrt((u / 2900) ** 2 + (v / 1550) ** 2);
    e += 70 * (1 - A.smooth(0.45, 1.1, q));
    e += 24 * gauss(x, y, 6060, 9660, 600);
    e += 8 * gauss(x, y, 7740, 6400, 650);
    e += 46 * gauss(x, y, 5690, 3440, 270); // Santon
    e += 56 * gauss(x, y, 4530, 5100, 430); // Zuran
    const nx = (x - 8300) / 2600, ny = (y - 200) / 1500;
    e += 70 * Math.exp(-(nx * nx + ny * ny));
    e += 22 * (1 - A.smooth(0, 3200, x));
    e += 40 * gauss(x, y, 13000, 11200, 2300);
    e += 30 * gauss(x, y, 12600, 3400, 1800);
    const dg = A.polyDist(x, y, A.STREAMS[0].pts);
    e -= 18 * Math.exp(-((dg / 450) ** 2));
    const dl = A.polyDist(x, y, A.STREAMS[1].pts);
    e -= 16 * Math.exp(-((dl / 650) ** 2));
    e -= 24 * A.smooth(10500, 14200, y) * (1 - 0.5 * A.smooth(9000, 13000, x));
    e += (A.fbm(noise, x / 1600, y / 1600, 3) - 0.5) * 20;
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
    inPlateau(x, y) {
      return x > 5000 && x < 9200 && y > 5700 && y < 11000 && elev(x, y) > 266;
    },
    describe(x, y) {
      if (nearCastle(x, y)) return 'Château de Sokolnitz';
      const v = villageAt(x, y);
      if (v) return 'Village de ' + v.name;
      if (pondAt(x, y)) return 'Étang gelé';
      if (inWoods(x, y)) return 'Bois';
      if (streamDist(x, y) < 35) return 'Gué du ruisseau';
      if (this.inPlateau(x, y)) return 'Plateau de Pratzen';
      return 'Terrain découvert';
    },
  };
})();
