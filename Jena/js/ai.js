'use strict';
A.AI = (function () {
  let acc = 0;
  let flags = {};
  const R = { wait: 350, hold: 550, march: 300, attack: 900, retreat: 160 };
  const G = () => A.Game;
  const byId = (id) => G().units.find((u) => u.id === id && !u.dead);
  const corpsUnits = (cs) => G().units.filter((u) => !u.dead && u.side === 'A' && cs.includes(u.corps));
  const owner = (id) => G().objectives.find((o) => o.id === id).owner;

  function initUnit(u) {
    u.plan = (A.PLANS[u.id] || []).map((s) => ({ ...s }));
    u.pi = -1;
    u.aiMode = 'wait';
    u.aiDest = [u.x, u.y];
  }

  function init() {
    acc = 0;
    flags = {};
    for (const u of G().units) {
      if (u.side === 'A') initUnit(u);
      else initFrench(u);
    }
  }

  function setPlan(u, steps) {
    if (!u) return;
    u.plan = steps;
    u.pi = -1;
  }

  function retreatPoint(u) {
    if (u.corps === 'HZ' || (u.y < 2200 && u.x > 9000)) return [10300, 20];
    return u.y > 5600 ? [20, 5150] : [20, 4400];
  }
  function retreat(us) {
    const t = G().t;
    for (const u of us) {
      const p = retreatPoint(u);
      setPlan(u, [{ t, mode: 'retreat', x: p[0], y: p[1] }]);
    }
  }

  function triggers() {
    const g = G(), t = g.t;

    // Tauentzien, beaten in the fog, falls back on Vierzehnheiligen.
    if (!flags.tauentzien) {
      const left = corpsUnits(['T']).filter((u) => !u.routed).reduce((s, u) => s + u.men, 0);
      if (t >= 630 || (owner('clo') === 'F' && owner('lue') === 'F') || left < 3500) {
        flags.tauentzien = t;
        const posts = { tclo: [8100, 3900], tjae: [8300, 4300], tlue: [8000, 4800], tcav: [7600, 3500] };
        for (const u of corpsUnits(['T'])) {
          const p = posts[u.id] || [8000, 4300];
          setPlan(u, [{ t, mode: 'march', x: p[0], y: p[1] }, { t: t + 45, mode: 'hold', x: p[0], y: p[1] }]);
        }
        A.UI.dispatch('Maréchal Lannes', 'Tauentzien is falling back across the plateau towards Vierzehnheiligen.', 'good', { x: 9500, y: 4600 });
        A.Report.note('Tauentzien, beaten in the fog, falls back on Vierzehnheiligen.', 'good', 3, { x: 9500, y: 4600 });
      }
    }

    // Hohenlohe wakes to the danger and brings Grawert's division up in line.
    if (!flags.grawert && (t >= 555 || (flags.tauentzien && t >= flags.tauentzien + 10))) {
      flags.grawert = t;
      setPlan(byId('gr1'), [{ t, mode: 'march', x: 6700, y: 4000 }, { t: t + 55, mode: 'attack', x: 7490, y: 4392 }]);
      setPlan(byId('gr2'), [{ t: t + 10, mode: 'march', x: 6300, y: 4700 }, { t: t + 70, mode: 'attack', x: 7300, y: 4800 }]);
      setPlan(byId('grc'), [{ t: t + 15, mode: 'march', x: 6600, y: 3300 }, { t: t + 70, mode: 'attack', x: 8000, y: 3900 }]);
      setPlan(byId('hcav'), [{ t: t + 30, mode: 'march', x: 6000, y: 3200 }, { t: t + 90, mode: 'attack', x: 7800, y: 3800 }]);
      A.UI.dispatch('Espions', "Prince Hohenlohe has woken to the danger: Grawert's division is marching up from Kapellendorf in long lines, as if on parade.", 'warn', { x: 6000, y: 4100 });
      A.Report.note("Hohenlohe brings Grawert's division forward in line to retake Vierzehnheiligen.", 'warn', 4, { x: 6500, y: 4200 });
    }

    if (!flags.holtz && t >= 560) {
      const h = byId('ho1');
      if (h) {
        flags.holtz = t;
        A.UI.dispatch('Maréchal Soult', 'Holtzendorff is coming down from Rödigen against our right!', 'warn', h);
        A.Report.note("Holtzendorff's detachment comes down from Rödigen against the French right.", 'warn', 2, h);
      }
    }

    if (!flags.vier && owner('vier') === 'F' && flags.grawert && t > flags.grawert + 30) {
      flags.vier = t;
      for (const id of ['gr1', 'gr2']) {
        const u = byId(id);
        if (u && !u.routed) setPlan(u, [{ t, mode: 'attack', x: 7490, y: 4392 }]);
      }
    }

    // Holtzendorff gives up once beaten back.
    if (!flags.hzRetreat) {
      const hz = corpsUnits(['HZ']).filter((u) => !u.routed).reduce((s, u) => s + u.men, 0);
      if (t >= 800 || (flags.holtz && hz < 2400)) {
        flags.hzRetreat = t;
        retreat(corpsUnits(['HZ']));
        A.Report.note('Holtzendorff, beaten back, retreats northwards towards Apolda.', 'good', 2, { x: 10800, y: 1500 });
      }
    }

    // The general retreat of Hohenlohe's army along the Weimar road.
    const lineLost = owner('vier') === 'F' && owner('iss') === 'F';
    if (!flags.retreat && (t >= 960 || (lineLost && t >= 750))) {
      flags.retreat = t;
      retreat(corpsUnits(['T', 'GW', 'SX', 'HC']));
      A.UI.dispatch('Espions', "Hohenlohe's line is giving way. Prussians and Saxons are falling back on Kapellendorf and the Weimar road.", 'good', { x: 4500, y: 4400 });
      A.Report.note('Hohenlohe orders the retreat on Weimar.', 'good', 4, { x: 4500, y: 4400 });
    }

    if (!flags.ruchelOut && flags.retreat && t >= Math.max(960, flags.retreat + 120)) {
      flags.ruchelOut = t;
      retreat(corpsUnits(['RU']));
    }

    if (!flags.broken) {
      let eff = 0;
      for (const u of g.units) if (u.side === 'A' && !u.routed && !u.dead) eff += u.men;
      if (t > 480 && eff < g.arrived.A * 0.32) {
        flags.broken = t;
        flags.retreat = flags.retreat || t;
        retreat(g.units.filter((u) => u.side === 'A' && !u.dead));
        g.alliedBroken = t;
        A.UI.banner("L'armée prussienne est en déroute !", 'Prussians and Saxons are streaming back towards Weimar. Murat and the cavalry must pursue them until nightfall.');
        A.Report.note('The Prussian and Saxon army breaks and flees towards Weimar.', 'good', 6, { x: 4000, y: 4300 });
      }
    }
  }

  // Prussian and Saxon foot were drilled to stand in line and fire by volleys;
  // they seldom closed with the bayonet.
  function decideCharge(u, e) {
    if (u.cls === 'cav') return e.form !== 'square' || e.routed;
    if (e.cls === 'art' || e.routed) return true;
    return u.men > e.men * 1.7 || e.morale < 38 || u.fireTime > 35;
  }

  function pickTarget(u, rad) {
    let best = null, bd = rad;
    for (const e of G().units) {
      if (e.dead || e.side !== 'F' || e.cls === 'staff' || !G().vis.A.has(e.uid)) continue;
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
    const rad = R[u.aiMode] || 400;
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
      u.order = { type: 'attack', target: e, charge: prev || decideCharge(u, e) };
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

  return { init, initUnit, initFrench, update, get flags() { return flags; } };
})();
