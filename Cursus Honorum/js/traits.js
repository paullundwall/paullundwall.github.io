window.CH = window.CH || {};

(function () {
  CH.QUALITIES = [
    { key: "dignitas", label: "Dignity", latin: "dignitas", desc: "Your rank and reputation among the great families." },
    { key: "senatus", label: "Authority", latin: "auctoritas", desc: "The weight your opinion carries in the Senate." },
    { key: "populus", label: "Popularity", latin: "favor populi", desc: "How the crowd in the Forum feels about you." },
    { key: "eloquentia", label: "Eloquence", latin: "eloquentia", desc: "Your skill in the Senate, the courts and the Rostra." },
    { key: "calliditas", label: "Cunning", latin: "calliditas", desc: "Your talent for intrigue, bribery and getting away with it." },
    { key: "pietas", label: "Piety", latin: "pietas", desc: "Your standing with the gods, and with those who interpret them." },
    { key: "gloria", label: "Military glory", latin: "gloria", desc: "Your fame as a soldier and commander." },
    { key: "infamia", label: "Infamy", latin: "infamia", desc: "Scandal attached to your name. Prosecutors are watching.", bad: true },
  ];

  CH.QUALITY_SHORT = {
    dignitas: "Dignity", senatus: "Authority", populus: "Popularity", eloquentia: "Eloquence",
    calliditas: "Cunning", pietas: "Piety", gloria: "Glory", infamia: "Infamy", clients: "Clients",
  };

  CH.TRAIT_BUDGET = 3;
  CH.MAX_TRAITS = 6;

  CH.TRAIT_CATEGORIES = [
    { id: "corpus", label: "Body", latin: "corpus" },
    { id: "ingenium", label: "Mind", latin: "ingenium" },
    { id: "mores", label: "Morals", latin: "mores" },
    { id: "consuetudo", label: "Habits", latin: "consuetudo" },
    { id: "animus", label: "Temperament", latin: "animus" },
  ];

  // Mods are read by the game. Numeric mods from several traits add up.
  CH.TRAITS = [
    // Body
    { id: "robust", cat: "corpus", name: "Iron constitution", latin: "firmus", cost: 1,
      desc: "You have never been ill a day in your life, and intend to bury all your rivals.",
      perk: "Lives longer and recovers faster.", mods: { mortality: -0.4, health: 3 }, excl: ["sickly"] },
    { id: "sickly", cat: "corpus", name: "Delicate health", latin: "valetudinarius", cost: -1,
      desc: "Your Greek physician travels everywhere with you, and charges accordingly.",
      perk: "Dies younger; doctors' bills eat into your income.", mods: { mortality: 0.5, health: -3, income: -10 }, excl: ["robust"] },
    { id: "tireless", cat: "corpus", name: "Tireless", latin: "impiger", cost: 3,
      desc: "You sleep four hours a night and dictate letters in the bath.",
      perk: "One extra deed every year.", mods: { actions: 1, health: -1 } },
    { id: "voice", cat: "corpus", name: "Thunderous voice", latin: "vox magna", cost: 1,
      desc: "You can be heard from the Rostra to the Capitol, and frequently are.",
      perk: "Harangues to the crowd succeed more often.", fx: { eloquentia: 3 }, mods: { contio: 0.12 } },
    { id: "stammer", cat: "corpus", name: "Stammer", latin: "balbus", cost: -1,
      desc: "Your tongue betrays you when it matters most. Demosthenes had the same trouble; he used pebbles.",
      perk: "Speeches fail more often.", fx: { eloquentia: -8 }, mods: { contio: -0.08, senate: -0.06 },
      nick: ["Balbus", "for your stammer"] },
    { id: "falling", cat: "corpus", name: "Falling sickness", latin: "morbus comitialis", cost: -1,
      desc: "Now and then you collapse, foaming, in public. Some call it a curse; others, a sign from the gods.",
      perk: "Fits in public, which may be read as omens either way.", fx: { pietas: 5 }, mods: { fits: 1 } },

    // Mind
    { id: "learned", cat: "ingenium", name: "Steeped in Greek", latin: "eruditus", cost: 1,
      desc: "You read Plato in the original and correct other men's quotations.",
      perk: "Lessons with a rhetor teach you twice as much.", fx: { eloquentia: 6, populus: -2 }, mods: { rhetoric: 5 } },
    { id: "cunning", cat: "ingenium", name: "Cunning", latin: "callidus", cost: 2,
      desc: "Three moves ahead, and nobody sees you make the first.",
      perk: "Plots are harder to expose; bribes harder to trace.", fx: { calliditas: 15 }, mods: { stealth: -0.35 }, excl: ["slow"] },
    { id: "jurist", cat: "ingenium", name: "Learned in the law", latin: "iuris peritus", cost: 1,
      desc: "You know the Twelve Tables by heart, and every loophole carved since.",
      perk: "Better odds in every court case; your laws pass more easily.", mods: { court: 0.12, law: 0.05 } },
    { id: "general", cat: "ingenium", name: "Born soldier", latin: "rei militaris peritus", cost: 2,
      desc: "You were reading Xenophon at eight and drilling your father's slaves at ten.",
      perk: "Campaigns go much better.", fx: { gloria: 5 }, mods: { campaign: 0.15 } },
    { id: "slow", cat: "ingenium", name: "Slow-witted", latin: "tardus", cost: -2,
      desc: "Kind, loyal, and always the last to understand the joke.",
      perk: "Worse in court and in the Senate.", fx: { calliditas: -12, eloquentia: -5 }, mods: { court: -0.08, senate: -0.05 }, excl: ["cunning"] },
    { id: "superstitious", cat: "ingenium", name: "Superstitious", latin: "superstitiosus", cost: -1,
      desc: "You will not leave the house if a crow caws on your left.",
      perk: "Unlucky days sometimes cost you a deed.", fx: { pietas: 12 }, mods: { badDays: 0.35 }, excl: ["impious"] },

    // Morals
    { id: "incorruptible", cat: "mores", name: "Incorruptible", latin: "integer", cost: 2,
      desc: "Not even the publicani can find your price. They find this deeply unsettling.",
      perk: "You refuse every bribe; infamy fades faster and juries trust you.", fx: { dignitas: 6, infamia: -5 },
      mods: { incorruptible: 1, court: 0.05, infamyFade: 0.08 }, excl: ["greedy"] },
    { id: "greedy", cat: "mores", name: "Avaricious", latin: "avarus", cost: -1,
      desc: "You count your silver twice and other men's three times.",
      perk: "Extortion and bribes pay half again as much.", fx: { infamia: 4 }, mods: { greed: 0.5, income: 10 }, excl: ["incorruptible"] },
    { id: "clement", cat: "mores", name: "Clement", latin: "clemens", cost: 1,
      desc: "You forgive your enemies, which infuriates them more than anything.",
      perk: "Enemies are slower to drag you into court.", fx: { populus: 3 }, mods: { enemy: -0.6 }, excl: ["ruthless"] },
    { id: "ruthless", cat: "mores", name: "Ruthless", latin: "crudelis", cost: 1,
      desc: "Like Sulla, you never forget a friend's service or an enemy's insult.",
      perk: "Better at war and conspiracy; feared rather than loved.", fx: { populus: -3, infamia: 3 },
      mods: { campaign: 0.05, plot: 0.25, revolt: 0.06 }, excl: ["clement"] },
    { id: "pious", cat: "mores", name: "Pious", latin: "pius", cost: 1,
      desc: "You perform every rite to the letter, and the gods seem to notice.",
      perk: "Favoured by omens and priestly colleges.", fx: { pietas: 15, dignitas: 2 }, excl: ["impious"],
      nick: ["Pius", "for your devotion to the gods"] },
    { id: "impious", cat: "mores", name: "Scoffer", latin: "contemptor divum", cost: -1,
      desc: "You laugh at the haruspices. Cato wondered how two of them could pass in the street without smiling.",
      perk: "The pious distrust you, but you see through other men's tricks.", fx: { pietas: -15, calliditas: 4 },
      excl: ["pious", "superstitious"] },
    { id: "proud", cat: "mores", name: "Proud", latin: "superbus", cost: -1,
      desc: "You walk the Forum as if you owned it. In a sense, your ancestors did.",
      perk: "Great dignity, little popularity.", fx: { dignitas: 8, populus: -8 }, mods: { contio: -0.05 },
      nick: ["Superbus", "for your pride"] },

    // Habits
    { id: "gourmand", cat: "consuetudo", name: "Gourmand", latin: "gulosus", cost: 0,
      desc: "You know the oyster beds of the Lucrine Lake by name.",
      perk: "Banquets are far more effective. You will grow stout.", mods: { banquet: 0.5, weightGain: 1.5, mortality: 0.1 } },
    { id: "drinker", cat: "consuetudo", name: "Hard drinker", latin: "vinolentus", cost: -1,
      desc: "Falernian at dinner, Chian at supper, and whatever is left at breakfast.",
      perk: "Good company, but your eyes redden and your health suffers.", fx: { infamia: 3 },
      mods: { banquet: 0.3, rednessGain: 3, health: -2, mortality: 0.15 }, nick: ["Bibulus", "for your thirst"] },
    { id: "gambler", cat: "consuetudo", name: "Gambler", latin: "aleator", cost: -1,
      desc: "You cannot pass a game of dice without throwing for Venus.",
      perk: "Your fortune swings wildly every year.", mods: { gamble: 1 } },
    { id: "spendthrift", cat: "consuetudo", name: "Spendthrift", latin: "prodigus", cost: -1,
      desc: "Money runs through your fingers, mostly into other people's pockets.",
      perk: "Everything costs more; the people love you for it.", fx: { populus: 6, clients: 10 }, mods: { spend: 0.3 }, excl: ["frugal"] },
    { id: "frugal", cat: "consuetudo", name: "Frugal", latin: "frugi", cost: 1,
      desc: "You drink cheap wine, sell old slaves, and boast about it like Cato.",
      perk: "Everything costs less and your estates yield more.", fx: { dignitas: 2, populus: -3 },
      mods: { spend: -0.25, income: 15 }, excl: ["spendthrift"], nick: ["Frugi", "for your thrift"] },
    { id: "rake", cat: "consuetudo", name: "Rake", latin: "moechus", cost: -1,
      desc: "Husbands lock their doors when you pass. Their wives unlock them.",
      perk: "Popular with the young bloods; scandal follows you.", fx: { populus: 4, senatus: -3 }, mods: { scandal: 1 } },
    { id: "athlete", cat: "consuetudo", name: "Athletic", latin: "exercitatus", cost: 1,
      desc: "You swim the Tiber in winter and wrestle on the Campus Martius.",
      perk: "Better health, and a soldier's bearing.", fx: { gloria: 2 }, mods: { health: 2, mortality: -0.15, campaign: 0.03 } },
    { id: "writer", cat: "consuetudo", name: "Man of letters", latin: "litteratus", cost: 1,
      desc: "You write poems, histories, and an eleven-book treatise on grammar.",
      perk: "Your writings add to your legacy.", fx: { eloquentia: 3 }, mods: { legacy: 4 } },
    { id: "earlyriser", cat: "consuetudo", name: "Early riser", latin: "matutinus", cost: 1,
      desc: "Your atrium opens before dawn, and your clients find you already dressed.",
      perk: "Receiving clients brings twice as many.", mods: { salutatio: 1 } },

    // Temperament
    { id: "charming", cat: "animus", name: "Charming", latin: "lepidus", cost: 2,
      desc: "Everyone leaves a conversation with you feeling cleverer than they came in.",
      perk: "Your popularity and authority fade more slowly.", fx: { populus: 4, senatus: 4 }, mods: { popFade: 0.07 } },
    { id: "irascible", cat: "animus", name: "Hot-tempered", latin: "iracundus", cost: -1,
      desc: "You have thrown inkpots at two consuls and a Vestal.",
      perk: "Passionate on the Rostra, but your quarrels make enemies.", fx: { senatus: -3 },
      mods: { contio: 0.05, senate: -0.06, quarrels: 1 }, excl: ["patient"] },
    { id: "patient", cat: "animus", name: "Patient", latin: "cunctator", cost: 1,
      desc: "Like Fabius Maximus, you wait, and wait, and win.",
      perk: "Defeats at the polls cost you no dignity; a small edge in elections.", mods: { election: 0.04, patient: 1 },
      excl: ["irascible"], nick: ["Cunctator", "for your patience"] },
    { id: "ambitious", cat: "animus", name: "Burning ambition", latin: "cupidus gloriae", cost: 2,
      desc: "You wept before a statue of Alexander: at your age he had conquered the world.",
      perk: "Better odds at every election.", fx: { infamia: 2 }, mods: { election: 0.08 } },
    { id: "brave", cat: "animus", name: "Brave", latin: "fortis", cost: 1,
      desc: "You fight in the front rank, which your soldiers love and your doctors do not.",
      perk: "Better in battle.", fx: { gloria: 3 }, mods: { campaign: 0.08 }, excl: ["coward"] },
    { id: "coward", cat: "animus", name: "Cowardly", latin: "ignavus", cost: -2,
      desc: "You have discovered that the rear of the column is also the safest part.",
      perk: "Battles go badly.", fx: { gloria: -5 }, mods: { campaign: -0.15 }, excl: ["brave"] },
    { id: "witty", cat: "animus", name: "Witty", latin: "facetus", cost: 1,
      desc: "Your jokes are repeated all over Rome, usually by their victims.",
      perk: "You win every war of epigrams, and the crowd enjoys you.", fx: { populus: 2 }, mods: { wit: 0.35, contio: 0.04 } },
  ];

  // Read from the face rather than chosen.
  CH.FACE_TRAITS = [
    { id: "severe", name: "Severe", desc: "Your scowl reminds the old men of Cato.", test: (c) => c.face.frown >= 70, fx: { senatus: 5, populus: -3 } },
    { id: "affable", name: "Affable", desc: "Your easy smile wins over the crowd.", test: (c) => c.face.frown <= 30, fx: { populus: 5 } },
    { id: "wellfed", name: "Well fed", desc: "A man of your girth is clearly a generous host.", test: (c) => c.face.weight >= 70, mods: { banquet: 0.3 } },
    { id: "lean", name: "Lean and hungry", desc: "“He thinks too much: such men are dangerous.” Plots advance faster.", test: (c) => c.face.weight <= 30, mods: { plot: 0.3 } },
    { id: "weathered", name: "Weathered", desc: "You look older than your years, and graver.", test: (c) => c.face.wrinkles >= 70, fx: { dignitas: 5 } },
    { id: "bloodshot", name: "Bloodshot", desc: "Everyone can guess how you spent last night.", test: (c) => c.face.eyeRedness >= 70, fx: { infamia: 4 }, mods: { banquet: 0.2 } },
    { id: "beard", name: "Bearded dandy", desc: "The young bloods admire you; the old guard does not.", test: (c) => c.beard === "full", fx: { populus: 3, senatus: -3 } },
    { id: "gaze", name: "Piercing gaze", desc: "Juries find it hard to look away.", test: (c) => c.face.eyeSize >= 75, fx: { eloquentia: 3 }, mods: { court: 0.05 } },
    { id: "jaw", name: "Commanding jaw", desc: "Soldiers follow a face like yours. Campaigns go better.", test: (c) => c.face.chinSize >= 75 || c.face.jawWidth >= 75, mods: { campaign: 0.1 } },
    { id: "shrewd", name: "Shrewd eyes", desc: "Those narrow eyes miss nothing.", test: (c) => c.face.eyeNarrow >= 75, fx: { calliditas: 5 } },
    { id: "aquiline", name: "Aquiline nose", desc: "A nose fit for a coin. Romans respect a great nose.", test: (c) => c.face.noseSize >= 75, fx: { dignitas: 3 } },
    { id: "ears", name: "Ears like sails", desc: "You hear every whisper on the back benches.", test: (c) => c.face.earSize >= 75 || c.face.earAngle >= 80, fx: { calliditas: 3 } },
  ];

  const ALL = [...CH.TRAITS, ...CH.FACE_TRAITS];
  CH.getTrait = (id) => ALL.find((t) => t.id === id);

  CH.faceTraits = (c) => CH.FACE_TRAITS.filter((t) => t.test(c));
  CH.chosenTraits = (c) => (c.traits || []).map(CH.getTrait).filter((t) => t && t.cat);
  CH.activeTraits = (c) => [...CH.faceTraits(c), ...CH.chosenTraits(c)];
  CH.traitPointsLeft = (c) => CH.TRAIT_BUDGET - CH.chosenTraits(c).reduce((s, t) => s + t.cost, 0);

  // Why a trait cannot be added right now, or null if it can.
  CH.traitBlocker = (c, id) => {
    const t = CH.getTrait(id);
    const chosen = c.traits || [];
    if (chosen.includes(id)) return null;
    const clash = chosen.map(CH.getTrait).find((o) => (t.excl || []).includes(o.id) || (o.excl || []).includes(id));
    if (clash) return `Incompatible with ${clash.name}`;
    if (c.unbounded) return null;
    if (chosen.length >= CH.MAX_TRAITS) return `At most ${CH.MAX_TRAITS} traits`;
    if (t.cost > CH.traitPointsLeft(c)) return "Not enough points";
    return null;
  };

  CH.baseQualities = (c) => {
    const patrician = CH.getGens(c.gens).status === "Patrician";
    return {
      dignitas: patrician ? 30 : 20,
      senatus: patrician ? 30 : 22,
      populus: patrician ? 18 : 25,
      eloquentia: 20,
      calliditas: 20,
      pietas: patrician ? 30 : 22,
      gloria: 5,
      infamia: 5,
    };
  };

  // Starting qualities and clients once every trait's effect is applied.
  CH.startingProfile = (c) => {
    const stats = CH.baseQualities(c);
    let clients = CH.getGens(c.gens).status === "Patrician" ? 30 : 20;
    for (const t of CH.activeTraits(c)) {
      for (const [k, v] of Object.entries(t.fx || {})) {
        if (k === "clients") clients += v;
        else stats[k] = Math.max(0, Math.min(100, stats[k] + v));
      }
    }
    return { stats, clients };
  };

  CH.fxSummary = (fx = {}) =>
    Object.entries(fx)
      .map(([k, v]) => {
        const good = k === "infamia" ? v < 0 : v > 0;
        return `<b class="${good ? "up" : "down"}">${CH.QUALITY_SHORT[k]} ${v > 0 ? "+" : "−"}${Math.abs(v)}</b>`;
      })
      .join(" ");

  const pct = (v) => `${v > 0 ? "+" : "−"}${Math.round(Math.abs(v) * 100)}%`;
  const num = (v) => `${v > 0 ? "+" : "−"}${Math.abs(v)}`;
  // [label, format, true if a positive value is bad for you]
  const MOD_TEXT = {
    actions: ["Deeds each year", num],
    spend: ["Everything you buy", pct, true],
    income: ["Yearly income", (v) => `${num(v)},000 HS`],
    greed: ["Takings from extortion", pct],
    banquet: ["Banquet success", pct],
    contio: ["Speeches to the people", pct],
    senate: ["Speeches in the Senate", pct],
    court: ["Court cases", pct],
    campaign: ["Military campaigns", pct],
    election: ["Election odds", pct],
    law: ["Passing laws", pct],
    plot: ["Conspiracy progress", pct],
    stealth: ["Risk of exposure", pct, true],
    rhetoric: ["Eloquence from rhetoric lessons", num],
    salutatio: ["Clients at the morning salutation", pct],
    wit: ["Wars of words in the Senate", pct],
    revolt: ["Odds of a successful revolt", pct],
    health: ["Health recovered each year", num],
    mortality: ["Risk of dying of old age", pct, true],
    weightGain: ["Weight gained each year", num, true],
    rednessGain: ["Redness of the eyes each year", num, true],
    popFade: ["Popularity kept each year", pct],
    infamyFade: ["Infamy forgotten each year", pct],
    enemy: ["Risk of prosecution", pct, true],
    legacy: ["Legacy at your death", num],
  };

  // How a trait shows itself in another senator.
  const PERSONA_NOTES = {
    greedy: "Melts at a gift of silver.",
    incorruptible: "Returns gifts with contempt, and may prosecute you if your Infamy is high.",
    gourmand: "A good dinner wins him over faster.",
    drinker: "A good dinner wins him over faster. Unlikely to see old age.",
    wellfed: "A good dinner wins him over faster.",
    frugal: "Unimpressed by your dinners.",
    proud: "Unimpressed by your dinners, and slow to forgive.",
    irascible: "Takes an attack very badly, and is slow to forgive.",
    clement: "Forgives easily, and shrugs off attacks.",
    patient: "Open to reconciliation.",
    ruthless: "Would listen to talk of a conspiracy.",
    ambitious: "Stands for every office he can, and resents losing to you.",
    witty: "Dangerous in a war of words.",
    voice: "A formidable speaker.",
    learned: "A formidable speaker.",
    stammer: "A weak speaker: easy to beat in debate or in court.",
    slow: "A weak speaker: easy to beat in debate or in court.",
    robust: "Will live long.",
    sickly: "Unlikely to see old age.",
  };

  // Tooltip HTML for a trait. `persona` describes it in someone else.
  CH.traitTip = (t, persona) => {
    const head = `<div class="tip-head"><b>${t.name}</b>${t.latin ? ` <em>${t.latin}</em>` : t.cat ? "" : ` <em>written on the face</em>`}</div>`;
    const desc = `<p>${t.desc}</p>`;
    if (persona) {
      const note = PERSONA_NOTES[t.id];
      return head + desc + (note ? `<p class="tip-note">${note}</p>` : "");
    }
    const lines = [];
    if (t.perk) lines.push(`<p class="tip-perk">${t.perk}</p>`);
    if (t.fx && Object.keys(t.fx).length) lines.push(`<div class="tip-row"><span>At the start</span><span class="fx">${CH.fxSummary(t.fx)}</span></div>`);
    const mods = Object.entries(t.mods || {}).filter(([k]) => MOD_TEXT[k]);
    if (mods.length)
      lines.push(
        `<ul class="tip-mods">${mods
          .map(([k, v]) => {
            const [label, f, badUp] = MOD_TEXT[k];
            return `<li><span>${label}</span><b class="${(v > 0) !== !!badUp ? "up" : "down"}">${f(v)}</b></li>`;
          })
          .join("")}</ul>`
      );
    return head + desc + lines.join("");
  };
})();
