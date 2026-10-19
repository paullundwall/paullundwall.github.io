'use strict';
A.AI = (function () {
  const T = A.Terrain;
  let acc = 0;
  let flags = {};
  const SOUTH = ['AG', 'C1', 'C2', 'C3'];
  const R = { wait: 350, hold: 550, march: 300, attack: 900, seek: 1600, retreat: 160 };
  const G = () => A.Game;
  const byId = (id) => G().units.find((u) => u.id === id && !u.dead);
  const corpsUnits = (cs) => G().units.filter((u) => !u.dead && u.side === 'A' && cs.includes(u.corps));

  function init() {
    acc = 0;
    flags = {};
    for (const u of G().units) {
      if (u.side !== 'A') continue;
      u.plan = (A.PLANS[u.id] || []).map((s) => ({ ...s }));
      u.pi = -1;
      u.aiMode = 'wait';
      u.aiDest = [u.x, u.y];
    }
    for (const u of G().units) if (u.side === 'F') initFrench(u);
  }

  function setPlan(u, steps) {
    if (!u) return;
    u.plan = steps;
    u.pi = -1;
  }

  function frenchOnPlateau() {
    let best = null, bm = 0;
    for (const u of G().units) {
      if (u.dead || u.side !== 'F' || u.routed || u.cls === 'staff') continue;
      if (!G().vis.A.has(u.uid) || !T.inPlateau(u.x, u.y)) continue;
      if (u.men > bm) { bm = u.men; best = u; }
    }
    return best;
  }

  function retreatPoint(u) {
    if (u.y > 9600) return u.x < 4800 ? [4300, 14480] : [9500, 14480];
    if (u.y < 4300) return [14580, 1200];
    return [14580, 7000];
  }

  function triggers() {
    const g = G(), t = g.t;
    if (!flags.threat && t >= 470) {
      const th = frenchOnPlateau();
      if (th) {
        flags.threat = t;
        A.UI.dispatch('Espions', 'Kutuzov has seen our columns on the Pratzen plateau! The Fourth Column is turning about to face us.', 'warn', th);
        A.Report.note('Kutuzov spots French columns on the Pratzen and turns the Fourth Column about to meet them.', 'warn', 4, th);
        for (const id of ['c4m', 'c4j', 'c4r']) setPlan(byId(id), [{ t, mode: 'seek', x: th.x, y: th.y }]);
        const kam = byId('c2k');
        if (kam && kam.x > 4300) setPlan(kam, [{ t: t + 10, mode: 'seek', x: 6100, y: 9500 }]);
        setPlan(byId('rg1'), [{ t: t + 25, mode: 'attack', x: 7600, y: 6700 }]);
        setPlan(byId('rg2'), [{ t: t + 35, mode: 'attack', x: 7200, y: 7300 }]);
        setPlan(byId('rga'), [{ t: t + 25, mode: 'march', x: 8200, y: 6300 }, { t: t + 60, mode: 'hold', x: 8000, y: 6500 }]);
        setPlan(byId('rgc'), [{ t: t + 20, mode: 'march', x: 8600, y: 6100 }, { t: Math.max(t + 150, 750), mode: 'attack', x: 7000, y: 7200, charge: true }]);
      }
    }
    if (!flags.guardCharge) {
      const c = byId('rgc');
      if (c && c.aiMode === 'attack' && c.order && c.order.type === 'attack') {
        flags.guardCharge = t;
        A.UI.banner('La Garde russe charge !', 'The Chevalier Guard of Grand Duke Constantine falls upon our battalions. — “Rapp, take the Guard cavalry and charge!”');
        A.UI.dispatch("L'Empereur", 'The Russian Guard cavalry is charging. Bessières and Rapp must throw in the Guard cavalry!', 'warn', c);
        A.Report.note("Grand Duke Constantine's Chevalier Guard charges the French line.", 'warn', 4, c);
      }
    }
    const plateauFr = ['pratze', 'pratzeberg'].every((id) => g.objectives.find((o) => o.id === id).owner === 'F');
    if (!flags.south && (t >= 900 || (flags.threat && plateauFr && t >= flags.threat + 300))) {
      flags.south = t;
      for (const u of corpsUnits(['AG', 'C1', 'C2', 'C3'])) {
        const p = retreatPoint(u);
        setPlan(u, [{ t, mode: 'retreat', x: p[0], y: p[1] }]);
      }
      A.UI.dispatch('Espions', 'Buxhöwden at last orders the Allied left wing to retreat by Aujezd and across the ponds.', 'good', { x: 4500, y: 12500 });
      A.Report.note('Buxhöwden orders the Allied left wing to retreat by Aujezd and across the ponds.', 'good', 3, { x: 4500, y: 12500 });
    }
    if (!flags.bag && t >= 930) {
      flags.bag = t;
      for (const u of corpsUnits(['AB'])) setPlan(u, [{ t, mode: 'retreat', x: 14580, y: 1200 }]);
      A.UI.dispatch('Maréchal Lannes', 'Bagration is breaking off and withdrawing along the Olmütz road.', 'info', { x: 9000, y: 2500 });
      A.Report.note('Bagration breaks off and withdraws along the Olmütz road.', 'info', 2, { x: 9000, y: 2500 });
    }
    if (!flags.broken) {
      let eff = 0;
      for (const u of g.units) if (u.side === 'A' && !u.routed && !u.dead) eff += u.men;
      if (eff < g.initialMen.A * 0.32) {
        flags.broken = t;
        for (const u of g.units) {
          if (u.side !== 'A' || u.dead) continue;
          const p = retreatPoint(u);
          setPlan(u, [{ t, mode: 'retreat', x: p[0], y: p[1] }]);
        }
        g.alliedBroken = t;
        A.UI.banner("L'armée coalisée est en déroute !", 'Russians and Austrians are fleeing towards Austerlitz and across the frozen ponds. Pursue them until nightfall.');
        A.Report.note('The Allied army breaks and flees towards Austerlitz and across the frozen ponds.', 'good', 6, { x: 8500, y: 9000 });
      }
    }
  }

  function decideCharge(u, e, sluggish) {
    if (u.cls === 'cav') return e.form !== 'square' || e.routed;
    if (e.cls === 'art' || e.routed) return true;
    if (sluggish) return u.men > e.men * 1.6 || e.morale < 40 || u.fireTime > 30;
    return u.men > e.men * 1.4 || e.morale < 45 || u.fireTime > 20;
  }

  const CENTRE = ['C4', 'C5', 'RG'];
  const LEASH_X = 3900;

  function pickTarget(u, rad) {
    let best = null, bd = rad;
    const leash = CENTRE.includes(u.corps);
    for (const e of G().units) {
      if (e.dead || e.side !== 'F' || e.cls === 'staff' || !G().vis.A.has(e.uid)) continue;
      if (leash && e.x < LEASH_X - 200) continue;
      if (u.cls === 'cav' && e.form === 'square' && !e.routed) continue;
      let d = A.dist(u.x, u.y, e.x, e.y) - e.r * 0.5;
      if (e.routed) d += u.cls === 'cav' ? -100 : 400;
      if (u.cls === 'cav' && e.cls === 'art') d -= 150;
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  function think(u) {
    const t = G().t;
    while (u.pi + 1 < u.plan.length && t >= u.plan[u.pi + 1].t) {
      u.pi++;
      const s = u.plan[u.pi];
      u.aiMode = s.mode;
      u.aiDest = [s.x, s.y];
    }
    if (u.aiMode === 'seek') {
      let best = null, bd = 3500;
      for (const e of G().units) {
        if (e.dead || e.side !== 'F' || e.routed || e.cls === 'staff' || e.x < LEASH_X || !G().vis.A.has(e.uid)) continue;
        const d = A.dist(u.x, u.y, e.x, e.y) * (T.inPlateau(e.x, e.y) ? 0.6 : 1);
        if (d < bd) { bd = d; best = e; }
      }
      if (best) u.aiDest = [best.x, best.y];
    }
    const sluggish = SOUTH.includes(u.corps) && !flags.south;
    let rad = R[u.aiMode] || 400;
    if (sluggish && u.aiMode === 'attack') rad = 750;
    if (CENTRE.includes(u.corps) && u.aiDest && u.aiDest[0] < LEASH_X) u.aiDest = [LEASH_X + 300, u.aiDest[1]];
    const dest = u.aiDest;
    if (u.aiMode === 'retreat' && dest && A.dist(u.x, u.y, dest[0], dest[1]) < 150) {
      A.kill(u, 'escaped');
      return;
    }
    if (u.cls === 'art') {
      const threat = A.Q.nearestEnemy(u, 650, { notRouted: true });
      if (dest && A.dist(u.x, u.y, dest[0], dest[1]) > 80 && (!threat || u.aiMode === 'retreat')) u.order = { type: 'move', x: dest[0], y: dest[1] };
      else u.order = null;
      return;
    }
    const e = pickTarget(u, rad);
    if (e && !(u.aiMode === 'retreat' && A.dist(u.x, u.y, e.x, e.y) > 200)) {
      const prev = u.order && u.order.type === 'attack' && u.order.target === e ? u.order.charge : false;
      u.order = { type: 'attack', target: e, charge: prev || decideCharge(u, e, sluggish) };
    } else if (dest && A.dist(u.x, u.y, dest[0], dest[1]) > 120) {
      u.order = { type: 'move', x: dest[0], y: dest[1], face: null };
    } else {
      u.order = null;
    }
  }

  // French corps not under the player's command follow the historical plan,
  // fighting whatever comes near their route or their post.
  const FR = { hold: 600, march: 250, attack: 900 };
  function initFrench(u) {
    const plan = A.FPLANS && A.FPLANS[u.id];
    if (!plan || A.controls(u)) return;
    u.aiF = true;
    u.q *= A.FRENCH_AI_Q || 1;
    u.plan = plan.map((s) => ({ ...s }));
    u.pi = -1;
    u.stance = 'engage';
  }
  function pickFoe(u, rad, anchor) {
    let best = null, bd = rad;
    for (const e of G().units) {
      if (e.dead || e.side !== 'A' || !G().vis.F.has(e.uid)) continue;
      if (u.cls === 'cav' && e.cls === 'inf' && !e.routed && (e.form === 'square' || (e.morale >= 50 && !e.melee.length))) continue;
      if (anchor && A.dist(anchor[0], anchor[1], e.x, e.y) > rad + 250) continue;
      let d = A.dist(u.x, u.y, e.x, e.y) - e.r * 0.5;
      if (e.routed) d += u.cls === 'cav' ? -100 : 600;
      if (u.cls === 'cav' && e.cls === 'art') d -= 150;
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
  function thinkF(u) {
    const t = G().t;
    while (u.pi + 1 < u.plan.length && t >= u.plan[u.pi + 1].t) {
      u.pi++;
      u.aiMode = u.plan[u.pi].mode;
      u.aiDest = [u.plan[u.pi].x, u.plan[u.pi].y];
    }
    if (u.pi < 0) return;
    const dest = u.aiDest;
    if (u.cls === 'staff') return;
    if (u.cls === 'art') {
      const threat = A.Q.nearestEnemy(u, 700, { notRouted: true });
      if (A.dist(u.x, u.y, dest[0], dest[1]) > 80 && !threat) u.order = { type: 'move', x: dest[0], y: dest[1] };
      else if (u.order && u.order.type === 'move') u.order = null;
      return;
    }
    if (u.aiMode === 'hold' && !u.melee.length && (u.morale < 45 || u.men < u.men0 * 0.5)) {
      const near = A.Q.nearestEnemy(u, 700, { notRouted: true });
      if (near) {
        const ax = u.x - near.x, ay = u.y - near.y, l = Math.hypot(ax, ay) || 1;
        u.aiDest = [A.clamp(u.x + (ax / l) * 500, 100, A.MAP.W - 100), A.clamp(u.y + (ay / l) * 500, 100, A.MAP.H - 100)];
        u.order = { type: 'move', x: u.aiDest[0], y: u.aiDest[1], face: Math.atan2(-ay, -ax) };
        return;
      }
    }
    const e = pickFoe(u, FR[u.aiMode] || 400, u.aiMode === 'hold' ? dest : null);
    if (e) {
      const prev = u.order && u.order.type === 'attack' && u.order.target === e ? u.order.charge : false;
      const charge = u.cls === 'cav' || e.cls === 'art' || e.routed
        || (u.aiMode === 'hold' ? e.morale < 35 : u.men > e.men * 1.4 || e.morale < 45 || u.fireTime > 20);
      u.order = { type: 'attack', target: e, charge: prev || charge };
    } else if (A.dist(u.x, u.y, dest[0], dest[1]) > 120) {
      u.order = { type: 'move', x: dest[0], y: dest[1], face: null };
    } else if (u.order && u.order.type !== 'attack') u.order = null;
  }

  function update(dt) {
    acc += dt;
    if (acc < 1) return;
    acc = 0;
    triggers();
    for (const u of G().units) {
      if (u.dead || u.routed) continue;
      if (u.side === 'A') think(u);
      else if (u.aiF) thinkF(u);
    }
  }

  return { init, initFrench, update, get flags() { return flags; } };
})();
