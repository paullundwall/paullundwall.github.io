'use strict';
// Records the course of the battle and writes the after-action report.
A.Report = (function () {
  const SAMPLE = 10;
  const HOURS = (A.T_END - A.T_START) / 60;
  const H0 = A.T_START / 60;
  const M = A.MAP;
  const clock = (t) => A.fmtClock(t);

  function init(G) {
    G.chron = [];
    G.hourly = { F: new Array(HOURS).fill(0), A: new Array(HOURS).fill(0) };
    G.tracks = {};
    G.nextSample = G.t;
    G.roster = G.units.slice();
    G.firstPlateau = null;
  }

  // A moment worth remembering. A later note with the same key within a quarter
  // of an hour replaces the earlier one, so a contested village is told once.
  function note(text, kind, weight, pos, key) {
    const G = A.Game;
    if (!G || !G.chron) return;
    if (key) {
      const i = G.chron.findIndex((c) => c.key === key && G.t - c.t < 15);
      if (i >= 0) G.chron.splice(i, 1);
    }
    G.chron.push({ t: G.t, text, kind, w: weight, x: pos ? pos.x : null, y: pos ? pos.y : null, key });
  }

  function loss(side, n) {
    const G = A.Game;
    const h = A.clamp(Math.floor((G.t - A.T_START) / 60), 0, HOURS - 1);
    G.hourly[side][h] += n;
  }

  function sample(G) {
    if (G.t < G.nextSample) return;
    G.nextSample += SAMPLE;
    const acc = {};
    for (const u of G.units) {
      if (u.dead || u.routed || u.cls === 'staff') continue;
      const a = acc[u.corps] || (acc[u.corps] = { x: 0, y: 0, m: 0, nation: u.nation });
      a.x += u.x * u.men; a.y += u.y * u.men; a.m += u.men;
    }
    for (const k in acc) {
      const a = acc[k];
      const tr = G.tracks[k] || (G.tracks[k] = { nation: a.nation, pts: [] });
      tr.pts.push([a.x / a.m, a.y / a.m, a.m]);
    }
  }

  function moments(G) {
    const top = [...G.chron].sort((a, b) => b.w - a.w || a.t - b.t).slice(0, 10);
    return top.sort((a, b) => a.t - b.t);
  }

  function hourTotals(G) {
    return G.hourly.F.map((f, i) => f + G.hourly.A[i]);
  }

  function summary(G, a) {
    const s = [];
    const flags = A.AI.flags;
    const soult = G.chron.find((c) => c.key === 'arr:IV');
    const ney = G.chron.find((c) => c.key === 'arr:VI');
    if (soult) s.push(`Soult's IV Corps came up on the right at ${clock(soult.t)}${ney ? `, and Ney's vanguard reached the field at ${clock(ney.t)}` : ''}.`);
    if (flags.tauentzien) s.push(`Tauentzien's division fell back from the edge of the plateau at ${clock(flags.tauentzien)}.`);
    if (G.firstKey) s.push(`French troops first took one of the Prussian key positions at ${clock(G.firstKey.t)}, at ${G.firstKey.name}.`);
    else s.push('The French never broke into the Prussian position at Vierzehnheiligen, Isserstedt and Kapellendorf.');
    s.push(`At ${clock(G.t)} they held ${a.keys} of the three key positions and ${a.pts} of ${a.tot} objective points.`);
    const tot = hourTotals(G);
    const hi = tot.indexOf(Math.max(...tot));
    if (tot[hi] > 0) s.push(`The heaviest fighting came between ${H0 + hi} h and ${H0 + 1 + hi} h, when some ${A.fmtNum(tot[hi])} men fell on both sides.`);
    const ru = G.chron.find((c) => c.key === 'ruchel');
    const late = [];
    if (ru) late.push([ru.t, `Rüchel's corps arrived from Weimar at ${clock(ru.t)}.`]);
    if (G.alliedBroken) late.push([G.alliedBroken, `At ${clock(G.alliedBroken)} the Prussian and Saxon army broke and fled down the Weimar road.`]);
    else if (flags.retreat) late.push([flags.retreat, `Hohenlohe ordered the retreat on Weimar at ${clock(flags.retreat)}.`]);
    for (const [, txt] of late.sort((x, y) => x[0] - y[0])) s.push(txt);
    if (a.ratio >= 1) s.push(`In all, the Prussians and Saxons lost ${a.ratio.toFixed(1)} men for every Frenchman.`);
    else s.push(`In all, the French lost more men than they inflicted: ${(1 / Math.max(a.ratio, 0.01)).toFixed(1)} for every Prussian or Saxon.`);
    return s.join(' ');
  }

  function mentions(G) {
    const out = [];
    const fr = G.roster.filter((u) => u.side === 'F' && u.cls !== 'staff');
    const al = G.roster.filter((u) => u.side === 'A');
    const by = (arr, f) => arr.reduce((b, u) => (f(u) > f(b) ? u : b), arr[0]);
    const name = (u) => `<b>${u.name}</b> (${u.cmd})`;
    const best = by(fr, (u) => u.inflicted);
    if (best && best.inflicted > 200) out.push(['Distinguished', `${name(best)} inflicted some ${A.fmtNum(best.inflicted)} casualties on the enemy.`]);
    const firm = fr.filter((u) => !u.routs && u.men0 >= 1000 && u.losses / u.men0 >= 0.25);
    if (firm.length) {
      const u = by(firm, (x) => x.losses / x.men0);
      out.push(['Stood firm', `${name(u)} never broke, though it lost ${Math.round((100 * u.losses) / u.men0)}% of its men.`]);
    }
    const broke = fr.filter((u) => u.firstRout != null).sort((a, b) => a.firstRout - b.firstRout)[0];
    if (broke) out.push(['First to break', `${name(broke)} gave way at ${clock(broke.firstRout)}${broke.routs > 1 ? ` and broke ${broke.routs} times in all` : ''}.`]);
    const foe = by(al, (u) => u.inflicted);
    if (foe && foe.inflicted > 200) out.push(['Among the enemy', `${name(foe)} fought hardest, inflicting some ${A.fmtNum(foe.inflicted)} casualties.`]);
    return out;
  }

  function hoursHtml(G) {
    const tot = hourTotals(G);
    const max = Math.max(1, ...G.hourly.F, ...G.hourly.A);
    const crit = [...tot.keys()].sort((a, b) => tot[b] - tot[a]).slice(0, 2).filter((i) => tot[i] > 0);
    let h = '';
    for (let i = 0; i < HOURS; i++) {
      const t0 = A.T_START + i * 60;
      if (t0 > G.t) break;
      const f = G.hourly.F[i], a = G.hourly.A[i];
      const ev = G.chron.filter((c) => c.t >= t0 && c.t < t0 + 60).sort((x, y) => y.w - x.w)[0];
      h += `<div class="r-hour${crit.includes(i) ? ' crit' : ''}">
        <span class="r-h">${H0 + i} h</span>
        <span class="r-bars"><i class="f" style="width:${(100 * f) / max}%"></i><i class="a" style="width:${(100 * a) / max}%"></i></span>
        <span class="r-n">${A.fmtNum(f)} / ${A.fmtNum(a)}</span>
        <span class="r-ev">${ev ? ev.text : ''}</span>
      </div>`;
    }
    return h;
  }

  function html(G, a) {
    const moms = moments(G);
    const list = moms.map((m, i) => `<li class="${m.kind}"><span class="r-num">${i + 1}</span><span class="r-t">${clock(m.t)}</span> ${m.text}</li>`).join('');
    const ment = mentions(G).map(([k, v]) => `<div><label>${k}</label><p>${v}</p></div>`).join('');
    return `<div class="r-cols">
        <figure class="r-map">
          <canvas id="r-map"></canvas>
          <figcaption><span class="k f"></span>French corps <span class="k p"></span>Prussian <span class="k sx"></span>Saxon · each line follows a corps from dawn to the end of the battle; numbers mark the critical moments.</figcaption>
        </figure>
        <div class="r-side">
          <h3>The day in brief</h3>
          <p class="r-sum">${summary(G, a)}</p>
          <h3>Critical moments</h3>
          <ol class="r-chron">${list || '<li>Nothing of note took place.</li>'}</ol>
        </div>
      </div>
      <h3 class="r-title">Hour by hour <small>French / Prussian &amp; Saxon losses</small></h3>
      <div class="r-hours">${hoursHtml(G)}</div>
      ${ment ? `<h3 class="r-title">Mentioned in dispatches</h3><div class="r-ment">${ment}</div>` : ''}`;
  }

  function rdp(pts, eps) {
    if (pts.length < 3) return pts;
    const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
    let best = 0, bi = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      const d = A.segDist(pts[i][0], pts[i][1], ax, ay, bx, by);
      if (d > best) { best = d; bi = i; }
    }
    if (best < eps) return [pts[0], pts[pts.length - 1]];
    return rdp(pts.slice(0, bi + 1), eps).slice(0, -1).concat(rdp(pts.slice(bi), eps));
  }

  // Broad strokes only: average over half an hour, then drop the small wiggles.
  function generalise(raw) {
    const R = 3;
    const avg = raw.map((_, i) => {
      let x = 0, y = 0, n = 0;
      for (let j = Math.max(0, i - R); j <= Math.min(raw.length - 1, i + R); j++) { x += raw[j][0]; y += raw[j][1]; n++; }
      return [x / n, y / n];
    });
    avg[0] = [raw[0][0], raw[0][1]];
    return rdp(avg, 450);
  }

  function trackColour(k, tr) {
    if (A.CORPS[k].side === 'F') return '#24438c';
    return A.NATIONS[tr.nation].track;
  }

  function drawMap(cv, G) {
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth, H = (W * M.H) / M.W;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.height = H + 'px';
    const g = cv.getContext('2d');
    g.scale(dpr, dpr);
    const k = W / M.W;
    g.drawImage(A.Render.mapCanvas, 0, 0, W, H);
    g.fillStyle = 'rgba(240,229,200,0.35)';
    g.fillRect(0, 0, W, H);

    for (const o of G.objectives) {
      g.beginPath(); g.arc(o.x * k, o.y * k, 5, 0, 7);
      g.fillStyle = o.owner === 'F' ? '#2d4f97' : '#3f5c33'; g.fill();
      g.lineWidth = 1.5; g.strokeStyle = '#c9a043'; g.stroke();
    }

    g.lineCap = 'round'; g.lineJoin = 'round';
    g.font = '10px "IM Fell English SC", Georgia, serif';
    g.textBaseline = 'middle';
    for (const key in G.tracks) {
      const tr = G.tracks[key];
      if (!A.CORPS[key] || !tr.pts.length) continue;
      const col = trackColour(key, tr);
      let pts = generalise(tr.pts).map((p) => [p[0] * k, p[1] * k]);
      const men = Math.max(...tr.pts.map((p) => p[2]));
      const lw = A.clamp(Math.sqrt(men) / 30, 1.5, 4.5);
      let len = 0;
      for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      g.strokeStyle = g.fillStyle = col;
      g.globalAlpha = 0.85;
      if (len < 8) {
        g.beginPath(); g.arc(pts[0][0], pts[0][1], lw + 1, 0, 7); g.fill();
      } else {
        pts = A.chaikin(pts, 2);
        g.lineWidth = lw;
        g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
        for (const p of pts) g.lineTo(p[0], p[1]);
        g.stroke();
        const [x1, y1] = pts[pts.length - 1];
        let j = pts.length - 2;
        while (j > 0 && Math.hypot(x1 - pts[j][0], y1 - pts[j][1]) < 6) j--;
        const ang = Math.atan2(y1 - pts[j][1], x1 - pts[j][0]), s = 5 + lw;
        g.beginPath(); g.moveTo(x1 + Math.cos(ang) * 2, y1 + Math.sin(ang) * 2);
        g.lineTo(x1 - Math.cos(ang - 0.5) * s, y1 - Math.sin(ang - 0.5) * s);
        g.lineTo(x1 - Math.cos(ang + 0.5) * s, y1 - Math.sin(ang + 0.5) * s);
        g.closePath(); g.fill();
      }
      g.globalAlpha = 1;
      const [lx, ly] = pts[0];
      g.lineWidth = 3; g.strokeStyle = 'rgba(244,236,214,0.9)';
      g.strokeText(A.CORPS[key].short, lx + 6, ly);
      g.fillStyle = col; g.fillText(A.CORPS[key].short, lx + 6, ly);
    }

    moments(G).forEach((m, i) => {
      if (m.x == null) return;
      const x = m.x * k, y = m.y * k;
      g.beginPath(); g.arc(x, y, 8, 0, 7);
      g.fillStyle = m.kind === 'bad' ? '#8e2a22' : '#1a1208'; g.fill();
      g.lineWidth = 1.5; g.strokeStyle = '#f3d27a'; g.stroke();
      g.fillStyle = '#f3e9cf'; g.font = 'bold 10px "Bodoni Moda", Didot, serif';
      g.textAlign = 'center'; g.fillText(String(i + 1), x, y + 0.5);
      g.textAlign = 'left';
    });
  }

  return { init, note, loss, sample, html, drawMap };
})();
