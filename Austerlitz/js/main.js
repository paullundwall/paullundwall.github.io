'use strict';
(function () {
  const STEP = 0.1;
  let acc = 0, last = 0, started = false;
  const UI = A.UI, R = A.Render;

  const EVENTS = [
    {
      t: 420,
      fn: () => {
        UI.dispatch("L'Empereur", 'Let them come down from the Pratzen. Legrand must hold Telnitz and Sokolnitz until Davout arrives from Raigern. Keep Soult\'s divisions hidden in the fog below Puntowitz — when the heights are empty, we strike the centre.', 'info', { x: 4530, y: 5100 });
      },
    },
    { t: 423, fn: () => UI.dispatch('Général Legrand', "Kienmayer's Austrians are coming out of the fog towards Telnitz. The 3e de Ligne stands to arms.", 'warn', { x: 2560, y: 12650 }) },
    { t: 495, fn: () => UI.dispatch('Observers on the Zuran', 'The Russian columns are streaming south off the plateau towards Telnitz and Sokolnitz. Their centre grows thin.', 'info', { x: 6300, y: 9300 }) },
    {
      t: 520,
      fn: () => UI.banner('Le Soleil d’Austerlitz', '“How long do you need to reach the heights?” — “Less than twenty minutes, Sire.” — “Then we shall wait another quarter of an hour.”'),
    },
    { t: 525, fn: () => UI.dispatch('Espions', 'The Fourth Column — Kutuzov himself, with Miloradovich and Kolowrat — begins to leave the plateau.', 'info', { x: 8000, y: 7800 }) },
    { t: 535, fn: () => UI.dispatch("L'Empereur", 'Now. One sharp blow and the war is over! Soult: Saint-Hilaire on the Pratzeberg, Vandamme on Staré Vinohrady.', 'good', { x: 6000, y: 8200 }) },
    { t: 720, fn: () => UI.dispatch('Aide de camp', 'Noon. Report the state of the line to His Majesty.', 'info') },
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
      zuranT: null,
    });
    for (const d of A.OOB) G.units.push(new A.Unit(d));
    G.napoleon = G.units.find((u) => u.id === 'nap');
    G.initialMen = { F: sumMen('F') + A.REINFORCEMENTS.reduce((a, r) => a + r.u.men, 0), A: sumMen('A') };
    G.captureEmperor = () => endGame('captured');
    for (const u of G.units) u.el = A.Terrain.elev(u.x, u.y);
    A.AI.init();
    A.Sim.computeVis();
  }

  function events() {
    const G = A.Game;
    while (G.ei < EVENTS.length && G.t >= EVENTS[G.ei].t) EVENTS[G.ei++].fn();
    while (G.ri < A.REINFORCEMENTS.length && G.t >= A.REINFORCEMENTS[G.ri].t) {
      const r = A.REINFORCEMENTS[G.ri++];
      const u = new A.Unit(r.u);
      u.order = { type: 'move', x: r.dest[0], y: r.dest[1], face: 0 };
      G.units.push(u);
      if (G.ri === 1) {
        UI.banner('Davout arrive !', 'The III Corps comes up from Raigern after a forced march of more than 110 km in two days.');
      }
      UI.dispatch('Maréchal Davout', `${u.name} (${u.cmd}) arrives on the Raigern road.`, 'good', u);
      UI.buildOOB();
    }
    if (!G.over) {
      const z = G.objectives.find((o) => o.id === 'zuran');
      if (z.owner === 'A') {
        if (G.zuranT == null) { G.zuranT = G.t; UI.banner('Le Zuran est perdu !', 'Retake the Emperor\'s command post within fifteen minutes or the army will fall back.'); }
        else if (G.t - G.zuranT >= 15) endGame('zuran');
      } else G.zuranT = null;
      let eff = 0;
      for (const u of G.units) if (u.side === 'F' && !u.routed && !u.dead) eff += u.men;
      if (G.t > 480 && eff < G.initialMen.F * 0.38) endGame('broken');
      if (G.t >= A.T_END) endGame('time');
    }
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
    const plateau = G.objectives.filter((o) => o.plateau && o.owner === 'F').length;
    const lf = G.stats.loss.F, la = G.stats.loss.A;
    const ratio = la / Math.max(1, lf);
    let r;
    if (reason === 'captured') r = ['DÉSASTRE', "The Emperor is taken", 'Cossacks have overrun the imperial escort. The Grande Armée is leaderless and the campaign of 1805 ends in catastrophe.'];
    else if (reason === 'zuran') r = ['DÉFAITE', 'The command post has fallen', 'With the Zuran in Allied hands the army\'s line of retreat to Brünn is cut. The Grande Armée falls back in disorder.'];
    else if (reason === 'broken') r = ['DÉFAITE', 'The army is broken', 'Too many battalions have fled the field. The Allies have turned the tables on the Emperor.'];
    else if (plateau === 3 && (ratio >= 2 || G.alliedBroken) && pts >= 18) r = ['VICTOIRE DÉCISIVE', 'The Sun of Austerlitz', '“Soldats, je suis content de vous… Il vous suffira de dire : « J\'étais à la bataille d\'Austerlitz », pour que l\'on réponde : « Voilà un brave ! »” The Third Coalition is shattered.'];
    else if (plateau >= 2 && pts >= 14 && ratio >= 1.2) r = ['VICTOIRE', 'The Pratzen is ours', 'The Allied centre has been pierced and the field belongs to France, though part of the enemy army escaped intact.'];
    else if (pts >= 12 && ratio >= 0.8) r = ['VICTOIRE INCERTAINE', 'A hard-won field', 'The French hold their ground, but the blow that was meant to end the war has not fallen.'];
    else if (pts >= 9) r = ['BATAILLE INDÉCISE', 'Neither side prevails', 'Night falls on a blood-soaked plateau. Both emperors will claim the day; the war goes on.'];
    else r = ['DÉFAITE', 'The Coalition triumphs', 'The Allied plan has succeeded. The Grande Armée retreats on Brünn and Vienna is lost.'];
    return { r, pts, tot, plateau, lf, la, ratio };
  }

  function endGame(reason) {
    const G = A.Game;
    if (G.over) return;
    G.over = true;
    A.setSpeed(0);
    const a = assess(reason);
    const el = document.getElementById('end');
    const held = G.objectives.map((o) => `<li class="${o.owner === 'F' ? 'f' : 'a'}">${o.name} <span>${A.roman(o.pts)}</span></li>`).join('');
    el.innerHTML = `<div class="e-inner">
      <div class="e-kicker">${A.fmtClock(G.t)} — 2 décembre 1805</div>
      <h1>${a.r[0]}</h1>
      <h2>${a.r[1]}</h2>
      <p class="e-text">${a.r[2]}</p>
      <div class="e-grid">
        <div><label>French losses</label><b>${A.fmtNum(a.lf)}</b><i>of which ${A.fmtNum(G.stats.pris.F)} taken prisoner</i></div>
        <div><label>Allied losses</label><b>${A.fmtNum(a.la)}</b><i>of which ${A.fmtNum(G.stats.pris.A)} taken prisoner</i></div>
        <div><label>Guns captured</label><b>${A.fmtNum(G.stats.guns.A)}</b><i>French guns lost: ${A.fmtNum(G.stats.guns.F)}</i></div>
        <div><label>Objectives</label><b>${a.pts} / ${a.tot}</b><i>${a.plateau} of 3 plateau positions</i></div>
      </div>
      <ul class="e-objs">${held}</ul>
      <p class="e-hist"><b>History:</b> the French lost ${A.HISTORY.fr.text}; the Allies lost ${A.HISTORY.al.text}. Austria signed the Peace of Pressburg on 26 December.</p>
      <button id="btn-again">Fight the battle again</button>
    </div>`;
    el.classList.remove('hidden');
    document.getElementById('btn-again').onclick = () => location.reload();
  }
  A.endGame = endGame;
  A.advance = (minutes) => {
    for (let i = 0; i < minutes / STEP && !A.Game.over; i++) { A.Sim.step(STEP); events(); }
  };

  function frame(ts) {
    const dt = Math.min(0.1, (ts - last) / 1000 || 0);
    last = ts;
    const G = A.Game;
    if (started && G && !G.over) {
      acc += dt * G.speed;
      let n = 0;
      while (acc >= STEP && n < 50) {
        A.Sim.step(STEP);
        events();
        acc -= STEP;
        n++;
        if (G.over) break;
      }
      if (n >= 50) acc = 0;
      A.FX.update(dt * Math.min(G.speed, 2));
      UI.frame(dt);
    } else if (!started) {
      R.cam.x += dt * 60;
      if (R.cam.x > 9000) R.cam.x = 4000;
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
    document.getElementById('title').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    R.cam.x = 4700; R.cam.y = 7600; R.cam.z = Math.max(R.H / 9500, R.W / 12000);
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
      R.cam.x = 5000; R.cam.y = 7600; R.cam.z = R.H / 7000;
      R.clampCam();
      loading.classList.add('hidden');
      document.getElementById('title').classList.remove('hidden');
      requestAnimationFrame(frame);
    }, 30);
    document.getElementById('btn-start').onclick = start;
  });
})();
