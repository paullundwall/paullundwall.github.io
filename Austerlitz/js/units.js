'use strict';
(function () {
  const T = A.Terrain;
  const M = A.MAP;

  const FORM = {
    inf: {
      column: { speed: 70, fire: 0.35, melee: 1.15, turn: 3 },
      line: { speed: 42, fire: 1.0, melee: 0.85, turn: 1.3 },
      square: { speed: 12, fire: 0.6, melee: 0.9, turn: 8 },
    },
    cav: { column: { speed: 1, melee: 0.9, turn: 4 }, line: { speed: 0.85, melee: 1.1, turn: 2.5 } },
    art: { line: { speed: 1, turn: 2 } },
    staff: { line: { speed: 1, turn: 10 } },
  };
  A.FORM = FORM;
  A.FORM_NAMES = { column: 'Column', line: 'Line', square: 'Square' };

  let uidSeq = 1;

  class Unit {
    constructor(d) {
      this.id = d.id;
      this.uid = uidSeq++;
      this.side = d.side;
      this.nation = d.nation;
      this.corps = d.corps;
      this.name = d.name;
      this.cmd = d.cmd;
      this.type = d.type;
      this.T = A.TYPES[d.type];
      this.cls = this.T.cls;
      this.men = d.men;
      this.men0 = d.men;
      this.guns = d.guns || 0;
      this.guns0 = this.guns;
      this.x = d.x;
      this.y = d.y;
      this.facing = ((d.face || 0) * Math.PI) / 180;
      this.idleFace = null;
      this.form = d.form || (this.cls === 'inf' || this.cls === 'cav' ? 'column' : 'line');
      this.formTo = null;
      this.formT = 0;
      this.q = d.q || 1;
      this.morale = 100;
      this.routed = false;
      this.dead = false;
      this.order = null;
      this.stance = 'hold';
      this.autoForm = true;
      this.still = 10;
      this.speedNow = 0;
      this.melee = [];
      this.chargeT = 0;
      this.target = null;
      this.firing = 0;
      this.underFire = 0;
      this.fireTime = 0;
      this.losses = 0;
      this.inflicted = 0;
      this.routs = 0;
      this.firstRout = null;
      this.prisoners = 0;
      this.pendCas = 0;
      this.pendMor = 0;
      this.pendPris = 0;
      this.el = 0;
      this.updateDims();
    }
    updateDims() {
      const m = this.men;
      let w, d;
      if (this.cls === 'inf') {
        if (this.form === 'line') { w = 120 + m * 0.075; d = 55; }
        else if (this.form === 'square') { w = d = 70 + m * 0.022; }
        else { w = 60 + m * 0.03; d = 110 + m * 0.022; }
      } else if (this.cls === 'cav') {
        if (this.form === 'line') { w = 90 + m * 0.13; d = 55; }
        else { w = 60 + m * 0.03; d = 110 + m * 0.05; }
      } else if (this.cls === 'art') { w = 70 + this.guns0 * 9; d = 55; }
      else { w = 70; d = 70; }
      this.fw = w;
      this.fd = d;
      this.r = 0.3 * (w + d);
    }
    setForm(f) {
      if (this.cls === 'art' || this.cls === 'staff' || this.routed) return;
      if (this.cls === 'cav' && f === 'square') return;
      if (this.melee.length) return;
      const cur = this.formTo || this.form;
      if (cur === f) return;
      if (this.formTo && this.form === f) { this.formTo = null; this.formT = 0; return; }
      this.formTo = f;
      const drill = this.q >= 1.1 ? 0.75 : 1;
      this.formT = (this.cls === 'cav' ? 1.2 : f === 'square' || this.form === 'square' ? 1.5 : 2.6) * drill;
    }
    speed() {
      if (this.cls === 'inf') return FORM.inf[this.form].speed * (this.T.speedMul || 1);
      if (this.cls === 'cav') return this.T.speed * FORM.cav[this.form].speed;
      return this.T.speed;
    }
    turnRate() {
      const f = FORM[this.cls];
      return (f[this.form] || f.line || f.column).turn;
    }
    effGuns() {
      if (!this.guns) return 0;
      return this.guns * Math.min(1, (this.men / this.men0) * 1.3);
    }
    get frontX() { return this.x + Math.cos(this.facing) * this.fd * 0.5; }
    get frontY() { return this.y + Math.sin(this.facing) * this.fd * 0.5; }
  }
  A.Unit = Unit;

  // ---------- geometry ----------
  function corners(u, m) {
    const c = Math.cos(u.facing), s = Math.sin(u.facing);
    const hw = u.fw / 2 + m, hd = u.fd / 2 + m;
    const out = [];
    for (const [a, b] of [[1, 1], [1, -1], [-1, -1], [-1, 1]]) {
      out.push([u.x + c * hd * a - s * hw * b, u.y + s * hd * a + c * hw * b]);
    }
    return out;
  }
  function overlap(a, b, m) {
    const axes = [
      [Math.cos(a.facing), Math.sin(a.facing)], [-Math.sin(a.facing), Math.cos(a.facing)],
      [Math.cos(b.facing), Math.sin(b.facing)], [-Math.sin(b.facing), Math.cos(b.facing)],
    ];
    const ca = corners(a, m), cb = corners(b, m);
    for (const [ax, ay] of axes) {
      let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
      for (const p of ca) { const d = p[0] * ax + p[1] * ay; if (d < a0) a0 = d; if (d > a1) a1 = d; }
      for (const p of cb) { const d = p[0] * ax + p[1] * ay; if (d < b0) b0 = d; if (d > b1) b1 = d; }
      if (a1 < b0 || b1 < a0) return false;
    }
    return true;
  }
  function pointObbDist(px, py, u) {
    const c = Math.cos(u.facing), s = Math.sin(u.facing);
    const dx = px - u.x, dy = py - u.y;
    const lf = dx * c + dy * s, ll = -dx * s + dy * c;
    return Math.hypot(Math.max(0, Math.abs(lf) - u.fd / 2), Math.max(0, Math.abs(ll) - u.fw / 2));
  }
  function pointInUnit(px, py, u, m = 0) {
    const c = Math.cos(u.facing), s = Math.sin(u.facing);
    const dx = px - u.x, dy = py - u.y;
    const lf = dx * c + dy * s, ll = -dx * s + dy * c;
    return Math.abs(lf) <= u.fd / 2 + m && Math.abs(ll) <= u.fw / 2 + m;
  }
  A.Geom = { overlap, pointObbDist, pointInUnit, corners };

  const angTo = (u, t) => Math.atan2(t.y - u.y, t.x - u.x);
  function turnToward(u, ang, dt) {
    const da = A.angDiff(u.facing, ang);
    const m = u.turnRate() * dt;
    u.facing += A.clamp(da, -m, m);
  }

  // ---------- queries ----------
  function isVisible(side, e) {
    return e.side === side || A.Game.vis[side].has(e.uid);
  }
  function nearestEnemy(u, R, opt = {}) {
    let best = null, bd = R;
    for (const e of A.Game.units) {
      if (e.dead || e.side === u.side) continue;
      if (e.cls === 'staff' && !opt.staff) continue;
      if (opt.notRouted && e.routed) continue;
      if (opt.cls && e.cls !== opt.cls) continue;
      if (opt.filter && !opt.filter(e)) continue;
      if (!opt.all && !isVisible(u.side, e)) continue;
      const d = A.dist(u.x, u.y, e.x, e.y) - e.r * 0.5;
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
  function enemyNear(u, R) {
    return !!nearestEnemy(u, R, { notRouted: true, all: true });
  }
  A.Q = { isVisible, nearestEnemy, enemyNear };

  // ---------- environment ----------
  function env(t) {
    let d = 1, top = 262;
    if (t >= 500 && t < 545) { const k = (t - 500) / 45; d = 1 - k; top = 262 - 60 * k; }
    else if (t >= 545) { d = 0; top = 0; }
    const light = t < 975 ? 1 : A.lerp(1, 0.45, A.clamp((t - 975) / 45, 0, 1));
    return { fog: d, fogTop: top, light };
  }
  A.env = env;

  function canSee(u, e, E) {
    let s = u.T.sight * E.light;
    if (E.fog > 0 && (u.el < E.fogTop || e.el < E.fogTop)) s = Math.min(s, 380 + (1 - E.fog) * 1800);
    const d = A.dist(u.x, u.y, e.x, e.y);
    if (d > s) return false;
    if (d < 450) return true;
    const ea = u.el + 10, eb = e.el + 6;
    for (let i = 1; i < 8; i++) {
      const k = i / 8;
      if (T.elev(u.x + (e.x - u.x) * k, u.y + (e.y - u.y) * k) > ea + (eb - ea) * k + 6) return false;
    }
    return true;
  }

  function computeVis() {
    const G = A.Game, E = G.env;
    for (const side of ['F', 'A']) {
      const own = G.units.filter((u) => !u.dead && u.side === side);
      const set = new Set();
      for (const e of G.units) {
        if (e.dead || e.side === side) continue;
        for (const u of own) if (canSee(u, e, E)) { set.add(e.uid); break; }
      }
      G.vis[side] = set;
    }
    for (const e of G.units) {
      if (e.side === 'A' && !e.dead && G.vis.F.has(e.uid)) {
        G.lastSeen.set(e.uid, { x: e.x, y: e.y, facing: e.facing, fw: e.fw, fd: e.fd, t: G.t, u: e });
      }
    }
    for (const [k, v] of G.lastSeen) if (G.t - v.t > 20 || v.u.dead) G.lastSeen.delete(k);
  }

  // ---------- commanders ----------
  function updateCommanders(dt) {
    const G = A.Game;
    const acc = {};
    for (const u of G.units) {
      if (u.dead || u.routed || u.cls === 'staff') continue;
      const a = acc[u.corps] || (acc[u.corps] = { x: 0, y: 0, w: 0, fx: 0, fy: 0, side: u.side });
      a.x += u.x * u.men; a.y += u.y * u.men; a.w += u.men;
      a.fx += Math.cos(u.facing); a.fy += Math.sin(u.facing);
    }
    for (const k in A.CORPS) {
      if (k === 'Q') continue;
      const a = acc[k];
      if (!a) { delete G.cmdPos[k]; continue; }
      const fl = Math.hypot(a.fx, a.fy) || 1;
      const tx = a.x / a.w - (a.fx / fl) * 350, ty = a.y / a.w - (a.fy / fl) * 350;
      const c = G.cmdPos[k];
      if (!c) G.cmdPos[k] = { x: tx, y: ty };
      else { const k2 = Math.min(1, dt * 0.6); c.x += (tx - c.x) * k2; c.y += (ty - c.y) * k2; }
    }
  }
  function aura(u) {
    const G = A.Game;
    let a = 0;
    const nap = G.napoleon;
    if (u.side === 'F' && nap && !nap.dead && A.dist(u.x, u.y, nap.x, nap.y) < 1800) a += 0.9;
    const c = G.cmdPos[u.corps];
    if (c && A.dist(u.x, u.y, c.x, c.y) < 1300) a += 0.5;
    return a;
  }
  A.aura = aura;

  // ---------- automatic behaviour ----------
  function autoFormation(u) {
    if (u.melee.length || u.routed) return;
    const eCav = nearestEnemy(u, 900, { cls: 'cav', notRouted: true });
    const dCav = eCav ? A.dist(u.x, u.y, eCav.x, eCav.y) - eCav.r * 0.5 : Infinity;
    const eAny = nearestEnemy(u, 1000, { notRouted: true });
    const dAny = eAny ? A.dist(u.x, u.y, eAny.x, eAny.y) - eAny.r * 0.5 : Infinity;
    const o = u.order;
    const moveFar = o && o.type === 'move' && A.dist(u.x, u.y, o.x, o.y) > 350;
    if (u.cls === 'inf') {
      const cur = u.formTo || u.form;
      let want = cur;
      const cavThreat = eCav && (eCav.speedNow > 90 ? dCav < 650 : dCav < 420);
      if (cavThreat) want = 'square';
      else if (cur === 'square' && dCav < 750) want = 'square';
      else if (o && o.type === 'attack' && o.charge) want = 'column';
      else if (dAny < 600) want = 'line';
      else if (moveFar) want = 'column';
      else if (cur === 'square') want = dAny < 900 ? 'line' : 'column';
      u.setForm(want);
    } else if (u.cls === 'cav') {
      let want = dAny < 700 || (o && o.type === 'attack' && !o.target.dead && A.dist(u.x, u.y, o.target.x, o.target.y) < 900) ? 'line' : 'column';
      if (moveFar && dAny > 500) want = 'column';
      u.setForm(want);
    }
  }

  function autoBehave(u) {
    if (u.dead || u.routed || u.cls === 'staff') return;
    if (u.autoForm) autoFormation(u);
    if (u.side !== 'F') return;
    if (u.stance === 'engage' && u.cls !== 'art' && u.order && u.order.type === 'move' && !u.order.auto && !u.melee.length) {
      const e = nearestEnemy(u, 350, { notRouted: true, filter: (x) => x.cls === 'inf' || x.cls === 'cav' });
      if (e) {
        u.order = { type: 'attack', target: e, charge: false, auto: true };
        u.anchor = [u.x, u.y];
        return;
      }
    }
    if (u.order && !u.order.auto) { u.anchor = null; return; }
    if (!u.order && !u.anchor) u.anchor = [u.x, u.y];
    if (u.stance === 'engage' && !u.order && !u.melee.length && u.formT <= 0) {
      const [ax, ay] = u.anchor;
      const e = nearestEnemy(u, 650, {
        notRouted: u.cls !== 'cav',
        filter: (x) => A.dist(ax, ay, x.x, x.y) < 1100 && (u.cls !== 'cav' || x.form !== 'square' || x.routed),
      });
      if (e) u.order = { type: 'attack', target: e, charge: u.cls !== 'art', auto: true };
      else if (A.dist(u.x, u.y, ax, ay) > 250) u.order = { type: 'move', x: ax, y: ay, auto: true };
    }
  }

  // ---------- movement ----------
  function rallyPoint(u) {
    if (u.side === 'F') return u.y > 9500 ? [800, 10600] : u.y < 4600 ? [1600, 4300] : [1500, 6300];
    if (u.y > 9600) return [8700, 13600];
    if (u.y < 4300) return [13300, 1400];
    return [13300, 7300];
  }
  function routDir(u) {
    const [hx, hy] = rallyPoint(u);
    let vx = hx - u.x, vy = hy - u.y, l = Math.hypot(vx, vy) || 1;
    const e = nearestEnemy(u, 1500, { notRouted: true, all: true });
    if (l < 300 && (!e || A.dist(u.x, u.y, e.x, e.y) > 700)) return null;
    vx /= l; vy /= l;
    if (e) {
      const ax = u.x - e.x, ay = u.y - e.y, al = Math.hypot(ax, ay) || 1;
      vx += (ax / al) * 1.2; vy += (ay / al) * 1.2;
      l = Math.hypot(vx, vy) || 1; vx /= l; vy /= l;
    }
    return [vx, vy];
  }

  function staffMove(u, dt) {
    const e = nearestEnemy(u, 650, { notRouted: true, all: true });
    let tx = null, ty = null;
    if (e) {
      const ax = u.x - e.x, ay = u.y - e.y, l = Math.hypot(ax, ay) || 1;
      tx = u.x + (ax / l) * 400; ty = u.y + (ay / l) * 400;
      if (!u.fleeing) {
        u.fleeing = true;
        A.UI && A.UI.dispatch('Imperial escort', 'The Emperor falls back before the enemy!', 'warn', u);
        A.Report.note('Enemy troops come within musket shot of the Emperor, who is forced to fall back.', 'bad', 3, u, 'emperor');
      }
    } else {
      u.fleeing = false;
      if (u.order && u.order.type === 'move') { tx = u.order.x; ty = u.order.y; }
    }
    if (tx === null) { u.speedNow = 0; return; }
    const dx = tx - u.x, dy = ty - u.y, d = Math.hypot(dx, dy);
    if (d < 4) { if (!e) u.order = null; u.speedNow = 0; return; }
    const sp = u.speed() * T.moveFactor(u.x, u.y);
    const st = Math.min(d, sp * dt);
    u.facing = Math.atan2(dy, dx);
    u.x = A.clamp(u.x + (dx / d) * st, 20, M.W - 20);
    u.y = A.clamp(u.y + (dy / d) * st, 20, M.H - 20);
    u.speedNow = sp;
  }

  function move(u, dt) {
    u.el = T.elev(u.x, u.y);
    if (u.chargeT > 0) u.chargeT -= dt;
    u.charging = false;
    if (u.formT > 0) {
      u.formT -= dt;
      if (u.formT <= 0) { u.form = u.formTo; u.formTo = null; u.formT = 0; u.updateDims(); }
      u.speedNow = 0; u.still += dt;
      return;
    }
    if (u.cls === 'staff') return staffMove(u, dt);
    if (u.melee.length && !u.routed) {
      u.speedNow = 0; u.still += dt;
      turnToward(u, angTo(u, u.melee[0]), dt * 0.5);
      return;
    }
    let tx = null, ty = null, finalFace = null, charging = false;
    if (u.routed) {
      const d = routDir(u);
      if (d) { tx = u.x + d[0] * 500; ty = u.y + d[1] * 500; }
    } else if (u.order) {
      const o = u.order;
      if (o.type === 'move') { tx = o.x; ty = o.y; finalFace = o.face; }
      else if (o.type === 'attack') {
        const t = o.target;
        if (!t || t.dead || (t.routed && u.cls !== 'cav' && o.auto)) u.order = null;
        else if (!isVisible(u.side, t) && A.dist(u.x, u.y, t.x, t.y) > 600) u.order = null;
        else if (u.cls === 'cav' && t.form === 'square' && t.formT <= 0 && !t.routed && A.dist(u.x, u.y, t.x, t.y) < 700) {
          u.order = null;
          if (u.side === 'F') A.UI.dispatch(u.cmd, `The enemy has formed square — ${u.name} will not charge it.`, 'warn', u);
        } else {
          const d = pointObbDist(u.frontX, u.frontY, t);
          let range = 0;
          if (u.cls === 'art') range = 700;
          else if (u.cls === 'inf' && !o.charge) range = 170;
          if (range > 0 && d <= range) {
            u.speedNow = 0; u.still += dt;
            turnToward(u, angTo(u, t), dt);
            return;
          }
          tx = t.x; ty = t.y;
          charging = range === 0 && d < 350;
        }
      }
    }
    if (tx === null) {
      u.speedNow = 0; u.still += dt;
      const e = u.target && !u.target.dead ? u.target : nearestEnemy(u, 900, { notRouted: true });
      if (e && u.form !== 'square') turnToward(u, angTo(u, e), dt);
      else if (u.idleFace != null) turnToward(u, u.idleFace, dt);
      return;
    }
    const dx = tx - u.x, dy = ty - u.y, d = Math.hypot(dx, dy);
    if (d < 4) {
      if (u.order && u.order.type === 'move') { u.idleFace = finalFace; u.order = null; }
      u.speedNow = 0;
      return;
    }
    const ang = Math.atan2(dy, dx);
    if (u.form !== 'square') turnToward(u, ang, dt);
    let sp = u.speed() * T.moveFactor(u.x, u.y);
    const ahead = T.elev(u.x + (dx / d) * 30, u.y + (dy / d) * 30);
    const sl = (ahead - u.el) / 30;
    if (sl > 0) sp *= 1 - A.clamp(sl * 5, 0, 0.4);
    const diff = Math.abs(A.angDiff(u.facing, ang));
    if (u.form !== 'square' && diff > 0.8) sp *= 0.3;
    if (u.routed) sp *= u.cls === 'inf' ? 1.3 : 1.1;
    if (charging) sp *= u.cls === 'cav' ? 1.7 : 1.3;
    const st = Math.min(d, sp * dt);
    u.x += (dx / d) * st;
    u.y += (dy / d) * st;
    u.speedNow = sp;
    u.still = 0;
    u.charging = charging;
    if (u.routed && u.side === 'A' && (u.x < 40 || u.x > M.W - 40 || u.y < 40 || u.y > M.H - 40)) kill(u, 'escaped');
    u.x = A.clamp(u.x, 10, M.W - 10);
    u.y = A.clamp(u.y, 10, M.H - 10);
  }

  function separate(dt) {
    const us = A.Game.units;
    const k = Math.min(1, dt * 3);
    for (let i = 0; i < us.length; i++) {
      const a = us[i];
      if (a.dead || a.cls === 'staff') continue;
      for (let j = i + 1; j < us.length; j++) {
        const b = us[j];
        if (b.dead || b.side !== a.side || b.cls === 'staff') continue;
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
        const min = (a.r + b.r) * 0.8;
        if (d >= min || d < 0.01) continue;
        const p = (min - d) * 0.5 * k;
        const wa = a.melee.length ? 0.2 : 1, wb = b.melee.length ? 0.2 : 1;
        a.x -= (dx / d) * p * wa; a.y -= (dy / d) * p * wa;
        b.x += (dx / d) * p * wb; b.y += (dy / d) * p * wb;
      }
    }
  }

  // ---------- melee ----------
  function flank(a, b) {
    if (b.form === 'square' || b.cls === 'staff') return 1;
    const diff = Math.abs(A.angDiff(b.facing, Math.atan2(a.y - b.y, a.x - b.x)));
    return diff < 1.05 ? 1 : diff < 2.1 ? 1.5 : 2.0;
  }
  function meleePower(a, b) {
    if (a.routed) return (0.03 * a.men) / 1000;
    let p = (a.men / 1000) * a.T.melee * a.q * (0.4 + (0.6 * a.morale) / 100);
    if (a.cls === 'inf') {
      if (b.cls === 'cav') p *= a.form === 'square' ? 2.2 : a.form === 'column' ? 0.85 : 0.6;
      else p *= FORM.inf[a.form].melee;
    } else if (a.cls === 'cav') {
      if (b.cls === 'inf') p *= b.form === 'square' ? 0.25 : b.form === 'line' ? 1.4 : 1.15;
      else p *= FORM.cav[a.form].melee;
    }
    if (a.chargeT > 0) p *= a.cls === 'cav' ? 2.0 : 1.4;
    p *= flank(a, b);
    p *= T.meleeDef(a.x, a.y);
    if (a.el - b.el > 12) p *= 1.15;
    if (a.formT > 0) p *= 0.6;
    return p;
  }
  A.meleePower = meleePower;

  function startMelee(a, b) {
    a.melee.push(b);
    b.melee.push(a);
    for (const [x, y] of [[a, b], [b, a]]) {
      if (x.speedNow > 25 && !x.routed) {
        x.chargeT = 2;
        const ratio = A.clamp(meleePower(x, y) / Math.max(0.05, meleePower(y, x)), 0.3, 3);
        let shock = 7 * ratio;
        if (y.form === 'square' && x.cls === 'cav') shock *= 0.25;
        y.pendMor += shock / y.T.morale;
        if (x.cls === 'cav') A.FX.dust(y.x, y.y, 8);
      }
    }
  }

  function meleePhase(dt) {
    const G = A.Game, us = G.units;
    for (const u of us) {
      u.mFoe = 0;
      if (u.melee.length) u.melee = u.melee.filter((o) => !o.dead && overlap(u, o, 30));
    }
    for (let i = 0; i < us.length; i++) {
      const a = us[i];
      if (a.dead) continue;
      for (let j = i + 1; j < us.length; j++) {
        const b = us[j];
        if (b.dead || b.side === a.side) continue;
        const reach = (Math.max(a.fw, a.fd) + Math.max(b.fw, b.fd)) * 0.75 + 20;
        if (Math.abs(a.x - b.x) > reach || Math.abs(a.y - b.y) > reach) continue;
        if (a.cls === 'staff' || b.cls === 'staff') {
          const s = a.cls === 'staff' ? a : b, o = s === a ? b : a;
          if (!o.routed && overlap(s, o, 0)) G.captureEmperor(s);
          continue;
        }
        if (a.routed && b.routed) continue;
        if (!a.melee.includes(b)) {
          if (overlap(a, b, 8)) startMelee(a, b);
          else continue;
        }
        let pa = meleePower(a, b) / a.melee.length, pb = meleePower(b, a) / b.melee.length;
        const casB = 4.5 * pa * dt * (b.routed ? 2.5 : 1), casA = 4.5 * pb * dt * (a.routed ? 2.5 : 1);
        b.pendCas += casB; a.pendCas += casA;
        a.inflicted += casB; b.inflicted += casA;
        if (b.routed) b.pendPris += casB * 0.7;
        if (a.routed) a.pendPris += casA * 0.7;
        a.mFoe += pb; b.mFoe += pa;
        if (Math.random() < dt * 4) A.FX.melee((a.x + b.x) / 2, (a.y + b.y) / 2);
      }
    }
    for (const u of us) {
      if (u.dead || u.routed || !u.mFoe) continue;
      const odds = u.mFoe / Math.max(0.01, meleePower(u, u.melee[0] || u));
      u.pendMor += ((2 + 4 * A.clamp(odds - 1, 0, 1.5)) * dt) / u.T.morale;
    }
  }

  // ---------- fire ----------
  let iceWarned = false;
  function firePhase(dt) {
    const G = A.Game;
    for (const u of G.units) {
      u.firing = 0;
      if (u.dead || u.routed || u.melee.length || u.cls === 'cav' || u.cls === 'staff') continue;
      const gunR = u.cls === 'art' ? 950 : 700;
      const gunsReady = u.guns > 0 && u.still >= 1.5;
      const maxR = gunsReady ? gunR : u.cls === 'inf' ? 200 : 0;
      if (!maxR) continue;
      let t = null, td = Infinity;
      const o = u.order;
      if (o && o.type === 'attack' && o.target && !o.target.dead && isVisible(u.side, o.target)) {
        const d = pointObbDist(u.frontX, u.frontY, o.target);
        if (d <= maxR) { t = o.target; td = d; }
      }
      if (!t) {
        let best = Infinity;
        for (const e of G.units) {
          if (e.dead || e.side === u.side || e.cls === 'staff' || !isVisible(u.side, e)) continue;
          if (Math.abs(e.x - u.x) > maxR + 600 || Math.abs(e.y - u.y) > maxR + 600) continue;
          const d = pointObbDist(u.frontX, u.frontY, e);
          if (d > maxR) continue;
          const score = d + (e.routed ? 300 : 0);
          if (score < best) { best = score; t = e; td = d; }
        }
      }
      u.target = t;
      if (!t) { u.fireTime = 0; continue; }
      const diff = Math.abs(A.angDiff(u.facing, angTo(u, t)));
      const arc = u.form === 'square' ? 1 : diff < 0.9 ? 1 : diff < 1.7 ? 0.45 : 0.12;
      const mor = 0.5 + (0.5 * u.morale) / 100;
      let musk = 0, gun = 0;
      if (u.cls === 'inf' && td <= 200) {
        musk = (u.men / 1000) * 1.4 * u.T.fire * FORM.inf[u.form].fire * (1.15 - td / 400);
        if (u.speedNow > 0) musk *= 0.3;
      }
      if (gunsReady && td <= gunR) gun = u.effGuns() * (td < 350 ? 0.65 : 0.28 * (1.2 - (td / gunR) * 0.7));
      if (!musk && !gun) continue;
      const elevB = u.el - t.el > 12 ? 1.15 : 1;
      const cover = T.cover(t.x, t.y);
      let vG = t.cls === 'inf' ? (t.form === 'column' ? 1.3 : t.form === 'square' ? 1.7 : 1.0) : t.cls === 'cav' ? 1.2 : 0.6;
      const vM = t.cls === 'cav' ? 1.1 : t.cls === 'art' ? 0.8 : 1.0;
      if (gun && T.onIce(t.x, t.y)) {
        vG *= 2.5;
        if (!iceWarned && t.side === 'A') { iceWarned = true; A.UI.dispatch('Artillerie de la Garde', 'Our roundshot is breaking the ice under the fugitives on the ponds!', 'good', t); }
      }
      const k = arc * mor * u.q * A.NATIONS[u.nation].fire * elevB * cover * (u.formT > 0 ? 0.3 : 1);
      const cas = (musk * vM + gun * vG) * k * dt;
      t.pendCas += cas;
      u.inflicted += cas;
      t.pendMor += ((gun ? 0.5 : 0) + (musk ? 0.4 : 0)) * dt * arc / t.T.morale;
      t.underFire = 0.6;
      u.firing = (musk ? 1 : 0) | (gun ? 2 : 0);
      u.fireTime += dt;
      A.FX.fire(u, t, musk > 0, gun > 0, dt);
    }
  }

  // ---------- damage, morale, rout ----------
  function rout(u) {
    const G = A.Game;
    u.routed = true;
    u.routs++;
    if (u.firstRout == null) {
      u.firstRout = G.t;
      if (u.men0 >= 3000 || u.type === 'guard' || u.type === 'guardcav') {
        const elite = u.type === 'guard' || u.type === 'guardcav';
        A.Report.note(`${u.name} (${u.cmd}) is routed.`, u.side === 'F' ? 'bad' : 'good', elite ? 4 : 2, u);
      }
    }
    u.order = null;
    u.formTo = null;
    u.formT = 0;
    if (u.cls === 'inf') u.form = 'column';
    u.updateDims();
    if (u.guns) {
      const lost = Math.round(u.guns * 0.35);
      u.guns -= lost;
      G.stats.guns[u.side] += lost;
    }
    for (const o of G.units) {
      if (o !== u && !o.dead && o.side === u.side && !o.routed && A.dist(o.x, o.y, u.x, u.y) < 600) o.morale -= 4 / o.T.morale;
    }
    if (u.side === 'F') A.UI.dispatch(u.cmd, `${u.name} has broken and is fleeing!`, 'bad', u);
    else if (isVisible('F', u)) A.UI.dispatch('Aide de camp', `The enemy gives way: ${u.name} (${u.cmd}) is routed.`, 'good', u);
  }
  function rally(u) {
    u.routed = false;
    u.morale = Math.max(u.morale, 45);
    u.order = null;
    if (u.side === 'F') A.UI.dispatch(u.cmd, `${u.name} has rallied.`, 'info', u);
  }
  function kill(u, why) {
    const G = A.Game;
    if (u.dead) return;
    u.dead = true;
    if (u.guns && why !== 'escaped') G.stats.guns[u.side] += u.guns;
    if (why !== 'escaped') {
      G.stats.pris[u.side] += u.men * 0.35; G.stats.loss[u.side] += u.men * 0.5;
      A.Report.loss(u.side, u.men * 0.5);
      if (u.men0 >= 2500) A.Report.note(`${u.name} (${u.cmd}) is destroyed as a fighting force.`, u.side === 'F' ? 'bad' : 'good', 3, u);
    }
    else G.stats.escaped[u.side] += u.men;
    for (const o of G.units) if (o.melee.length) o.melee = o.melee.filter((m) => m !== u);
    if (u.side === 'F') A.UI.dispatch(u.cmd, `${u.name} has ceased to exist as a fighting force.`, 'bad', u);
    else if (why !== 'escaped') A.UI.dispatch('Aide de camp', `${u.name} has been destroyed or captured!`, 'good', u);
    if (A.UI.onUnitDead) A.UI.onUnitDead(u);
  }
  A.kill = kill;

  function applyDamage(dt) {
    const G = A.Game;
    for (const u of G.units) {
      if (u.dead) continue;
      if (u.pendCas > 0) {
        const c = Math.min(u.pendCas, u.men);
        u.men -= c;
        u.losses += c;
        G.stats.loss[u.side] += c;
        A.Report.loss(u.side, c);
        const pr = Math.min(u.pendPris, c);
        u.prisoners += pr;
        G.stats.pris[u.side] += pr;
        u.pendMor += ((c / Math.max(u.men + c, 1)) * 260) / (u.T.morale * Math.sqrt(u.q));
      }
      let regen = 0;
      if (u.routed) regen = enemyNear(u, 700) ? 0.15 : 1.0 + aura(u);
      else if (!u.melee.length && u.underFire <= 0) regen = 0.35 + aura(u);
      u.morale = A.clamp(u.morale - u.pendMor / A.NATIONS[u.nation].morale + regen * dt, 0, 100);
      u.underFire = Math.max(0, u.underFire - dt);
      u.pendCas = u.pendMor = u.pendPris = 0;
      if (u.cls === 'staff') { u.morale = 100; continue; }
      if (!u.routed && u.morale < 20) rout(u);
      else if (u.routed && u.morale >= 42 && !enemyNear(u, 800)) rally(u);
      if (u.men < 180 || (u.routed && u.men < u.men0 * 0.15)) kill(u, 'dispersed');
    }
  }

  // ---------- objectives ----------
  function objectives() {
    const G = A.Game;
    for (const o of G.objectives) {
      let f = 0, a = 0, aInf = 0, m = 0;
      for (const u of G.units) {
        if (u.dead || u.routed || u.cls === 'staff') continue;
        if (A.dist(u.x, u.y, o.x, o.y) < o.r + u.r * 0.5) {
          if (u.side === 'F') { f += u.men; if (A.controls(u)) m += u.men; }
          else { a += u.men; if (u.cls === 'inf') aInf += u.men; }
        }
      }
      o.contested = f > 0 && a > 0;
      if (o.owner === 'F' && m >= 300) o.mine = true;
      const takeA = o.hq ? a >= 3000 && aInf >= 1500 : a >= 300;
      const now = f >= 300 && !a ? 'F' : takeA && !f ? 'A' : o.owner;
      if (now !== o.owner) {
        o.owner = now;
        o.mine = now === 'F' && m >= 300;
        o.since = G.t;
        const w = o.pts + (o.plateau || o.hq ? 1 : 0);
        if (now === 'F' && o.plateau && !G.firstPlateau) G.firstPlateau = { t: G.t, name: o.name };
        A.Report.note(now === 'F' ? `French troops take ${o.name}.` : `${o.name} falls to the Allies.`, now === 'F' ? 'good' : 'bad', w, o, 'obj:' + o.id);
        if (now === 'F') A.UI.dispatch('Quartier général', `Our troops are masters of ${o.name}.`, 'good', o);
        else A.UI.dispatch('Quartier général', `The enemy has taken ${o.name}!`, 'bad', o);
      }
    }
  }

  // ---------- main step ----------
  A.Sim = {
    computeVis,
    step(dt) {
      const G = A.Game;
      G.t += dt;
      G.env = env(G.t);
      for (const u of G.units) if (!u.dead) u.el = T.elev(u.x, u.y);
      G.visAcc += dt;
      if (G.visAcc >= 0.5) {
        G.visAcc = 0;
        computeVis();
        updateCommanders(0.5);
        objectives();
      }
      A.AI.update(dt);
      G.autoAcc += dt;
      if (G.autoAcc >= 0.5) { G.autoAcc = 0; for (const u of G.units) autoBehave(u); }
      for (const u of G.units) if (!u.dead) u.updateDims();
      for (const u of G.units) if (!u.dead) move(u, dt);
      separate(dt);
      meleePhase(dt);
      firePhase(dt);
      applyDamage(dt);
      if (G.units.some((u) => u.dead)) G.units = G.units.filter((u) => !u.dead);
    },
  };
})();
