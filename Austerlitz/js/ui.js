'use strict';
A.UI = (function () {
  const R = A.Render;
  const S = { selected: [], hover: null, inspect: null, box: null, faceDrag: null, marker: null };
  const $ = (id) => document.getElementById(id);
  let el = {};
  let mouse = { x: 0, y: 0, btn: -1, sx: 0, sy: 0, moved: false, pan: false };
  const keys = new Set();
  let domAcc = 0;
  let oobRows = new Map();
  let lastDisp = new Map();
  const bannerQ = [];
  let bannerBusy = false;
  let cardFor = '';

  // ---------- symbols ----------
  function symSVG(u, w = 34, h = 22) {
    const N = A.NATIONS[u.nation];
    const g = N.glyph, f = N.fill, d = N.dark;
    let glyph = '';
    if (u.cls === 'inf') {
      glyph = `<path d="M3 3L${w - 3} ${h - 3}M${w - 3} 3L3 ${h - 3}" stroke="${g}" stroke-width="1.6"/>`;
      if (u.type === 'light') glyph += `<circle cx="${w / 2}" cy="${h / 2}" r="3" fill="${g}"/>`;
      if (u.type === 'grenadier') glyph += `<path d="M3 7H${w - 3}" stroke="${g}" stroke-width="1.6"/>`;
    } else if (u.cls === 'cav') {
      glyph = `<path d="M3 ${h - 3}L${w - 3} 3" stroke="${g}" stroke-width="1.6"/>`;
      if (u.type === 'cuirassier' || u.type === 'guardcav') glyph += `<path d="M3 ${h - 9}L${w - 12} 3" stroke="${g}" stroke-width="1.6"/>`;
      if (u.type === 'cossack' || u.type === 'uhlan') glyph += `<circle cx="${w / 2}" cy="${h / 2}" r="3.5" stroke="${g}" fill="none" stroke-width="1.4"/>`;
    } else if (u.cls === 'art') {
      glyph = `<circle cx="${w / 2}" cy="${h / 2 + 2}" r="4.5" fill="${g}"/><path d="M${w / 2} ${h / 2}V3" stroke="${g}" stroke-width="3"/>`;
    } else {
      return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><circle cx="${w / 2}" cy="${h / 2}" r="${h / 2 - 1}" fill="#1b2f66" stroke="#d9b14d" stroke-width="2"/><text x="${w / 2}" y="${h / 2 + 5}" font-family="Bodoni Moda, Didot, serif" font-weight="700" font-size="14" fill="#e8c463" text-anchor="middle">N</text></svg>`;
    }
    const guard = u.type === 'guard' || u.type === 'guardcav' ? `<rect x="2.5" y="2.5" width="${w - 5}" height="${h - 5}" fill="none" stroke="#e1b84b" stroke-width="1.2"/>` : '';
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect x="0.75" y="0.75" width="${w - 1.5}" height="${h - 1.5}" fill="${f}" stroke="${d}" stroke-width="1.5"/>${glyph}${guard}<path d="M0.75 1.5H${w - 0.75}" stroke="${d}" stroke-width="3"/></svg>`;
  }
  A.symSVG = symSVG;

  // ---------- text helpers ----------
  function moraleWord(u) {
    if (u.routed) return 'Routed';
    const m = u.morale;
    return m >= 80 ? 'Eager' : m >= 60 ? 'Steady' : m >= 40 ? 'Shaken' : m >= 25 ? 'Wavering' : 'Breaking';
  }
  function statusWord(u) {
    if (u.routed) return 'In flight';
    if (u.melee.length) return 'In melee';
    if (u.formT > 0) return 'Forming ' + A.FORM_NAMES[u.formTo].toLowerCase();
    if (u.firing & 2) return 'Bombarding';
    if (u.firing & 1) return 'Firing';
    if (u.underFire > 0) return 'Under fire';
    if (u.order && u.order.type === 'attack') return u.order.charge ? 'Charging' : 'Advancing to fire';
    if (u.speedNow > 0) return 'Marching';
    return u.cls === 'staff' ? 'Observing' : 'Holding';
  }
  const estimate = (n) => '~' + A.fmtNum(Math.max(500, Math.round(n / 500) * 500));

  // ---------- picking ----------
  function pickUnit(sx, sy) {
    const G = A.Game;
    if (!G) return null;
    const [wx, wy] = R.s2w(sx, sy);
    let best = null, ba = Infinity;
    for (const u of G.units) {
      if (u.dead) continue;
      if (u.side === 'A' && !G.vis.F.has(u.uid)) continue;
      if (u.cls === 'staff') {
        const [px, py] = R.w2s(u.x, u.y);
        if (Math.hypot(px - sx, py - sy) < 17) return u;
        continue;
      }
      const [w, d] = R.unitScreenDims(u);
      const mx = Math.max(0, (w - u.fw * R.cam.z) / 2) / R.cam.z + 6 / R.cam.z;
      const my = Math.max(0, (d - u.fd * R.cam.z) / 2) / R.cam.z + 6 / R.cam.z;
      const c = Math.cos(u.facing), s = Math.sin(u.facing);
      const dx = wx - u.x, dy = wy - u.y;
      const lf = dx * c + dy * s, ll = -dx * s + dy * c;
      if (Math.abs(lf) <= u.fd / 2 + my && Math.abs(ll) <= u.fw / 2 + mx) {
        const a = u.fw * u.fd;
        if (a < ba) { ba = a; best = u; }
      }
    }
    return best;
  }
  function pickCommander(sx, sy) {
    const G = A.Game;
    if (!G) return null;
    for (const k in G.cmdPos) {
      if (A.CORPS[k].side !== 'F') continue;
      const [px, py] = R.w2s(G.cmdPos[k].x, G.cmdPos[k].y);
      if (Math.abs(sx - (px + 6)) < 12 && sy > py - 22 && sy < py + 6) return k;
    }
    return null;
  }
  const ownUnits = () => A.Game.units.filter((u) => u.side === 'F' && !u.dead);
  function selectCorps(k, add) {
    const us = ownUnits().filter((u) => u.corps === k);
    S.selected = add ? [...new Set([...S.selected, ...us])] : us;
    S.inspect = null;
  }

  // ---------- orders ----------
  function issueMove(wx, wy, face) {
    const sel = S.selected.filter((u) => !u.dead && !u.routed);
    if (!sel.length) return;
    let cx = 0, cy = 0, fx = 0, fy = 0;
    for (const u of sel) { cx += u.x; cy += u.y; fx += Math.cos(u.facing); fy += Math.sin(u.facing); }
    cx /= sel.length; cy /= sel.length;
    const avgF = Math.atan2(fy, fx);
    const moveDir = Math.atan2(wy - cy, wx - cx);
    const rot = face != null ? A.angDiff(avgF, face) : 0;
    const cr = Math.cos(rot), sr = Math.sin(rot);
    for (const u of sel) {
      let ox = sel.length > 1 ? u.x - cx : 0, oy = sel.length > 1 ? u.y - cy : 0;
      const l = Math.hypot(ox, oy);
      if (l > 1600) { ox *= 1600 / l; oy *= 1600 / l; }
      const tx = A.clamp(wx + ox * cr - oy * sr, 30, A.MAP.W - 30);
      const ty = A.clamp(wy + ox * sr + oy * cr, 30, A.MAP.H - 30);
      u.order = { type: 'move', x: tx, y: ty, face: face != null ? face : sel.length > 1 ? moveDir : Math.atan2(ty - u.y, tx - u.x) };
    }
    S.marker = { x: wx, y: wy, t: performance.now(), kind: 'move' };
  }
  function issueAttack(target) {
    const sel = S.selected.filter((u) => !u.dead && !u.routed && u.cls !== 'staff');
    for (const u of sel) {
      const charge = u.cls === 'cav' || (u.cls === 'inf' && !(u.autoForm === false && u.form === 'line'));
      u.order = { type: 'attack', target, charge: u.cls === 'art' ? false : charge };
    }
    S.marker = { x: target.x, y: target.y, t: performance.now(), kind: 'attack' };
  }
  function setFormation(f) {
    for (const u of S.selected) {
      if (u.dead || u.cls === 'staff' || u.cls === 'art') continue;
      if (f === 'auto') { u.autoForm = !u.autoForm; continue; }
      if (u.cls === 'cav' && f === 'square') continue;
      u.autoForm = false;
      u.setForm(f);
    }
    cardFor = '';
  }
  function setStance(s) {
    for (const u of S.selected) if (!u.dead) u.stance = s;
    cardFor = '';
  }
  function halt() {
    for (const u of S.selected) if (!u.dead) { u.order = null; u.idleFace = null; }
  }

  // ---------- input ----------
  function bindInput(cv) {
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    cv.addEventListener('mousedown', (e) => {
      if (!A.Game || A.Game.over) return;
      mouse.btn = e.button; mouse.sx = e.clientX; mouse.sy = e.clientY; mouse.moved = false;
      mouse.pan = e.button === 1 || (e.button === 2 && !S.selected.some((u) => !u.dead));
      if (e.button === 1) e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
      const dx = e.clientX - mouse.x, dy = e.clientY - mouse.y;
      mouse.x = e.clientX; mouse.y = e.clientY;
      if (mouse.btn >= 0 && Math.hypot(e.clientX - mouse.sx, e.clientY - mouse.sy) > 5) mouse.moved = true;
      if (mouse.btn < 0) {
        if (e.target === cv && A.Game) S.hover = pickUnit(e.clientX, e.clientY);
        else S.hover = null;
        updateTooltip(e);
        return;
      }
      if (mouse.pan && mouse.moved) {
        R.cam.x -= dx / R.cam.z; R.cam.y -= dy / R.cam.z; R.clampCam();
      } else if (mouse.btn === 0 && mouse.moved) {
        S.box = { x0: Math.min(mouse.sx, e.clientX), y0: Math.min(mouse.sy, e.clientY), x1: Math.max(mouse.sx, e.clientX), y1: Math.max(mouse.sy, e.clientY) };
      } else if (mouse.btn === 2 && mouse.moved && !mouse.pan) {
        S.faceDrag = { x0: mouse.sx, y0: mouse.sy, x1: e.clientX, y1: e.clientY };
      }
    });
    window.addEventListener('mouseup', (e) => {
      if (mouse.btn < 0) return;
      const btn = mouse.btn;
      mouse.btn = -1;
      if (!A.Game || A.Game.over) { S.box = null; S.faceDrag = null; return; }
      if (btn === 0) {
        if (S.box) {
          const b = S.box;
          const inBox = ownUnits().filter((u) => { const [sx, sy] = R.w2s(u.x, u.y); return sx >= b.x0 && sx <= b.x1 && sy >= b.y0 && sy <= b.y1; });
          S.selected = e.shiftKey ? [...new Set([...S.selected, ...inBox])] : inBox;
          S.inspect = null;
          S.box = null;
        } else if (e.target === cv) {
          const k = pickCommander(e.clientX, e.clientY);
          const u = k ? null : pickUnit(e.clientX, e.clientY);
          if (k) selectCorps(k, e.shiftKey);
          else if (u && u.side === 'F') {
            if (e.shiftKey) S.selected = S.selected.includes(u) ? S.selected.filter((x) => x !== u) : [...S.selected, u];
            else S.selected = [u];
            S.inspect = null;
          } else if (u) { S.inspect = u; if (!e.shiftKey) S.selected = []; }
          else if (!e.shiftKey) { S.selected = []; S.inspect = null; }
        }
      } else if (btn === 2 && !mouse.pan) {
        const sel = S.selected.filter((u) => !u.dead);
        if (sel.length && e.target === cv) {
          if (S.faceDrag) {
            const f = S.faceDrag;
            const [wx, wy] = R.s2w(f.x0, f.y0);
            issueMove(wx, wy, Math.atan2(f.y1 - f.y0, f.x1 - f.x0));
          } else {
            const t = pickUnit(e.clientX, e.clientY);
            if (t && t.side === 'A') issueAttack(t);
            else { const [wx, wy] = R.s2w(e.clientX, e.clientY); issueMove(wx, wy, null); }
          }
        }
      }
      S.faceDrag = null;
      mouse.pan = false;
    });
    cv.addEventListener('dblclick', (e) => {
      const u = pickUnit(e.clientX, e.clientY);
      if (u && u.side === 'F' && u.cls !== 'staff') selectCorps(u.corps, e.shiftKey);
    });
    cv.addEventListener('wheel', (e) => {
      e.preventDefault();
      const [wx, wy] = R.s2w(e.clientX, e.clientY);
      const k = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0016));
      R.cam.z *= k;
      R.clampCam();
      const [nx, ny] = R.s2w(e.clientX, e.clientY);
      R.cam.x += wx - nx; R.cam.y += wy - ny;
      R.clampCam();
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      if (!A.Game) return;
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      keys.add(k);
      if (A.Game.over) return;
      if (k === ' ' || k === 'p') A.setSpeed(A.Game.speed === 0 ? A.Game.prevSpeed || 1 : 0);
      else if (k === '1') A.setSpeed(0.5);
      else if (k === '2') A.setSpeed(1);
      else if (k === '3') A.setSpeed(2);
      else if (k === '4') A.setSpeed(4);
      else if (k === 'z') setFormation('column');
      else if (k === 'x') setFormation('line');
      else if (k === 'c') setFormation('square');
      else if (k === 'v') setFormation('auto');
      else if (k === 'h') halt();
      else if (k === 'e') setStance(S.selected[0] && S.selected[0].stance === 'engage' ? 'hold' : 'engage');
      else if (k === 'f') focusSelection();
      else if (k === 'escape') { if (!$('help').classList.contains('hidden')) toggleHelp(false); else { S.selected = []; S.inspect = null; } }
      else if (k === '?' || k === '/') toggleHelp();
    });
    window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => keys.clear());
  }

  function focusSelection() {
    const s = S.selected.filter((u) => !u.dead);
    if (!s.length) return;
    R.cam.x = s.reduce((a, u) => a + u.x, 0) / s.length;
    R.cam.y = s.reduce((a, u) => a + u.y, 0) / s.length;
    R.clampCam();
  }
  function centerOn(x, y) { R.cam.x = x; R.cam.y = y; R.clampCam(); }

  function updateTooltip(e) {
    const tt = el.tooltip;
    const u = S.hover;
    if (!u || mouse.btn >= 0) { tt.classList.add('hidden'); return; }
    let html;
    if (u.side === 'F') html = `<b>${u.name}</b><br><i>${u.cmd}</i> · ${A.fmtNum(u.men)} men · ${moraleWord(u)}`;
    else html = `<b>${u.name}</b><br><i>${u.cmd}</i> · ${A.NATIONS[u.nation].name} · ${estimate(u.men)} men${u.routed ? ' · <em>routed</em>' : ''}`;
    tt.innerHTML = html;
    tt.style.left = e.clientX + 16 + 'px';
    tt.style.top = e.clientY + 14 + 'px';
    tt.classList.remove('hidden');
  }

  // ---------- panels ----------
  function buildOOB() {
    const G = A.Game;
    const list = el.oobList;
    list.innerHTML = '';
    oobRows = new Map();
    const order = ['Q', 'V', 'RC', 'I', 'IV', 'G', 'GR', 'III'];
    for (const k of order) {
      const us = G.units.filter((u) => u.side === 'F' && u.corps === k && !u.dead);
      if (!us.length) continue;
      const C = A.CORPS[k];
      const h = document.createElement('div');
      h.className = 'oob-corps';
      h.innerHTML = `<span class="pennant" style="background:${C.color}"></span><span class="cn">${C.name}</span><span class="cc">${C.cmd}</span>`;
      h.onclick = (e) => selectCorps(k, e.shiftKey);
      h.ondblclick = () => { selectCorps(k); focusSelection(); };
      list.appendChild(h);
      for (const u of us) {
        const r = document.createElement('div');
        r.className = 'oob-unit';
        r.innerHTML = `<span class="sym">${symSVG(u, 26, 16)}</span><span class="un"><b>${u.cmd}</b><i>${u.name}</i></span><span class="us"><em class="men"></em><span class="mbar"><i></i></span></span>`;
        r.onclick = (e) => {
          if (e.shiftKey) S.selected = S.selected.includes(u) ? S.selected.filter((x) => x !== u) : [...S.selected, u];
          else S.selected = [u];
          S.inspect = null;
        };
        r.ondblclick = () => { S.selected = [u]; focusSelection(); };
        list.appendChild(r);
        oobRows.set(u, { r, men: r.querySelector('.men'), bar: r.querySelector('.mbar i') });
      }
    }
  }
  function updateOOB() {
    const sel = new Set(S.selected);
    for (const [u, row] of oobRows) {
      if (u.dead) { row.r.classList.add('dead'); row.men.textContent = 'dispersed'; row.bar.style.width = '0'; continue; }
      row.men.textContent = A.fmtNum(u.men) + (u.cls === 'staff' ? '' : '');
      row.bar.style.width = u.morale + '%';
      row.bar.style.background = u.morale > 60 ? '#4f8a3a' : u.morale > 35 ? '#c8962a' : '#b8352b';
      row.r.classList.toggle('sel', sel.has(u));
      row.r.classList.toggle('routed', u.routed);
      row.r.classList.toggle('fight', !!(u.melee.length || u.firing || u.underFire > 0));
    }
  }

  function updateCard() {
    const card = el.card;
    const sel = S.selected.filter((u) => !u.dead);
    if (sel.length !== S.selected.length) S.selected = sel;
    if (S.inspect && (S.inspect.dead || !A.Game.vis.F.has(S.inspect.uid))) S.inspect = null;
    const key = sel.length ? sel.map((u) => u.uid).join(',') + '|' + sel.map((u) => u.autoForm + u.stance).join('') : S.inspect ? 'e' + S.inspect.uid : '';
    if (!key) { card.classList.add('hidden'); cardFor = ''; return; }
    card.classList.remove('hidden');
    if (key !== cardFor) { cardFor = key; buildCard(sel); }
    const q = (s) => card.querySelector(s);
    if (sel.length === 1) {
      const u = sel[0];
      q('.v-men').textContent = A.fmtNum(u.men);
      q('.v-men0').textContent = 'of ' + A.fmtNum(u.men0);
      if (q('.v-guns')) q('.v-guns').textContent = Math.round(u.guns);
      q('.v-mor').style.width = u.morale + '%';
      q('.v-mor').style.background = u.morale > 60 ? '#4f8a3a' : u.morale > 35 ? '#c8962a' : '#b8352b';
      q('.v-morw').textContent = moraleWord(u);
      q('.v-status').textContent = statusWord(u);
      q('.v-terrain').textContent = `${A.Terrain.describe(u.x, u.y)} · elevation ${Math.round(u.el)} m${A.aura(u) > 0 ? ' · within command radius' : ''}`;
      card.querySelectorAll('[data-form]').forEach((b) => b.classList.toggle('on', !u.autoForm && (u.formTo || u.form) === b.dataset.form));
      card.querySelectorAll('[data-form]').forEach((b) => b.classList.toggle('cur', u.form === b.dataset.form));
    } else if (sel.length > 1) {
      const men = sel.reduce((a, u) => a + u.men, 0);
      const mor = sel.reduce((a, u) => a + u.morale * u.men, 0) / Math.max(1, men);
      q('.v-men').textContent = A.fmtNum(men);
      q('.v-mor').style.width = mor + '%';
      q('.v-status').textContent = sel.filter((u) => u.melee.length || u.firing).length + ' engaged · ' + sel.filter((u) => u.routed).length + ' routed';
    } else if (S.inspect) {
      const u = S.inspect;
      q('.v-men').textContent = estimate(u.men);
      q('.v-status').textContent = u.routed ? 'Routed' : u.melee.length ? 'In melee' : u.firing ? 'Firing' : u.speedNow > 0 ? 'Marching' : 'Halted';
    }
  }

  function buildCard(sel) {
    const card = el.card;
    const btns = (u) => {
      if (u && (u.cls === 'staff' || u.cls === 'art')) return '';
      const isCav = u && u.cls === 'cav';
      const auto = sel.every((x) => x.autoForm);
      const st = sel[0].stance;
      return `<div class="c-btns">
        <div class="grp"><label>Formation</label>
          <button data-form="column">Column <kbd>Z</kbd></button>
          <button data-form="line">Line <kbd>X</kbd></button>
          ${isCav ? '' : '<button data-form="square">Square <kbd>C</kbd></button>'}
          <button data-auto class="${auto ? 'on' : ''}">Auto <kbd>V</kbd></button>
        </div>
        <div class="grp"><label>Stance</label>
          <button data-stance="hold" class="${st === 'hold' ? 'on' : ''}">Hold</button>
          <button data-stance="engage" class="${st === 'engage' ? 'on' : ''}">Engage <kbd>E</kbd></button>
          <button data-halt>Halt <kbd>H</kbd></button>
        </div></div>`;
    };
    if (sel.length === 1) {
      const u = sel[0], C = A.CORPS[u.corps];
      card.innerHTML = `<div class="c-head"><span class="c-sym">${symSVG(u, 44, 28)}</span>
        <div><div class="c-name">${u.name}</div><div class="c-sub">${u.cls === 'staff' ? 'Emperor of the French' : 'Général ' + u.cmd} · ${u.T.label} · <span style="color:${C.color}">■</span> ${C.name}${u.corps !== 'Q' ? ' — ' + C.cmd : ''}</div></div></div>
        <div class="c-stats">
          <div><label>Strength</label><b class="v-men"></b> <i class="v-men0"></i></div>
          ${u.guns0 ? '<div><label>Guns</label><b class="v-guns"></b></div>' : ''}
          <div class="wide"><label>Morale</label><span class="bar"><i class="v-mor"></i></span> <em class="v-morw"></em></div>
          <div><label>Status</label><b class="v-status"></b></div>
        </div>
        ${btns(u)}
        <div class="c-terrain v-terrain"></div>`;
    } else if (sel.length > 1) {
      const anyInf = sel.some((u) => u.cls === 'inf');
      card.innerHTML = `<div class="c-head"><span class="c-sym">${symSVG(sel.find((u) => u.cls !== 'staff') || sel[0], 44, 28)}</span>
        <div><div class="c-name">${sel.length} formations under orders</div><div class="c-sub">${[...new Set(sel.map((u) => u.cmd))].slice(0, 6).join(' · ')}${sel.length > 6 ? '…' : ''}</div></div></div>
        <div class="c-stats"><div><label>Total strength</label><b class="v-men"></b></div><div class="wide"><label>Avg. morale</label><span class="bar"><i class="v-mor"></i></span></div><div><label>Status</label><b class="v-status"></b></div></div>
        ${btns(anyInf ? sel.find((u) => u.cls === 'inf') : sel.find((u) => u.cls === 'cav'))}`;
    } else {
      const u = S.inspect, C = A.CORPS[u.corps];
      card.innerHTML = `<div class="c-head enemy"><span class="c-sym">${symSVG(u, 44, 28)}</span>
        <div><div class="c-name">${u.name}</div><div class="c-sub">${u.cmd} · ${A.NATIONS[u.nation].name} · ${u.T.label} · ${C.name} (${C.cmd})</div></div></div>
        <div class="c-stats"><div><label>Estimated strength</label><b class="v-men"></b></div><div><label>Observed</label><b class="v-status"></b></div></div>
        <div class="c-terrain">Right-click with your troops selected to attack this formation.</div>`;
    }
    card.querySelectorAll('[data-form]').forEach((b) => (b.onclick = () => setFormation(b.dataset.form)));
    const au = card.querySelector('[data-auto]');
    if (au) au.onclick = () => setFormation('auto');
    card.querySelectorAll('[data-stance]').forEach((b) => (b.onclick = () => setStance(b.dataset.stance)));
    const h = card.querySelector('[data-halt]');
    if (h) h.onclick = halt;
  }

  function updateTop() {
    const G = A.Game;
    el.clock.textContent = A.fmtClock(G.t);
    el.daypart.textContent = G.t < 720 ? 'in the morning' : G.t < 1050 ? 'in the afternoon' : 'in the evening';
    const E = G.env;
    el.weather.textContent = E.fog > 0.6 ? 'Thick fog lies in the Goldbach valley' : E.fog > 0 ? 'The fog is lifting — the sun breaks through' : E.light < 1 ? 'Dusk is falling over the field' : 'Clear and bitterly cold';
    let mf = 0;
    for (const u of G.units) if (u.side === 'F' && !u.dead) mf += u.men;
    el.menF.textContent = A.fmtNum(mf);
    el.lossA.textContent = A.fmtNum(G.stats.loss.A);
    let p = 0, tot = 0;
    for (const o of G.objectives) { tot += o.pts; if (o.owner === 'F') p += o.pts; }
    el.obj.textContent = `${p} / ${tot}`;
  }

  // ---------- dispatches & banners ----------
  function dispatch(author, text, kind = 'info', loc = null) {
    if (!A.Game || !el.disp) return;
    const t = A.Game.t;
    const prev = lastDisp.get(text);
    if (prev != null && t - prev < 5) return;
    lastDisp.set(text, t);
    const d = document.createElement('div');
    d.className = 'disp ' + kind;
    d.innerHTML = `<div class="d-head"><span class="d-time">${A.fmtClock(t)}</span><span class="d-auth">${author}</span></div><div class="d-text">${text}</div>`;
    if (loc) { d.classList.add('loc'); d.onclick = () => centerOn(loc.x, loc.y); }
    el.disp.prepend(d);
    while (el.disp.children.length > 40) el.disp.lastChild.remove();
  }
  function banner(title, text) {
    bannerQ.push([title, text]);
    if (!bannerBusy) nextBanner();
  }
  function nextBanner() {
    const b = bannerQ.shift();
    if (!b) { bannerBusy = false; return; }
    bannerBusy = true;
    el.banner.querySelector('.b-title').textContent = b[0];
    el.banner.querySelector('.b-text').textContent = b[1];
    el.banner.classList.remove('hidden');
    el.banner.classList.remove('show');
    void el.banner.offsetWidth;
    el.banner.classList.add('show');
    setTimeout(() => { el.banner.classList.add('hidden'); el.banner.classList.remove('show'); setTimeout(nextBanner, 400); }, 7000);
  }

  function toggleHelp(force) {
    const h = $('help');
    const show = force != null ? force : h.classList.contains('hidden');
    h.classList.toggle('hidden', !show);
  }

  // ---------- frame ----------
  function frame(dt) {
    if (!A.Game) return;
    const sp = (700 * dt) / R.cam.z;
    if (keys.has('w') || keys.has('arrowup')) R.cam.y -= sp;
    if (keys.has('s') || keys.has('arrowdown')) R.cam.y += sp;
    if (keys.has('a') || keys.has('arrowleft')) R.cam.x -= sp;
    if (keys.has('d') || keys.has('arrowright')) R.cam.x += sp;
    R.clampCam();
    domAcc += dt;
    if (domAcc > 0.2) { domAcc = 0; updateTop(); updateOOB(); updateCard(); }
  }

  function init() {
    el = {
      card: $('card'), oobList: $('oob-list'), disp: $('disp-list'), banner: $('banner'), tooltip: $('tooltip'),
      clock: $('clock'), daypart: $('daypart'), weather: $('weather'), menF: $('men-f'), lossA: $('loss-a'), obj: $('obj-score'),
    };
    bindInput($('map'));
    const mm = $('minimap');
    let mmDown = false;
    const mmMove = (e) => {
      const r = mm.getBoundingClientRect();
      centerOn(((e.clientX - r.left) / r.width) * A.MAP.W, ((e.clientY - r.top) / r.height) * A.MAP.H);
    };
    mm.addEventListener('mousedown', (e) => { mmDown = true; mmMove(e); });
    window.addEventListener('mousemove', (e) => mmDown && mmMove(e));
    window.addEventListener('mouseup', () => (mmDown = false));
    document.querySelectorAll('#speed button').forEach((b) => (b.onclick = () => A.setSpeed(+b.dataset.speed)));
    $('btn-help').onclick = () => toggleHelp();
    $('help').onclick = (e) => { if (e.target.id === 'help' || e.target.dataset.close != null) toggleHelp(false); };
    $('btn-end').onclick = () => { if (confirm('End the battle now and assess the result?')) A.endGame('time'); };
    $('oob-toggle').onclick = () => $('oob').classList.toggle('collapsed');
    $('disp-toggle').onclick = () => $('dispatches').classList.toggle('collapsed');
  }

  return {
    init, frame, dispatch, banner, buildOOB, centerOn, toggleHelp,
    state: S,
    onUnitDead(u) {
      S.selected = S.selected.filter((x) => x !== u);
      if (S.inspect === u) S.inspect = null;
      if (S.hover === u) S.hover = null;
    },
    setSpeedButtons(s) { document.querySelectorAll('#speed button').forEach((b) => b.classList.toggle('on', +b.dataset.speed === s)); },
  };
})();
