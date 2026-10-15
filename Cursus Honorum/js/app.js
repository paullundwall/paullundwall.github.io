(function () {
  const STORAGE_KEY = "cursusHonorum.character";
  const $ = (sel) => document.querySelector(sel);
  const ALL_SLIDERS = CH.SLIDER_GROUPS.flatMap((g) => g.sliders);

  function defaultCharacter() {
    return {
      gens: "Julia",
      praenomen: "Gaius",
      cognomen: "Caesar",
      face: Object.fromEntries(ALL_SLIDERS.map((s) => [s.key, 50])),
      hair: "full",
      beard: "none",
      hairColor: "darkbrown",
      eyeColor: "brown",
      skin: "light",
      traits: ["ambitious", "clement", "spendthrift", "rake"],
    };
  }

  function loadCharacter() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && CH.getGens(saved.gens)) {
        const base = defaultCharacter();
        return { ...base, ...saved, face: { ...base.face, ...saved.face }, traits: saved.traits || base.traits };
      }
    } catch (e) {
      /* ignore corrupt saves */
    }
    return null;
  }

  let character = loadCharacter() || defaultCharacter();

  // ---------- Names ----------
  const toInscription = (s) => s.toUpperCase().replace(/J/g, "I").replace(/U/g, "V");

  function nameParts(c) {
    const gens = CH.getGens(c.gens);
    return { praenomen: c.praenomen, nomen: gens.nomen, cognomen: c.cognomen.trim(), agnomen: c.agnomen || "" };
  }

  function fullName(c) {
    const p = nameParts(c);
    return [p.praenomen, p.nomen, p.cognomen, p.agnomen].filter(Boolean).join(" ");
  }

  function inscription(c) {
    const p = nameParts(c);
    const abbr = CH.PRAENOMINA[p.praenomen].replace(/\.$/, "");
    return [abbr, p.nomen, p.cognomen, p.agnomen].filter(Boolean).map(toInscription).join(" · ");
  }

  CH.toInscription = toInscription;
  CH.fullName = fullName;
  CH.inscription = inscription;

  const isValidCognomen = (s) => s.trim() === "" || /^[A-Za-z]+$/.test(s.trim());

  // ---------- Screens ----------
  function show(screen) {
    document.querySelectorAll(".screen").forEach((el) => el.classList.remove("active"));
    $(`#screen-${screen}`).classList.add("active");
    window.scrollTo(0, 0);
    if (screen === "home") updateContinue();
    if (screen === "creator") refreshCreator();
    if (screen === "senate") CH.Game.renderSenate();
    if (screen === "game") CH.Game.render();
    if (screen === "end") CH.Game.renderEnd();
  }
  CH.show = show;

  document.addEventListener("click", (e) => {
    const target = e.target.closest("[data-goto]");
    if (target) show(target.dataset.goto);
  });

  function updateContinue() {
    $("#btn-continue").classList.toggle("hidden", !CH.Game.hasSave());
  }

  // ---------- Home ----------
  function buildLaurel() {
    const svg = $("#laurel");
    const cx = 100, cy = 100, R = 72;
    let out = `<defs><linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f3dc8a"/><stop offset="100%" stop-color="#a77d17"/></linearGradient></defs>`;
    for (const side of [-1, 1]) {
      const angles = Array.from({ length: 11 }, (_, i) => Math.PI / 2 - side * (0.06 + i * 0.075) * Math.PI);
      const stem = angles.map((a, i) => `${i ? "L" : "M"} ${(cx + R * Math.cos(a)).toFixed(1)} ${(cy + R * Math.sin(a)).toFixed(1)}`);
      out += `<path d="${stem.join(" ")}" fill="none" stroke="#b08a22" stroke-width="2.5" stroke-linejoin="round"/>`;
      for (const a of angles) {
        const px = cx + R * Math.cos(a);
        const py = cy + R * Math.sin(a);
        const tangent = (a * 180) / Math.PI + (side > 0 ? -90 : 90);
        for (const off of [-1, 1]) {
          const lx = px + off * 9 * Math.cos(a);
          const ly = py + off * 9 * Math.sin(a);
          const rot = tangent + off * side * 28;
          out += `<ellipse cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" rx="11" ry="4.6" fill="url(#leaf)"
            stroke="#7a5a0e" stroke-width="0.8" transform="rotate(${rot.toFixed(1)} ${lx.toFixed(1)} ${ly.toFixed(1)})"/>`;
        }
      }
    }
    out += `<path d="M 88 176 q 12 10 24 0 q -6 12 -12 18 q -6 -6 -12 -18 Z" fill="#8b1e1e"/>`;
    svg.innerHTML = out;
  }

  $("#btn-start").addEventListener("click", () => {
    character = defaultCharacter();
    show("creator");
  });
  $("#btn-continue").addEventListener("click", () => {
    if (CH.Game.load()) show(CH.Game.needsPosting() ? "senate" : "game");
  });

  // ---------- Creator: tabs ----------
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t === tab));
      document.querySelectorAll(".tab-panel").forEach((p) =>
        p.classList.toggle("active", p.dataset.panel === tab.dataset.tab)
      );
    });
  });

  // ---------- Creator: name & gens ----------
  function buildGensGrid() {
    $("#gens-grid").innerHTML = CH.GENTES.map(
      (g) => `<button class="gens-card" data-gens="${g.id}">
        <span class="gens-name">${g.id}</span>
        <span class="gens-status">${g.status}</span>
      </button>`
    ).join("");
    $("#gens-grid").addEventListener("click", (e) => {
      const card = e.target.closest("[data-gens]");
      if (card) selectGens(card.dataset.gens);
    });
  }

  function selectGens(id) {
    const prev = CH.getGens(character.gens);
    const next = CH.getGens(id);
    // Swap in the new family's signature cognomen unless the player typed their own.
    if (character.cognomen === "" || prev.cognomina.includes(character.cognomen)) {
      character.cognomen = next.cognomina[0];
    }
    character.gens = id;
    refreshCreator();
  }

  function buildPraenomenSelect() {
    const gens = CH.getGens(character.gens);
    const customary = gens.praenomina;
    const others = Object.keys(CH.PRAENOMINA).filter((p) => !customary.includes(p));
    const opt = (p) => `<option value="${p}">${p} (${CH.PRAENOMINA[p]})</option>`;
    const sel = $("#praenomen");
    sel.innerHTML = `<optgroup label="Customary in the gens ${gens.id}">${customary.map(opt).join("")}</optgroup>
      <optgroup label="Other praenomina">${others.map(opt).join("")}</optgroup>`;
    sel.value = character.praenomen;
  }

  $("#praenomen").addEventListener("change", (e) => {
    character.praenomen = e.target.value;
    updateNameplate();
  });

  function buildCognomenChips() {
    const gens = CH.getGens(character.gens);
    const chips = gens.cognomina
      .map((c) => `<button class="chip${c === character.cognomen ? " active" : ""}" data-cog="${c}">${c}</button>`)
      .join("");
    $("#cognomen-chips").innerHTML =
      chips + `<button class="chip chip-none${character.cognomen === "" ? " active" : ""}" data-cog="">No cognomen</button>`;
  }

  $("#cognomen-chips").addEventListener("click", (e) => {
    const chip = e.target.closest("[data-cog]");
    if (!chip) return;
    character.cognomen = chip.dataset.cog;
    $("#cognomen").value = character.cognomen;
    validateCognomen();
    buildCognomenChips();
    updateNameplate();
  });

  $("#cognomen").addEventListener("input", (e) => {
    let v = e.target.value.replace(/\s+/g, "");
    if (v) v = v.charAt(0).toUpperCase() + v.slice(1);
    e.target.value = v;
    character.cognomen = v;
    validateCognomen();
    buildCognomenChips();
    updateNameplate();
  });

  function validateCognomen() {
    const ok = isValidCognomen(character.cognomen);
    $("#cognomen").classList.toggle("invalid", !ok);
    $("#cognomen-error").classList.toggle("hidden", ok);
    $("#btn-confirm").disabled = !ok;
    return ok;
  }

  // ---------- Creator: face sliders ----------
  function setFill(input) {
    input.style.setProperty("--fill", input.value + "%");
  }

  function buildSliders() {
    $("#sliders").innerHTML = CH.SLIDER_GROUPS.map(
      (g) => `<div class="slider-group">
        <h3 class="section-title">${g.title}</h3>
        <div class="slider-grid">
          ${g.sliders
            .map(
              (s) => `<div class="slider-row">
                <label for="sl-${s.key}">${s.label}<span class="slider-value" id="val-${s.key}"></span></label>
                <input type="range" id="sl-${s.key}" data-key="${s.key}" min="0" max="100" step="1" />
                <div class="slider-ends"><span>${s.min}</span><span>${s.max}</span></div>
              </div>`
            )
            .join("")}
        </div>
      </div>`
    ).join("");

    $("#sliders").addEventListener("input", (e) => {
      const key = e.target.dataset.key;
      if (!key) return;
      character.face[key] = Number(e.target.value);
      setFill(e.target);
      $(`#val-${key}`).textContent = e.target.value;
      updatePortrait();
    });
    $("#sliders").addEventListener("dblclick", (e) => {
      const key = e.target.dataset && e.target.dataset.key;
      if (!key) return;
      character.face[key] = 50;
      syncSliders();
      updatePortrait();
    });
  }

  function syncSliders() {
    ALL_SLIDERS.forEach((s) => {
      const input = $(`#sl-${s.key}`);
      input.value = character.face[s.key];
      setFill(input);
      $(`#val-${s.key}`).textContent = character.face[s.key];
    });
  }

  // ---------- Creator: hair & eyes ----------
  function buildSegmented(container, options, field) {
    const el = $(container);
    el.innerHTML = options.map((o) => `<button data-value="${o.id}">${o.label}</button>`).join("");
    el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-value]");
      if (!b) return;
      character[field] = b.dataset.value;
      syncAppearanceControls();
      updatePortrait();
    });
  }

  function buildSwatches(container, colors, field) {
    const el = $(container);
    el.innerHTML = colors
      .map(
        (c) => `<button class="swatch" data-value="${c.id}" title="${c.label}">
          <span class="swatch-dot" style="background:${c.hex}"></span>${c.label}
        </button>`
      )
      .join("");
    el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-value]");
      if (!b) return;
      character[field] = b.dataset.value;
      syncAppearanceControls();
      updatePortrait();
    });
  }

  function syncAppearanceControls() {
    const mark = (container, value) =>
      document.querySelectorAll(`${container} [data-value]`).forEach((b) =>
        b.classList.toggle("active", b.dataset.value === value)
      );
    mark("#hair-style", character.hair);
    mark("#beard-style", character.beard);
    mark("#hair-colors", character.hairColor);
    mark("#eye-colors", character.eyeColor);
    mark("#skin-tones", character.skin);
  }

  // ---------- Creator: character traits ----------
  function buildTraitList() {
    $("#trait-list").innerHTML = CH.TRAIT_CATEGORIES.map(
      (cat) => `<div class="trait-group">
        <h3 class="section-title">${cat.label} <em>${cat.latin}</em></h3>
        <div class="trait-grid">
          ${CH.TRAITS.filter((t) => t.cat === cat.id)
            .map(
              (t) => `<button class="trait-card" data-trait="${t.id}" data-tip-trait="${t.id}">
                <span class="trait-head">
                  <span class="trait-name">${t.name}</span>
                  <span class="trait-cost ${t.cost > 0 ? "virtue" : t.cost < 0 ? "flaw" : ""}">${t.cost > 0 ? "costs " + t.cost : t.cost < 0 ? "grants " + -t.cost : "free"}</span>
                </span>
                <span class="trait-latin">${t.latin}</span>
                <span class="trait-desc">${t.desc}</span>
                <span class="trait-perk">${t.perk}</span>
                ${t.fx ? `<span class="fx">${CH.fxSummary(t.fx)}</span>` : ""}
                <span class="trait-blocker"></span>
              </button>`
            )
            .join("")}
        </div>
      </div>`
    ).join("");
    $("#trait-list").addEventListener("click", (e) => {
      const card = e.target.closest("[data-trait]");
      if (!card) return;
      const id = card.dataset.trait;
      if (character.traits.includes(id)) character.traits = character.traits.filter((t) => t !== id);
      else if (!CH.traitBlocker(character, id)) character.traits = [...character.traits, id];
      updateTraits();
    });
  }

  function updateTraits() {
    const free = !!character.unbounded;
    $("#trait-points").textContent = free ? "∞" : CH.traitPointsLeft(character);
    $("#trait-count").textContent = free ? `${character.traits.length} traits · no limits` : `${character.traits.length} of ${CH.MAX_TRAITS} traits`;
    $("#btn-unbounded").classList.toggle("active", free);
    $("#btn-unbounded").setAttribute("aria-pressed", free);
    $("#traits-hint").innerHTML = free
      ? "Fortuna smiles on you: take as many traits as you like, whatever they cost. Only traits that contradict each other are refused."
      : "Virtues cost Fortuna; flaws give some back. Choose up to six. Your face speaks for itself: traits written on it are added for free.";
    document.querySelectorAll(".trait-card").forEach((card) => {
      const id = card.dataset.trait;
      const selected = character.traits.includes(id);
      const blocker = selected ? null : CH.traitBlocker(character, id);
      card.classList.toggle("selected", selected);
      card.classList.toggle("blocked", !!blocker);
      card.querySelector(".trait-blocker").textContent = blocker || "";
    });

    const face = CH.faceTraits(character);
    $("#face-traits").innerHTML = face.length
      ? face.map((t) => `<div class="face-trait" data-tip-trait="${t.id}"><b>${t.name}</b> ${t.desc}${t.fx ? ` <span class="fx">${CH.fxSummary(t.fx)}</span>` : ""}</div>`).join("")
      : `<p class="hint">Nothing remarkable. Shape the face to reveal more: a scowl, a great nose, a heavy jaw…</p>`;

    const { stats } = CH.startingProfile(character);
    const base = CH.baseQualities(character);
    $("#quality-preview").innerHTML = CH.QUALITIES.map((q) => {
      const d = stats[q.key] - base[q.key];
      const cls = d === 0 ? "" : (d > 0) !== !!q.bad ? "up" : "down";
      return `<div class="qp ${q.bad ? "qp-bad" : ""}" title="${q.desc}">
        <span class="qp-label">${q.label} <em>${q.latin}</em></span>
        <span class="qp-value">${stats[q.key]}${d ? ` <small class="${cls}">${d > 0 ? "+" : "−"}${Math.abs(d)}</small>` : ""}</span>
        <span class="qp-bar"><span style="width:${stats[q.key]}%"></span></span>
      </div>`;
    }).join("");
  }

  function randomTraits() {
    const target = 2 + Math.floor(Math.random() * 4);
    const pool = [...CH.TRAITS].sort(() => Math.random() - 0.5);
    character.traits = [];
    for (const t of pool) {
      if (character.traits.length >= target) break;
      if (!CH.traitBlocker(character, t.id)) character.traits.push(t.id);
    }
  }

  $("#btn-random-traits").addEventListener("click", () => {
    randomTraits();
    updateTraits();
  });
  $("#btn-unbounded").addEventListener("click", () => {
    character.unbounded = !character.unbounded;
    if (!character.unbounded) {
      // Back within the rules: drop the latest picks until the choice is legal again.
      while (character.traits.length > CH.MAX_TRAITS || CH.traitPointsLeft(character) < 0) character.traits.pop();
    }
    updateTraits();
  });
  $("#btn-clear-traits").addEventListener("click", () => {
    character.traits = [];
    updateTraits();
  });

  // ---------- Randomise / reset ----------
  const pick = (weighted) => {
    const total = weighted.reduce((s, [, w]) => s + w, 0);
    let roll = Math.random() * total;
    for (const [v, w] of weighted) if ((roll -= w) < 0) return v;
    return weighted[0][0];
  };

  $("#btn-random").addEventListener("click", () => {
    ALL_SLIDERS.forEach((s) => {
      const roll = (Math.random() + Math.random() + Math.random()) / 3;
      const [lo, hi] = s.randomRange || [0, 100];
      character.face[s.key] = Math.round(lo + roll * (hi - lo));
    });
    character.hair = pick([["full", 6], ["balding", 2.5], ["bald", 1.5]]);
    character.beard = pick([["none", 6], ["stubble", 2.5], ["full", 1.5]]);
    character.hairColor = pick([
      ["black", 4], ["darkbrown", 5], ["chestnut", 3], ["auburn", 1.5],
      ["bronze", 1], ["fair", 1], ["grey", 0.6], ["white", 0.2],
    ]);
    character.skin = pick([["pale", 1], ["fair", 2], ["light", 4], ["olive", 4], ["tanned", 2.5]]);
    character.eyeColor = pick([
      ["darkbrown", 5], ["brown", 5], ["hazel", 2.5], ["green", 1.2], ["grey", 1], ["blue", 1],
    ]);
    syncSliders();
    syncAppearanceControls();
    updatePortrait();
  });

  $("#btn-random-name").addEventListener("click", () => {
    const gens = CH.GENTES[Math.floor(Math.random() * CH.GENTES.length)];
    const any = (list) => list[Math.floor(Math.random() * list.length)];
    character.gens = gens.id;
    character.praenomen = Math.random() < 0.85 ? any(gens.praenomina) : any(Object.keys(CH.PRAENOMINA));
    character.cognomen = Math.random() < 0.9 ? any(gens.cognomina) : "";
    refreshCreator();
  });

  $("#btn-reset").addEventListener("click", () => {
    character = defaultCharacter();
    refreshCreator();
  });

  // ---------- Rendering ----------
  let portraitFrame = 0;
  function updatePortrait() {
    cancelAnimationFrame(portraitFrame);
    portraitFrame = requestAnimationFrame(() => {
      $("#portrait").innerHTML = CH.renderCharacter(character);
      updateTraits();
    });
  }

  function updateNameplate() {
    const gens = CH.getGens(character.gens);
    $("#np-full").textContent = fullName(character);
    $("#np-inscription").textContent = inscription(character);
    $("#np-status").textContent = `Gens ${gens.id} · ${gens.status}`;
    $("#nomen").textContent = gens.nomen;
  }

  function refreshCreator() {
    const gens = CH.getGens(character.gens);
    document.querySelectorAll(".gens-card").forEach((c) =>
      c.classList.toggle("selected", c.dataset.gens === gens.id)
    );
    $("#gens-info").innerHTML = `<strong>Gens ${gens.id}</strong> · <em>${gens.status}</em><br>${gens.desc}`;
    buildPraenomenSelect();
    $("#cognomen").value = character.cognomen;
    buildCognomenChips();
    validateCognomen();
    syncSliders();
    syncAppearanceControls();
    updateNameplate();
    updatePortrait();
  }

  // ---------- Confirm ----------
  $("#btn-confirm").addEventListener("click", () => {
    if (!validateCognomen()) {
      document.querySelector('.tab[data-tab="name"]').click();
      return;
    }
    character.cognomen = character.cognomen.trim();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(character));
    CH.Game.start(character);
    show("senate");
  });

  // ---------- Tooltips ----------
  const tip = document.createElement("div");
  tip.className = "tooltip hidden";
  document.body.appendChild(tip);
  let tipFor = null;
  let tipTimer = null;

  function tipContent(el) {
    if (el.dataset.tipTrait) {
      const t = CH.getTrait(el.dataset.tipTrait);
      return t ? CH.traitTip(t, el.dataset.tipWho === "persona") : "";
    }
    if (el.dataset.tipRel) return CH.Game.relationTip(el.dataset.tipRel);
    if (el.dataset.tipNick) return CH.Game.nickTip(+el.dataset.tipNick);
    return "";
  }

  function showTip(el) {
    const html = tipContent(el);
    if (!html) return;
    tipFor = el;
    tip.innerHTML = html;
    tip.classList.remove("hidden");
    const r = el.getBoundingClientRect();
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    const left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2));
    const top = r.top - h - 10 >= 8 ? r.top - h - 10 : Math.min(window.innerHeight - h - 8, r.bottom + 10);
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  }

  function hideTip() {
    clearTimeout(tipTimer);
    tipFor = null;
    tip.classList.add("hidden");
  }

  const TIP_TARGET = "[data-tip-trait],[data-tip-rel],[data-tip-nick]";
  document.addEventListener("mouseover", (e) => {
    const el = e.target.closest(TIP_TARGET);
    if (el === tipFor) return;
    hideTip();
    if (el) tipTimer = setTimeout(() => showTip(el), el.classList.contains("trait-card") ? 450 : 120);
  });
  document.addEventListener("click", (e) => {
    const el = e.target.closest(TIP_TARGET);
    if (!el || el === tipFor) return hideTip();
    if (window.matchMedia("(hover: none)").matches) showTip(el);
    else hideTip();
  });
  window.addEventListener("scroll", hideTip, { passive: true });

  // ---------- Init ----------
  buildLaurel();
  buildGensGrid();
  buildSliders();
  buildTraitList();
  buildSegmented("#hair-style", CH.HAIR_STYLES, "hair");
  buildSegmented("#beard-style", CH.BEARD_STYLES, "beard");
  buildSwatches("#hair-colors", CH.HAIR_COLORS, "hairColor");
  buildSwatches("#eye-colors", CH.EYE_COLORS, "eyeColor");
  buildSwatches("#skin-tones", CH.SKIN_TONES, "skin");
  updateContinue();
})();
