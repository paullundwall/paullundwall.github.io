// What Rome said afterwards: an epilogue built from the memories of one particular life.
(function () {
  const CH = (window.CH = window.CH || {});

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randi = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const list = (items) => (items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}` : items[0] || "");
  // Second-person text ("for your nose") into third person ("for his nose").
  const toHe = (t) => t.replace(/\byourself\b/g, "himself").replace(/\byour\b/g, "his").replace(/\byou\b/g, "he");

  const CITY = {
    Sicily: ["Syracuse", "SYRACVSANI"],
    "Nearer Spain": ["Tarraco", "TARRACONENSES"],
    "Further Spain": ["Corduba", "CORDVBENSES"],
    Macedonia: ["Thessalonica", "THESSALONICENSES"],
    Asia: ["Ephesus", "EPHESII"],
    Africa: ["Utica", "VTICENSES"],
    Cilicia: ["Tarsus", "TARSENSES"],
    "Cisalpine Gaul": ["Aquileia", "AQVILEIENSES"],
    "Transalpine Gaul": ["Narbo", "NARBONENSES"],
    Sardinia: ["Caralis", "CARALITANI"],
    Bithynia: ["Nicomedia", "NICOMEDENSES"],
  };
  const MONUMENT_LATIN = {
    "a portico on the Campus Martius": ["PORTICVM · IN · CAMPO · MARTIO · RESTITVIT", "Restored a portico on the Campus Martius"],
    "the Temple of Fortuna": ["AEDEM · FORTVNAE · RESTITVIT", "Restored the Temple of Fortuna"],
    "a fountain in the Forum Boarium": ["LACVM · IN · FORO · BOARIO · FECIT", "Built a fountain in the Forum Boarium"],
    "the Temple of Hercules Victor": ["AEDEM · HERCVLIS · VICTORIS · RESTITVIT", "Restored the Temple of Hercules Victor"],
    "a stretch of the Via Appia": ["VIAM · APPIAM · STRAVIT", "Paved the Via Appia"],
  };
  const MONTHS = ["Ianuarius", "Februarius", "Martius", "Aprilis", "Maius", "Iunius", "Quinctilis", "Sextilis", "September", "October", "November", "December"];
  const DAYS = ["the Kalends", "the Nones", "the Ides", "the day before the Ides", "the third day before the Kalends"];
  const GREEKS = ["Phocion", "Agesilaus", "Timoleon", "Philopoemen", "Eumenes", "Pelopidas", "Aratus", "Dion", "Lysander", "Nicias"];
  const FREEDMEN = ["Philemon", "Diodotus", "Eros", "Hermippus", "Tryphon", "Alexander", "Apollonius", "Demetrius"];
  const MODERN = [
    ["1879", "a farmer ploughing near Tibur", "now sits in a museum basement in Rome, between a broken sarcophagus and a fire extinguisher"],
    ["1544", "workmen digging the foundations of a cardinal's palace", "was built into the cardinal's garden wall, upside down"],
    ["1932", "engineers laying a new road for Mussolini", "was photographed once, then lost again"],
    ["1761", "an English milord on the Grand Tour", "was shipped to Norfolk, where it holds open a greenhouse door"],
    ["1998", "a man repairing his cellar in Trastevere", "is now the centrepiece of a pizzeria"],
    ["1823", "a shepherd sheltering from the rain", "was sold to a German professor for the price of a goat"],
  ];

  CH.Epilogue = { scenes, inscription };

  // ---------- Facts: the raw material of every speech ----------
  function buildFacts(x) {
    const { g, yearLabel, fmtHS, LAWS, OFFICES, pName, pShort, persona } = x;
    const nm = x.gens().id;
    const out = [];
    const add = (tone, p, w = 1, turn = null, vivid = false) => out.push({ tone, p, w, turn, vivid });
    const y = (m) => yearLabel(m.turn);
    const who = (id) => (id && persona(id) ? pName(persona(id)) : null);
    const has = (m, re) => re.test(m.result || "");

    for (const m of g.memories || []) {
      if (m.kind === "event") {
        const sub = who(m.subject) || who(m.persona);
        switch (m.id) {
          case "fire":
            if (has(m, /bread and blankets/)) add("praise", `fed and clothed the Subura when it burned in ${y(m)}`, 2, m.turn, true);
            if (has(m, /sell for a song/)) add("mock", `bought the burning tenements of the Subura for a song in ${y(m)}, then had his private fire brigade put them out`, 3, m.turn, true);
            if (has(m, /condolence/)) add("mock", `sent a letter of condolence when the Subura burned`, 1, m.turn);
            break;
          case "loan":
            if (/Accept/.test(m.choice)) add("mock", `borrowed four hundred thousand from a man who buys burning houses`, 1, m.turn);
            break;
          case "bribe":
            if (/Keep/.test(m.choice)) add("mock", `kept the tax-farmers' figs, and the silver underneath`, 2, m.turn, true);
            if (/Return/.test(m.choice)) add("praise", `sent back the tax-farmers' silver and kept only the figs`, 2, m.turn, true);
            if (/Denounce/.test(m.choice)) add("praise", `denounced the tax-farmers who tried to buy him`, 2, m.turn);
            break;
          case "client":
            if (has(m, /mushrooms/)) add("praise", `proved that a wool merchant's partner died of bad mushrooms, not poison`, 2, m.turn, true);
            if (has(m, /condemned/)) add("mock", `lost the wool merchant's case in ${y(m)}; the mushrooms were innocent`, 2, m.turn);
            if (/Abandon/.test(m.choice)) add("mock", `abandoned a client from the Aventine to his fate`, 2, m.turn);
            break;
          case "omen":
            if (/expiation/.test(m.choice)) add("praise", `paid for the expiation when a two-headed calf was born at Reate`, 1, m.turn);
            if (has(m, /Who knew/)) add("mock", `bribed the haruspices to discover that the gods agreed with him`, 3, m.turn, true);
            if (has(m, /buy the gods/)) add("mock", `tried to buy the gods' interpreters in ${y(m)}, and was caught`, 3, m.turn, true);
            if (/Scoff/.test(m.choice)) add("mock", `laughed out loud at a two-headed calf`, 1, m.turn);
            break;
          case "pirates":
            if (has(m, /crucify/)) add("praise", `hunted down the Cilician pirates off Pharmacusa and crucified every one of them, exactly as he had promised`, 4, m.turn, true);
            if (has(m, /thinner and wiser/)) add("mock", `paid a pirates' ransom for his steward without even haggling`, 2, m.turn);
            if (has(m, /Delos/)) add("mock", `let pirates sell his own steward at Delos rather than pay the ransom`, 3, m.turn, true);
            if (has(m, /slip away/)) add("mock", `chased pirates around the Aegean for a summer and caught none`, 2, m.turn);
            break;
          case "illness":
            if (has(m, /shake it off/)) add("praise", `shook off the fever of ${y(m)} without missing a session of the Senate`, 1, m.turn);
            break;
          case "lampoon":
            if (has(m, /wittier/)) add("praise", `out-rhymed the poets who scrawled verses about him on the walls`, 2, m.turn, true);
            if (has(m, /do not scan/)) add("mock", `answered a lampoon with verses that did not scan`, 2, m.turn, true);
            if (has(m, /fined/)) add("mock", `sued a poet over a rhyme`, 2, m.turn, true);
            break;
          case "veterans":
            if (/Champion/.test(m.choice)) add("praise", `stood with the veterans when the Senate would not give them their farms`, 2, m.turn);
            break;
          case "grain":
            if (/Buy/.test(m.choice)) add("praise", `bought bread for the whole city when the grain fleet was late in ${y(m)}`, 3, m.turn, true);
            if (/Sell/.test(m.choice)) add("mock", `sold his own grain at three times the price during the bread riots of ${y(m)}`, 3, m.turn, true);
            break;
          case "slaves":
            if (has(m, /trap a column/)) add("praise", `trapped a column of Spartacus' gladiators against a river in Campania`, 4, m.turn, true);
            if (has(m, /routed/)) add("mock", `ran from Spartacus' gladiators in Campania`, 3, m.turn, true);
            break;
          case "creditors":
            if (/Sell/.test(m.choice)) add("mock", `sold his Campanian farm to a freedman to pay his debts`, 2, m.turn);
            if (/Bar/.test(m.choice)) add("mock", `barred his doors and let his creditors shout through them all morning`, 3, m.turn, true);
            break;
          case "invitation":
            if (/Inform/.test(m.choice)) add("praise", `denounced a conspiracy to the consul the morning after the dinner where it was hatched`, 2, m.turn, true);
            break;
          case "pontifex":
            if (has(m, /It is Pontifex/)) add("praise", `was elected Pontifex Maximus in ${y(m)}, and moved into the Domus Publica`, 4, m.turn);
            if (has(m, /more grey in his beard/)) add("mock", `stood for Pontifex Maximus in ${y(m)} and lost to a man with more grey in his beard`, 2, m.turn);
            break;
          case "fit":
            if (has(m, /gods have spoken/)) add("praise", `fell in a fit in the Comitium and persuaded the augurs it was a message from Jupiter`, 3, m.turn, true);
            if (has(m, /Nobody believes/)) add("mock", `fell in a fit in the Comitium and claimed it was a message from the gods. Nobody believed him`, 3, m.turn, true);
            break;
          case "scandal":
            if (has(m, /fishmonger/)) add("mock", `leapt from a married woman's window into a fishmonger's cart`, 5, m.turn, true);
            if (has(m, /hairy ankles/)) add("mock", `escaped an angry husband dressed as a woman, and was betrayed by his hairy ankles`, 5, m.turn, true);
            if (has(m, /front door/)) add("mock", `wished a cuckolded husband good evening and strolled out of his front door`, 4, m.turn, true);
            if (has(m, /tell everyone/)) add("mock", `paid a husband's slaves for their silence, and got none`, 3, m.turn, true);
            break;
          case "quarrel":
            if (has(m, /on the ear/)) add("mock", `threw his stylus across the Curia and hit a senator on the ear`, 4, m.turn, true);
            if (has(m, /flay him/)) add("praise", `flayed a senator on the Rostra so thoroughly that the man retired to his estates`, 3, m.turn, true);
            break;
          case "feud":
            if (has(m, /barber/)) add("praise", `answered ${sub || "an enemy"} in the Senate with a reply quoted in every barber's shop`, 3, m.turn, true);
            if (has(m, /stumble/)) add("mock", `tried to answer ${sub || "an enemy"} in the Senate and stumbled`, 2, m.turn);
            break;
          case "creditor":
            if (/Accept/.test(m.choice)) add("mock", `let ${sub || "a moneylender"} pay his debts, and voted as he was told ever after`, 3, m.turn);
            break;
          case "prosecution": {
            const acc = m.accuserName || "an enemy";
            const crime = m.crime || "corruption";
            if (has(m, /Acquitted/)) {
              if (/Bribe/.test(m.choice)) add("mock", `was acquitted of ${crime} in ${y(m)}, by a jury that went home noticeably richer`, 4, m.turn, true);
              else add("praise", `was prosecuted for ${crime} by ${acc} in ${y(m)}, and walked out of court acquitted`, 3, m.turn, true);
            } else if (has(m, /fine/)) add("mock", `was convicted of ${crime} in ${y(m)} and fined two hundred thousand`, 3, m.turn, true);
            break;
          }
          case "exposed":
            if (has(m, /wounded dignity/)) add("mock", `denied everything with wounded dignity when the consul denounced his conspiracy`, 4, m.turn, true);
            if (has(m, /name names/)) add("mock", `named five fellow conspirators to the strangler in the Tullianum`, 5, m.turn, true);
            break;
          case "imperator":
            if (has(m, /grants your triumph/)) add("praise", `rode through Rome in triumph with his face painted red`, 4, m.turn);
            if (has(m, /technicality/)) add("mock", `asked for a triumph and was refused on a technicality`, 2, m.turn);
            if (/Decline/.test(m.choice)) add("praise", `refused a triumph his soldiers begged him to ask for`, 2, m.turn);
            break;
          case "funeral":
            if (has(m, /weeping/)) add("praise", `gave the funeral oration for ${sub} that had the whole Forum weeping`, 3, m.turn, true);
            if (has(m, /voice cracks/)) add("mock", `burst into tears halfway through ${sub}'s funeral oration`, 2, m.turn, true);
            if (/Celebrate/.test(m.choice)) add("mock", `threw a dinner party on the day of ${sub}'s funeral`, 5, m.turn, true);
            break;
          default:
        }
      } else if (m.kind === "battle") {
        if (m.won) add("praise", `broke the ${m.enemy} in ${m.place} in ${y(m)}`, 3, m.turn, true);
        else add("mock", `marched a column into an ambush of the ${m.enemy} in ${m.place}`, 3, m.turn, true);
      } else if (m.kind === "law") {
        const law = LAWS.find((l) => l.id === m.id);
        if (m.passed) add("praise", `carried the Lex ${nm} ${law.adj} in ${y(m)}`, 4, m.turn);
        else add("mock", `saw his Lex ${nm} ${law.adj} rejected amid uproar in ${y(m)}`, 3, m.turn, true);
      } else if (m.kind === "election") {
        const label = OFFICES[m.office].label.toLowerCase();
        const by = (m.cast || []).map(who).filter(Boolean);
        if (!m.won) add("mock", `lost the ${label} election of ${y(m)}${by.length ? ` to ${list(by)}` : ""}`, by.length ? 3 : 2, m.turn);
        else if (m.office === "consul") add("praise", `was consul in ${yearLabel(m.turn + 1)}, with ${m.others[0] || "a colleague nobody remembers"} as his colleague`, 5, m.turn + 1);
      } else if (m.kind === "monument") {
        add("praise", `put his name in bronze letters on ${m.where}`, 3, m.turn);
      } else if (m.kind === "games") {
        if (m.level === "Unforgettable") add("praise", `put elephants in the Circus Maximus and made the fountains run with wine`, 4, m.turn, true);
        if (m.level === "Lavish") add("praise", `brought panthers from Mauretania for his games`, 3, m.turn, true);
        if (m.level === "Respectable") add("mock", `gave respectable games in ${y(m)}. Nobody was trampled, and nobody remembers them`, 3, m.turn, true);
      } else if (m.kind === "deed") {
        const n = who(m.id);
        if (m.label === "Prosecute him" && /condemned/.test(m.text)) add("praise", `sent ${n} into exile`, 4, m.turn, true);
        if (m.label === "Prosecute him" && /acquits/.test(m.text)) add("mock", `prosecuted ${n} and lost`, 3, m.turn);
        if (m.label === "Attack him in the Senate" && /apart/.test(m.text)) add("praise", `took ${n} apart in the Senate, clause by clause`, 3, m.turn, true);
        if (m.label === "Attack him in the Senate" && /laughs at you/.test(m.text)) add("mock", `attacked ${n} in the Senate and was laughed off the floor`, 3, m.turn, true);
        if (/gift/.test(m.label) && /Twelve Tables/.test(m.text)) add("mock", `tried to give ${n} a present of silver and got a lecture on the Twelve Tables`, 3, m.turn, true);
      } else if (m.kind === "act" && m.province) {
        if (m.id === "extort") add("mock", `squeezed ${m.province} until the temples were bare`, 3, m.turn, true);
        if (m.id === "justice") add("praise", `governed ${m.province} so justly that its cities sent embassies to praise him`, 3, m.turn);
      }
    }
    const c = g.counts || {};
    if ((c.banquet || 0) >= 4) add("mock", `never gave a dinner for fewer than nine couches, and gave ${c.banquet} of them`, 2);
    if ((c.rhetoric || 0) >= 3) add("mock", `took ${c.rhetoric} courses of lessons from Greek rhetors and still sawed the air with his right hand`, 2);
    if ((c.defend || 0) >= 3) add("praise", `defended ${c.defend} citizens in the courts`, 2);
    if ((c.salutatio || 0) >= 6) add("praise", `opened his doors at dawn to every client in Rome`, 1);
    if ((c.temple || 0) >= 4) add("praise", `sacrificed ${c.temple} white bulls to Jupiter`, 1);
    if ((c.borrow || 0) >= 3) add("mock", `borrowed from every banker in the Forum, some of them twice`, 2);
    if ((c.veto || 0) >= 2) add("mock", `vetoed the Senate's business ${c.veto} times in a single tribunate`, 2);
    if ((c.streets || 0) >= 2) add("praise", `waded into the Cloaca Maxima in person`, 2, null, true);
    if (g.post === "ostia") add("praise", "brought the grain fleet into Ostia early as quaestor", 1, 0);
    if (g.post === "urban") add("praise", "kept the keys of the treasury as urban quaestor and never lost one", 1, 0);
    if (g.debt > 0) add("mock", `died owing ${fmtHS(g.debt)}`, 3);
    for (const n of g.nicknames || []) if (n.tone === "mock" && n.why) add("mock", `was called ${n.name} ${toHe(n.why)}`, 2, n.turn);
    return out.filter((f, i) => out.findIndex((o) => o.p === f.p) === i);
  }

  const weightedPick = (facts, n) => {
    const pool = [...facts];
    const out = [];
    while (pool.length && out.length < n) {
      let r = Math.random() * pool.reduce((s, f) => s + f.w, 0);
      const i = pool.findIndex((f) => (r -= f.w) < 0);
      out.push(pool.splice(i < 0 ? 0 : i, 1)[0]);
    }
    return out;
  };

  // ---------- The inscription on the tomb ----------
  function inscription(x) {
    const { g, roman, pName, persona } = x;
    const deeds = [];
    const mem = g.memories || [];
    const mon = mem.find((m) => m.kind === "monument");
    if (mon && MONUMENT_LATIN[mon.where]) deeds.push(MONUMENT_LATIN[mon.where]);
    const games = mem.find((m) => m.kind === "games");
    if (games && games.level !== "Respectable") deeds.push([`LVDOS · ${games.level === "Unforgettable" ? "MAGNIFICENTISSIMOS" : "MAGNIFICOS"} · FECIT`, `Gave ${games.level === "Unforgettable" ? "the most magnificent" : "magnificent"} games`]);
    if (mem.some((m) => m.kind === "event" && m.id === "pirates" && /crucify/.test(m.result))) deeds.push(["PRAEDONES · MARITIMOS · CEPIT", "Captured the pirates of the sea"]);
    if (mem.some((m) => m.kind === "event" && m.id === "slaves" && /trap a column/.test(m.result))) deeds.push(["FVGITIVOS · IN · CAMPANIA · CECIDIT", "Cut down the runaway slaves in Campania"]);
    if (mem.some((m) => m.kind === "event" && m.id === "imperator")) deeds.push(["IMPERATOR · APPELLATVS", "Hailed as imperator by his soldiers"]);
    const just = mem.find((m) => m.kind === "act" && m.id === "justice" && CITY[m.province]);
    if (just) deeds.push([`${CITY[just.province][1]} · PATRONO`, `Patron of the people of ${CITY[just.province][0]}`]);

    let ending = null;
    const extra = [];
    const kind = g.ended.kind;
    if (kind === "death" || kind === "retired") {
      const months = randi(0, 11);
      const days = randi(1, 29);
      ending = [
        `VIXIT · ANNOS · ${roman(g.ended.age)}${months ? ` · MENSES · ${roman(months)}` : ""} · DIES · ${roman(days)}`,
        `Lived ${g.ended.age} years${months ? `, ${months} month${months > 1 ? "s" : ""}` : ""} and ${days} day${days > 1 ? "s" : ""}`,
      ];
      extra.push(pick([["H · S · E", "He lies here"], ["S · T · T · L", "May the earth lie lightly on you"], ["D · M", "To the spirits of the dead"], ["HAVE · ET · VALE", "Hail and farewell"]]));
    }
    if (kind === "slain") extra.push(["[ · · · ERASVM · · · ]", "By order of the Senate your name was chiselled out. The mason was careless: it can still be read."]);

    const friend = (g.personae || []).filter((n) => n.relation >= 30 || n.kin).sort((a, b) => b.relation - a.relation)[0];
    const abbr = (n) => (CH.PRAENOMINA[n.char.praenomen] || n.char.praenomen[0] + ".").replace(/\.$/, "");
    const T = CH.toInscription;
    const options = [];
    if (kind === "dictator") options.push(["S · P · Q · R", "Set up by the Senate and People of Rome"]);
    else if (kind === "exile") options.push(["MASSILIENSES · HOSPITI", "Set up by the people of Massilia, for their guest"]);
    else if (kind !== "slain" && kind !== "mob") {
      if (friend) options.push([`${[abbr(friend), CH.getGens(friend.char.gens).nomen, friend.char.cognomen].filter(Boolean).map(T).join(" · ")} · ${friend.kin ? "ADFINI · CARISSIMO" : "AMICO · OPTIMO"}`, `Set up by ${pName(friend)}, for his ${friend.kin ? "dearest kinsman" : "best friend"}`]);
      if (g.wife) options.push([`${T(g.wife).toUpperCase().replace(/ /g, " · ")} · CONIVGI · BENE · MERENTI`, `Set up by his wife ${g.wife}, for a husband who deserved it`]);
      options.push(["HEREDES · EX · TESTAMENTO · FECERVNT", "Set up by his heirs, because the will said they must"]);
      if (g.stats.populus >= 60) options.push([`TRIBVS · ${g.tribe.toUpperCase()}`, `Set up by the tribe ${g.tribe}, which voted for him every time`]);
    }
    if (options.length) extra.push(pick(options));
    return { deeds, ending, extra };
  }

  // ---------- The scenes ----------
  function scenes(x) {
    const { g, yearLabel, fmtHS, LAWS, OFFICES, pName, pShort, pHas, pElo, bestOffice, mockedFeature, agedChar, hasTrait, rankName, roman, name } = x;
    const kind = g.ended.kind;
    const died = ["death", "retired", "mob", "slain"].includes(kind);
    const gn = x.gens();
    const nm = gn.id;
    const nomenAdj = gn.nomen.replace(/i?us$/, "iana");
    const me = g.char.cognomen || gn.nomen;
    const cast = g.personae || [];
    const alive = cast.filter((n) => n.alive);
    const facts = buildFacts(x);
    const praise = facts.filter((f) => f.tone === "praise");
    const mock = facts.filter((f) => f.tone === "mock");
    const used = new Set();
    const take = (pool, n) => {
      const got = weightedPick(pool.filter((f) => !used.has(f.p)), n);
      got.forEach((f) => used.add(f.p));
      return got;
    };
    const out = [];
    const add = (who, glyph, kicker, text) => out.push({ who, glyph, kicker, text });
    const endYear = yearLabel(g.ended.turn);
    const consuls = (g.consuls && g.consuls[g.ended.turn]) || [];
    const myBest = bestOffice(g.history);
    const featureLine = {
      "your ears": ["They had to widen the door of the tomb for his ears.", "The mask-maker charged extra for the ears.", "With ears like that, he will hear the eulogies from the underworld."],
      "your nose": ["The mask-maker ran out of wax halfway down the nose.", "The nose will reach the Styx a full day before the rest of him.", "They are burying the nose with full honours; the man is incidental."],
      "your belly": ["Eight bearers for the bier, and they asked for a ninth.", "The pyre has been burning since dawn. It will be burning tomorrow.", "He was the only man in Rome who could block the Via Sacra on his own."],
      "your bald head": ["At least the sculptor saved on the hair.", "The sun on that head blinded three jurors in the year of his praetorship."],
      "your bloodshot eyes": ["It is the first night in thirty years he has gone without wine.", "The wine merchants of the Velabrum have declared a day of mourning."],
      "your wandering eye": ["Even now, one eye is on my seat in the Senate.", "Nobody ever knew who he was looking at. Least of all him."],
    }[mockedFeature(agedChar())];

    // 1. The funeral oration, or whatever stands in for it.
    const speaker = alive.filter((n) => n.relation >= 15 || n.kin).sort((a, b) => b.relation + (b.kin ? 30 : 0) - (a.relation + (a.kin ? 30 : 0)))[0];
    const freedman = `${g.char.praenomen} ${gn.nomen} ${pick(FREEDMEN)}`;
    const voice = speaker ? pName(speaker) : `Your freedman ${freedman}`;
    const career = take(praise, 3).map((f) => f.p);
    const anecdote = take(praise.filter((f) => f.vivid), 1)[0];
    const bond = speaker && [...(speaker.relLog || [])].filter((e) => e.d > 0).sort((a, b) => b.d - a.d)[0];
    const BOND = {
      "Received your gift": "When I was poor, he sent me silver and pretended it was a loan.",
      "Dined with you": "He fed me more dinners than I can count, and laughed at every one of my stories, even the third time.",
      "Promised you his backing": "I canvassed for him in the rain, and he never once let me forget that he would have done the same.",
      "Gave you his family in marriage": "I gave him my sister. I would give him another, if I had one.",
      "A boyhood friendship": "We stole figs together when we were eight. He still owes me half of them.",
      "He pulled you out of the Tiber when you were nine": "I pulled him out of the Tiber once. I have spent forty years wondering if he was worth it. He was.",
      "You were nursed by the same wet-nurse": "We were nursed at the same breast. He took more than his share even then.",
      "Your father's oldest friend": "I promised his father I would look after him. He never made it easy.",
      "He promised your dying father to look after you": "I promised his father I would look after him. He never made it easy.",
    };
    const flourish = {
      gourmand: ["No man in Rome kept a better table, and I have the waistline to prove it.", "He knew forty ways to stuff a dormouse, and taught me thirty-nine."],
      drinker: ["He drank a little more than his doctors liked. So did Cato.", "He never refused a cup, or a friend."],
      witty: ["He made me laugh in the Curia, at funerals, and once, unforgivably, during a sacrifice.", "Half of the jokes you tell in the baths are his. He would want them back."],
      rake: ["Half the matrons of Rome are in mourning today, and their husbands would like to know why.", "He loved Rome, and a good part of its population.", "I see several ladies in the crowd who are trying very hard not to catch each other's eye."],
      gambler: ["He would bet on anything. He bet on Rome, and Rome paid out.", "He once lost a farm on a single throw, and laughed."],
      clement: ["He forgave his enemies, which annoyed them more than anything else he ever did."],
      irascible: ["He had a temper. I have the scars of several dinners.", "He shouted at me once a month for forty years. I shall miss it."],
      pious: ["The gods, who agree on nothing, all liked him."],
      frugal: ["He wore the same toga for eleven years. It is the one he is wearing now."],
      spendthrift: ["He never kept a sesterce longer than an afternoon, and Rome was richer for it.", `He spent ${g.debt > 0 ? `${fmtHS(g.debt)} more than he had` : "every coin he ever had"}, and most of it on us.`, "His steward is here today. He looks relieved."],
      learned: ["He could quote Homer in Greek and the Twelve Tables backwards."],
      coward: ["He was not the bravest of men, but he was wise enough to know it, which is rarer."],
      brave: ["He never once looked behind him, in a battle or in a debate."],
      incorruptible: ["He was offered more bribes than any man I know, and took none. I asked."],
      greedy: ["He loved money, but money, to be fair, loved him back."],
      proud: ["He never bowed his head to any man. It is bowed now, and only to the gods below."],
      earlyriser: ["He was at his desk before the cocks crowed. Let him sleep now."],
      writer: ["He wrote everything down. The rest of us will have to remember."],
      ambitious: ["He wanted everything, and he very nearly got it."],
      charming: ["He could talk a Vestal into a wine shop, and a moneylender out of one."],
      tireless: ["I never once saw him asleep. I am not certain he is asleep now."],
    };
    const traitLines = Object.entries(flourish).filter(([id]) => hasTrait(id)).flatMap(([, l]) => l);
    const opening = pick([
      `“Citizens! ${me} would have wanted me to be brief. He never was.`,
      `“Romans! I did not come here to bury ${me} quietly.`,
      `“Citizens, I knew ${me} for ${g.ended.age - 25} years, and I still could not tell you what he was thinking.`,
      `“They asked me to speak because nobody else could stop crying long enough.`,
      `“Look at the masks behind me, citizens. Today the gens ${nm} adds one more face.`,
      `“Citizens. I have spoken from this Rostra many times, but never with so little wish to.`,
    ]);
    const careerLine = career.length ? ` This was a man who ${list(career)}.` : myBest === "quaestor" ? " He was quaestor. I confess I had to ask his steward what else to say." : "";
    const story = anecdote
      ? ` ${pick([`I remember the year he ${anecdote.p}.`, `I was there when he ${anecdote.p}.`, ...(anecdote.turn != null && !/ BC/.test(anecdote.p) ? [`In ${yearLabel(anecdote.turn)} he ${anecdote.p}.`] : []), `They will tell you he ${anecdote.p}. It is true.`, `Some of you were alive when he ${anecdote.p}.`])} ${pick(["Who else would have?", "Nobody had asked him to.", "Rome talked of nothing else for a month.", "He told it better than I can.", "I have never laughed so hard, or been so frightened.", "I still do not know how he got away with it.", "He would want me to tell it properly. I shall not."])}`
      : "";
    const bondLine = bond && BOND[bond.why] ? ` ${BOND[bond.why]}` : "";
    const traitLine = traitLines.length ? ` ${pick(traitLines)}` : "";
    const closing = pick([
      " Weep for him, Romans. He would have enjoyed it.”",
      ` Go home, and tell your sons about ${me}.”`,
      " That is all. It is not enough.”",
      " The Republic is poorer today, and so am I.”",
      " Farewell, my friend. Keep a couch for me.”",
      " He is gone, and the Forum is very quiet.”",
    ]);
    const speech = `${opening}${careerLine}${story}${bondLine}${traitLine}${closing}`;
    const good = speaker ? Math.random() < 0.3 + pElo(speaker) / 120 : Math.random() < 0.4;
    const rival0 = alive.find((n) => n.role === "aemulus") || [...alive].sort((a, b) => a.relation - b.relation)[0];
    const nick = (g.nicknames || [])[0];
    const crowd = good
      ? pick([
          "By the end, even the moneylenders are weeping.",
          "The crowd follows the bier all the way to the Campus Martius.",
          consuls[0] ? `${consuls[0]}, presiding as consul, is seen to wipe his eye.` : "The consul, presiding, is seen to wipe his eye.",
          rival0 ? `Even ${pShort(rival0)}, standing at the back, applauds. Twice.` : "The applause goes on for some time.",
          nick ? `Somebody in the crowd starts chanting “${nick.name}!”, and soon the whole Forum is at it.` : "Somebody in the crowd starts chanting your name.",
          "A woman nobody recognises throws herself onto the pyre and has to be pulled off. Nobody asks who she was.",
        ])
      : pick([
          "The speech runs long. Halfway through, the crowd drifts off to watch a cockfight.",
          "It starts to rain in the second hour, and the crowd starts to leave in the third.",
          "He loses his notes, then his place, then the crowd.",
          "A dog wanders onto the Rostra and steals the show, and a sausage.",
          "The actor wearing your father's mask trips on the steps, and nobody hears another word.",
        ]);
    if (kind === "exile") {
      add(speaker || null, speaker ? null : "VALE", `A letter reaches you at Massilia, ${yearLabel(g.ended.turn + 1)}`,
        `${speaker ? pName(speaker) : `Your freedman ${freedman}`} writes ${pick(["every month", "every Nones", "whenever a ship sails"])}. ${pick(["In the first letter", "In the last letter before winter", "In a letter that takes four months to arrive"])}: “${pick(["The Forum is dull without you.", `${rival0 ? pShort(rival0) : "Your rival"} is unbearable now.`, "Your dog still waits at the door.", `The Senate debated your recall for ${randi(2, 6)} days, then broke for the games.`])}${traitLine} ${pick(["Come home when they let you.", "I am working on the tribunes.", "Your plane trees are well. I am watering them myself."])}”`);
    } else if (kind === "dictator") {
      add(speaker || null, speaker ? null : "S·P·Q·R", "The Rostra, at the dedication of your statue",
        `${voice} delivers a panegyric so fulsome that even you look at your feet. ${speech} ${pick(["The statue is gilded. Its nose is not quite right.", "The statue is three feet taller than you."])}`);
    } else if (kind === "slain") {
      add(speaker || null, speaker ? null : "VALE", pick(["A locked dining room, by lamplight", "A cellar on the Aventine, after dark"]),
        `${pick(["Speaking for a public enemy is a capital crime.", "Your name may not be spoken in Rome.", "There is no funeral, and no mask for the atrium."])} ${voice} does it anyway, in a whisper, to ${randi(4, 9)} friends and a nervous slave. ${speech}`);
    } else if (kind === "mob") {
      add(speaker || null, speaker ? null : "VALE", pick(["The banks of the Tiber, that night", "The Tiber island, before dawn"]),
        `The mob throws your body in the river. ${voice} pays ${randi(2, 4)} boatmen to fish it out below the ${pick(["Aemilian bridge", "Sublician bridge", "Tiber island"])}, and buries you at his own expense. ${speech}`);
    } else {
      add(speaker || null, speaker ? null : "VALE", `The Rostra, ${pick(DAYS)} of ${pick(MONTHS)}, ${endYear}`,
        `${speaker ? `${pName(speaker)} gives the laudatio.` : `No senator comes forward to speak, so your freedman ${freedman} does it himself.`} ${speech} ${crowd}`);
    }

    // 2. The enemy has the last word.
    const rival = [...alive].filter((n) => n !== speaker && n.relation <= -10).sort((a, b) => (a.role === "aemulus" ? -50 : 0) + a.relation - ((b.role === "aemulus" ? -50 : 0) + b.relation))[0];
    const where = pick([
      "at the Senian baths", "over dinner at his house on the Carinae", "to his barber, who tells everyone", "in a letter to a friend in Athens, which is copied all over Rome",
      "on the steps of the Temple of Castor", "in the Curia, in the middle of a debate on the water supply", "at a cockfight in the Subura", "to the garland-seller outside the Temple of Venus",
    ]);
    if (rival) {
      const jokes = take(mock, 2).map((f, i) =>
        pick([
          `“Do you remember when he ${f.p}?”`,
          `“He ${f.p}. I rest my case.”`,
          `“They say he ${f.p}. They say it because I told them.”`,
          `“Write this on his tomb: he ${f.p}.”`,
          ...(f.turn != null && !/ BC/.test(f.p) ? [`“In ${yearLabel(f.turn)} he ${f.p}. That was a good year for him.”`] : []),
          `“My grandsons will ask me what he did. I shall say: he ${f.p}.”`,
          `“He ${f.p}, and then he asked for my vote.”`,
          `“I have a statue of him in my latrine. It shows the time he ${f.p}.”`,
          `“${cap(f.p.replace(/^was /, "being "))}? ${i ? "Typical." : "That was him on a good day."}”`,
        ])
      );
      const beat = (g.memories || []).find((m) => m.kind === "election" && !m.won && (m.cast || []).includes(rival.id));
      if (beat) jokes.unshift(`“I beat him for the ${OFFICES[beat.office].label.toLowerCase()} in ${yearLabel(beat.turn)}. He never forgave me, and I never let him.”`);
      if (featureLine && Math.random() < 0.6) jokes.push(`“${pick(featureLine)}”`);
      if (!jokes.length) jokes.push(pick([`“I shall miss him,” he says. “Who will I beat now?”`, `“A great loss,” he says, and orders more wine.`]));
      add(rival, null, cap(where.replace(/^(at|to|in|on|over) /, "").split(",")[0]),
        `${pName(rival)} has a few words about you ${where}. ${jokes.slice(0, 3).join(" ")}`);
    } else {
      const deadRival = cast.find((n) => !n.alive && n.role === "aemulus" && n.fate && n.fate.kind === "death");
      if (deadRival) add(null, "MANES", "The Underworld, presumably", pick([
        `Your rival ${pName(deadRival)} went before you, in ${yearLabel(deadRival.fate.turn)}. It is generally assumed that the two of you are already arguing about precedence.`,
        `${pName(deadRival)}, your rival, died in ${yearLabel(deadRival.fate.turn)}. His son reads your epitaph, counts the offices, and goes home to count his father's.`,
      ]));
    }

    // 3. The exiles come home.
    for (const n of cast.filter((c) => c.fate && c.fate.kind === "exile").slice(0, 2)) {
      const from = n.fate.place || "Massilia";
      const yrs = randi(2, 6);
      let text;
      if (kind === "exile") text = `${pName(n)}, whom you sent to ${from} in ${yearLabel(n.fate.turn)}, is recalled the very month you are banished. You pass each other on the Via Aurelia, he going home, you leaving. ${pick(["He waves.", "He raises his cup.", "He does not look up."])}`;
      else if (kind === "dictator") text = `You recall ${pName(n)} from ${from}, simply to show that you can. He thanks you from the Rostra in a speech so ironic that only half the Senate notices.`;
      else if (pHas(n, "clement") || pHas(n, "pious")) text = `${cap(String(yrs))} years later an amnesty brings ${pName(n)} home from ${from}. He goes straight to your tomb, reads your epitaph twice, ${pick(["lays a wreath of myrtle", "pours a little wine on the ground", "straightens a crooked letter with his thumb"])}, and says nothing at all.`;
      else if (pHas(n, "irascible") || pHas(n, "ruthless") || n.relation <= -60) text = `${cap(String(yrs))} years later an amnesty brings ${pName(n)} home from ${from}. He hires a mason by night to add one word to your epitaph: ${pick(["MENDAX, “liar”", "FVR, “thief”", "PERIVRVS, “perjurer”"])}. Your heirs have it chiselled off; the outline is still there.`;
      else text = pick([
        `${cap(String(yrs))} years later an amnesty brings ${pName(n)} home from ${from}. He buys your house at auction and sleeps in your bed. He says it is very comfortable.`,
        `${pName(n)} never comes back from ${from}. He opens a school of rhetoric there, and teaches your speeches as examples of what not to do.`,
        `${pName(n)} comes home from ${from} after ${yrs} years with a Greek wife, a Greek beard and a book about you. The book is not kind, and sells very well.`,
      ]);
      add(n, null, `The exile of ${from}`, text);
    }

    // 4. Your friends and foes, each in their own way.
    const noted = shuffle(alive.filter((n) => n !== speaker && n !== rival && !n.fate)).sort((a, b) => Math.abs(b.relation) + (b.kin ? 40 : 0) + (b.conspirator ? 30 : 0) - (Math.abs(a.relation) + (a.kin ? 40 : 0) + (a.conspirator ? 30 : 0)));
    for (const n of noted.slice(0, 3)) {
      const friendly = n.relation >= 20 || n.kin;
      const hostile = n.relation <= -20;
      const s = pShort(n);
      let text = null;
      if (n.conspirator && kind !== "dictator") text = pick([`${pName(n)}, who swore your oath by night, now swears by day that he never met you.`, `${pName(n)} burns your letters the night you die. All but one, which he keeps, just in case.`]);
      else if (n.kin) text = pick([`Your brother-in-law ${pName(n)} takes your sons under his roof, and lives to see the eldest elected quaestor.`, `${pName(n)} manages your widow's dowry so carefully that it is somehow larger when he gives it back.`, `${pName(n)} hangs your wax mask beside his own family's. It is the only one that is smiling.`]);
      else if (n.role === "consularis") text = n.age >= 70 ? `${pName(n)}, now ${n.age}, attends your funeral on the arms of two slaves. “I told him he would never outlive me,” he says. He was right.` : `${pName(n)} rises first in the Senate to propose a public funeral for you. ${friendly ? "It passes without a single voice against." : "It is the shortest speech of his life."}`;
      else if (n.role === "dives") text = g.debt > 0 ? `${pName(n)} arrives at the reading of your will before the mourners, carrying a wax tablet: you owe him ${fmtHS(g.debt)}. He takes ${pick(["the villa at Tusculum", "your Greek library", "the good silver", "your cook"])} and sends a very handsome wreath.` : `${pName(n)} buys your ${pick(["villa at Baiae", "fishponds", "town house"])} at auction for a tenth of its value, then tells everyone how much he paid.`;
      else if (n.role === "popularis") text = `${pName(n)} uses your name in every speech he gives for a year, ${friendly ? "as an example to the young" : hostile ? "as a warning to the people" : "sometimes as an example and sometimes as a warning, depending on the crowd"}.`;
      else if (n.role === "severus") text = g.stats.infamia >= 40 ? `${pName(n)} devotes a whole chapter of his “On the Vices of Our Age” to you. It is by far the most popular chapter.` : g.stats.dignitas >= 55 ? `${pName(n)} concedes, after long reflection, that you “were not the worst of us”. From him, this is a laurel crown.` : pick([`${pName(n)} adds a line about you to his list of everyone's sins. It is a short line. He seems disappointed.`, `${pName(n)} attends your funeral in a plain grey toga and leaves before the games, remarking that ${g.ended.age} years was “ample”.`]);
      else if (n.role === "veteranus") text = (g.memories || []).some((m) => m.kind === "battle" && m.won) ? `${pName(n)}, who has seen a hundred battles, says only that you “held the line against the ${(g.memories || []).find((m) => m.kind === "battle" && m.won).enemy}”. Coming from him, this is the Iliad.` : `${pName(n)} says, not unkindly, that you “were never a soldier”. Then he says it again, less kindly.`;
      else if (n.role === "inimicus") text = `${pName(n)} declares the feud between your families settled at last. Within a month he has started a new one with your son.`;
      else if (n.role === "bellus") text = `${pName(n)} wears black for exactly one day, then appears in a tunic of a colour nobody has a name for. ${friendly ? pick(["He says you would have approved.", "He says it is the colour of your laugh.", "He says it is in your memory. It is certainly memorable."]) : pick(["He says you would have hated it, which is the point.", `He says it is the colour of your ${pick(["nose", "politics", "debts"])}.`, "Nobody is sure whether it is a tribute or an insult. Neither is he."])}`;
      else if (n.role === "philosophus") text = `${pName(n)} writes a consolation in Greek, proving that death is nothing to you. ${g.debt > 0 ? "Your creditors find it unpersuasive." : "Your widow uses it to light the lamps."}`;
      else if (n.role === "patronus") text = n.age >= 75 ? `${pName(n)}, who promised your father to look after you, outlives you by ${randi(2, 8)} years and complains about it the whole time.` : `${pName(n)} reminds everyone at the funeral that he knew you when you were three. “He was a difficult child,” he says. “He stayed one.”`;
      else if (n.role === "augur") text = `${pName(n)} reports that a crow flew ${pick(["left", "right", "in circles"])} over your tomb on the day of the funeral. He declines to say what it means, ${friendly ? "though he smiles" : "though he looks pleased"}.`;
      else if (friendly) text = pick([`${pName(n)} names his next son ${g.char.praenomen}, after you.`, `${pName(n)} keeps your bust in his library and is sometimes heard arguing with it.`, `${pName(n)} pays for a stretch of road outside the Porta Capena and puts your name on the milestones.`, `${pName(n)} takes your old freedmen into his own household, and listens to their stories about you for years.`]);
      else if (hostile) text = pick([`${pName(n)} proposes that your statue be moved to a less prominent spot. The motion fails by ${randi(3, 11)} votes.`, `${pName(n)} buys your house and cuts down your plane trees.`, `${pName(n)} writes a pamphlet, “Against ${gn.nomen}”, in ${pick(["two", "three", "five"])} books.`, ...(g.wife ? [`${pName(n)} marries your widow, ${g.wife}, within the year. Rome is scandalised, and delighted.`] : [])]);
      if (text) add(n, null, pick(["Afterwards", "That winter", `${yearLabel(g.ended.turn + 1)}`, "Some months later", "At the next meeting of the Senate"]), text);
    }

    // 5. Laws, remembered in their own ways.
    const LAW_MEMORY = {
      agraria: [`Veterans on the farms the Lex ${nm} Agraria gave them still pour a cup of wine on the ground for you every harvest.`, `In the hills above ${pick(["Capua", "Praeneste", "Arretium"])}, a village of your veterans calls itself Forum ${gn.nomen.replace(/us$/, "i")}. It has a well, a shrine, and a very bad statue of you.`],
      frumentaria: [`Every month, when the cheap grain is handed out at the Porticus Minucia, the queue still calls it “${gn.nomen}'s bread”.`, `The bakers of the Aventine add a loaf to their range called the ${nomenAdj}. It is small, cheap and slightly stale, which some think is a joke.`],
      civitas: [`Beyond the Po, the new citizens of a dozen towns vote you their patron and put up your statue in every forum. It is the same statue; they share a sculptor.`, `A boy born in Verona the year your law passed is named ${g.char.praenomen} ${gn.nomen}, after you. He grows up to write very rude poems, though none about you.`],
      repetundae: [`Governors setting out for their provinces still curse your law on the Via Appia. Provincials bless it all the way back.`, `The first man convicted under your Lex de Repetundis is ${pick(["your cousin", "your rival's nephew", "a former client of yours"])}. You would have found that funny.`],
      ambitus: [`Your law against electoral bribery is broken at the very next election, with great enthusiasm, by every candidate.`, `Your law against bribery is still in force. The bribes are simply called “gifts of friendship” now.`],
      tabulae: [`The moneylenders of the Forum spit when they hear your name. The debtors of the Subura name their sons after you.`, `On the anniversary of your law, the Subura lights bonfires of old account-books. The bankers stay indoors.`],
      sumptuaria: [`Your law against extravagant banquets is ignored at your own funeral feast, which has fourteen courses and a dancing bear.`, `Your sumptuary law limits a dinner to three courses. Rome responds by inventing the very large course.`],
    };
    for (const id of shuffle(g.laws).slice(0, 2)) {
      const m = (g.memories || []).find((x) => x.kind === "law" && x.id === id && x.passed);
      add(null, "LEX", `The Lex ${nm} ${LAWS.find((l) => l.id === id).adj}${m ? `, ${yearLabel(m.turn)}` : ""}`, pick(LAW_MEMORY[id]));
    }

    // 6. Something in Rome that carries your name.
    const c = g.counts || {};
    const named = [];
    const score = x.legacyScore();
    if (kind === "mob") named.push(["VIA", "The Subura, a year later", `The same crowd that killed you holds a festival in your honour on the anniversary. Nobody sees a contradiction.`]);
    if (g.stats.populus >= 60 || score >= 20) named.push(["VIA", `The Vicus ${gn.nomen}`, `The street where you were born is renamed the Vicus ${gn.nomen}. A shrine at the crossroads keeps your image, ${pick(["and the woman who sells chickpeas on the corner swears you once bought a bowl from her", "freshly painted every Compitalia", "though the painter gave you someone else's chin"])}.`]);
    if ((c.banquet || 0) >= 3 || hasTrait("gourmand")) named.push(["CENA", "A recipe", `A dish of ${pick(["dormice stuffed with pork and pine nuts", "sow's udder in fish sauce", "flamingo tongues with honey", "peas with cumin and lovage"])} is served at the best tables as “patina ${nomenAdj}”. ${pick(["The cooks argue about the recipe; you never cooked in your life.", `Apicius includes it in his cookbook, with the note “better than it sounds”.`, `It is served cold at the feast of your funeral, and ${rival0 ? pShort(rival0) : "your rival"} asks for the recipe.`, `Your cook, ${pick(FREEDMEN)}, sells the recipe for ${fmtHS(randi(4, 20) * 1000)} and retires to Baiae.`])}`]);
    if ((c.estates || 0) >= 3) named.push(["PIRA", "Your orchards", `${pick(["A pear", "An apple", "A fig", "A cabbage"])} from your ${pick(["Campanian", "Sabine", "Tusculan"])} estates is sold in the markets as the “${nomenAdj}”. ${pick(["Pliny will mention it in his Natural History, between a pear named after a slave and one that gives you wind.", "It is small, hard and sour, and ripens late. The fruit-sellers say it is very like you.", `It wins first prize at the market of ${pick(["Capua", "Nola", "Puteoli"])} every autumn for fifty years.`, "Your heirs grub up the orchard to plant vines. One tree survives, behind the latrine."])}`]);
    if (c["games:Lavish"] || c["games:Unforgettable"]) named.push(["CIRCVS", "The Circus Maximus", `A ${pick(["chariot horse of the Greens", "gladiator from Capua", "bear from Lucania"])} is named ${me} in your honour. ${pick(["He wins forty-two times.", "He is remarkably stupid, and very popular.", "He lasts one afternoon."])}`]);
    if (g.post === "ostia") named.push(["NAVIS", "The docks at Ostia", `A grain ship is named the ${gn.nomen} in memory of the quaestor who ${pick(["bullied the shippers", "counted every sack twice", "slept on the quay in the bad winter"])}. ${pick(["It sinks off Puteoli in its second year, with all its grain, which the dockers find very fitting.", "It sails for forty years and never once arrives on time, which the dockers find very fitting.", `It brings the grain from ${pick(["Sicily", "Africa", "Sardinia"])} safely through ${randi(3, 9)} storms. The sailors kiss your name on the stern before every voyage.`])}`]);
    if (g.stats.infamia >= 50 || (c["p:Send him a gift"] || 0) >= 3) named.push(["VERBVM", "The slang of the Subura", `“To ${me.toLowerCase()} a jury” enters the slang of the Forum. It means exactly what you think.`]);
    if (g.pontifex) named.push(["DOMVS", "The Domus Publica", `The next Pontifex Maximus finds your initials carved under a couch in the Domus Publica, next to a very rude drawing of the College of Augurs.`]);
    if (!named.length) named.push(["VIA", "The Forum, a vote", pick([`A motion to name a street after you fails by ${randi(2, 9)} votes. The street goes instead to a man who sold excellent sausages.`, `A little alley near the Porta ${pick(["Capena", "Esquilina", "Collina"])} is named after you. It floods every spring.`, `Your name is given to a public latrine near the Forum Holitorium. It is, everyone agrees, a very good latrine.`])]);
    for (const [glyph, kicker, text] of shuffle(named).slice(0, 2)) add(null, glyph, kicker, text);

    // 7. The will.
    if (died) {
      const freed = Math.max(2, Math.round(g.wealth / 60));
      add(null, "TESTAM", "The reading of your will", g.debt > g.wealth
        ? `Your heirs inherit ${fmtHS(g.debt)} of debts, ${pick(["a very fine view", "a library of unread Greek", "forty pairs of shoes", "a parrot that swears in Oscan"])}, and your ${pick(["lampreys", "wax masks", "good name, more or less"])}.`
        : `Your will frees ${freed} slaves, leaves ${pick(["three hundred", "a hundred", "fifty"])} sesterces to every man of the tribe ${g.tribe}${g.stats.populus >= 50 ? ", and your gardens across the Tiber to the people" : ""}. ${pick([`The rest goes to ${g.wife ? `your wife ${g.wife}` : "your sons"}.`, `A codicil leaves your ${pick(["cook", "Greek doctor", "best couch"])} to ${speaker ? pShort(speaker) : "the state"}.`, `A codicil leaves nothing at all to ${rival ? pShort(rival) : "your rivals"}, by name.`])}`);
    }

    // 8. Your names, scratched on a wall.
    if ((g.nicknames || []).length) {
      const names = [gn.nomen, ...g.nicknames.map((n) => n.name)].map(CH.toInscription).join(" · ");
      const mostlyMock = g.nicknames.filter((n) => n.tone === "mock").length > g.nicknames.length / 2;
      const first = g.nicknames[0];
      const spot = pick([
        ["A tavern wall in Pompeii", pick(["Vesuvius will bury the wall and archaeologists will dig it up again, so this is the version of you most tourists will see.", "Below it, in another hand: “and his mother”.", `Underneath, someone has added the price of a cup of wine in ${yearLabel(g.ended.turn)}: two asses.`])],
        ["A latrine in Herculaneum", pick(["It will survive the eruption, the Middle Ages and three restorations.", "It is the only one of your titles to be carved deeper than your consulships.", "A modern guidebook translates it, wrongly, as a love poem."])],
        ["A lead sling-bullet", pick(["It is found in a field in Picenum two thousand years later and catalogued under “insults, military”.", "The man who cast it threw it at somebody else's army. He just liked the name."])],
        ["A column of the Basilica Aemilia", pick(["A bored clerk scratched it there during a very long trial.", `It dates, by the hand, from ${yearLabel(first.turn)}, the year Rome started calling you ${first.name}.`])],
        ["The back of a seat in the Theatre of Pompey", `Whoever carved it sat there through ${randi(3, 7)} acts of a very bad tragedy.`],
      ]);
      add(null, "GRAF", spot[0], `Someone has scratched, ${pick(["under a drawing of a face that is unmistakably yours", "beside a drawing of a gladiator", "in very large letters"])}: “${names} · ${mostlyMock ? pick(["VAE · TIBI", "FVR", "CACATOR"]) : pick(["FELICITER", "VIVAS", "VINCAS"])}”. ${spot[1]}`);
    }

    // 9. Posterity: what the historians say, and what the earth gives back.
    const vivid = take(facts.filter((f) => f.vivid), 1)[0] || take(facts, 1)[0];
    const fact = vivid ? vivid.p : "was a senator";
    const SOURCES = {
      Forgotten: [`You appear exactly once in history: a footnote to a footnote in a German commentary on Cicero, with your name misspelled.`, `Your name survives in the list of magistrates, between two men nobody remembers either.`, `A fragment of Sallust mentions you, then breaks off mid-sentence. Scholars have argued for a century about what the next word was.`],
      Respectable: [`Cicero mentions you in a letter to Atticus: “${gn.nomen} ${fact}. ${pick(["I laughed until I wept, then I wept.", "Do not show this letter to Terentia.", "Rome will not see his like again, which is something."])}”`, `Valerius Maximus tells, in his “Memorable Deeds and Sayings”, how ${name()} ${fact}. He files it under “${vivid && vivid.tone === "mock" ? "Of Folly" : "Of Fortitude"}”.`],
      Distinguished: [`Cicero mentions you in three letters, two of them unkindly. In the third he writes that you ${fact}, and adds: “I envy him.”`, `Asconius, writing a commentary on a lost speech of Cicero's, explains to his sons that you ${fact}. The speech is lost; the commentary survives.`],
      Illustrious: [`Plutarch writes your life, and pairs it with that of ${pick(GREEKS)}. He spends three pages on the time you ${fact}, and concludes that ${pick(["the Greek comes out of the comparison rather better", "you come out of the comparison rather better", "both of you would have been happier as farmers"])}.`, `Velleius Paterculus calls you “a man born for great things, had the times allowed”, and spends a whole paragraph on how you ${fact}.`],
      Great: [`Two thousand years later, schoolchildren curse your name as they translate the account of how you ${fact}.`, `Shakespeare gives you four lines in a play about somebody else. One of them is about the time you ${fact}.`],
      Princeps: [`A month of the year is very nearly renamed after you. In the end it goes to someone called Augustus.`, `Suetonius writes your life as the first of his Caesars, and includes the time you ${fact}, together with several things you would rather he had not.`],
    };
    const finds = [];
    for (const h of g.history.filter((h) => h.province && CITY[h.province.name])) {
      const [city] = CITY[h.province.name];
      const ruled = (g.memories || []).filter((m) => m.kind === "act" && m.province === h.province.name);
      if (ruled.some((m) => m.id === "extort")) finds.push(`In a well at ${city}, archaeologists find a lead curse tablet asking the gods below to rot the liver of “${name()}, the governor”. It is very specific about the liver.`);
      else finds.push(`At ${city}, a statue base is dug up: “The people of ${city}, to ${name()}, their saviour and benefactor”. The Greek is effusive; the statue is missing.`);
    }
    if (g.history.some((h) => h.office === "consul")) finds.push(`A silver denarius struck in your consulship turns up in a hoard in ${pick(["Wales", "Bohemia", "Romania", "Kent"])}. The die-cutter was not kind to ${mockedFeature(agedChar()) === "your ancestors" ? "your chin" : mockedFeature(agedChar())}.`);
    const battle = (g.memories || []).find((m) => m.kind === "battle" && m.won);
    if (battle) finds.push(`A lead sling-bullet stamped with your name is found in ${battle.place}, where you fought the ${battle.enemy}. A museum label calls you “a minor commander”.`);
    if ((c.estates || 0) >= 3) finds.push(`Amphora stamps from your Campanian vineyards turn up as far away as ${pick(["Lyon", "Alexandria", "the Black Sea", "Tangier"])}. Your bailiff's name is stamped beside yours, slightly larger.`);
    if (c["games:Unforgettable"]) finds.push(`A floor mosaic of your elephants is found in a villa at ${pick(["Tusculum", "Antium", "Praeneste"])}. One of them is looking straight at the viewer, exactly like you.`);
    const via = (g.memories || []).find((m) => m.kind === "monument" && /Via Appia/.test(m.where));
    if (via) finds.push(`A milestone from your stretch of the Via Appia still stands at the side of the road, ${randi(9, 60)} miles from Rome. Tourists lean their bicycles against it.`);
    if (hasTrait("writer") || kind === "retired") finds.push(`A charred papyrus from the Villa of the Papyri at Herculaneum is unrolled by X-ray in 2023. It turns out to be book ${roman(randi(2, 14))} of your memoirs, and the first word that can be read is “I”.`);
    const curser = cast.find((n) => n.relation <= -50);
    if (curser) finds.push(`In the sacred spring of Anna Perenna, archaeologists find a curse tablet with your name, scratched by ${pName(curser)}. He asks the gods to ${pick(["make your tongue cleave to your mouth", "tie your feet before every vote", "give you the gout"])}. ${hasTrait("robust") ? "It did not work." : "It may have worked."}`);
    const [yr, finder, fate] = pick(MODERN);
    finds.push(`In ${yr}, ${finder} turns up your epitaph. The stone ${fate}.`);
    add(null, "POST", "Posterity", `${pick(SOURCES[rankName] || SOURCES.Respectable)} ${pick(finds)}`);

    return out;
  }
})();
