window.CH = window.CH || {};

(function () {
  const SAVE_KEY = "cursusHonorum.game";
  const BASE_ACTIONS = 3;
  const START_YEAR = -70;

  const $ = (s) => document.querySelector(s);
  const rand = (a, b) => a + Math.random() * (b - a);
  const randi = (a, b) => Math.floor(rand(a, b + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
  const roll = (p) => Math.random() < clamp(p, 0.03, 0.97);

  let g = null;

  // ---------- Reference data ----------
  const OFFICES = {
    quaestor: { label: "Quaestor", latin: "QVAESTOR", points: 1 },
    aedile: { label: "Aedile", latin: "AEDILIS", points: 2 },
    tribune: { label: "Tribune of the Plebs", latin: "TRIBVNVS PLEBIS", points: 2 },
    praetor: { label: "Praetor", latin: "PRAETOR", points: 3 },
    consul: { label: "Consul", latin: "CONSVL", points: 6 },
    censor: { label: "Censor", latin: "CENSOR", points: 6 },
    propraetor: { label: "Propraetor", latin: "PRO PRAETORE", points: 1 },
    proconsul: { label: "Proconsul", latin: "PRO CONSVLE", points: 2 },
  };
  const MAGISTRACIES = ["quaestor", "aedile", "tribune", "praetor", "consul", "censor"];
  const SEATS = { aedile: 4, tribune: 10, praetor: 8, consul: 2, censor: 2 };

  const PROVINCES = [
    { name: "Sicily", latin: "SICILIAM" },
    { name: "Nearer Spain", latin: "HISPANIAM CITERIOREM" },
    { name: "Further Spain", latin: "HISPANIAM VLTERIOREM" },
    { name: "Macedonia", latin: "MACEDONIAM" },
    { name: "Asia", latin: "ASIAM" },
    { name: "Africa", latin: "AFRICAM" },
    { name: "Cilicia", latin: "CILICIAM" },
    { name: "Cisalpine Gaul", latin: "GALLIAM CISALPINAM" },
    { name: "Transalpine Gaul", latin: "GALLIAM TRANSALPINAM" },
    { name: "Sardinia", latin: "SARDINIAM" },
    { name: "Bithynia", latin: "BITHYNIAM" },
  ];

  const POSTS = {
    urban: {
      label: "Urban quaestor",
      desc: "Keep the keys of the treasury beneath the Temple of Saturn. Dull, respectable, and within earshot of the Senate.",
      hint: "+Authority",
      fx: { senatus: 5 },
    },
    provincial: {
      label: "Provincial quaestor",
      desc: "Serve as paymaster to a governor abroad. Legions, plunder, and a great deal of temptation.",
      hint: "+Glory",
      fx: { gloria: 6 },
    },
    ostia: {
      label: "Quaestor at Ostia",
      desc: "Keep Rome fed by overseeing the grain fleets at its port. The people never forget a full belly.",
      hint: "+Popularity",
      fx: { populus: 5 },
    },
  };

  // Thousands of sesterces.
  const WEALTH = {
    Aemilia: 800, Caecilia: 1000, Claudia: 800, Cornelia: 900, Domitia: 1100, Fabia: 700, Julia: 500, Junia: 700,
    Licinia: 1500, Manlia: 600, Porcia: 500, Sempronia: 600, Sergia: 300, Servilia: 1000, Sulpicia: 700, Valeria: 800,
  };

  const LAWS = [
    { id: "agraria", adj: "Agraria", acc: "AGRARIAM", desc: "Distribute public land to poor citizens and veterans.", hostility: 0.9, fx: { populus: 14, senatus: -12, clients: 25, dignitas: 4 } },
    { id: "frumentaria", adj: "Frumentaria", acc: "FRVMENTARIAM", desc: "Sell grain to every citizen at a low, fixed price.", hostility: 0.6, fx: { populus: 10, senatus: -6 } },
    { id: "civitas", adj: "de Civitate", acc: "DE CIVITATE TRANSPADANORVM", desc: "Grant full citizenship to the Latin towns beyond the Po.", hostility: 0.5, fx: { clients: 40, dignitas: 6, senatus: -5, populus: -2 } },
    { id: "repetundae", adj: "de Repetundis", acc: "DE REPETVNDIS", desc: "Tighten the courts that try governors for plundering their provinces.", hostility: 0.4, fx: { dignitas: 6, populus: 4, senatus: -4 } },
    { id: "ambitus", adj: "de Ambitu", acc: "DE AMBITV", desc: "Punish bribery at elections with exile.", hostility: 0.2, fx: { dignitas: 5, senatus: 4 } },
    { id: "tabulae", adj: "de Aere Alieno", acc: "DE AERE ALIENO", desc: "Tabulae novae: wipe the slate clean for every debtor in Rome, yourself included.", hostility: 1, fx: { populus: 16, senatus: -16 }, cancelDebt: true },
    { id: "sumptuaria", adj: "Sumptuaria", acc: "SVMPTVARIAM", desc: "Limit the extravagance of banquets and funerals.", hostility: 0.1, fx: { senatus: 5, dignitas: 3, populus: -3 } },
  ];

  const RIVAL_PRAENOMINA = ["Gaius", "Lucius", "Marcus", "Publius", "Quintus", "Gnaeus", "Titus", "Aulus", "Decimus", "Servius"];
  const RIVAL_NOMINA = ["Pompeius", "Tullius", "Antonius", "Calpurnius", "Aurelius", "Lutatius", "Hortensius", "Marcius", "Octavius", "Cassius", "Gabinius", "Memmius", "Popillius", "Lollius", "Cornelius", "Caecilius", "Claudius", "Servilius", "Valerius", "Junius", "Domitius", "Fabius", "Aemilius", "Licinius", "Sulpicius", "Manlius", "Sergius"];
  const RIVAL_COGNOMINA = ["Piso", "Rufus", "Bibulus", "Varro", "Gallus", "Longinus", "Lepidus", "Murena", "Silanus", "Nepos", "Celer", "Hybrida", "Balbus", "Flaccus", "Glabrio", "Scaurus", "Lentulus", "Cotta", "Paetus"];
  const rivalName = () => `${pick(RIVAL_PRAENOMINA)} ${pick(RIVAL_NOMINA)} ${pick(RIVAL_COGNOMINA)}`;

  const LABELS = { ...CH.QUALITY_SHORT, wealth: "Wealth", debt: "Debt", health: "Health" };
  const BAD_WHEN_UP = ["infamia", "debt"];

  // ---------- Small helpers ----------
  const yearOf = (turn) => {
    const y = START_YEAR + turn;
    return y >= 0 ? y + 1 : y;
  };
  const aucOf = (turn) => 684 + turn;
  const yearLabel = (turn) => {
    const y = yearOf(turn);
    return y < 0 ? `${-y} BC` : `AD ${y}`;
  };
  const fmtHS = (k) => `${Math.round(k * 1000).toLocaleString("en-GB")} HS`;

  function roman(n) {
    const map = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
    let out = "";
    for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
    return out;
  }

  const gens = () => CH.getGens(g.char.gens);
  const isPatrician = () => gens().status === "Patrician";
  const hasTrait = (id) => g.traitIds.includes(id);
  const mod = (key) => g.traitIds.reduce((s, id) => s + ((CH.getTrait(id) || {}).mods?.[key] || 0), 0);
  const actionsPerYear = () => BASE_ACTIONS + mod("actions");
  const adjCost = (cost) => Math.round(cost * (1 + mod("spend")));
  const cun = () => g.stats.calliditas / 100;
  const pie = () => g.stats.pietas / 100;
  const elo = () => g.stats.eloquentia / 100;
  const name = () => CH.fullName(g.char);
  const held = (office) => g.history.filter((h) => h.office === office);

  function fx(changes) {
    const parts = [];
    for (const [k, v] of Object.entries(changes)) {
      if (!v) continue;
      let d = v;
      if (k in g.stats) {
        const before = g.stats[k];
        g.stats[k] = clamp(before + v);
        d = g.stats[k] - before;
      } else if (k === "health") {
        const before = g.health;
        g.health = clamp(before + v);
        d = g.health - before;
      } else {
        const before = g[k];
        g[k] = Math.max(0, before + v);
        d = g[k] - before;
      }
      if (!d) continue;
      const good = BAD_WHEN_UP.includes(k) ? d < 0 : d > 0;
      const amount = k === "wealth" || k === "debt" ? fmtHS(Math.abs(d)) : Math.abs(Math.round(d));
      parts.push(`<b class="${good ? "up" : "down"}">${LABELS[k]} ${d > 0 ? "+" : "−"}${amount}</b>`);
    }
    return parts.length ? ` <span class="fx">${parts.join(" ")}</span>` : "";
  }

  // Pays a cost, borrowing any shortfall at a punishing rate.
  function spend(cost) {
    cost = adjCost(cost);
    if (g.wealth >= cost) return fx({ wealth: -cost });
    const shortfall = cost - g.wealth;
    return fx({ wealth: -g.wealth, debt: Math.round(shortfall * 1.2) });
  }

  // Things worth remembering at the funeral.
  function remember(kind, data = {}) {
    g.memories = g.memories || [];
    g.memories.push({ kind, turn: g.turn, age: g.age, ...data });
  }
  const plain = (html) => String(html).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

  function log(text) {
    g.log.unshift({ turn: g.turn, text });
    g.log = g.log.slice(0, 80);
  }

  // ---------- Appearance and nicknames ----------
  const TRIUMPH_NAMES = {
    Sicily: "Siculus", "Nearer Spain": "Hispanicus", "Further Spain": "Hispanicus", Macedonia: "Macedonicus", Asia: "Asiaticus",
    Africa: "Africanus", Cilicia: "Isauricus", "Cisalpine Gaul": "Gallicus", "Transalpine Gaul": "Gallicus", Sardinia: "Sardus", Bithynia: "Bithynicus",
  };
  const TRAIT_NICKS = {
    witty: ["Lepidus", "for your wit", "praise"],
    charming: ["Blandus", "for your honeyed manner", "praise"],
    gambler: ["Aleator", "for your love of the dice", "mock"],
    rake: ["Trossulus", "for your perfume and your affairs", "mock"],
    gourmand: ["Apicius", "after the famous glutton, for your table", "mock"],
    tireless: ["Impiger", "because you never seem to sleep", "praise"],
    learned: ["Doctus", "for your learning", "praise"],
    cunning: ["Vafer", "for your slyness", "mock"],
    jurist: ["Prudens", "for your knowledge of the law", "praise"],
    ruthless: ["Saevus", "for your cruelty", "mock"],
    clement: ["Clemens", "for your mercy", "praise"],
    greedy: ["Avarus", "for your greed", "mock"],
    irascible: ["Ferox", "for your temper", "mock"],
    coward: ["Timidus", "for your caution, they say, to be polite", "mock"],
    spendthrift: ["Prodigus", "for your way with money", "mock"],
    earlyriser: ["Gallus", "the rooster, because you are up before him", "praise"],
    writer: ["Scriptor", "for your endless pen", "praise"],
    athlete: ["Pugil", "the boxer, for your exercise on the Campus", "praise"],
    slow: ["Brutus", "the dullard, which is how the first Brutus got his name too", "mock"],
    robust: ["Taurus", "the bull, for your constitution", "praise"],
    voice: ["Tuba", "the trumpet, for your voice", "praise"],
    superstitious: ["Haruspex", "for consulting the entrails before breakfast", "mock"],
    impious: ["Atheus", "the godless, as the Greeks would say", "mock"],
    brave: ["Fortis", "for your courage", "praise"],
  };

  // Names the crowd might give you, from your face, your character and your deeds.
  function nicknameOptions() {
    const c = g.char;
    const f = agedChar().face;
    const s = g.stats;
    const k = (id) => (g.counts || {})[id] || 0;
    const out = [];
    const P = (n, why) => out.push([n, why, "praise"]);
    const M = (n, why) => out.push([n, why, "mock"]);
    // The face
    if (f.earSize >= 70 || f.earAngle >= 75) M("Flaccus", "for your flapping ears");
    if (f.noseSize >= 75) M("Naso", "for your noble nose");
    if (f.noseSize <= 25) M("Silus", "for your snub nose");
    if (f.squint <= 25 || f.squint >= 75) M("Strabo", "for your squint");
    else if (f.squint <= 40 || f.squint >= 60) M("Paetus", "for the slight cast in your eye");
    if (c.hair === "bald") M("Calvus", "for your gleaming pate");
    if (c.beard === "full") P("Barbatus", "for your beard");
    if (f.weight >= 75) M("Crassus", "for your girth");
    if (f.weight <= 15) M("Macer", "for your bony frame");
    if (["auburn", "bronze"].includes(c.hairColor)) P("Rufus", "for your red hair");
    if (c.hairColor === "fair") P("Flavus", "for your golden hair");
    if (c.skin === "pale") M("Albinus", "for your pallor");
    if (f.eyeRedness >= 70) M("Bibulus", "for your fondness for the cup");
    if (f.headWidth >= 75 || f.headLength >= 80) M("Capito", "for your large head");
    if (f.chinSize >= 80) M("Mento", "for your chin");
    if (f.eyeSize <= 20) M("Ocella", "for your little eyes");
    if (f.frown >= 82) P("Severus", "for your scowl");
    if (f.frown <= 15) P("Hilarus", "for your eternal grin");
    if (f.wrinkles >= 85) M("Rugosus", "for your wrinkles");
    // The character
    for (const t of CH.chosenTraits(c)) {
      if (t.nick) out.push([...t.nick, ["Balbus", "Bibulus", "Superbus"].includes(t.nick[0]) ? "mock" : "praise"]);
      if (TRAIT_NICKS[t.id]) out.push(TRAIT_NICKS[t.id]);
    }
    // The deeds
    for (const p of g.triumphs) if (TRIUMPH_NAMES[p]) P(TRIUMPH_NAMES[p], `for your triumph over ${p}`);
    if (g.victories >= 3 && !g.triumphs.length) P("Bellator", "for your many battles");
    if (k("extort") + k("purse") >= 2) M("Verres", "the boar, because you swept the provinces clean");
    if (k("justice") >= 3) P("Iustus", "for your just rule of the provinces");
    if (k("banquet") >= 5) M("Gurges", "the whirlpool, for your dinners");
    if (k("contio") >= 5) P("Rostralis", "because you practically live on the Rostra");
    if (k("senate") >= 6) P("Sapiens", "for your counsel in the Senate");
    if (k("defend") >= 4) P("Patronus", "for the citizens you have saved in court");
    if (k("prosecute") + k("p:Prosecute him") >= 2) M("Accusator", "for your appetite for prosecutions");
    if (k("borrow") >= 3 || g.debt >= 800) M("Decoctor", "the bankrupt, for your debts");
    if (k("estates") >= 5) P("Rusticus", "for your love of your farms");
    if (k("rhetoric") >= 3) M("Graeculus", "the little Greek, for your Rhodian airs");
    if (k("temple") >= 4) P("Pius", "for your sacrifices");
    if (k("plot") >= 3) M("Nocturnus", "for your midnight meetings");
    if (k("veto") >= 3) M("Intercessor", "for your veto, which is never far from your lips");
    if (k("streets") >= 3) M("Cloacarius", "the sewer man, for your devotion to the drains");
    if (k("games:Unforgettable")) P("Munificus", "for your unforgettable games");
    if (k("monument")) P("Aedificator", "for putting your name on the city");
    if (k("p:Attack him in the Senate") >= 3) M("Mordax", "for your biting tongue");
    if (k("p:Send him a gift") >= 4) M("Largitor", "for your generosity, which some call bribery");
    if (k("p:Dine together") >= 6) P("Hospes", "the host, since half the Senate has dined with you");
    if (g.laws.includes("tabulae")) P("Liberator", "for wiping out the debts of the poor");
    if (g.laws.includes("agraria") || g.laws.includes("frumentaria")) P("Publicola", "the people's friend, for your law");
    if (g.laws.includes("sumptuaria")) M("Censorinus", "for telling everyone else how to dine");
    // The reputation
    if (s.infamia >= 60) M("Sordidus", "for your reputation");
    if (s.populus >= 80) P("Deliciae", "the darling of the plebs");
    if (s.dignitas >= 80) P("Magnus", "the Great, only half in jest");
    if (s.calliditas >= 70) M("Vulpes", "the fox");
    if (s.gloria >= 70) P("Imperiosus", "for your commanding presence");
    if (g.wealth >= 3000) P("Dives", "the rich");
    if (g.enemies >= 5) M("Invisus", "for the enemies you collect");
    if (g.age >= 70) P("Senex", "because you simply refuse to die");
    const taken = [c.cognomen, c.agnomen, ...(g.nicknames || []).map((n) => n.name)];
    return out.filter(([n]) => !taken.includes(n));
  }

  const NICK_TRIUMPHAL = Object.values(TRIUMPH_NAMES);

  function mockedFeature(c) {
    const f = c.face;
    if (f.earSize >= 70 || f.earAngle >= 75) return "your ears";
    if (f.noseSize >= 70) return "your nose";
    if (f.weight >= 70) return "your belly";
    if (c.hair === "bald") return "your bald head";
    if (f.eyeRedness >= 65) return "your bloodshot eyes";
    if (f.squint <= 30 || f.squint >= 70) return "your wandering eye";
    return "your ancestors";
  }

  function agedChar() {
    const c = JSON.parse(JSON.stringify(g.char));
    c.face.wrinkles = Math.min(100, c.face.wrinkles + (g.age - 30) * 1.5);
    c.face.weight = clamp(c.face.weight + g.weightDelta);
    c.face.eyeRedness = clamp(c.face.eyeRedness + (g.rednessDelta || 0));
    if (g.age >= 68) c.hairColor = "white";
    else if (g.age >= 52 && !["grey", "white"].includes(c.hairColor)) c.hairColor = "grey";
    return c;
  }

  // ---------- Game lifecycle ----------
  function start(character) {
    const gn = CH.getGens(character.gens);
    const profile = CH.startingProfile(character);
    g = {
      char: JSON.parse(JSON.stringify(character)),
      turn: 0,
      age: 30,
      office: "quaestor",
      post: null,
      province: null,
      history: [],
      stats: profile.stats,
      wealth: WEALTH[gn.id] ?? 700,
      debt: 0,
      clients: profile.clients,
      health: 100,
      incomeMod: 0,
      actionsLeft: BASE_ACTIONS,
      flags: {},
      laws: [],
      triumphs: [],
      victories: 0,
      enemies: 0,
      conspiracy: { active: false, progress: 0, exposure: 0 },
      spouse: null,
      weightDelta: 0,
      rednessDelta: 0,
      pontifex: false,
      nicknames: character.agnomen ? [{ name: character.agnomen, why: "", tone: "praise", turn: 0, embraced: true }] : [],
      lastNickTurn: -9,
      counts: {},
      memories: [],
      tribe: pick(["Palatina", "Collina", "Esquilina", "Suburana", "Fabia", "Cornelia", "Sergia", "Aemilia", "Claudia", "Voltinia", "Falerna", "Pollia", "Romilia", "Galeria"]),
      fatherPraenomen: pick(gn.praenomina),
      traitIds: CH.activeTraits(character).map((t) => t.id),
      log: [],
      lastResult: null,
      ended: null,
    };
    g.actionsLeft = actionsPerYear();
    if (hasTrait("irascible")) g.enemies = 1;
    g.pendingFunerals = [];
    g.npcCandidates = [];
    createCast();
    setConsuls();
    save();
  }

  function save() {
    if (g) localStorage.setItem(SAVE_KEY, JSON.stringify(g));
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (saved && saved.char && !saved.ended) {
        saved.stats = { calliditas: 20, pietas: 25, ...saved.stats };
        saved.traitIds = saved.traitIds || (saved.traits || []).map((t) => t.id);
        g = saved;
        if (!g.personae) {
          g.pendingFunerals = [];
          createCast();
          setConsuls();
        }
        for (const n of g.personae) n.relLog = n.relLog || [];
        g.counts = g.counts || {};
        g.memories = g.memories || [];
        g.tribe = g.tribe || "Palatina";
        g.nicknames = g.nicknames || (g.char.agnomen ? [{ name: g.char.agnomen, why: "", tone: "praise", turn: g.turn, embraced: true }] : []);
        return true;
      }
    } catch (e) {
      /* ignore corrupt saves */
    }
    return false;
  }

  const hasSave = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
      return !!(saved && saved.char && !saved.ended);
    } catch (e) {
      return false;
    }
  };

  const needsPosting = () => g && !g.post;

  function endGame(kind, text) {
    g.ended = { kind, text, turn: g.turn, age: g.age };
    save();
  }

  // ---------- Modal ----------
  let relWhy = "";
  function modal({ kicker, title, body, choices, wide }) {
    const el = $("#modal");
    el.querySelector(".modal-card").classList.toggle("wide", !!wide);
    el.querySelector(".modal-purse").innerHTML =
      `<span>Wealth <b>${fmtHS(g.wealth)}</b></span><span>Debt <b class="${g.debt ? "neg" : ""}">${fmtHS(g.debt)}</b></span>` +
      `<span>Deeds left <b>${g.actionsLeft}</b></span>`;
    el.querySelector(".modal-kicker").textContent = kicker || yearLabel(g.turn);
    el.querySelector(".modal-title").textContent = title;
    el.querySelector(".modal-body").innerHTML = body;
    const list = el.querySelector(".modal-choices");
    list.innerHTML = "";
    choices.forEach((c) => {
      const b = document.createElement("button");
      b.className = "choice";
      b.disabled = !!c.disabled;
      b.innerHTML = `<span class="choice-label">${c.label}</span>${c.hint ? `<span class="choice-hint">${c.hint}</span>` : ""}`;
      b.addEventListener("click", () => {
        el.classList.add("hidden");
        const label = c.label.replace(/<[^>]+>/g, "");
        relWhy = wide ? label : `${title}: ${label}`;
        c.onChoose();
      });
      list.appendChild(b);
    });
    el.classList.remove("hidden");
  }

  const notice = (title, body, next, label = "Continue") =>
    modal({ title, body, choices: [{ label, onChoose: next }] });

  // ---------- Actions ----------
  const ENEMIES = {
    Sicily: ["runaway slaves in the hills of Enna", "Cilician pirates off Lilybaeum"],
    "Nearer Spain": ["Celtiberians", "Vaccaei"],
    "Further Spain": ["Lusitanians", "Callaeci"],
    Macedonia: ["Thracians", "Dardanians", "Bessi"],
    Asia: ["generals of Mithridates", "Galatian raiders"],
    Africa: ["Numidian raiders", "Gaetulian horsemen"],
    Cilicia: ["Isaurian hill tribes", "pirates of Coracesium"],
    "Cisalpine Gaul": ["Salassi", "Raeti"],
    "Transalpine Gaul": ["Allobroges", "Helvetii"],
    Sardinia: ["bandits of the Sardinian mountains"],
    Bithynia: ["Pontic cavalry"],
  };

  function campaign() {
    const place = g.province ? g.province.name : pick(["Thrace", "Illyricum", "Pontus"]);
    const enemy = pick(ENEMIES[place] || ["Thracians", "Dalmatians", "Mithridates"]);
    const p = 0.45 + g.stats.gloria / 250 + mod("campaign");
    g.weightDelta -= 1;
    if (roll(p)) {
      g.victories++;
      remember("battle", { won: true, enemy, place });
      return `The ${enemy} break before your legions. Your men carry your name in their marching songs.` +
        fx({ gloria: randi(10, 18), wealth: randi(30, 90), dignitas: 3 });
    }
    remember("battle", { won: false, enemy, place });
    return `The ${enemy} ambush your column in a narrow valley. You extricate the survivors, but the despatch to the Senate makes grim reading.` +
      fx({ gloria: -4, dignitas: -5, health: -10 });
  }

  const ACTIONS = [
    // Office duties
    { id: "audit", office: "quaestor", post: "urban", title: "Audit the treasury", desc: "Go through the ledgers of the aerarium line by line.", hint: "+Authority",
      run() {
        if (roll(0.3)) return "You uncover a scribe skimming from the public accounts. The Senate is impressed by your diligence." + fx({ senatus: 5, dignitas: 6 });
        return "The accounts balance, more or less." + fx({ senatus: 3 });
      } },
    { id: "legions", office: "quaestor", post: "provincial", title: "Serve with the legions", desc: "Ride out with the governor's army against the hill tribes.", hint: "+Glory · risky",
      run() {
        if (roll(0.8 + mod("campaign"))) return "You acquit yourself well in a skirmish." + fx({ gloria: Math.round(randi(5, 9) * (1 + mod("campaign") * 2)) });
        return "A sling stone finds you. You will carry the scar." + fx({ gloria: 3, health: -15 });
      } },
    { id: "purse", office: "quaestor", post: "provincial", title: "Line your purse", desc: "The provincials are rich and the governor looks the other way.", hint: "+Wealth · +Infamy",
      when: () => !mod("incorruptible"),
      run: () => "A few requisitions here, a few “gifts” there." + fx({ wealth: Math.round(randi(80, 150) * (1 + mod("greed"))), infamia: Math.round(randi(6, 10) * (1 - cun() / 2)) }) },
    { id: "grain", office: "quaestor", post: "ostia", title: "Hasten the grain fleet", desc: "Bully the shippers and clear the wharves at Ostia.", hint: "+Popularity",
      run: () => "The ships come in early and bread is cheap in the Subura." + fx({ populus: randi(4, 8) }) },
    { id: "games", office: "aedile", once: true, title: "Stage the public games", desc: "Every aedile is judged by his games. Every aedile also goes into debt for them.", hint: "++Popularity · costly", open: stageGames },
    { id: "streets", office: "aedile", title: "Clean the streets and sewers", desc: "Inspect the Cloaca Maxima and fine the shopkeepers who block the pavements.", hint: "+Popularity",
      run: () => "The Forum smells marginally better." + fx({ populus: randi(2, 5), dignitas: 1 }) },
    { id: "law", office: ["tribune", "consul"], once: true, title: "Propose a law", desc: "Put a bill before the people. Your nomen will be on it forever.", hint: "Reform · legacy", open: proposeLaw },
    { id: "veto", office: "tribune", title: "Veto a decree of the Senate", desc: "One word, veto, and the Senate's business stops.", hint: "+Popularity · −Authority",
      run: () => "You interpose your veto. The senators fume; the plebs cheer." + fx({ populus: randi(4, 7), senatus: -randi(5, 8), dignitas: 2 }) },
    { id: "courts", office: "praetor", title: "Preside over the courts", desc: "Sit on your curule chair in the Forum and dispense justice.", hint: "+Dignity",
      run: () => "Your judgements are sound and quickly given." + fx({ dignitas: randi(3, 6), eloquentia: 1 }) },
    { id: "edict", office: "praetor", once: true, title: "Publish your edict", desc: "Set out the legal remedies you will grant this year.", hint: "+Clients · +Authority",
      run: () => "Merchants and landowners study your edict, and many come to thank you." + fx({ clients: randi(4, 8), senatus: 2 }) },
    { id: "convene", office: "consul", title: "Convene the Senate", desc: "Set the agenda of the most powerful assembly in the world.", hint: "+Authority · +Dignity",
      run: () => "The house debates on your terms." + fx({ senatus: randi(4, 7), dignitas: 3 }) },
    { id: "army", office: "consul", once: true, title: "Take the field", desc: "Lead a consular army against Rome's enemies.", hint: "++Glory · risky", run: campaign },
    { id: "campaign", office: ["propraetor", "proconsul"], title: "Campaign against the tribes", desc: "Glory waits beyond the frontier. So does death.", hint: "++Glory · risky", run: campaign },
    { id: "extort", office: ["propraetor", "proconsul"], title: "Squeeze the provincials", desc: "Every governor needs three years: one to repay his debts, one to get rich, one to bribe the jury.", hint: "++Wealth · ++Infamy",
      when: () => !mod("incorruptible"),
      run: () => "Your agents strip the temples of their silver and the cities of their savings." + fx({ wealth: Math.round(randi(200, 400) * (1 + mod("greed"))), infamia: Math.round(randi(12, 18) * (1 - cun() / 2)), clients: -3, pietas: -2 }) },
    { id: "justice", office: ["propraetor", "proconsul"], title: "Govern with justice", desc: "Rein in the tax-farmers and hear the provincials' petitions.", hint: "+Dignity · +Clients",
      run: () => "Whole cities become your clients, and send embassies to praise you in Rome." + fx({ dignitas: randi(4, 7), clients: randi(8, 14), infamia: -3 }) },
    { id: "roll", office: "censor", once: true, title: "Revise the roll of the Senate", desc: "Strike unworthy men from the Senate, and make enemies for life.", hint: "+Dignity · enemies",
      run() {
        g.enemies += 2;
        return `You expel ${rivalName()} and ${randi(5, 30)} others for moral turpitude.` + fx({ dignitas: 8, senatus: -3 });
      } },
    { id: "contracts", office: "censor", title: "Let the public contracts", desc: "Roads, aqueducts and tax-farming, all at your disposal.", hint: "+Wealth · +Clients",
      run: () => "The contractors are generous in their gratitude." + fx({ wealth: randi(60, 120), clients: 8, infamia: 4 }) },
    { id: "lustrum", office: "censor", once: true, title: "Perform the lustrum", desc: "Purify the Roman people with the sacrifice of a pig, a sheep and a bull.", hint: "+Dignity",
      run() {
        g.flags.lustrum = true;
        return "The suovetaurilia is performed on the Campus Martius. The census is closed." + fx({ dignitas: 8 });
      } },

    // Always available
    { id: "senate", title: "Speak in the Senate", desc: "Rise and offer your opinion, if the presiding magistrate calls on you.", hint: "+Authority · +Dignity",
      run() {
        if (roll(0.35 + elo() * 0.45 + mod("senate"))) return "Your speech is well received; several senators walk over to your side of the house." + fx({ senatus: randi(4, 8), dignitas: randi(1, 3), eloquentia: 1 });
        return "The house talks over you." + fx({ senatus: 1, eloquentia: 1 });
      } },
    { id: "contio", title: "Address the people", desc: "Harangue a crowd from the Rostra.", hint: "+Popularity · −Authority",
      run() {
        if (roll(0.4 + elo() * 0.5 + mod("contio"))) return "The crowd roars its approval." + fx({ populus: randi(5, 9), senatus: -2, eloquentia: 1 });
        return "The crowd drifts off to watch a juggler." + fx({ populus: 1 });
      } },
    { id: "banquet", cost: 40, title: "Host a banquet", desc: "Dormice in honey, Falernian wine, and the right guests.", hint: "+Authority · +Clients",
      run() {
        const m = 1 + mod("banquet");
        g.weightDelta += 2;
        if (hasTrait("drinker")) g.rednessDelta += 1;
        return pick([
          "The conversation sparkles and so does the wine.",
          "A consular falls asleep on his couch, a sign of a good evening.",
          "Your cook's stuffed sow is the talk of the Palatine.",
        ]) + fx({ senatus: Math.round(4 * m), clients: Math.round(3 * m), dignitas: 1, infamia: hasTrait("drinker") ? 1 : 0 });
      } },
    { id: "salutatio", title: "Receive your clients", desc: "Open your atrium at dawn to the morning salutation.", hint: "+Clients",
      run: () => "Your atrium is crowded before sunrise." + fx({ clients: Math.round(randi(4, 8) * (1 + mod("salutatio"))), populus: 1 }) },
    { id: "defend", title: "Defend a citizen in court", desc: "Take on a case in the Forum. Win, and the accused is yours for life.", hint: "+Dignity · +Clients · risky",
      run() {
        if (roll(0.3 + elo() * 0.6 + mod("court"))) return "Acquitted! Your peroration has the jury in tears." + fx({ dignitas: randi(4, 7), clients: randi(3, 6), eloquentia: 2 });
        return "Your client is condemned. You learn from it." + fx({ dignitas: -2, eloquentia: 1 });
      } },
    { id: "prosecute", once: true, title: "Prosecute a corrupt senator", desc: "Nothing makes a young man's name faster, or makes enemies quicker.", hint: "++Dignity · enemies · risky",
      run() {
        const target = rivalName();
        g.enemies++;
        if (roll(0.2 + elo() * 0.6 + mod("court"))) return `${target} is condemned and slinks off into exile at Massilia.` + fx({ dignitas: randi(8, 12), populus: 4, senatus: -4 });
        return `${target} is acquitted, and will not forget it.` + fx({ dignitas: -5, senatus: -2 });
      } },
    { id: "legate", office: [null], once: true, title: "Serve as a legate abroad", desc: "Join a governor's staff and see some fighting.", hint: "+Glory",
      run: () => "You return bronzed and with a decent story." + fx({ gloria: randi(5, 10), wealth: 40 }) },
    { id: "estates", title: "Manage your estates", desc: "Visit your farms in Campania and terrify your bailiffs.", hint: "+Wealth",
      run: () => "The vintage is good and the bailiffs are honest, for once." + fx({ wealth: randi(60, 120) }) },
    { id: "rhetoric", cost: 30, title: "Study with a Greek rhetor", desc: "Practise declamation with a master from Rhodes.", hint: "+Eloquence",
      run: () => "Your periods grow rounder and your gestures more restrained." + fx({ eloquentia: randi(4, 7) + mod("rhetoric") }) },
    { id: "temple", cost: 15, title: "Sacrifice on the Capitol", desc: "A white bull for Jupiter Best and Greatest.", hint: "−Infamy · +Dignity",
      run: () => (hasTrait("impious") ? "You go through the motions, stifling a yawn." : "The entrails are favourable.") + fx({ infamia: -randi(3, 6), dignitas: 1, pietas: randi(3, 5) }) },
    { id: "monument", cost: 250, once: true, title: "Restore a public monument", desc: "Put your name on the face of the city.", hint: "++Popularity · ++Dignity",
      run() {
        const where = pick(["a portico on the Campus Martius", "the Temple of Fortuna", "a fountain in the Forum Boarium", "the Temple of Hercules Victor", "a stretch of the Via Appia"]);
        remember("monument", { where });
        return `Your name now stands in bronze letters on ${where}.` + fx({ populus: randi(7, 10), dignitas: randi(6, 9) });
      } },
    { id: "borrow", title: "Borrow from the moneylenders", desc: "The bankers of the Forum will lend to a senator. At a price.", hint: "+Wealth · +Debt",
      run: () => "The banker counts out the coins with a smile." + fx({ wealth: 300, debt: 330 }) },
    { id: "repay", title: "Repay your creditors", desc: "Clear what you can of your debts.", hint: "−Debt", when: () => g.debt > 0 && g.wealth > 20,
      run: () => "Your creditors leave your atrium almost cheerful." + fx({ wealth: -Math.min(g.debt, g.wealth - 20), debt: -Math.min(g.debt, g.wealth - 20) }) },
    { id: "plot", title: "Meet the malcontents by night", desc: "Bankrupt nobles, bitter veterans, ambitious young men. They are waiting for a leader.", hint: "Conspiracy · dangerous", danger: true,
      when: () => g.conspiracy.progress < 100,
      run() {
        const c = g.conspiracy;
        c.active = true;
        c.progress = Math.min(100, c.progress + Math.round(randi(10, 18) * (1 + mod("plot"))));
        c.exposure = Math.min(100, c.exposure + Math.max(1, Math.round(randi(5, 12) * (1 + mod("stealth")) * (1.2 - cun() * 0.8))));
        const extra = c.progress >= 100 ? " The conspiracy is ready. Only you can give the signal." : ` Your plans are ${c.progress}% complete.`;
        return "Oaths are sworn over a cup of wine and blood." + extra + fx({ infamia: 2 });
      } },
    { id: "revolt", title: "Raise the standard of revolt", desc: "There is no going back.", hint: "All or nothing", danger: true,
      when: () => g.conspiracy.progress >= 100, open: (done) => confirmRevolt(done) },
    { id: "retire", title: "Retire to your villa", desc: "Leave public life for books, fishponds and memoirs.", hint: "Ends your career",
      when: () => g.age >= 55, open: (done) => confirmRetire(done) },
  ];

  function availableActions() {
    return ACTIONS.filter((a) => {
      if (a.office !== undefined) {
        const offices = Array.isArray(a.office) ? a.office : [a.office];
        if (!offices.includes(g.office)) return false;
      }
      if (a.post && g.post !== a.post) return false;
      if (a.office === "quaestor" && g.office !== "quaestor") return false;
      if (a.when && !a.when()) return false;
      return true;
    });
  }

  function doAction(id) {
    const a = ACTIONS.find((x) => x.id === id);
    if (!a || g.actionsLeft <= 0 || (a.once && g.flags["done_" + a.id])) return;
    const finish = (text) => {
      if (text == null) return;
      g.actionsLeft--;
      g.flags["done_" + a.id] = true;
      g.counts[a.id] = (g.counts[a.id] || 0) + 1;
      remember("act", { id: a.id, province: g.province ? g.province.name : null, result: plain(text) });
      const entry = `<strong>${a.title}.</strong> ${text}`;
      g.lastResult = entry;
      log(entry);
      save();
      if (g.ended) CH.show("end");
      else render();
    };
    if (a.open) return a.open(finish);
    const cost = a.cost ? spend(a.cost) : "";
    finish(a.run() + cost);
  }

  function stageGames(done) {
    const opt = (label, cost, pop, dig, hint) => ({
      label: `${label} · ${fmtHS(adjCost(cost))}`,
      hint: g.wealth < adjCost(cost) ? `${hint} · you will have to borrow ${fmtHS(adjCost(cost) - g.wealth)}` : hint,
      onChoose: () => {
        g.counts["games:" + label] = 1;
        remember("games", { level: label });
        done(gamesText(label) + spend(cost) + fx({ populus: pop, dignitas: dig }));
      },
    });
    modal({
      title: "The Ludi Romani",
      body: "<p>Chariots in the Circus Maximus, plays on wooden stages, beasts from Africa. How lavish will your games be?</p>",
      choices: [
        opt("Respectable", 100, 7, 1, "+Popularity"),
        opt("Lavish", 250, 15, 3, "++Popularity"),
        opt("Unforgettable", 500, 26, 6, "+++Popularity · the city will talk of nothing else"),
        { label: "Not yet", onChoose: () => done(null) },
      ],
    });
  }

  const gamesText = (scale) =>
    ({
      Respectable: "The races are close and nobody is trampled.",
      Lavish: "Panthers from Mauretania, and three hundred pairs of gladiators in silvered armour.",
      Unforgettable: "Elephants in the Circus, the Forum roofed over with awnings, and wine flowing from the fountains. The people will vote for you until they die.",
    })[scale];

  function lawChance(law) {
    const s = g.stats;
    const officeBonus = g.office === "consul" ? (s.senatus - 40) / 120 + 0.05 : 0.08;
    return clamp(0.35 + (s.populus - 45) / 90 - law.hostility * 0.3 + officeBonus + elo() * 0.15 + cun() * 0.08 + mod("law"), 0.05, 0.92);
  }

  const prospect = (p) => (p >= 0.75 ? "Excellent" : p >= 0.55 ? "Good" : p >= 0.4 ? "Even" : p >= 0.25 ? "Poor" : "Hopeless");

  function proposeLaw(done) {
    const open = LAWS.filter((l) => !g.laws.includes(l.id));
    const gensAdj = gens().id;
    modal({
      title: "Propose a law",
      body: `<p>The bill will bear your family's name. Which law will you put to the people?</p>`,
      choices: [
        ...open.map((law) => ({
          label: `Lex ${gensAdj} ${law.adj}`,
          hint: `${law.desc} · Prospects: ${prospect(lawChance(law))}`,
          onChoose: () => done(voteLaw(law)),
        })),
        { label: "Not yet", onChoose: () => done(null) },
      ],
    });
  }

  function voteLaw(law) {
    const title = `the Lex ${gens().id} ${law.adj}`;
    const passed = roll(lawChance(law));
    remember("law", { id: law.id, passed, office: g.office });
    if (passed) {
      g.laws.push(law.id);
      let text = `The tribes vote, and ${title} is carried!`;
      if (law.cancelDebt) text += ` Your own debts vanish with everyone else's.` + fx({ debt: -g.debt });
      return text + fx(law.fx);
    }
    if (g.office === "tribune" && law.hostility >= 0.6 && g.stats.senatus < 25 && roll(0.3)) {
      endGame("mob", `On the day of the vote, senators armed with the legs of benches pour out of the Curia. Like the Gracchi before you, you are clubbed to death on the Capitol, and your body is thrown into the Tiber.`);
      return `Violence erupts over ${title}.`;
    }
    return `${title} is rejected amid uproar.` + fx({ dignitas: -3, senatus: law.hostility > 0.5 ? -3 : 0 });
  }

  function revoltChance(bonus = 0) {
    const s = g.stats;
    const army = ["consul", "proconsul", "propraetor"].includes(g.office) ? 0.2 : 0;
    return 0.12 + s.gloria / 220 + s.populus / 350 + g.clients / 700 + army - s.senatus / 500 + s.calliditas / 500 + mod("revolt") + living().filter((n) => n.conspirator).length * 0.05 + bonus;
  }

  function revolt(bonus = 0) {
    if (roll(revoltChance(bonus))) {
      endGame("dictator", "Your veterans march on Rome. The gates open; the Senate, white-faced, names you dictator “for the restoration of the Republic”. The Republic is yours, whatever is left of it.");
      return "The signal is given.";
    }
    endGame("slain", "Your ragged army is cornered in the Apennines. You fall in the front rank, far ahead of your men, still breathing defiance. The Senate declares you a public enemy.");
    return "The signal is given.";
  }

  function confirmRevolt(done) {
    modal({
      title: "Alea iacta est?",
      body: `<p>Your men are armed, your allies sworn. If you strike, you will either rule Rome or die. Your chances look <strong>${prospect(revoltChance()).toLowerCase()}</strong>.</p>`,
      choices: [
        { label: "Give the signal", hint: "All or nothing", onChoose: () => done(revolt()) },
        { label: "Wait for a better moment", onChoose: () => done(null) },
      ],
    });
  }

  function confirmRetire(done) {
    modal({
      title: "Retire from public life?",
      body: "<p>You could spend your last years among your books and your fishponds, writing memoirs that flatter you.</p>",
      choices: [
        {
          label: "Retire to the villa",
          onChoose: () => {
            endGame("retired", `You withdraw to your villa ${pick(["at Tusculum", "on the Bay of Naples", "at Formiae", "in the Alban Hills"])}, where you breed lampreys and write your memoirs.`);
            done("You leave the Forum for the last time.");
          },
        },
        { label: "Not yet", onChoose: () => done(null) },
      ],
    });
  }

  // ---------- Events ----------
  const choice = (label, hint, run) => ({ label, hint, run });

  const EVENTS = [
    {
      id: "fire",
      title: "Fire in the Subura",
      text: () => "Flames tear through the tenements of the Subura. Thousands are homeless by morning, and the crowd watches to see which senators open their purses.",
      choices: () => [
        choice("Pay for relief and rebuilding", "−80,000 HS · +Popularity", () => "Your freedmen hand out bread and blankets in your name." + spend(80) + fx({ populus: randi(6, 9), dignitas: 2 })),
        choice("Buy the burning blocks cheap", "+Wealth · −Popularity · +Infamy", () => "The owners sell for a song as the flames approach. Then your private fire brigade puts them out." + fx({ wealth: 150, populus: -5, infamia: 5 })),
        choice("Send your condolences", "", () => "Your letter of sympathy is read out to a sullen crowd." + fx({ populus: -2 })),
      ],
    },
    {
      id: "loan",
      when: () => g.wealth < 600,
      title: "A friendly offer",
      text: () => "A fabulously rich consular, who made his fortune buying burning houses, offers you a loan “between friends”.",
      choices: () => [
        choice("Accept", "+400,000 HS · +Debt", () => "He smiles. You are now in his debt in more ways than one." + fx({ wealth: 400, debt: 400, senatus: 2 })),
        choice("Decline politely", "", () => "He shrugs. There are always other young men."),
      ],
    },
    {
      id: "bribe",
      when: () => !!g.office,
      title: "A gift from the publicani",
      text: () => "A company of tax-farmers sends a basket of figs to your house. Beneath the figs is a great deal of silver, and a note about their contract.",
      choices: () => [
        { ...choice("Keep the figs, and the silver", mod("incorruptible") ? "You could never" : "+Wealth · +Infamy", () => "Their contract is renewed on generous terms." + fx({ wealth: Math.round(randi(120, 200) * (1 + mod("greed"))), infamia: Math.round(randi(8, 12) * (1 - cun() / 2)) })), disabled: !!mod("incorruptible") },
        choice("Return it", "+Dignity", () => "You send back the silver and keep the figs." + fx({ dignitas: 3 })),
        choice("Denounce them in public", "+Popularity · makes enemies", () => { g.enemies++; return "The equestrian order is outraged; the people delighted." + fx({ populus: 4, dignitas: 2, senatus: -2 }); }),
      ],
    },
    {
      id: "client",
      title: "A client in trouble",
      text: () => "One of your clients, a wool merchant from the Aventine, is accused of poisoning his business partner. He begs you to defend him.",
      choices: () => [
        choice("Defend him", "Eloquence decides", () => roll(0.35 + elo() * 0.55 + mod("court"))
          ? "You prove the partner died of eating bad mushrooms. Acquitted!" + fx({ dignitas: 4, clients: 4, eloquentia: 2 })
          : "He is condemned, and drags your name through the mud as he goes." + fx({ dignitas: -3, clients: -2 })),
        choice("Abandon him", "−Clients", () => "Word spreads that your protection is worth little." + fx({ clients: -6, dignitas: -2 })),
      ],
    },
    {
      id: "omen",
      title: "Prodigies",
      text: () => "Lightning strikes the Capitol, and a calf with two heads is born at Reate. The haruspices demand expiation.",
      choices: () => [
        choice("Pay for the expiation", "−20,000 HS · −Infamy · +Piety", () => "The gods are appeased, and so are the pious." + spend(20) + fx({ dignitas: 2, infamia: -4, pietas: 4 })),
        choice("Scoff at superstition", "Risky", () => roll(0.25 + pie() * 0.6) ? "The pious mutter about you in the Forum." + fx({ populus: -4, pietas: -6 }) : "Nothing happens. The gods, it seems, have other concerns." + fx({ pietas: -2 })),
        ...(g.stats.calliditas >= 30
          ? [choice("Bribe the haruspices to read it your way", "Cunning · +Popularity", () => roll(0.3 + cun() * 0.6)
              ? "The haruspices announce that the gods favour your policies. Who knew?" + spend(30) + fx({ populus: 5, dignitas: 2 })
              : "A haruspex talks. The whole city knows you tried to buy the gods." + spend(30) + fx({ infamia: 8, pietas: -8 }))]
          : []),
      ],
    },
    {
      id: "marriage",
      when: () => !g.spouse && g.turn >= 1,
      weight: 1.5,
      title: "A marriage alliance",
      text: () => "A matchmaker arrives with three proposals. In Rome, a marriage is a treaty between families.",
      choices: () => {
        const castGentes = shuffle([...new Set(living().map((n) => n.char.gens))].filter((id) => id !== g.char.gens)).slice(0, 2);
        const rest = shuffle(CH.GENTES.filter((x) => x.id !== g.char.gens && !castGentes.includes(x.id))).slice(0, 3 - castGentes.length);
        const others = shuffle([...castGentes.map(CH.getGens), ...rest]);
        return [
          ...others.map((o) => {
            const kin = living().filter((n) => n.char.gens === o.id);
            return choice(
              `Marry a daughter of the gens ${o.id}`,
              (o.status === "Patrician" ? "+Authority · +Dignity · dowry 150,000 HS" : "+Popularity · dowry 300,000 HS") + (kin.length ? ` · warms ${kin.map(pShort).join(" and ")}` : ""),
              () => {
                const ties = marryInto(o.id, null);
                return `You marry ${g.wife}. The wedding procession winds through the city by torchlight.` +
                  fx(o.status === "Patrician" ? { senatus: 6, dignitas: 4, wealth: 150 } : { populus: 4, wealth: 300 }) + ties;
              }
            );
          }),
          choice("Remain unmarried", "", () => "The censors, you suspect, will have something to say."),
        ];
      },
    },
    {
      id: "pirates",
      when: () => g.wealth >= 300,
      title: "Pirates!",
      text: () => "Cilician pirates have seized a ship carrying your goods, and your steward. They demand a ransom.",
      choices: () => [
        choice("Pay the ransom", "−60,000 HS", () => "Your steward returns, thinner and wiser." + spend(60)),
        choice("Refuse", "Lose the cargo", () => "The pirates keep the cargo and sell your steward in Delos." + fx({ wealth: -randi(100, 160) })),
        ...(g.stats.gloria >= 25
          ? [choice("Raise a fleet and hunt them down", "Risky · +Glory", () => roll(0.35 + g.stats.gloria / 150)
              ? "You catch them off Pharmacusa and crucify every one, as you promised." + spend(50) + fx({ gloria: 10, dignitas: 4 })
              : "They slip away into the Aegean." + spend(50) + fx({ gloria: -3 }))]
          : []),
      ],
    },
    {
      id: "illness",
      title: "Fever",
      text: () => "A fever takes hold of you during the dog days of summer.",
      choices: () => [
        choice("Rest in the hills", "One fewer deed next year", () => { g.flags.ill = true; return "You recover slowly at your villa." + fx({ health: -5 }); }),
        choice("Carry on as normal", "Risky", () => {
          if (g.age >= 45 && roll(0.12)) {
            endGame("death", "The fever does not break. You die in your bed, attended by a Greek doctor who insists it was the will of the gods.");
            return "The fever worsens.";
          }
          return "You shake it off, but it leaves its mark." + fx({ health: -20 });
        }),
      ],
    },
    {
      id: "lampoon",
      title: "Verses on the walls",
      text: () => `Scurrilous verses about you are scrawled on the walls of the Forum, mocking ${mockedFeature(g.char)}.`,
      choices: () => [
        choice("Reply in kind", hasTrait("witty") ? "Your speciality" : "Eloquence decides", () => roll(0.3 + elo() * 0.6 + mod("wit")) ? "Your reply is wittier and ruder. The city laughs with you." + fx({ populus: 5, dignitas: 1 }) : "Your verses do not scan. The city laughs at you." + fx({ populus: -2, dignitas: -2 })),
        choice("Rise above it", "", () => "The verses fade in the rain, eventually." + fx({ dignitas: -2 })),
        choice("Sue the poet for libel", "+Dignity · −Popularity", () => "The poet is fined; the crowd thinks you thin-skinned." + fx({ dignitas: 2, populus: -3 })),
      ],
    },
    {
      id: "nickname",
      when: () => g.turn >= 1 && g.turn - (g.lastNickTurn ?? -9) >= 3 && nicknameOptions().length > 0,
      weight: 2.5,
      title: "A name from the crowd",
      text: () => {
        const opts = nicknameOptions();
        const [n, why, tone] = (g.flags.nick = opts.find(([x]) => NICK_TRIUMPHAL.includes(x)) || pick(opts));
        return tone === "mock"
          ? `Someone has chalked it on the wall of your house overnight, and by noon the whole Subura is using it: <strong>${n}</strong>, ${why}.`
          : `The crowd at the Rostra has found a name for you: <strong>${n}</strong>, ${why}. Romans have built whole dynasties on worse.`;
      },
      choices: () => {
        const [n, why, tone] = g.flags.nick;
        const triumphal = NICK_TRIUMPHAL.includes(n);
        const record = (embraced) => {
          g.lastNickTurn = g.turn;
          g.nicknames.forEach((x) => embraced && (x.embraced = false));
          g.nicknames.push({ name: n, why, tone, turn: g.turn, embraced });
        };
        const embrace = () => {
          record(true);
          g.char.agnomen = n;
          return `From now on you are ${name()}.` + (triumphal ? " Like Scipio Africanus before you." : tone === "mock" ? " Romans love a man who can laugh at himself." : "") +
            fx(triumphal ? { dignitas: 6, populus: 4 } : tone === "mock" ? { populus: 7, dignitas: -3 } : { populus: 4, dignitas: 2 });
        };
        const hint = triumphal ? "++Dignity · added to your name" : tone === "mock" ? "+Popularity · −Dignity · added to your name" : "+Popularity · added to your name";
        const out = [choice(g.char.agnomen ? `Take it instead of ${g.char.agnomen}` : "Embrace it", hint, embrace)];
        if (g.char.agnomen) out.push(choice(`Stay ${g.char.agnomen}`, "They will call you both", () => { record(false); return `You keep your name. The Forum uses both, depending on its mood.`; }));
        else out.push(choice("Ignore it", "It may stick anyway", () => { record(false); return tone === "mock" ? "You pretend not to hear it. It sticks anyway, behind your back." + fx({ dignitas: 1 }) : "You affect not to hear it, and everyone notices you affecting." + fx({ dignitas: 1 }); }));
        if (tone === "mock") out.push(choice("Have the walls scrubbed", `${fmtHS(adjCost(10))} · −Popularity`, () => { record(false); return "Your slaves scrub all morning. The next night it is back, in larger letters." + spend(10) + fx({ populus: -2 }); }));
        return out;
      },
    },
    {
      id: "veterans",
      title: "The veterans' land",
      text: () => "A victorious general's veterans are camped outside the city, demanding the farms they were promised. The Senate stalls.",
      choices: () => [
        choice("Champion the veterans", "+Popularity · −Authority", () => "The soldiers chant your name." + fx({ populus: 6, senatus: -5, gloria: 2 })),
        choice("Side with the Senate", "+Authority · −Popularity", () => "The boni thank you quietly." + fx({ senatus: 5, populus: -4 })),
      ],
    },
    {
      id: "grain",
      title: "Bread riots",
      text: () => "The grain fleet is late, and the price of bread has tripled. Crowds are throwing stones at the aediles.",
      choices: () => [
        choice("Buy grain for the people", "−120,000 HS · ++Popularity", () => "Your granaries open and your name is blessed in every bakery." + spend(120) + fx({ populus: 10, clients: 5 })),
        choice("Sell your own stores at the high price", "+Wealth · −Popularity", () => "You make a fortune and many enemies." + fx({ wealth: 100, populus: -6, infamia: 5 })),
      ],
    },
    {
      id: "slaves",
      when: () => g.turn >= 2,
      weight: 0.6,
      title: "The gladiators' war",
      text: () => "A band of runaway gladiators terrorises Campania, swelling with escaped slaves. The Senate looks for a commander.",
      choices: () => [
        choice("Volunteer as a legate", "Risky · ++Glory", () => roll(0.35 + g.stats.gloria / 150 + mod("campaign"))
          ? "You trap a column of rebels against the river and destroy it." + fx({ gloria: 12, dignitas: 4 })
          : "You are routed and escape with your life." + fx({ gloria: -2, health: -20 })),
        choice("Leave it to others", "", () => "Someone else will have the glory, and the danger."),
      ],
    },
    {
      id: "creditors",
      when: () => g.debt > Math.max(300, g.wealth * 1.5),
      weight: 3,
      title: "Your creditors",
      text: () => `Your creditors crowd into your atrium. You owe ${fmtHS(g.debt)}, and they want it back.`,
      choices: () => [
        choice("Sell an estate", "−Debt · lower income", () => { g.incomeMod -= 15; return "Your Campanian farm goes to a freedman." + fx({ debt: -300, dignitas: -3 }); }),
        choice("Borrow from Peter to pay Paul", "+Debt", () => "A new lender, a new rate." + fx({ debt: 100 })),
        choice("Bar the doors", "+Infamy · −Dignity", () => "They shout through the doors all morning." + fx({ infamia: 6, dignitas: -4 })),
      ],
    },
    {
      id: "invitation",
      when: () => !g.conspiracy.active && g.turn >= 1,
      weight: 0.7,
      title: "A dinner invitation",
      text: () => "A bankrupt young noble invites you to dinner. As the wine flows, the talk turns to cancelling debts and burning the Senate house.",
      choices: () => [
        choice("Listen, and join them", "Begins a conspiracy", () => { Object.assign(g.conspiracy, { active: true, progress: 15, exposure: 5 }); return "You swear the oath. There is no going back. Or is there?"; }),
        choice("Leave early", "", () => "You plead an early start and slip away."),
        choice("Inform the consul", "+Authority · +Dignity", () => "The consul thanks you warmly, and has the young man watched." + fx({ senatus: 6, dignitas: 2 })),
      ],
    },
    {
      id: "pontifex",
      when: () => !g.pontifexTried && g.age >= 34 && g.turn >= 2,
      weight: () => 0.12 + pie() * 0.5,
      title: "The Pontifex Maximus is dead",
      text: () => "The chief priest of Rome has died. Seventeen tribes chosen by lot will elect his successor, for life. The post brings a house on the Via Sacra and the ear of every god in the city.",
      choices: () => {
        g.pontifexTried = true;
        const p = 0.02 + pie() * 0.35 + g.stats.populus / 500 + (isPatrician() ? 0.04 : 0);
        return [
          choice("Stand, and spend whatever it takes", `${fmtHS(adjCost(300))} · Prospects: ${prospect(p + 0.08)}`, () => stand(p + 0.08, spend(300))),
          choice("Stand on your piety alone", `Prospects: ${prospect(p)}`, () => stand(p, "")),
          choice("Let an older man have it", "", () => "A venerable consular is elected. He will probably outlive you."),
        ];
        function stand(chance, cost) {
          if (roll(chance)) {
            g.pontifex = true;
            return "“Today you will see me either Pontifex or an exile.” It is Pontifex. You move into the Domus Publica." + cost + fx({ dignitas: 10, pietas: 12, senatus: 3 });
          }
          return "The tribes prefer a man with more grey in his beard." + cost + fx({ dignitas: -3 });
        }
      },
    },
    {
      id: "fit",
      when: () => !!mod("fits"),
      weight: 2,
      title: "The falling sickness",
      text: () => "In the middle of a crowded assembly, the world tilts. You wake on the paving stones of the Comitium, surrounded by faces.",
      choices: () => [
        choice("Declare it a sign from the gods", "Cunning and piety decide", () => roll(0.25 + cun() * 0.4 + pie() * 0.4)
          ? "The augurs agree: the gods have spoken through you. The assembly is dissolved, conveniently for your side." + fx({ pietas: 6, populus: 4 })
          : "Nobody believes you. Your enemies say the gods have cursed you." + fx({ dignitas: -4, pietas: -3 })),
        choice("Go home and rest", "", () => "You keep to your bed for a week. The rumours do not." + fx({ dignitas: -2, health: -5 })),
      ],
    },
    {
      id: "scandal",
      when: () => !!mod("scandal"),
      weight: 2,
      title: "A compromising position",
      text: () => `The husband of ${pick(["a consul's wife", "a Metella", "a Clodia", "a Vestal's cousin", "the urban praetor's wife"])} comes home early.`,
      choices: () => [
        choice("Leap from the window", "−Dignity · +Popularity", () => "You land in a fishmonger's cart. The whole Subura is laughing, mostly with you." + fx({ dignitas: -4, populus: 3, health: -5 })),
        choice("Bribe the slaves to silence", "Cunning decides", () => roll(0.3 + cun() * 0.6)
          ? "Not a word gets out. Money well spent." + spend(40)
          : "The slaves take your money and tell everyone anyway." + spend(40) + fx({ infamia: 8, senatus: -3 })),
        choice("Brazen it out", "+Popularity · −Authority · +Infamy", () => { g.enemies++; return "You bow, wish him good evening, and stroll out of the front door. Rome talks of nothing else." + fx({ populus: 4, senatus: -5, infamia: 6 }); }),
        choice("Disguise yourself as a woman and flee", "The Clodius manoeuvre", () => "You escape in a borrowed stola, but someone recognises your hairy ankles." + fx({ populus: 5, dignitas: -6, pietas: -5, infamia: 4 })),
      ],
    },
    {
      id: "quarrel",
      when: () => !!mod("quarrels"),
      weight: 2,
      title: "Words in the Curia",
      text: () => `${rivalName()} mocks ${mockedFeature(g.char)} in front of the whole Senate. Your blood rises.`,
      choices: () => [
        choice("Throw your stylus at him", "+Popularity · −Authority · an enemy", () => { g.enemies++; return "It catches him on the ear. The house erupts." + fx({ populus: 3, senatus: -5, dignitas: -2 }); }),
        choice("Challenge him on the Rostra", "Eloquence decides", () => roll(0.3 + elo() * 0.6 + mod("wit"))
          ? "You flay him so thoroughly that he leaves Rome for his estates." + fx({ populus: 5, dignitas: 3, eloquentia: 2 })
          : "You lose your temper, then the argument." + fx({ dignitas: -3, populus: -2 })),
        choice("Bite your tongue", "Try, at least", () => roll(0.5)
          ? "You count to ten in Greek. The moment passes." + fx({ senatus: 3 })
          : "You try. You fail. The words come out anyway." + fx({ senatus: -4 })),
      ],
    },
  ];

  function pickEvent() {
    const pool = [...EVENTS, ...PERSONA_EVENTS].filter((e) => !e.when || e.when());
    const w = (e) => (typeof e.weight === "function" ? e.weight() : e.weight || 1);
    const total = pool.reduce((s, e) => s + w(e), 0);
    let r = Math.random() * total;
    for (const e of pool) if ((r -= w(e)) < 0) return e;
    return pool[0];
  }

  function runEvent(e, next) {
    const body = `<p>${e.text()}</p>`;
    const choices = e.choices();
    modal({
      title: e.title,
      body,
      choices: choices.map((c) => ({
        label: c.label,
        hint: c.hint,
        disabled: c.disabled,
        onChoose: () => {
          const result = c.run();
          remember("event", { id: e.id || e.title, choice: plain(c.label), result: plain(result), subject: g.flags.subject, accuser: e.accuser, accuserName: e.accuserName, crime: e.crime, persona: e.persona });
          log(`<strong>${e.title}.</strong> ${result}`);
          if (g.ended) return next();
          notice(e.title, `<p>${result}</p>`, next);
        },
      })),
    });
  }

  // Events that fire because of the player's own choices, checked before the random one.
  function forcedEvents() {
    const out = [];
    const c = g.conspiracy;
    if (c.active && Math.random() < c.exposure / 140) {
      out.push({
        id: "exposed",
        title: "Quo usque tandem?",
        text: () => `The consul rises in the Senate, turns towards you, and denounces your conspiracy in a speech the senators will be quoting for years. The benches around you empty.`,
        choices: () => [
          choice("Flee to your army and strike now", "Revolt with poor odds", () => revolt(-0.1)),
          choice("Brazen it out", "Eloquence and friends decide", () => {
            if (roll(0.25 + elo() * 0.45 + g.stats.senatus / 250)) {
              Object.assign(c, { exposure: 0, progress: Math.round(c.progress / 2) });
              return "You deny everything with such wounded dignity that the house hesitates. The moment passes." + fx({ infamia: 10 });
            }
            endGame("exile", "Your denials fall flat. You leave Rome by night with a few loyal freedmen, and the Senate declares you an exile.");
            return "The house is against you.";
          }),
          choice("Betray your fellow conspirators", "Ends the plot · +Infamy", () => {
            Object.assign(c, { active: false, progress: 0, exposure: 0 });
            g.enemies += 2;
            return "You name names. Five men are strangled in the Tullianum. You live, but nobody trusts you." + fx({ infamia: 15, senatus: 6, dignitas: -8 });
          }),
        ],
      });
    }
    for (const id of (g.pendingFunerals || []).splice(0)) out.push(funeralEvent(persona(id)));
    const accuser = living().find((n) => !n.office && !n.kin && ((n.relation <= -40 && n.influence >= 30) || (pHas(n, "incorruptible") && g.stats.infamia >= 40)));
    const named = accuser && Math.random() < 0.3 * Math.max(0.2, 1 + mod("enemy"));
    if (named) out.push(namedProsecution(accuser));
    const enemyPressure = g.enemies * 0.015 * Math.max(0, 1 + mod("enemy"));
    if (!named && (g.stats.infamia >= 35 || g.enemies >= 3) && Math.random() < Math.max(0, (g.stats.infamia - 25) / 120) + enemyPressure) {
      const accuser = rivalName();
      const crime = g.stats.infamia >= 55 ? "extortion" : pick(["electoral bribery", "extortion", "violence"]);
      out.push({
        id: "prosecution",
        accuserName: accuser,
        crime,
        title: "You are prosecuted",
        text: () => `${accuser} brings a charge of ${crime} against you. The jury will be drawn from senators and knights.`,
        choices: () => [
          choice("Hire the finest advocate in Rome", `${fmtHS(adjCost(150))} · good odds`, () => trial(0.75 - g.stats.infamia / 400 + mod("court") / 2, spend(150))),
          choice("Defend yourself", "Eloquence decides", () => trial(0.25 + elo() * 0.6 - g.stats.infamia / 300 + mod("court"), "")),
          { ...choice("Bribe the jury", mod("incorruptible") ? "You could never" : `${fmtHS(adjCost(250))} · Cunning decides`, () => trial(0.55 + cun() * 0.4, spend(250) + fx({ infamia: Math.round(10 * (1 - cun() / 2)) }))), disabled: !!mod("incorruptible") },
        ],
      });
    }
    if (["propraetor", "proconsul"].includes(g.office) && g.victories > 0 && g.stats.gloria >= 45 && !g.flags.triumphAsked) {
      out.push({
        id: "imperator",
        title: "Imperator!",
        text: () => `Your soldiers hail you as imperator on the field. You may ask the Senate for a triumph: to ride through Rome in a chariot, face painted red like Jupiter's.`,
        choices: () => [
          choice("Request a triumph", "The Senate decides", () => {
            g.flags.triumphAsked = true;
            if (roll(0.3 + g.stats.senatus / 150 + g.stats.gloria / 300 + pie() / 4)) {
              g.triumphs.push(g.province.name);
              return `The Senate grants your triumph. A slave holds a laurel wreath over your head and whispers: “Remember you are mortal.”` + fx({ dignitas: 15, populus: 10, gloria: 5 });
            }
            return "Your enemies in the Senate block it on a technicality." + fx({ dignitas: -3 });
          }),
          choice("Decline the honour", "", () => { g.flags.triumphAsked = true; return "Modesty, or calculation? The city wonders." + fx({ dignitas: 2 }); }),
        ],
      });
    }
    return out;
  }

  function trial(p, costText, accuser) {
    if (roll(p)) {
      if (accuser) accuser.influence = clamp(accuser.influence - 6);
      return "Acquitted! Your accuser is jeered out of the Forum." + costText + fx({ infamia: -10, dignitas: 2 }) + (accuser ? relate(accuser, -10, "Failed to convict you") : "");
    }
    if (g.stats.infamia >= 60) {
      endGame("exile", "Condemned. You must leave Italy within days. You settle at Massilia, where the mullets, at least, are excellent.");
      return "Condemned." + costText;
    }
    return "Condemned, but only to a heavy fine." + costText + fx({ wealth: -200, dignitas: -10, infamia: -15 });
  }

  // ---------- Personae: the recurring cast ----------
  const CAST_CORE = ["aemulus", "amicus"];
  const CAST_POOL = ["consularis", "dives", "popularis", "severus", "veteranus", "inimicus", "bellus", "philosophus", "patronus", "augur"];
  const CAST_SIZE = 6;
  const quaestorAt = (age) => [{ office: "quaestor", turn: 30 - age }];
  const praetorian = (age) => [{ office: "quaestor", turn: 30 - age }, { office: "praetor", turn: 39 - age }];
  const consular = (age) => [...praetorian(age), { office: "consul", turn: 43 - age }];
  const ROLES = {
    aemulus: {
      label: ["Your rival"], age: [30, 30], influence: [18, 24], relation: -15, traits: ["ambitious"],
      origin: ["Elected quaestor in the same year as you", "Lost a boyhood race to you, and never forgot it", "Courted the same girl as you, years ago"],
      blurb: [
        "Elected quaestor in the same year as you, and determined to stay one step ahead of you all the way to the consulship.",
        "You were taught by the same rhetor, who always said you were the better speaker. He has been trying to prove him wrong ever since.",
        "His family and yours have been racing each other up the cursus for three generations. So far, the score is even.",
      ],
      history: quaestorAt,
    },
    amicus: {
      label: ["Your oldest friend", "Your childhood friend", "Your foster-brother"], age: [30, 31], influence: [14, 20], relation: 45,
      origin: ["A boyhood friendship", "You were nursed by the same wet-nurse", "He pulled you out of the Tiber when you were nine"],
      blurb: [
        "You learned your letters from the same Greek slave and stole figs from the same orchards. He would lie for you, probably.",
        "He once took the blame for a broken statue of Mercury that was entirely your fault. You have never told him you know.",
        "You served together as tribunes of the soldiers in Spain and shared a tent, a cloak, and one terrible winter.",
      ],
      history: quaestorAt,
    },
    consularis: {
      label: ["The grand old man", "The elder statesman"], age: [54, 58], influence: [75, 85], relation: 0, traits: ["proud"], patrician: true,
      face: { wrinkles: 60, frown: 62 }, hair: "balding",
      blurb: [
        "A former consul who remembers Marius and Sulla. When he rises to speak, the Senate falls silent; when he dies, it will be a different place.",
        "He was consul in a year of famine, and is still proud of how few people died. He speaks first in every debate, and longest.",
      ],
      history: consular,
    },
    dives: {
      label: ["The richest man in Rome", "The moneylender"], age: [44, 46], influence: [62, 70], relation: 5, traits: ["greedy", "cunning"],
      origin: ["Your father once banked with him", "He lent your family money in a bad year"],
      face: { weight: 72 }, infamy: [25, 35],
      blurb: [
        "This year's consul. He owns half the Palatine and holds the debts of the other half. No man is rich, he says, who cannot keep an army.",
        "This year's consul. He made his first fortune buying the property of Sulla's victims, and his second lending it back to their sons.",
      ],
      history: (age) => [{ office: "quaestor", turn: 30 - age }, { office: "praetor", turn: 39 - age }, { office: "consul", turn: 0 }],
    },
    popularis: {
      label: ["The firebrand", "The demagogue"], age: [31, 33], influence: [28, 36], relation: 0, traits: ["voice"], plebeian: true,
      face: { frown: 25 }, infamy: [20, 35],
      blurb: [
        "Loved by the Subura, loathed by the Curia. He means to be tribune, and after that, who knows.",
        "He gives away free oil at the baths and free opinions on the Rostra. The Senate has tried to buy him twice, and failed once.",
      ],
      history: quaestorAt,
    },
    severus: {
      label: ["The conscience of the Senate", "The moralist"], age: [36, 38], influence: [40, 50], relation: 0, traits: ["incorruptible", "frugal"],
      face: { frown: 88, weight: 25 }, beard: "none", infamy: [0, 3],
      blurb: [
        "Wears no tunic under his toga, walks barefoot to the Forum, and has never been seen to smile. He keeps a list of everyone's sins.",
        "Drinks only water, eats only turnips, and prosecutes anyone who does otherwise. His great-grandfather was the censor Cato, and he will not let you forget it.",
      ],
      history: quaestorAt,
    },
    veteranus: {
      label: ["The old soldier", "The general"], age: [44, 50], influence: [40, 55], relation: 0, traits: ["brave", "general"],
      face: { jawWidth: 74, wrinkles: 55 }, beard: "stubble",
      blurb: [
        "Served under Sulla in the East, and has the scars to show it. He judges every man by how he would hold a line.",
        "Fought Sertorius in Spain for eight years. He speaks little in the Senate, and when he does, it is about mules.",
      ],
      history: praetorian,
    },
    inimicus: {
      label: ["Your family's old enemy", "The hereditary enemy"], age: [42, 48], influence: [45, 58], relation: -30, traits: ["proud"],
      origin: ["Your fathers were enemies", "His father prosecuted yours", "Your grandfathers fought on opposite sides in the civil war"],
      blurb: [
        "His father prosecuted yours for extortion in the year you were born. The verdict was acquittal; the feud was not.",
        "Your grandfathers fought on opposite sides at the Colline Gate, and neither family has ever let the other forget it.",
      ],
      history: praetorian,
    },
    bellus: {
      label: ["The dandy", "The gilded youth"], age: [30, 31], influence: [10, 18], relation: 5, traits: ["rake"], beard: "stubble",
      origin: ["You share a tailor"],
      face: { frown: 20, weight: 35 },
      blurb: [
        "Plucks his legs, scents his hair, and wears his tunic with long sleeves. The old men despise him; their daughters do not.",
        "Owes four million sesterces at the age of thirty and seems entirely untroubled by it. His father pays, and complains, and pays.",
      ],
      history: quaestorAt,
    },
    philosophus: {
      label: ["The Epicurean", "The Stoic", "The philosopher"], paired: true, age: [38, 44], influence: [25, 35], relation: 0, traits: ["learned"], beard: "full",
      blurb: [
        "Studied in Athens and has never quite come back. He quotes Epicurus at funerals, which is not appreciated.",
        "A Stoic of the strictest kind, who holds that pain is indifferent and that the Senate is a school of virtue. He is wrong about at least one of these.",
        "Has studied with every school in Athens and been expelled from two. He will explain the nature of the gods to you, at length, whether you ask or not.",
      ],
      history: quaestorAt,
    },
    patronus: {
      label: ["Your father's friend", "Your old protector"], age: [52, 58], influence: [55, 70], relation: 30,
      origin: ["Your father's oldest friend", "He promised your dying father to look after you"],
      face: { wrinkles: 55 }, hair: "balding",
      blurb: [
        "He carried your father's bier and promised to look after you. He does, in his own way, which mostly involves advice.",
        "He dandled you on his knee when you were three. He still thinks of you as three.",
      ],
      history: praetorian,
    },
    augur: {
      label: ["The augur"], age: [46, 52], influence: [45, 55], relation: 0, traits: ["superstitious"],
      face: { eyeSize: 70 },
      blurb: [
        "He reads the will of the gods in the flight of birds, and finds that it usually agrees with him.",
        "A member of the college of augurs. With one word, he can dissolve an assembly because a crow flew the wrong way.",
      ],
      history: praetorian,
    },
    novus: {
      label: ["A rising man", "A new man"], age: [30, 32], influence: [14, 22], relation: 0,
      blurb: [
        "New to the Senate, and still deciding whose friend he will be.",
        "The first of his family to sit in the Curia. His grandfather sold olive oil in Arpinum, and he would rather you did not mention it.",
        "Rich, eager and from somewhere in Picenum. He has already asked three consulars to dinner.",
      ],
      history: quaestorAt,
    },
  };
  const pLabel = (n) => n.label || ROLES[n.role].label[0];
  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

  const tri = () => (Math.random() + Math.random() + Math.random()) / 3;
  const weighted = (pairs) => {
    let t = pairs.reduce((a, [, w]) => a + w, 0) * Math.random();
    for (const [v, w] of pairs) if ((t -= w) < 0) return v;
    return pairs[0][0];
  };

  function randomLook(role) {
    const face = {};
    for (const s of CH.SLIDER_GROUPS.flatMap((x) => x.sliders)) {
      const [lo, hi] = s.randomRange || [0, 100];
      face[s.key] = Math.round(lo + tri() * (hi - lo));
    }
    Object.assign(face, role.face || {});
    return {
      face,
      hair: role.hair || weighted([["full", 6], ["balding", 2.5], ["bald", 1]]),
      beard: role.beard || weighted([["none", 7], ["stubble", 2], ["full", 1]]),
      hairColor: weighted([["black", 4], ["darkbrown", 5], ["chestnut", 3], ["auburn", 1], ["bronze", 0.6], ["fair", 0.6]]),
      eyeColor: weighted([["darkbrown", 5], ["brown", 5], ["hazel", 2], ["green", 1], ["grey", 1], ["blue", 1]]),
      skin: weighted([["pale", 1], ["fair", 2], ["light", 4], ["olive", 4], ["tanned", 2.5]]),
    };
  }

  function pickTraits(base) {
    const out = [...base];
    const want = out.length + randi(1, 2);
    for (const t of [...CH.TRAITS].sort(() => Math.random() - 0.5)) {
      if (out.length >= want) break;
      if (out.includes(t.id)) continue;
      const clash = out.some((id) => (CH.getTrait(id).excl || []).includes(t.id) || (t.excl || []).includes(id));
      if (!clash) out.push(t.id);
    }
    return out;
  }

  function makePersona(roleId) {
    const role = ROLES[roleId];
    const look = Math.floor(Math.random() * role.label.length);
    const used = (g.personae || []).filter((n) => n.alive).map((n) => n.char.gens);
    const takenCogs = [g.char.cognomen, ...(g.personae || []).map((n) => n.char.cognomen)];
    const fits = (x) => (!role.plebeian || x.status === "Plebeian") && (!role.patrician || x.status === "Patrician");
    const r = Math.random();
    // Families overlap: some senators share your gens, or each other's.
    let gentes = [];
    if (r < 0.12 && roleId !== "inimicus") gentes = CH.GENTES.filter((x) => x.id === g.char.gens);
    else if (r < 0.32) gentes = CH.GENTES.filter((x) => used.includes(x.id) && x.id !== g.char.gens);
    gentes = gentes.filter(fits);
    if (!gentes.length) gentes = CH.GENTES.filter((x) => fits(x) && x.id !== g.char.gens && !used.includes(x.id));
    const gn = pick(gentes.length ? gentes : CH.GENTES);
    const cogs = gn.cognomina.filter((c) => !takenCogs.includes(c));
    const age = randi(...role.age);
    const history = role.history(age).map((h) => ({ ...h, turn: h.turn + g.turn }));
    const current = history.find((h) => h.turn === g.turn && h.office !== "quaestor");
    return {
      id: roleId + "-" + Math.random().toString(36).slice(2, 7),
      role: roleId,
      label: role.label[look],
      blurb: role.paired ? role.blurb[look] : pick(role.blurb),
      char: { gens: gn.id, praenomen: pick(gn.praenomina), cognomen: cogs.length ? pick(cogs) : "", ...randomLook(role), traits: pickTraits(role.traits || []) },
      age,
      influence: randi(...role.influence),
      infamy: randi(...(role.infamy || [5, 20])),
      relation: role.relation,
      relLog: role.relation ? [{ turn: g.turn, d: role.relation, why: pick(role.origin) }] : [],
      history,
      office: current ? current.office : history.some((h) => h.turn === g.turn) ? "quaestor" : null,
      province: null,
      alive: true,
      fate: null,
      kin: false,
      conspirator: false,
      metTurn: -1,
      backedTurn: -1,
    };
  }

  function createCast() {
    g.personae = [];
    for (const r of shuffle([...CAST_CORE, ...shuffle(CAST_POOL).slice(0, CAST_SIZE - CAST_CORE.length)])) addPersona(makePersona(r));
  }

  // Blood and marriage colour a man's feelings from the start.
  function addPersona(n) {
    g.personae.push(n);
    if (n.char.gens === g.char.gens) relate(n, 15, `A kinsman of the gens ${n.char.gens}`);
    else if (g.spouse && n.char.gens === g.spouse) relate(n, 12, "A kinsman of your wife");
    return n;
  }

  // Marrying into a gens warms every man who bears its name.
  function marryInto(gensId, via) {
    g.spouse = gensId;
    const cog = via && via.char.cognomen.endsWith("us") ? via.char.cognomen.replace(/us$/, "a") : pick(["Prima", "Secunda", "Tertia", "Maior", "Minor"]);
    g.wife = `${gensId} ${cog}`;
    remember("marriage", { gens: gensId, via: via ? via.id : null });
    let out = "";
    for (const n of living()) if (n !== via && n.char.gens === gensId) out += relate(n, 15, `You married into the gens ${gensId}`);
    return out;
  }

  const persona = (id) => (g.personae || []).find((n) => n.id === id);
  const living = () => (g.personae || []).filter((n) => n.alive);
  const pName = (n) => CH.fullName(n.char);
  const pShort = (n) => n.char.cognomen || CH.getGens(n.char.gens).nomen;
  const pHas = (n, id) => n.char.traits.includes(id) || CH.faceTraits(n.char).some((t) => t.id === id);
  const pPatrician = (n) => CH.getGens(n.char.gens).status === "Patrician";
  const pElo = (n) => clamp(18 + n.influence / 3 + (pHas(n, "voice") ? 12 : 0) + (pHas(n, "learned") ? 10 : 0) + (pHas(n, "witty") ? 8 : 0) - (pHas(n, "stammer") ? 15 : 0) - (pHas(n, "slow") ? 10 : 0));
  const relLabel = (n) => (n.kin ? "Kinsman" : n.relation >= 60 ? "Close friend" : n.relation >= 20 ? "Friendly" : n.relation >= 8 ? "Warm" : n.relation > -8 ? "Neutral" : n.relation > -20 ? "Cool" : n.relation > -60 ? "Hostile" : "Sworn enemy");
  const relClass = (n) => (n.kin || n.relation >= 20 ? "friend" : n.relation > -20 ? "neutral" : "foe");

  function relate(n, d, why = relWhy) {
    const before = n.relation;
    n.relation = Math.round(clamp(n.relation + d, -100, 100));
    const diff = n.relation - before;
    if (diff) noteRelation(n, diff, why);
    return diff ? ` <span class="fx"><b class="${diff > 0 ? "up" : "down"}">${pShort(n)} ${diff > 0 ? "+" : "−"}${Math.abs(diff)}</b></span>` : "";
  }

  function noteRelation(n, d, why, merge) {
    n.relLog = n.relLog || [];
    const last = n.relLog[n.relLog.length - 1];
    if (merge && last && last.why === why) {
      last.d += d;
      last.to = g.turn;
      if (!last.d) n.relLog.pop();
    } else n.relLog.push({ turn: g.turn, d, why });
    if (n.relLog.length > 40) n.relLog.splice(1, n.relLog.length - 40);
  }

  function nickTip(i) {
    const n = g && g.nicknames[i];
    if (!n) return "";
    return `<div class="tip-head"><b>${n.name}</b> <em>${n.embraced ? "part of your name" : n.tone === "mock" ? "never to your face" : "what the crowd calls you"}</em></div>
      ${n.why ? `<p>So called ${n.why}.</p>` : ""}<p class="tip-note">Since ${yearLabel(n.turn)}.</p>`;
  }

  function relationTip(id) {
    const n = persona(id);
    if (!n) return "";
    const log = (n.relLog || []).slice().reverse();
    const shown = log.slice(0, 12);
    const rows = shown
      .map((e) => {
        const a = yearOf(e.turn);
        const b = yearOf(e.to ?? e.turn);
        const when = a === b ? yearLabel(e.turn) : a < 0 && b < 0 ? `${-a}–${-b} BC` : `${yearLabel(e.turn)}–${yearLabel(e.to)}`;
        return `<li><span class="tip-when">${when}</span><span class="tip-why">${e.why}</span><b class="${e.d > 0 ? "up" : "down"}">${e.d > 0 ? "+" : "−"}${Math.abs(e.d)}</b></li>`;
      })
      .join("");
    return `<div class="tip-head"><b>${pShort(n)} towards you</b> <em class="rel-${relClass(n)}">${relLabel(n)} · ${n.relation > 0 ? "+" : ""}${n.relation}</em></div>
      ${rows ? `<ul class="tip-ledger">${rows}</ul>` : `<p>Nothing has passed between you yet.</p>`}
      ${log.length > shown.length ? `<p class="tip-note">…and ${log.length - shown.length} older memories.</p>` : ""}
      ${n.relDrift && (n.relDrift.down || n.relDrift.up)
        ? `<ul class="tip-ledger drift">${n.relDrift.down ? `<li><span class="tip-when">Years</span><span class="tip-why">Time has cooled his warmth</span><b class="down">−${-n.relDrift.down}</b></li>` : ""}${n.relDrift.up ? `<li><span class="tip-when">Years</span><span class="tip-why">Time has softened his grudges</span><b class="up">+${n.relDrift.up}</b></li>` : ""}</ul>`
        : ""}
      <p class="tip-note">${n.kin ? "Family ties keep him at least Friendly." : "Strong feelings, good or bad, fade a little every year."}</p>`;
  }

  function pAged(n) {
    const c = JSON.parse(JSON.stringify(n.char));
    c.face.wrinkles = Math.min(100, c.face.wrinkles * 0.6 + (n.age - 30) * 1.6);
    if (n.age >= 66) c.hairColor = "white";
    else if (n.age >= 50 && c.hairColor !== "white") c.hairColor = "grey";
    return c;
  }

  const RANK = ["censor", "consul", "praetor", "aedile", "tribune", "quaestor"];
  const RANK_ADJ = { censor: "Censorius", consul: "Consular", praetor: "Praetorian", aedile: "Former aedile", tribune: "Former tribune", quaestor: "Senator" };
  const bestOffice = (history) => RANK.find((o) => history.some((h) => h.office === o));

  function pOffice(n) {
    if (!n.alive) return n.fate ? n.fate.label : "Departed";
    if (n.office) return n.province ? `${OFFICES[n.office].label} of ${n.province.name}` : OFFICES[n.office].label;
    return RANK_ADJ[bestOffice(n.history)] || "Senator";
  }

  // Shared by the player and the cast: Sulla's minimum ages and two-year gaps.
  function eligibleFor(age, history, patrician, turn, office) {
    if (["propraetor", "proconsul"].includes(office)) return [];
    const has = (o) => history.some((h) => h.office === o);
    const mags = history.filter((h) => MAGISTRACIES.includes(h.office)).map((h) => h.turn);
    const gap = turn + 1 - (mags.length ? Math.max(...mags) : -99);
    const nextAge = age + 1;
    const out = [];
    if (nextAge >= 31 && !patrician && !has("tribune") && !has("praetor") && gap >= 1) out.push("tribune");
    if (nextAge >= 36 && !has("aedile") && !has("praetor") && gap >= 2) out.push("aedile");
    if (nextAge >= 39 && has("quaestor") && !has("praetor") && gap >= 2) out.push("praetor");
    const consuls = history.filter((h) => h.office === "consul").map((h) => h.turn);
    if (nextAge >= 42 && has("praetor") && gap >= 2 && (!consuls.length || turn + 1 - Math.max(...consuls) >= 10)) out.push("consul");
    if (has("consul") && !has("censor") && aucOf(turn + 1) % 5 === 0 && gap >= 2) out.push("censor");
    return out;
  }

  function planNpcCandidacies() {
    g.npcCandidates = [];
    for (const n of living()) {
      const opts = eligibleFor(n.age, n.history, pPatrician(n), g.turn, n.office);
      const ambition = pHas(n, "ambitious") ? 0.15 : 0;
      let office = null;
      if (opts.includes("censor") && Math.random() < 0.7) office = "censor";
      else if (opts.includes("consul") && Math.random() < 0.6 + ambition) office = "consul";
      else if (opts.includes("praetor") && Math.random() < 0.75 + ambition) office = "praetor";
      else if (opts.includes("tribune") && Math.random() < (n.role === "popularis" ? 0.9 : 0.12)) office = "tribune";
      else if (opts.includes("aedile") && Math.random() < 0.4 + ambition) office = "aedile";
      if (office) g.npcCandidates.push({ id: n.id, office, bonus: 0 });
    }
  }

  const rivalsFor = (office) => (g.npcCandidates || []).filter((c) => c.office === office).map((c) => persona(c.id)).filter(Boolean);

  function resolveNpcElections(playerWon) {
    const results = [];
    for (const c of g.npcCandidates || []) {
      const n = persona(c.id);
      if (!n || !n.alive) continue;
      const base = { aedile: 0.45, tribune: 0.6, praetor: 0.4, consul: 0.15, censor: 0.3 }[c.office];
      results.push({ id: n.id, office: c.office, won: roll(base + n.influence / 200 - n.infamy / 300 + c.bonus), influence: n.influence });
    }
    for (const office of ["consul", "censor"]) {
      const winners = results.filter((r) => r.won && r.office === office).sort((a, b) => b.influence - a.influence);
      winners.slice(Math.max(0, 2 - (playerWon === office ? 1 : 0))).forEach((r) => (r.won = false));
    }
    for (const r of results) {
      const n = persona(r.id);
      if (r.won) {
        log(`<strong>${pName(n)}</strong> is elected ${OFFICES[r.office].label} for ${yearLabel(g.turn + 1)}.`);
        if (playerWon === r.office && n.role === "aemulus") log(`You and ${pShort(n)} will serve side by side, glaring at each other.`);
      } else if (playerWon === r.office && pHas(n, "ambitious")) {
        log(`${pName(n)} loses the race for ${OFFICES[r.office].label} that you won, and blames you for it.${relate(n, -10, `Lost the ${OFFICES[r.office].label.toLowerCase()} election you won`)}`);
      }
    }
    return results;
  }

  function advancePersonae(results) {
    const won = new Map(results.filter((r) => r.won).map((r) => [r.id, r.office]));
    for (const n of living()) {
      n.age++;
      const prev = n.office;
      if (won.has(n.id)) {
        n.office = won.get(n.id);
        n.province = null;
        n.history.push({ office: n.office, turn: g.turn });
        n.influence = clamp(n.influence + 5);
      } else if (prev === "praetor" || prev === "consul") {
        n.office = prev === "praetor" ? "propraetor" : "proconsul";
        n.province = pick(PROVINCES);
        n.history.push({ office: n.office, turn: g.turn, province: n.province });
      } else {
        n.office = null;
        n.province = null;
      }
      const cooled = Math.round(n.relation * 0.93) - n.relation;
      if (cooled) {
        n.relation += cooled;
        n.relDrift = n.relDrift || { down: 0, up: 0 };
        n.relDrift[cooled < 0 ? "down" : "up"] += cooled;
      }
      if (!n.kin && g.spouse && n.char.gens === g.spouse && n.relation < 10) {
        noteRelation(n, 10 - n.relation, "Family ties", true);
        n.relation = 10;
      }
      if (n.kin && n.relation < 25) {
        noteRelation(n, 25 - n.relation, "Family ties", true);
        n.relation = 25;
      }
      n.infamy = clamp(n.infamy + randi(-2, 3));
      const frail = pHas(n, "robust") ? 0.6 : pHas(n, "sickly") || pHas(n, "drinker") ? 1.5 : 1;
      if (n.age >= 50 && Math.random() < ((n.age - 48) / 40) ** 2 * 0.5 * frail) {
        n.alive = false;
        n.fate = { kind: "death", label: `Died aged ${n.age}`, turn: g.turn };
        g.pendingFunerals.push(n.id);
        log(`<strong>Death of ${pName(n)}.</strong> The wax masks of his ancestors will walk before his bier.`);
      }
    }
    while (living().length < CAST_SIZE) {
      const n = addPersona(makePersona("novus"));
      log(`<strong>A new face in the Curia.</strong> ${pName(n)}, quaestor this year, takes his seat on the back benches.`);
    }
  }

  function setConsuls() {
    g.consuls = g.consuls || {};
    const names = [];
    if (g.office === "consul") names.push(name());
    for (const n of living()) if (n.office === "consul") names.push(pName(n));
    if (g.turn === 0) names.push("Gnaeus Pompeius Magnus");
    while (names.length < 2) names.push(rivalName());
    g.consuls[g.turn] = names.slice(0, 2);
  }

  const DEED_MEMORY = {
    "Dine together": "Dined with you",
    "Ask for his backing": "Promised you his backing",
    "Send him a gift": "Received your gift",
    "Ask him for a loan": "Lent you money",
    "Attack him in the Senate": "You attacked him in the Senate",
    "Prosecute him": "You prosecuted him",
    "Seek a reconciliation": "You sought a reconciliation",
    "Sound him out about the conspiracy": "You sounded him out about a conspiracy",
  };

  // A deed spent on another senator.
  function personaDeed(n, label, run) {
    relWhy = DEED_MEMORY[label] || (label.startsWith("Ask for his") ? "Gave you his family in marriage" : label);
    const text = run();
    if (text == null) return;
    n.metTurn = g.turn;
    g.actionsLeft--;
    g.counts["p:" + label] = (g.counts["p:" + label] || 0) + 1;
    remember("deed", { id: n.id, label, text: plain(text) });
    const entry = `<strong>${label}</strong> · ${pName(n)}. ${text}`;
    g.lastResult = entry;
    log(entry);
    save();
    if (g.ended) CH.show("end");
    else render();
  }

  function duel(n) {
    return 0.35 + elo() * 0.5 - pElo(n) / 250 + mod("wit") - (pHas(n, "witty") ? 0.1 : 0);
  }

  function personaSheet(n) {
    const gn = CH.getGens(n.char.gens);
    const traits = [...CH.faceTraits(n.char), ...CH.chosenTraits(n.char)];
    const career = n.history
      .filter((h) => h.turn <= g.turn)
      .map((h) => `${OFFICES[h.office].label}${h.province ? ` (${h.province.name})` : ""} <span>${yearLabel(h.turn)}</span>`)
      .join(" · ");
    const pct = (n.relation + 100) / 2;
    return `<div class="persona-sheet">
      <div class="persona-portrait portrait-frame"><div>${CH.renderCharacter(pAged(n))}</div></div>
      <div class="persona-info">
        <p class="persona-blurb">${n.blurb || ROLES[n.role].blurb[0]}</p>
        <dl class="persona-facts">
          <div><dt>Gens</dt><dd>${gn.id} · ${gn.status}${n.char.gens === g.char.gens ? " · <em>your own</em>" : n.char.gens === g.spouse ? " · <em>your wife's</em>" : ""}</dd></div>
          <div><dt>Age</dt><dd>${n.age}</dd></div>
          <div><dt>Now</dt><dd>${pOffice(n)}</dd></div>
          <div><dt>Influence</dt><dd>${n.influence}</dd></div>
        </dl>
        <div class="trait-chips left">${traits.map((t) => `<span class="trait-chip ${t.cat ? "" : "face"}" data-tip-trait="${t.id}" data-tip-who="persona">${t.name}</span>`).join("")}</div>
        <div class="relation" data-tip-rel="${n.id}">
          <div class="relation-label"><span>Towards you</span><b class="rel-${relClass(n)}">${relLabel(n)}</b></div>
          <div class="relation-bar"><span class="relation-mid"></span><span class="relation-dot rel-${relClass(n)}" style="left:${pct}%"></span></div>
        </div>
        ${career ? `<p class="persona-career">${career}</p>` : ""}
        ${(() => {
          const kin = living().filter((x) => x !== n && x.char.gens === n.char.gens);
          return kin.length ? `<p class="persona-career">Of the same gens as ${kin.map(pName).join(", ")}.</p>` : "";
        })()}
      </div>
    </div>`;
  }

  function openPersona(id) {
    const n = persona(id);
    if (!n || !n.alive) return;
    const blocked = n.metTurn === g.turn ? "You have already seen him this year" : g.actionsLeft <= 0 ? "No deeds left this year" : null;
    const choices = [];
    const act = (label, hint, run, opts = {}) =>
      choices.push({
        label,
        hint: blocked || opts.reason || hint,
        disabled: !!blocked || !!opts.reason,
        onChoose: () => personaDeed(n, label, run),
      });

    act("Dine together", `${fmtHS(adjCost(25))} · +Friendship`, () => {
      let d = randi(6, 11);
      if (pHas(n, "gourmand") || pHas(n, "drinker") || pHas(n, "wellfed")) d += 5;
      if (pHas(n, "frugal") || pHas(n, "proud")) d -= 4;
      if (hasTrait("charming")) d += 3;
      if (hasTrait("witty")) d += 2;
      if (pHas(n, "incorruptible") && g.stats.infamia >= 30) d -= 7;
      const line =
        d >= 12 ? `The evening runs late. ${pShort(n)} embraces you at the door.`
        : d >= 6 ? `A pleasant dinner. ${pShort(n)} laughs at two of your jokes.`
        : `${pShort(n)} picks at the dormice and leaves early.`;
      if (pHas(n, "gourmand")) g.weightDelta += 1;
      return line + spend(25) + relate(n, d);
    });

    if (n.relation >= 30) {
      const standing = eligibleOffices().length > 0;
      act("Ask for his backing", `Better odds at this year's elections (+${Math.round(n.influence / 4)}%)`, () => {
        n.backedTurn = g.turn;
        return `${pShort(n)} promises to bring out his clients and tenants for you on the Campus Martius.` + relate(n, -3);
      }, { reason: n.backedTurn === g.turn ? "He has already promised" : !standing ? "You cannot stand for office this year" : null });
    }

    act("Send him a gift", `${fmtHS(adjCost(60))} · works on some men`, () => {
      if (pHas(n, "incorruptible")) return `${pShort(n)} returns the silver with a note quoting the Twelve Tables.` + spend(60) + relate(n, -15);
      if (pHas(n, "greedy")) return `${pShort(n)} weighs the silver carefully, and smiles.` + spend(60) + relate(n, 22);
      return `${pShort(n)} thanks you politely.` + spend(60) + relate(n, 9);
    });

    if (n.role === "dives" || n.influence >= 60) {
      act("Ask him for a loan", "+300,000 HS at a friend's rate", () => `He lends without the usual premium, and now owns a small piece of you.` + fx({ wealth: 300, debt: 300 }) + relate(n, -3), {
        reason: n.relation < 10 ? "He does not trust you enough" : null,
      });
    }

    if (!g.spouse) {
      const kin = n.age >= 45 ? "daughter" : "sister";
      act(`Ask for his ${kin}'s hand`, "Marriage alliance · dowry", () => {
        n.kin = true;
        const ties = marryInto(n.char.gens, n);
        return `You marry ${pShort(n)}'s ${kin}. From now on his family is yours.` + fx({ wealth: n.role === "dives" ? 400 : 150, dignitas: 3 }) + relate(n, 25) + ties;
      }, { reason: n.relation < 40 ? "He would refuse" : null });
    }

    act("Attack him in the Senate", "Eloquence against eloquence", () => {
      if (roll(duel(n))) {
        n.influence = clamp(n.influence - 6);
        return `You take ${pShort(n)} apart, clause by clause. The back benches roar.` + fx({ dignitas: 4, senatus: 2 }) + relate(n, pHas(n, "irascible") ? -35 : pHas(n, "clement") ? -10 : -20);
      }
      return `${pShort(n)} answers with a joke about ${mockedFeature(g.char)}, and the house laughs at you.` + fx({ dignitas: -3 }) + relate(n, -12);
    });

    act("Prosecute him", n.infamy >= 30 ? "His record is rich in material" : "Risky · makes a mortal enemy", () => {
      g.enemies++;
      const p = 0.12 + elo() * 0.5 + n.infamy / 150 - pElo(n) / 300 - n.influence / 400 + mod("court");
      if (roll(p)) {
        n.alive = false;
        const place = pick(["Massilia", "Rhodes", "Mytilene", "Athens", "Dyrrachium", "Tarraco", "Smyrna"]);
        n.fate = { kind: "exile", label: `Exiled by you to ${place}`, turn: g.turn, place };
        return `${pName(n)} is condemned and leaves for exile at ${place}. His friends will remember.` + fx({ dignitas: 10, populus: 4, eloquentia: 2 });
      }
      return `The jury acquits ${pShort(n)}. He leaves the court looking straight at you.` + fx({ dignitas: -4 }) + relate(n, -40);
    }, { reason: n.office ? "Immune while he holds office" : n.kin ? "He is family" : null });

    if (n.relation <= -20) {
      act("Seek a reconciliation", `${fmtHS(adjCost(30))} · depends on his temper`, () => {
        const p = 0.3 + (pHas(n, "clement") ? 0.35 : 0) + (pHas(n, "patient") ? 0.1 : 0) - (pHas(n, "irascible") ? 0.15 : 0) - (pHas(n, "proud") ? 0.1 : 0) + elo() * 0.2;
        if (roll(p)) return `You meet on neutral ground, at the Temple of Concord. ${pShort(n)} takes your hand.` + spend(30) + relate(n, -n.relation + randi(0, 10));
        return `${pShort(n)} keeps you waiting in his atrium for two hours, then sends you away.` + spend(30) + relate(n, -5);
      });
    }

    if (g.conspiracy.active && !n.conspirator) {
      act("Sound him out about the conspiracy", "Dangerous", () => {
        const p = (n.relation >= 40 ? 0.35 : 0.08) + (pHas(n, "ruthless") ? 0.25 : 0) + (pHas(n, "greedy") ? 0.1 : 0) + (pHas(n, "ambitious") ? 0.1 : 0) + (n.role === "popularis" ? 0.2 : 0) - (pHas(n, "incorruptible") ? 1 : 0);
        if (roll(p)) {
          n.conspirator = true;
          g.conspiracy.progress = Math.min(100, g.conspiracy.progress + 20);
          return `${pShort(n)} listens, then clasps your hand. Your plans are ${g.conspiracy.progress}% complete.` + relate(n, 10);
        }
        if (pHas(n, "incorruptible") || n.relation < 20) {
          g.conspiracy.exposure = Math.min(100, g.conspiracy.exposure + 35);
          return `${pShort(n)} says nothing. The next morning, he is seen entering the consul's house.` + relate(n, -30);
        }
        g.conspiracy.exposure = Math.min(100, g.conspiracy.exposure + 8);
        return `${pShort(n)} declines, and promises to forget the conversation. Promises.`;
      });
    }

    choices.push({ label: "Take your leave", onChoose: () => {} });
    modal({ kicker: pLabel(n), title: pName(n), body: personaSheet(n), choices, wide: true });
  }

  function personaCard(n, clickable) {
    const tag = clickable ? "button" : "div";
    return `<${tag} class="persona-card rel-${relClass(n)}" ${clickable ? `data-persona="${n.id}"` : ""}>
      <span class="persona-face">${CH.renderCharacter(pAged(n), { background: false })}</span>
      <span class="persona-name">${pName(n)}</span>
      <span class="persona-role">${pLabel(n)}</span>
      <span class="persona-meta">${pOffice(n)} · ${n.age}</span>
      <span class="persona-rel" data-tip-rel="${n.id}">${relLabel(n)}</span>
    </${tag}>`;
  }

  function funeralEvent(n) {
    const friend = n.relation >= 0;
    return {
      id: "funeral",
      persona: n.id,
      title: `The funeral of ${pShort(n)}`,
      text: () => `${pName(n)} is dead. Actors wearing the wax masks of his ancestors walk before the bier to the Forum, where a eulogy must be given from the Rostra.${friend ? " His family asks you to speak." : ""}`,
      choices: () =>
        friend
          ? [
              choice("Deliver the funeral oration", "Eloquence decides", () => {
                const legacy = n.relation >= 40 ? ` His will remembers you.` + fx({ wealth: n.role === "dives" ? randi(300, 600) : randi(40, 150), clients: 8 }) : "";
                return (roll(0.35 + elo() * 0.6)
                  ? "Your laudatio has the whole Forum weeping, and everyone notes who spoke it." + fx({ populus: 6, dignitas: 4, eloquentia: 2 })
                  : "Your voice cracks halfway through. It is taken as grief, which is not the worst outcome." + fx({ populus: 2 })) + legacy;
              }),
              choice("Send your condolences", "", () => "A short letter. His sons notice the brevity." + fx({ dignitas: -1 })),
            ]
          : [
              choice("Attend with a solemn face", "+Dignity", () => "You stand bareheaded in the front row. Even his friends concede it was decently done." + fx({ dignitas: 3 })),
              choice("Stay at home", "", () => "Your absence is noticed, but not much discussed."),
              choice("Celebrate openly", "+Popularity · +Infamy", () => { g.enemies++; return "You throw a dinner on the day of the funeral. The jokes are good; the reputation, less so." + fx({ populus: 2, infamia: 6 }); }),
            ],
    };
  }

  function namedProsecution(n) {
    const crime = g.stats.infamia >= 50 ? "extortion" : pick(["electoral bribery", "extortion", "violence", "impiety"]);
    const defender = living().filter((f) => f !== n && (f.relation >= 50 || f.kin)).sort((a, b) => pElo(b) - pElo(a))[0];
    return {
      id: "prosecution",
      accuser: n.id,
      accuserName: pName(n),
      crime,
      title: "You are prosecuted",
      text: () => `${pName(n)} brings a charge of ${crime} against you.${pHas(n, "incorruptible") ? " He claims it is purely a matter of principle, and may even believe it." : " It is, of course, personal."}`,
      choices: () => [
        ...(defender
          ? [choice(`Ask ${pShort(defender)} to defend you`, `Friendship · his eloquence ${Math.round(pElo(defender))}`, () => trial(0.3 + pElo(defender) / 140 - g.stats.infamia / 400 + mod("court") / 2, relate(defender, -4, "Defended you in court, at some cost to himself"), n))]
          : []),
        choice("Hire the finest advocate in Rome", `${fmtHS(adjCost(150))} · good odds`, () => trial(0.72 - g.stats.infamia / 400 + mod("court") / 2 - pElo(n) / 600, spend(150), n)),
        choice("Defend yourself", "Eloquence decides", () => trial(0.25 + elo() * 0.6 - g.stats.infamia / 300 + mod("court") - pElo(n) / 400, "", n)),
        { ...choice("Bribe the jury", mod("incorruptible") ? "You could never" : `${fmtHS(adjCost(250))} · Cunning decides`, () => trial(0.5 + cun() * 0.4 - (pHas(n, "incorruptible") ? 0.1 : 0), spend(250) + fx({ infamia: Math.round(10 * (1 - cun() / 2)) }), n)), disabled: !!mod("incorruptible") },
      ],
    };
  }

  const subject = () => persona(g.flags.subject);

  const PERSONA_EVENTS = [
    {
      id: "feud",
      when: () => living().some((n) => n.relation <= -20),
      weight: 1.6,
      title: "Barbs in the Curia",
      text: () => {
        const n = pick(living().filter((x) => x.relation <= -20));
        g.flags.subject = n.id;
        return `${pName(n)} rises in the Senate and, without once looking at you, delivers a long digression on ${mockedFeature(g.char)}.`;
      },
      choices: () => {
        const n = subject();
        return [
          choice("Answer him on the spot", "Eloquence against eloquence", () => roll(duel(n))
            ? `Your reply is quoted in every barber's shop by nightfall.` + fx({ dignitas: 4, populus: 2 }) + relate(n, -8)
            : `You stumble. ${pShort(n)} smiles thinly.` + fx({ dignitas: -3 }) + relate(n, -4)),
          choice("Let it pass", "−Dignity", () => "You sit through it with a fixed expression." + fx({ dignitas: -2 })),
          choice("Invite him to dinner", `${fmtHS(adjCost(25))} · +Friendship`, () => `He comes, suspicious, and leaves slightly less so.` + spend(25) + relate(n, 12)),
        ];
      },
    },
    {
      id: "canvass",
      when: () => (g.npcCandidates || []).some((c) => { const n = persona(c.id); return n && (n.relation >= 25 || n.kin); }),
      weight: 2,
      title: "A friend's candidacy",
      text: () => {
        const c = pick(g.npcCandidates.filter((x) => { const n = persona(x.id); return n && (n.relation >= 25 || n.kin); }));
        g.flags.subject = c.id;
        return `${pName(persona(c.id))} is standing for ${OFFICES[c.office].label} and asks you to walk the Forum at his side, greeting voters by name.`;
      },
      choices: () => {
        const n = subject();
        const c = g.npcCandidates.find((x) => x.id === n.id);
        return [
          choice("Canvass for him", `${fmtHS(adjCost(10))} · better odds for him · +Friendship`, () => { c.bonus += 0.12; return `You shake a thousand hands for ${pShort(n)}.` + spend(10) + relate(n, 12); }),
          choice("Make your excuses", "−Friendship", () => `${pShort(n)} says he understands. He does not.` + relate(n, -8)),
        ];
      },
    },
    {
      id: "patron",
      when: () => living().some((n) => n.influence >= 55 && n.relation >= 40),
      weight: 0.9,
      title: "A great man's favour",
      text: () => {
        const n = pick(living().filter((x) => x.influence >= 55 && x.relation >= 40));
        g.flags.subject = n.id;
        return `${pName(n)} takes your arm on the steps of the Curia and walks you in, in full view of the house. He wants you to speak early in tomorrow's debate.`;
      },
      choices: () => {
        const n = subject();
        return [
          choice("Speak as his man", "+Authority · +Dignity", () => "You speak third, after two consulars. The house takes note." + fx({ senatus: 6, dignitas: 4, populus: -1 }) + relate(n, 5)),
          choice("Speak your own mind", "+Dignity · −Friendship", () => "You take his slot and argue the opposite. Brave, they say." + fx({ dignitas: 3 }) + relate(n, -12)),
        ];
      },
    },
    {
      id: "creditor",
      when: () => g.debt >= 300 && living().some((n) => n.role === "dives" && n.relation >= 0),
      weight: 1.2,
      title: "A generous offer",
      text: () => {
        const n = living().find((x) => x.role === "dives");
        g.flags.subject = n.id;
        return `${pName(n)} has heard about your debts. He offers to buy them from your creditors. “Between friends,” he says.`;
      },
      choices: () => {
        const n = subject();
        return [
          choice("Accept", "−Debt · everyone will know you are his creature", () => `Your creditors are paid. ${pShort(n)} now owns your vote, more or less.` + fx({ debt: -Math.min(g.debt, 500), senatus: -3, dignitas: -2 }) + relate(n, 12)),
          choice("Decline", "", () => `${pShort(n)} shrugs. There are always other debtors.` + relate(n, -3)),
        ];
      },
    },
  ];

  // ---------- Elections ----------
  const eligibleOffices = () => eligibleFor(g.age, g.history, isPatrician(), g.turn, g.office);

  function electionChance(office, level) {
    const s = g.stats;
    const W = {
      aedile: { base: 0.3, pop: 0.7, sen: 0.25, glo: 0.1 },
      tribune: { base: 0.4, pop: 0.9, sen: 0.1, glo: 0.1 },
      praetor: { base: 0.2, pop: 0.4, sen: 0.5, glo: 0.2 },
      consul: { base: -0.14, pop: 0.35, sen: 0.55, glo: 0.35 },
      censor: { base: 0.1, pop: 0.1, sen: 0.7, glo: 0.2 },
    }[office];
    let p = W.base + ((s.dignitas - 30) / 100) * 0.8 + ((s.populus - 30) / 100) * W.pop + ((s.senatus - 30) / 100) * W.sen;
    p += (s.gloria / 100) * W.glo + g.clients / 400 - s.infamia / 250 + [0, 0.12, 0.28][level];
    if (office === "consul" && isPatrician()) p += 0.05;
    if (office === "consul") p -= held("consul").length * 0.2;
    if (office === "censor") p += pie() / 3;
    p += mod("election");
    for (const n of rivalsFor(office)) if (n.relation <= -20) p -= 0.03 + n.influence / 1500;
    for (const n of living()) if (n.backedTurn === g.turn) p += n.influence / 400;
    if (living().some((n) => n.office === "consul" && (n.relation >= 40 || n.kin))) p += 0.04;
    return clamp(p, 0.03, 0.95);
  }

  function runElection(next) {
    const offices = eligibleOffices();
    if (!offices.length) return next(null);
    modal({
      kicker: `Elections for ${yearLabel(g.turn + 1)}`,
      title: "The Campus Martius",
      body: `<p>The voting enclosures are being built on the Campus Martius. You are eligible to stand for office.</p>`,
      choices: [
        ...offices.map((o) => ({
          label: `Stand for ${OFFICES[o].label}`,
          hint: `Prospects: ${prospect(electionChance(o, 0))}${rivalsFor(o).length ? ` · against ${rivalsFor(o).map(pShort).join(", ")}` : ""}`,
          onChoose: () => chooseCampaign(o, next),
        })),
        { label: "Stand aside this year", onChoose: () => next(null) },
      ],
    });
  }

  function chooseCampaign(office, next) {
    const lvl = (label, level, cost, hint) => ({
      label,
      hint: `${hint} · Prospects: ${prospect(electionChance(office, level))}`,
      onChoose: () => {
        const costText = cost ? spend(cost) : "";
        const bribeText = level === 2 ? fx({ infamia: 12 }) : "";
        resolveElection(office, level, costText + bribeText, next);
      },
    });
    modal({
      kicker: `Candidate for ${OFFICES[office].label}`,
      title: "Your campaign",
      body: `<p>You put on the whitened toga of a candidate and walk the Forum with a slave who whispers voters' names in your ear. How much will you spend?</p>${
        rivalsFor(office).length
          ? `<p class="hint">Also standing: ${rivalsFor(office).map((n) => `${pName(n)} (${relLabel(n).toLowerCase()})`).join(", ")}.</p>`
          : ""
      }${(() => {
        const backers = living().filter((n) => n.backedTurn === g.turn);
        return backers.length ? `<p class="hint">Backing you: ${backers.map(pName).join(", ")}.</p>` : "";
      })()}`,
      choices: [
        lvl("Trust your name and your friends", 0, 0, "Free"),
        lvl("Spend generously", 1, 100, fmtHS(adjCost(100))),
        { ...lvl("Buy the tribes outright", 2, 300, `${fmtHS(adjCost(300))} · +Infamy`), ...(mod("incorruptible") ? { disabled: true, hint: "You could never" } : {}) },
      ],
    });
  }

  function resolveElection(office, level, costText, next) {
    const won = roll(electionChance(office, level));
    const results = (g.flags.npcResults = resolveNpcElections(won ? office : null));
    const castWinners = results.filter((r) => r.won && r.office === office).map((r) => pName(persona(r.id)));
    const others = [...castWinners, ...Array.from({ length: Math.max(0, Math.min(3, SEATS[office] - (won ? 1 : 0)) - castWinners.length) }, rivalName)];
    remember("election", { office, won, others: others.slice(0, 3), cast: results.filter((r) => r.won && r.office === office).map((r) => r.id) });
    let body;
    if (won) {
      body = `<p>The herald proclaims your name. You will be <strong>${OFFICES[office].label}</strong> in ${yearLabel(g.turn + 1)}.${costText}</p>`;
      if (office === "consul") body += `<p>Your colleague is ${others[0]}. The year will be remembered as the consulship of ${g.char.cognomen || CH.getGens(g.char.gens).nomen} and ${others[0].split(" ").pop()}.</p>`;
      else if (castWinners.length) body += `<p>Elected with you: ${castWinners.join(", ")}.</p>`;
      log(`<strong>Elected ${OFFICES[office].label}</strong> for ${yearLabel(g.turn + 1)}.${costText}`);
    } else {
      body = `<p>The centuries and tribes have voted. The winners are ${others.join(", ")}${SEATS[office] > 3 ? " and others" : ""}. Your name is not among them.${costText}</p>`;
      log(`<strong>Defeated</strong> in the elections for ${OFFICES[office].label}.${costText}${mod("patient") ? "" : fx({ dignitas: -2 })}`);
    }
    notice(won ? "Victory at the polls" : "Defeat at the polls", body, () => next(won ? office : null));
  }

  // ---------- End of year ----------
  function endYear() {
    if (g.ended) return;
    const steps = [];

    steps.push((next) => {
      planNpcCandidacies();
      const income = 50 + Math.floor(g.clients / 10) + g.incomeMod + mod("income");
      const interest = Math.round(g.debt * 0.12);
      let text = `Your estates yield their harvest.` + fx({ wealth: income - 25 });
      if (interest) text += ` Interest swells your debts.` + fx({ debt: interest });
      if (g.office === "aedile" && !g.flags.done_games) text += ` The people will not forget the aedile who gave no games.` + fx({ populus: -10, dignitas: -4 });
      if (mod("gamble")) {
        const swing = randi(-220, 180);
        text += swing >= 0 ? ` The dice love you this year.` + fx({ wealth: swing }) : ` The dice are cruel.` + spend(-swing);
      }
      g.health = clamp(g.health + 5 + mod("health"));
      g.weightDelta += mod("weightGain");
      g.rednessDelta = (g.rednessDelta || 0) + mod("rednessGain");
      const fade = {
        populus: 0.82 + mod("popFade"),
        gloria: 0.88,
        senatus: 0.88 + mod("popFade") / 2,
        dignitas: 0.93,
        infamia: 0.9 - mod("infamyFade"),
      };
      for (const [k, f] of Object.entries(fade)) g.stats[k] = Math.round(g.stats[k] * f);
      log(`<strong>The year closes.</strong> ${text}`);
      next();
    });

    steps.push((next) => {
      const queue = [...forcedEvents(), pickEvent()];
      const runQueue = () => {
        if (g.ended || !queue.length) return next();
        runEvent(queue.shift(), runQueue);
      };
      runQueue();
    });

    steps.push((next) => runElection((elected) => {
      g.flags.elected = elected;
      if (!g.flags.npcResults) g.flags.npcResults = resolveNpcElections(null);
      next();
    }));

    const run = () => {
      if (g.ended) {
        save();
        return CH.show("end");
      }
      const step = steps.shift();
      if (step) return step(run);
      advanceYear(g.flags.elected);
    };
    run();
  }

  function advanceYear(elected) {
    const prev = g.office;
    const ill = g.flags.ill;
    const npcResults = g.flags.npcResults || [];
    g.turn++;
    g.age++;
    g.flags = {};
    g.actionsLeft = actionsPerYear() - (ill ? 1 : 0);
    const badDay = Math.random() < mod("badDays");
    if (badDay) g.actionsLeft--;
    g.lastResult = null;

    if (elected) {
      g.office = elected;
      g.province = null;
      g.history.push({ office: elected, turn: g.turn });
    } else if (prev === "praetor" || prev === "consul") {
      g.office = prev === "praetor" ? "propraetor" : "proconsul";
      g.province = pick(PROVINCES);
      g.victories = 0;
      g.history.push({ office: g.office, turn: g.turn, province: g.province });
      log(`<strong>${OFFICES[g.office].label}.</strong> The lots assign you the province of ${g.province.name}.`);
    } else {
      g.office = null;
      g.province = null;
    }

    advancePersonae(npcResults);
    setConsuls();

    if (g.age >= 50) {
      const p = ((g.age - 48) / 40) ** 2 * 0.5 * (g.health < 50 ? 1.6 : 1) * Math.max(0.2, 1 + mod("mortality"));
      if (Math.random() < p) {
        endGame("death", pick([
          "You die peacefully in your sleep, surrounded by the wax masks of your ancestors.",
          "You collapse in the Forum in the middle of a speech, which your enemies say was the best way to end it.",
          "A chill caught at a festival carries you off within the week.",
        ]));
        save();
        return CH.show("end");
      }
    }

    log(`<strong>${yearLabel(g.turn)}.</strong> Consuls: ${g.consuls[g.turn].join(" and ")}. You are ${g.age}. ${g.office ? `You serve as ${officeLabel()}.` : "You hold no office this year."}${badDay ? " A crow caws on your left as you leave the house: you lose a day to the auspices." : ""}`);
    save();
    render();
  }

  function officeLabel() {
    if (!g.office) return "Senator";
    if (g.office === "quaestor" && g.post) return POSTS[g.post].label;
    if (g.province) return `${OFFICES[g.office].label} of ${g.province.name}`;
    return OFFICES[g.office].label;
  }

  // ---------- Rendering: Senate entrance ----------
  function curiaSVG() {
    let senators = "";
    const figure = (x, y, s, you) => `
      <g transform="translate(${x} ${y}) scale(${s})">
        <path d="M -9 18 Q -9 4 0 4 Q 9 4 9 18 Z" fill="${you ? "#fff" : "#f6f1e6"}" stroke="${you ? "#8b1e1e" : "#b9a77a"}" stroke-width="${you ? 2 : 1.2}"/>
        <circle cy="-2" r="5.5" fill="#e9c3a0" stroke="${you ? "#8b1e1e" : "#b9a77a"}" stroke-width="${you ? 2 : 1.2}"/>
      </g>`;
    const rows = [
      { y: 196, s: 1.0 },
      { y: 172, s: 0.92 },
      { y: 150, s: 0.84 },
    ];
    rows.forEach((row, ri) => {
      const step = 19 * row.s;
      for (const side of [-1, 1]) {
        const start = 300 + side * 95;
        for (let i = 0; i < 9 - ri; i++) {
          const x = start + side * i * step;
          const you = ri === 2 && side === -1 && i === 6 - ri;
          senators += figure(x, row.y, row.s, you);
        }
      }
      senators += `<rect x="40" y="${row.y + 18 * row.s}" width="215" height="5" fill="#d7c38e"/><rect x="345" y="${row.y + 18 * row.s}" width="215" height="5" fill="#d7c38e"/>`;
    });
    const youX = 300 - 95 - 4 * 19 * 0.84;
    return `<svg viewBox="0 0 600 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="20" y="20" width="560" height="225" fill="#fbf8f1" stroke="#c9a227" stroke-width="1.5"/>
      ${[60, 150, 450, 540].map((x) => `<rect x="${x - 8}" y="30" width="16" height="200" fill="#f3ecdc" stroke="#d7c38e"/>`).join("")}
      <rect x="20" y="20" width="560" height="10" fill="#c9a227"/>
      <text x="300" y="62" text-anchor="middle" font-family="Cinzel, serif" font-size="18" letter-spacing="6" fill="#8b1e1e">S · P · Q · R</text>
      <rect x="250" y="120" width="100" height="10" fill="#d7c38e"/>
      <rect x="240" y="130" width="120" height="10" fill="#c9b37a"/>
      ${[275, 325].map((x) => `
        <g transform="translate(${x} 106)" stroke="#8b1e1e" stroke-width="2" fill="none">
          <path d="M -10 0 H 10"/><path d="M -9 1 Q 0 9 9 14"/><path d="M 9 1 Q 0 9 -9 14"/>
        </g>`).join("")}
      ${figure(275, 84, 0.9)}${figure(325, 84, 0.9)}
      ${senators}
      <rect x="20" y="226" width="560" height="19" fill="#efe6d2"/>
      ${Array.from({ length: 14 }, (_, i) => `<rect x="${38 + i * 38}" y="230" width="11" height="11" transform="rotate(45 ${43.5 + i * 38} 235.5)" fill="${i % 2 ? "#c9a227" : "#8b1e1e"}" opacity="0.7"/>`).join("")}
      <text x="${youX}" y="128" text-anchor="middle" font-family="Cinzel, serif" font-size="11" fill="#8b1e1e">YOU</text>
      <path d="M ${youX} 131 L ${youX} 138" stroke="#8b1e1e" stroke-width="1.5"/>
    </svg>`;
  }

  function renderSenate() {
    const gn = gens();
    $("#senate-portrait").innerHTML = CH.renderCharacter(g.char);
    $("#curia").innerHTML = curiaSVG();
    $("#senate-date").textContent = `Kalends of January · ${aucOf(0)} AUC · ${yearLabel(0)}`;
    $("#senate-name").textContent = name();
    $("#senate-inscription").textContent = CH.inscription(g.char);
    $("#senate-intro").innerHTML = `
      <p>The bronze doors of the Curia swing open. Six hundred senators turn their heads. As a quaestor, the lowest of the magistrates, you take your place on the back benches among the <em>pedarii</em>, the junior senators who vote with their feet.</p>
      <p>${gn.status === "Patrician"
        ? `Your patrician ancestors watch from the wax masks in your atrium, and much is expected of a ${gn.nomen}. The tribunate of the plebs is closed to you; the consulship is not.`
        : `Your family is plebeian. The tribunate of the plebs, with its sacred veto, is open to you, and a plebeian consul is still something to boast of.`}</p>`;
    const traits = g.traitIds.map(CH.getTrait).filter(Boolean);
    $("#senate-traits").innerHTML = traits.length
      ? `<p class="hint">The senators size you up:</p>${traits.map((t) => `<span class="trait" data-tip-trait="${t.id}"><b>${t.name}</b> ${t.cat ? t.perk : t.desc}</span>`).join("")}`
      : `<p class="hint">The senators barely glance at you. Nothing about you, yet, stands out.</p>`;
    $("#senate-personae").innerHTML = living().map((n) => personaCard(n, false)).join("");
    $("#posts").innerHTML = Object.entries(POSTS)
      .map(([id, p]) => `<button class="post-card" data-post="${id}"><span class="post-title">${p.label}</span><span class="post-desc">${p.desc}</span><span class="post-hint">${p.hint}</span></button>`)
      .join("");
  }

  function choosePost(id) {
    g.post = id;
    g.history.push({ office: "quaestor", turn: 0, post: id });
    const text = fx(POSTS[id].fx);
    log(`<strong>${yearLabel(0)}.</strong> You enter the Senate and take up your post as ${POSTS[id].label.toLowerCase()}.${text}`);
    save();
    CH.show("game");
  }

  // ---------- Rendering: dashboard ----------
  function render() {
    $("#g-name").textContent = name();
    $("#g-year").textContent = `${aucOf(g.turn)} AUC · ${yearLabel(g.turn)}`;
    $("#g-consuls").textContent = g.consuls && g.consuls[g.turn] ? `Consuls: ${g.consuls[g.turn].join(" & ")}` : "";
    $("#g-personae").innerHTML = `<h3 class="section-title">Personae <em>the men who matter</em></h3>
      <div class="persona-grid">${living().map((n) => personaCard(n, true)).join("")}</div>`;
    $("#g-office").textContent = `${officeLabel()} · Age ${g.age}`;
    $("#g-portrait").innerHTML = CH.renderCharacter(agedChar());
    $("#g-traits").innerHTML = g.traitIds
      .map(CH.getTrait)
      .filter(Boolean)
      .map((t) => `<span class="trait-chip ${t.cat ? "" : "face"} ${t.cat && t.cost < 0 ? "flaw" : ""}" data-tip-trait="${t.id}">${t.name}</span>`)
      .join("");
    $("#g-nicknames").innerHTML = g.nicknames.length
      ? `<span class="nick-label">The Forum calls you</span>${g.nicknames
          .map((n, i) => `<span class="nick ${n.tone} ${n.embraced ? "embraced" : ""}" data-tip-nick="${i}">${n.name}</span>`)
          .join("")}`
      : "";

    $("#g-stats").innerHTML =
      CH.QUALITIES.map((q) => `
        <div class="stat ${q.bad ? "stat-bad" : ""}" title="${q.desc}">
          <div class="stat-label"><span>${q.label} <em>${q.latin}</em></span><b>${Math.round(g.stats[q.key])}</b></div>
          <div class="stat-bar"><span style="width:${g.stats[q.key]}%"></span></div>
        </div>`).join("") +
      `<dl class="ledger">
        <div><dt>Wealth</dt><dd>${fmtHS(g.wealth)}</dd></div>
        <div><dt>Debt</dt><dd class="${g.debt ? "neg" : ""}">${fmtHS(g.debt)}</dd></div>
        <div><dt>Clients</dt><dd>${g.clients}</dd></div>
        <div><dt>Health</dt><dd>${g.health}</dd></div>
        ${g.spouse ? `<div><dt>Wife</dt><dd>${g.spouse}</dd></div>` : ""}
      </dl>`;

    const career = g.history.map((h) => `<li><span>${yearLabel(h.turn)}</span>${OFFICES[h.office].label}${h.province ? ` of ${h.province.name}` : ""}</li>`);
    g.laws.forEach((id) => career.push(`<li><span>Law</span>Lex ${gens().id} ${LAWS.find((l) => l.id === id).adj}</li>`));
    g.triumphs.forEach((p) => career.push(`<li><span>Triumph</span>over ${p}</li>`));
    if (g.pontifex) career.push(`<li><span>Priest</span>Pontifex Maximus</li>`);
    $("#g-career").innerHTML = career.join("");

    const c = g.conspiracy;
    $("#g-plot").innerHTML = c.active
      ? `<h4>The conspiracy <em>secret</em></h4>
         <div class="stat"><div class="stat-label"><span>Preparations</span><b>${c.progress}%</b></div><div class="stat-bar plot"><span style="width:${c.progress}%"></span></div></div>
         <div class="stat stat-bad"><div class="stat-label"><span>Risk of exposure</span><b>${c.exposure}%</b></div><div class="stat-bar"><span style="width:${c.exposure}%"></span></div></div>`
      : "";

    $("#g-pips").innerHTML = Array.from({ length: Math.max(actionsPerYear(), g.actionsLeft) }, (_, i) => `<span class="pip ${i < g.actionsLeft ? "on" : ""}"></span>`).join("");
    $("#g-pips-label").textContent = g.actionsLeft ? `${g.actionsLeft} deed${g.actionsLeft > 1 ? "s" : ""} left this year` : "The year's work is done";
    $("#g-result").innerHTML = g.lastResult ? `<p>${g.lastResult}</p>` : "";
    $("#g-result").classList.toggle("hidden", !g.lastResult);

    const acts = availableActions();
    const card = (a) => {
      const done = a.once && g.flags["done_" + a.id];
      const disabled = g.actionsLeft <= 0 || done;
      return `<button class="action-card ${a.office !== undefined && a.office !== null && !(Array.isArray(a.office) && a.office[0] === null) ? "office" : ""} ${a.danger ? "danger" : ""}" data-action="${a.id}" ${disabled ? "disabled" : ""}>
        <span class="action-title">${a.title}</span>
        <span class="action-desc">${a.desc}</span>
        <span class="action-foot"><span class="action-hint">${done ? "Done this year" : a.hint}</span>${a.cost ? `<span class="action-cost">${fmtHS(adjCost(a.cost))}</span>` : ""}</span>
      </button>`;
    };
    const officeActs = acts.filter((a) => a.office !== undefined && !(Array.isArray(a.office) && a.office[0] === null));
    const general = acts.filter((a) => !officeActs.includes(a));
    $("#g-office-actions").innerHTML = officeActs.length ? `<h3 class="section-title">Duties of your office</h3><div class="action-grid">${officeActs.map(card).join("")}</div>` : "";
    $("#g-actions").innerHTML = `<h3 class="section-title">Private life and politics</h3><div class="action-grid">${general.map(card).join("")}</div>`;

    $("#g-log").innerHTML = g.log.map((e) => `<li><span class="log-year">${yearLabel(e.turn)}</span>${e.text}</li>`).join("");
    $("#btn-end-year").textContent = g.actionsLeft ? `End the year early →` : `End the year →`;
  }

  // ---------- Rendering: the end ----------
  function legacyScore() {
    let pts = g.history.reduce((s, h) => s + OFFICES[h.office].points, 0);
    pts += g.triumphs.length * 5 + g.laws.length * 3 + g.stats.dignitas / 10;
    if (g.ended.kind === "dictator") pts += 15;
    if (g.pontifex) pts += 4;
    pts += mod("legacy");
    return Math.round(pts);
  }

  const RANKS = [
    [0, "Forgotten", "A back-bencher whose name survives only in a single inscription."],
    [7, "Respectable", "A senator of sound reputation and modest achievement."],
    [13, "Distinguished", "A man whose opinion was asked early in debates."],
    [20, "Illustrious", "A pillar of the Republic, his mask carried proudly at every family funeral."],
    [30, "Great", "One of the great men of Rome, spoken of with Scipio and Marius."],
    [42, "Princeps", "The first man in Rome."],
  ];

  function elogium() {
    const c = g.char;
    const gn = gens();
    const abbr = (p) => CH.PRAENOMINA[p].replace(/\.$/, "");
    const T = CH.toInscription;
    const latin = [];
    const english = [];
    latin.push([abbr(c.praenomen), gn.nomen, abbr(g.fatherPraenomen), "F", c.cognomen, c.agnomen].filter(Boolean).map(T).join(" · "));
    english.push(`${name()}, son of ${g.fatherPraenomen}`);

    const counts = {};
    for (const h of g.history) {
      counts[h.office] = (counts[h.office] || 0) + 1;
      const n = counts[h.office] > 1 ? ` ${roman(counts[h.office])}` : "";
      if (h.province) {
        latin.push([...OFFICES[h.office].latin.split(" "), ...h.province.latin.split(" "), "OBTINVIT"].join(" · "));
        english.push(`${OFFICES[h.office].label}, governor of ${h.province.name}`);
      } else {
        latin.push(OFFICES[h.office].latin.replace(/ /g, " · ") + n);
        english.push(OFFICES[h.office].label + (n ? ` (${counts[h.office]} times)` : ""));
      }
    }
    if (g.pontifex) {
      latin.push("PONTIFEX · MAXIMVS");
      english.push("Pontifex Maximus");
    }
    if (g.triumphs.length) {
      latin.push(`TRIVMPHAVIT${g.triumphs.length > 1 ? " · " + roman(g.triumphs.length) : ""}`);
      english.push(`Celebrated ${g.triumphs.length > 1 ? g.triumphs.length + " triumphs" : "a triumph"}`);
    }
    for (const id of g.laws) {
      const law = LAWS.find((l) => l.id === id);
      latin.push(`LEGEM · ${T(gn.id).toUpperCase()}M · ${law.acc.replace(/ /g, " · ")} · TVLIT`);
      english.push(`Carried the Lex ${gn.id} ${law.adj}`);
    }
    const stone = CH.Epilogue.inscription(epilogueContext(null));
    for (const [l, e] of stone.deeds) {
      latin.push(l);
      english.push(e);
    }
    const age = roman(g.ended.age);
    const endings = {
      death: [`VIXIT · ANNOS · ${age}`, `Lived ${g.ended.age} years`],
      retired: [`VIXIT · ANNOS · ${age}`, `Lived ${g.ended.age} years`],
      exile: ["IN · EXSILIVM · PROFECTVS · EST", "Went into exile"],
      mob: ["IN · CAPITOLIO · OCCISVS", "Killed on the Capitol"],
      slain: ["HOSTIS · PVBLICVS · IVDICATVS", "Declared a public enemy"],
      dictator: ["DICTATOR · REI · PVBLICAE · CONSTITVENDAE", "Dictator for the restoration of the Republic"],
    };
    const [endL, endE] = stone.ending || endings[g.ended.kind];
    latin.push(endL);
    english.push(endE);
    for (const [l, e] of stone.extra) {
      latin.push(l);
      english.push(e);
    }
    return { latin, english };
  }

  // ---------- What Rome said afterwards ----------
  const epilogueContext = (rankName) => ({
    g, name, gens, yearLabel, fmtHS, roman, OFFICES, LAWS, RANK, pName, pShort, pHas, pElo, pLabel, persona,
    bestOffice, mockedFeature, agedChar, hasTrait, legacyScore, rankName,
  });

  function renderEnd() {
    const titles = {
      death: "Mors",
      retired: "Otium",
      exile: "Exsilium",
      mob: "Caedes",
      slain: "Hostis publicus",
      dictator: "Dictator",
    };
    const englishTitles = {
      death: "Death",
      retired: "Retirement",
      exile: "Exile",
      mob: "Murder",
      slain: "Public enemy",
      dictator: "Master of Rome",
    };
    const score = legacyScore();
    const rank = [...RANKS].reverse().find(([min]) => score >= min);
    const { latin, english } = elogium();
    $("#end-kicker").textContent = `${yearLabel(g.ended.turn)} · aged ${g.ended.age}`;
    $("#end-title").innerHTML = `${titles[g.ended.kind]} <em>${englishTitles[g.ended.kind]}</em>`;
    $("#end-text").textContent = g.ended.text;
    $("#end-portrait").innerHTML = CH.renderCharacter(agedChar());
    $("#end-elogium").innerHTML = latin.map((l) => `<div>${l}</div>`).join("");
    $("#end-translation").innerHTML = english.map((l) => `<div>${l}</div>`).join("");
    $("#end-rank").innerHTML = `<span class="rank-name">${rank[1]}</span><span class="rank-desc">${rank[2]}</span><span class="rank-score">Legacy ${score}</span>`;
    $("#end-afterword").innerHTML = CH.Epilogue.scenes(epilogueContext(rank[1]))
      .map(
        (a) => `<div class="aw-card">
          <span class="aw-medal ${a.who ? "persona-face" : "glyph"}">${a.who ? CH.renderCharacter(pAged(a.who), { background: false }) : a.glyph}</span>
          <div class="aw-body"><p class="aw-kicker">${a.kicker}</p><p class="aw-text">${a.text}</p></div>
        </div>`
      )
      .join("");
    $("#end-personae").innerHTML = (g.personae || [])
      .map((n) => {
        const best = bestOffice(n.history);
        const fate = n.alive ? `Outlived you, aged ${n.age}` : n.fate ? n.fate.label : "Departed";
        return `<div class="dp">
          <span class="persona-face">${CH.renderCharacter(pAged(n), { background: false })}</span>
          <span class="dp-text"><b>${pName(n)}</b><span>${pLabel(n)} · ${best ? RANK_ADJ[best] : "Senator"} · ${fate}</span><span class="rel-${relClass(n)}" data-tip-rel="${n.id}">${relLabel(n)}</span></span>
        </div>`;
      })
      .join("");
    localStorage.removeItem(SAVE_KEY);
  }

  // ---------- Wiring ----------
  document.addEventListener("click", (e) => {
    const post = e.target.closest("[data-post]");
    if (post) return choosePost(post.dataset.post);
    const act = e.target.closest("[data-action]");
    if (act && !act.disabled) return doAction(act.dataset.action);
    const per = e.target.closest("[data-persona]");
    if (per) return openPersona(per.dataset.persona);
  });

  document.addEventListener("DOMContentLoaded", () => {
    $("#btn-end-year").addEventListener("click", () => {
      if (g.actionsLeft > 0) {
        modal({
          title: "End the year early?",
          body: `<p>You still have ${g.actionsLeft} deed${g.actionsLeft > 1 ? "s" : ""} left. Idle senators are soon forgotten.</p>`,
          choices: [
            { label: "End the year", onChoose: endYear },
            { label: "Keep working", onChoose: () => {} },
          ],
        });
      } else endYear();
    });
  });

  CH.Game = { start, load, hasSave, needsPosting, renderSenate, render, renderEnd, relationTip, nickTip };
})();
