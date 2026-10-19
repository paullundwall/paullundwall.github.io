'use strict';
(function () {
  const STEP = 0.1;
  // Battle minutes per real second at 1×.
  const TIME_SCALE = 1 / 3;
  let acc = 0, last = 0, started = false;
  const UI = A.UI, R = A.Render;

  A.Player = A.COMMANDERS[0];
  A.controls = (u) => {
    const P = A.Player;
    if (u.side !== 'F') return false;
    if (!P.corps && !P.units) return true;
    return (P.corps || []).includes(u.corps) || (P.units || []).includes(u.id);
  };

  const EVENTS = [
    {
      t: 360,
      fn: () => {
        UI.dispatch("L'Empereur", 'Lannes is to advance in the fog and clear Closewitz, Cospeda and Lützeroda, so that the army has room to deploy off the Landgrafenberg. Augereau climbs from the Mühltal on our left; Soult is coming up on the right.', 'info', { x: 12350, y: 6400 });
      },
    },
    { t: 364, fn: () => UI.dispatch('Général Suchet', 'The fog is so thick we cannot see ten paces. The 17e Léger is feeling its way towards Closewitz.', 'warn', { x: 11700, y: 4900 }) },
    { t: 366, fn: () => A.Report.note('Lannes advances off the Landgrafenberg in dense fog.', 'info', 2, { x: 11800, y: 5300 }) },
    { t: 470, fn: () => UI.dispatch('Maréchal Augereau', 'Desjardin is climbing out of the Mühltal by the Schnecke. Heudelet follows. There are Saxons on the heights.', 'info', { x: 9600, y: 6900 }) },
    {
      t: 545,
      fn: () => {
        UI.banner('Le brouillard se lève', 'The sun begins to burn through. On the open plateau the white-coated Saxons and the long Prussian lines appear.');
        A.Report.note('The fog begins to lift from the plateau.', 'info', 1);
      },
    },
    { t: 600, fn: () => UI.dispatch("L'Empereur", 'Hold Vierzehnheiligen and wait for Soult, Ney and Murat. When they are up, the whole line will advance.', 'info', { x: 7490, y: 4392 }) },
    { t: 720, fn: () => UI.dispatch('Aide de camp', 'Noon. Report the state of the line to His Majesty.', 'info') },
    {
      t: 780,
      fn: () => {
        UI.banner('En avant !', 'One o’clock: the Emperor orders the general advance along the whole line.');
        A.Report.note('The Emperor orders the general advance.', 'info', 2, { x: 9000, y: 4800 });
      },
    },
    { t: 828, fn: () => UI.dispatch('Espions', "A strong column is coming along the Weimar road towards Kapellendorf — General Rüchel's corps, 15,000 men.", 'warn', { x: 1500, y: 4300 }) },
    { t: 960, fn: () => UI.dispatch('Aide de camp', 'The light is failing. Whatever we hold at five o\'clock will decide the day.', 'warn') },
  ];

  function sumMen(side) {
    let s = 0;
    for (const u of A.Game.units) if (u.side === side && !u.dead) s += u.men;
    return s;
  }

  function newGame() {
    const G = (A.Game = {
      t: A.T_START,
      units: [],
      vis: { F: new Set(), A: new Set() },
      lastSeen: new Map(),
      cmdPos: {},
      stats: { loss: { F: 0, A: 0 }, pris: { F: 0, A: 0 }, guns: { F: 0, A: 0 }, escaped: { F: 0, A: 0 } },
      objectives: A.OBJECTIVES.map((o) => ({ ...o })),
      visAcc: 1,
      autoAcc: 0,
      env: A.env(A.T_START),
      speed: 1,
      prevSpeed: 1,
      over: false,
      ri: 0,
      ei: 0,
      hqT: null,
    });
    for (const d of A.OOB) G.units.push(new A.Unit(d));
    G.napoleon = G.units.find((u) => u.id === 'nap');
    G.arrived = { F: sumMen('F'), A: sumMen('A') };
    G.captureEmperor = () => endGame('captured');
    for (const u of G.units) u.el = A.Terrain.elev(u.x, u.y);
    A.Report.init(G);
    A.AI.init();
    A.Sim.computeVis();
  }

  function events() {
    const G = A.Game;
    while (G.ei < EVENTS.length && G.t >= EVENTS[G.ei].t) EVENTS[G.ei++].fn();
    while (G.ri < A.REINFORCEMENTS.length && G.t >= A.REINFORCEMENTS[G.ri].t) {
      const r = A.REINFORCEMENTS[G.ri++];
      const u = new A.Unit(r.u);
      u.el = A.Terrain.elev(u.x, u.y);
      G.units.push(u);
      G.roster.push(u);
      G.arrived[u.side] += u.men;
      if (r.banner) UI.banner(r.banner[0], r.banner[1]);
      if (r.note) A.Report.note(r.note, u.side === 'F' ? 'good' : 'warn', 3, r.dest ? { x: r.dest[0], y: r.dest[1] } : u, r.key || 'arr:' + u.corps);
      if (u.side === 'F') {
        u.order = { type: 'move', x: r.dest[0], y: r.dest[1], face: Math.PI };
        UI.dispatch(r.from, `${u.name} (${u.cmd}) ${r.text}`, 'good', u);
        A.AI.initFrench(u);
        UI.buildOOB();
      } else A.AI.initUnit(u);
    }
    if (!G.over) {
      const z = G.objectives.find((o) => o.id === 'landgraf');
      if (z.owner === 'A') {
        if (G.hqT == null) {
          G.hqT = G.t;
          UI.banner('Le Landgrafenberg est perdu !', 'Retake the heights within fifteen minutes or the army will be thrown back into Jena.');
          A.Report.note("The Prussians storm the Landgrafenberg, the Emperor's command post.", 'bad', 5, z, 'obj:landgraf');
        }
        else if (G.t - G.hqT >= 15) endGame('hq');
      } else G.hqT = null;
      let eff = 0;
      for (const u of G.units) if (u.side === 'F' && !u.routed && !u.dead) eff += u.men;
      if (G.t > 480 && eff < G.arrived.F * 0.45) endGame('broken');
      if (G.t >= A.T_END) endGame('time');
    }
    A.Report.sample(G);
  }

  A.setSpeed = (s) => {
    const G = A.Game;
    if (!G) return;
    if (s > 0) G.prevSpeed = s;
    G.speed = s;
    UI.setSpeedButtons(s);
    document.body.classList.toggle('paused', s === 0);
  };

  function assess(reason) {
    const G = A.Game;
    let pts = 0, tot = 0;
    for (const o of G.objectives) { tot += o.pts; if (o.owner === 'F') pts += o.pts; }
    const keys = G.objectives.filter((o) => o.key && o.owner === 'F').length;
    const lf = G.stats.loss.F, la = G.stats.loss.A;
    const ratio = la / Math.max(1, lf);
    let r;
    if (reason === 'captured') r = ['DISASTER', 'The Emperor is taken', 'Prussian horsemen have overrun the imperial escort. The Grande Armée is leaderless and the campaign of 1806 ends in catastrophe.'];
    else if (reason === 'hq') r = ['DEFEAT', 'The Landgrafenberg has fallen', 'With the heights in Prussian hands the army is thrown back into Jena and the Saale valley. The road to Berlin is closed.'];
    else if (reason === 'broken') r = ['DEFEAT', 'The army is broken', 'Too many battalions have fled the field. The army of Frederick the Great has had its revenge.'];
    else if (keys === 3 && G.alliedBroken && ratio >= 2 && pts >= 20) r = ['DECISIVE VICTORY', 'The army of Frederick is no more', 'Hohenlohe’s army and Rüchel’s corps are routed and the cavalry is sabring the fugitives on the Weimar road. Prussia lies open; the road to Berlin is clear.'];
    else if (keys >= 2 && pts >= 15 && ratio >= 1.3) r = ['VICTORY', 'The plateau is ours', 'Hohenlohe has been driven from the field, though part of his army escaped towards Weimar in good order.'];
    else if (keys >= 1 && pts >= 10 && ratio >= 1) r = ['NARROW VICTORY', 'A hard-won field', 'The French have broken out of the Landgrafenberg, but the Prussian army is beaten rather than destroyed.'];
    else if (pts >= 7) r = ['INDECISIVE BATTLE', 'Neither side prevails', 'Night falls on the plateau with both armies still in the field. The campaign will go on.'];
    else r = ['DEFEAT', 'Prussia triumphs', 'The Grande Armée has been held on the edge of the plateau. Napoleon must fall back across the Saale.'];
    return { r, pts, tot, keys, lf, la, ratio };
  }

  const cmdLabel = (c) => (c.id === 'nap' ? "L'Empereur" : c.name.replace('Maréchal ', ''));
  function buildPicker() {
    const list = document.getElementById('t-cmd-list');
    const pick = (c) => {
      A.Player = c;
      list.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.id === c.id));
      document.getElementById('t-objs').innerHTML = c.objectives.map((o) => `<li>${o}</li>`).join('');
      document.getElementById('t-cmd-sub').textContent = c.id === 'nap' ? 'You command the whole army.' : `You are ${c.name}: ${c.sub}. The rest of the army follows the Emperor's plan.`;
    };
    list.innerHTML = A.COMMANDERS.map((c) => `<button data-id="${c.id}"><b>${cmdLabel(c)}</b><i>${c.id === 'nap' ? 'Napoléon' : c.sub.split(' — ')[0]}</i></button>`).join('');
    list.querySelectorAll('button').forEach((b) => (b.onclick = () => pick(A.COMMANDERS.find((c) => c.id === b.dataset.id))));
    pick(A.COMMANDERS[0]);
  }

  function commandReport(G) {
    const P = A.Player;
    if (!P.targets) return '';
    const mine = G.roster.filter((u) => A.controls(u) && u.cls !== 'staff');
    const inflicted = mine.reduce((s, u) => s + u.inflicted, 0);
    const lost = mine.reduce((s, u) => s + u.losses, 0);
    const objs = P.targets.map((id) => G.objectives.find((o) => o.id === id));
    const got = (o) => o.owner === 'F' && o.mine;
    const share = objs.filter(got).length / objs.length;
    const fought = inflicted >= Math.max(300, lost);
    const v = share === 1 && fought
      ? ['The Emperor is delighted', `${P.name} has done all that was asked of him, and more. There will be a dukedom in it.`]
      : share >= 0.5 || (share > 0 && fought)
        ? ['The Emperor is satisfied', `${P.name} has carried out the greater part of his orders.`]
        : ['The Emperor is displeased', `${P.name} has failed to carry out his orders. His conduct will not be forgotten.`];
    const li = objs.map((o) => `<li class="${got(o) ? 'f' : 'a'}">${o.name} <span>${got(o) ? '✓' : '✗'}</span></li>`).join('');
    return `<div class="e-cmd">
        <div class="e-cmd-k">${P.name} · ${P.sub}</div>
        <h3>${v[0]}</h3>
        <p>${v[1]} Your troops inflicted some ${A.fmtNum(inflicted)} casualties and lost ${A.fmtNum(lost)} men.</p>
        <ul class="e-objs">${li}</ul>
        <p class="e-cmd-n">✓ taken or held by your own troops, and still French at the end of the day</p>
      </div>`;
  }

  function endGame(reason) {
    const G = A.Game;
    if (G.over) return;
    G.over = true;
    A.setSpeed(0);
    if (reason === 'captured') A.Report.note('Prussian cavalry overrun the imperial escort and take the Emperor.', 'bad', 6, G.napoleon);
    G.nextSample = G.t;
    A.Report.sample(G);
    const a = assess(reason);
    const el = document.getElementById('end');
    const held = G.objectives.map((o) => `<li class="${o.owner === 'F' ? 'f' : 'a'}">${o.name} <span>${A.roman(o.pts)}</span></li>`).join('');
    el.innerHTML = `<div class="e-inner">
      <div class="e-kicker">${A.fmtClock(G.t)} — 14 octobre 1806</div>
      <h1>${a.r[0]}</h1>
      <h2>${a.r[1]}</h2>
      <p class="e-text">${a.r[2]}</p>
      <div class="e-grid">
        <div><label>French losses</label><b>${A.fmtNum(a.lf)}</b><i>of which ${A.fmtNum(G.stats.pris.F)} taken prisoner</i></div>
        <div><label>Prussian &amp; Saxon losses</label><b>${A.fmtNum(a.la)}</b><i>of which ${A.fmtNum(G.stats.pris.A)} taken prisoner</i></div>
        <div><label>Guns captured</label><b>${A.fmtNum(G.stats.guns.A)}</b><i>French guns lost: ${A.fmtNum(G.stats.guns.F)}</i></div>
        <div><label>Objectives</label><b>${a.pts} / ${a.tot}</b><i>${a.keys} of 3 key positions</i></div>
      </div>
      ${commandReport(G)}
      ${A.Report.html(G, a)}
      <ul class="e-objs">${held}</ul>
      <p class="e-hist"><b>History:</b> the French lost ${A.HISTORY.fr.text}; the Prussians and Saxons lost ${A.HISTORY.al.text}. The same day, twenty kilometres to the north, Davout’s III Corps routed the main Prussian army at Auerstedt. Napoleon entered Berlin on 27 October.</p>
      <button id="btn-again">Fight the battle again</button>
      <a href="../" class="home-link e-home">&larr; Kuklops</a>
    </div>`;
    el.classList.remove('hidden');
    el.scrollTop = 0;
    A.Report.drawMap(document.getElementById('r-map'), G);
    document.getElementById('btn-again').onclick = () => location.reload();
  }
  A.endGame = endGame;
  A.advance = (minutes) => {
    for (let i = 0; i < minutes / STEP && !A.Game.over; i++) { A.Sim.step(STEP); events(); }
  };

  let panDir = 1;
  function titleCam(dt) {
    const M = A.MAP;
    R.cam.z = Math.max(R.H / 7000, R.W / 9000);
    const halfW = R.W / R.cam.z / 2;
    R.cam.y = 5600;
    R.cam.x += dt * 60 * panDir;
    if (R.cam.x > M.W - halfW) { R.cam.x = M.W - halfW; panDir = -1; }
    else if (R.cam.x < halfW) { R.cam.x = halfW; panDir = 1; }
  }

  function frame(ts) {
    const dt = Math.min(0.1, (ts - last) / 1000 || 0);
    last = ts;
    const G = A.Game;
    if (started && G && !G.over) {
      acc += dt * G.speed * TIME_SCALE;
      let n = 0;
      while (acc > 1e-6 && n < 50) {
        const h = Math.min(STEP, acc);
        A.Sim.step(h);
        events();
        acc -= h;
        n++;
        if (G.over) break;
      }
      if (n >= 50) acc = 0;
      A.FX.update(dt * Math.min(G.speed * TIME_SCALE * 2, 2));
      UI.frame(dt);
    } else if (!started) {
      titleCam(dt);
    }
    R.draw(UI.state);
    if (started) {
      R.drawMinimap(document.getElementById('minimap'), UI.state);
      const m = UI.state.marker;
      if (m && performance.now() - m.t > 700) UI.state.marker = null;
    }
    requestAnimationFrame(frame);
  }

  function start() {
    newGame();
    const P = A.Player;
    document.getElementById('title').classList.add('hidden');
    if (P.arrives && P.arrives > A.T_START + 20) {
      const ld = document.getElementById('loading');
      ld.querySelector('.ld-text').textContent = `The battle has raged since dawn. ${P.name} rides for the field…`;
      ld.classList.remove('hidden');
      setTimeout(() => {
        A.advance(P.arrives - A.T_START + 0.5);
        UI.clearBanners();
        ld.classList.add('hidden');
        begin();
      }, 40);
    } else begin();
  }

  function begin() {
    const G = A.Game;
    document.getElementById('hud').classList.remove('hidden');
    const mine = G.units.filter((u) => !u.dead && A.controls(u) && u.cls !== 'staff');
    if (A.Player.id !== 'nap' && mine.length) {
      const aim = (u, i) => (u.order && u.order.type === 'move' ? (u[i] + u.order[i]) / 2 : u[i]);
      R.cam.x = mine.reduce((s, u) => s + aim(u, 'x'), 0) / mine.length;
      R.cam.y = mine.reduce((s, u) => s + aim(u, 'y'), 0) / mine.length;
      R.cam.z = Math.max(R.H / 6500, R.W / 8500);
    } else {
      R.cam.x = 10600; R.cam.y = 5600; R.cam.z = Math.max(R.H / 8000, R.W / 10500);
    }
    R.clampCam();
    UI.buildOOB();
    started = true;
    A.setSpeed(1);
    events();
  }

  window.addEventListener('load', () => {
    R.init(document.getElementById('map'));
    UI.init();
    const loading = document.getElementById('loading');
    setTimeout(() => {
      A.Terrain.build();
      R.bake();
      R.cam.x = 11000;
      titleCam(0);
      loading.classList.add('hidden');
      document.getElementById('title').classList.remove('hidden');
      requestAnimationFrame(frame);
    }, 30);
    buildPicker();
    document.getElementById('btn-start').onclick = start;
  });
})();
