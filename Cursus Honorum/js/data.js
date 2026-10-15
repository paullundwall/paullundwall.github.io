window.CH = window.CH || {};

CH.PRAENOMINA = {
  Appius: "Ap.",
  Aulus: "A.",
  Decimus: "D.",
  Gaius: "C.",
  Gnaeus: "Cn.",
  Kaeso: "K.",
  Lucius: "L.",
  Mamercus: "Mam.",
  Manius: "M'.",
  Marcus: "M.",
  Numerius: "N.",
  Publius: "P.",
  Quintus: "Q.",
  Servius: "Ser.",
  Sextus: "Sex.",
  Spurius: "Sp.",
  Tiberius: "Ti.",
  Titus: "T.",
};

CH.GENTES = [
  {
    id: "Aemilia",
    nomen: "Aemilius",
    status: "Patrician",
    desc: "One of the oldest patrician houses, claiming descent from a son of Pythagoras or of King Numa. Its sons include Aemilius Paullus, victor of Pydna, and the princeps senatus Aemilius Scaurus.",
    praenomina: ["Lucius", "Marcus", "Mamercus", "Manius", "Quintus"],
    cognomina: ["Lepidus", "Paullus", "Scaurus", "Regillus", "Papus"],
  },
  {
    id: "Caecilia",
    nomen: "Caecilius",
    status: "Plebeian",
    desc: "A plebeian clan that came to dominate the consular lists through the prolific Metelli, famed for their pride, their numbers and their talent for alliances.",
    praenomina: ["Quintus", "Lucius", "Marcus", "Gaius"],
    cognomina: ["Metellus", "Rufus", "Niger", "Bassus"],
  },
  {
    id: "Claudia",
    nomen: "Claudius",
    status: "Patrician",
    desc: "A patrician house of Sabine origin, renowned for arrogance and brilliance in equal measure. Appius Claudius Caecus built the Via Appia; the patrician Claudii pointedly shunned the praenomen Lucius.",
    praenomina: ["Appius", "Gaius", "Publius", "Tiberius", "Decimus"],
    cognomina: ["Pulcher", "Nero", "Crassus", "Caecus", "Caudex", "Centho"],
  },
  {
    id: "Cornelia",
    nomen: "Cornelius",
    status: "Patrician",
    desc: "The greatest of the patrician gentes, home to the Scipiones, the Lentuli and Sulla. A Cornelius has a vast network of kinsmen, and a great deal to live up to.",
    praenomina: ["Publius", "Lucius", "Gnaeus", "Servius", "Marcus"],
    cognomina: ["Scipio", "Sulla", "Lentulus", "Cethegus", "Dolabella", "Cinna", "Merula"],
  },
  {
    id: "Domitia",
    nomen: "Domitius",
    status: "Plebeian",
    desc: "A plebeian family whose Ahenobarbi, the 'bronze-beards', claimed the Dioscuri themselves had turned an ancestor's beard red. Wealthy, stubborn and staunchly traditional.",
    praenomina: ["Gnaeus", "Lucius"],
    cognomina: ["Ahenobarbus", "Calvinus"],
  },
  {
    id: "Fabia",
    nomen: "Fabius",
    status: "Patrician",
    desc: "An ancient patrician gens that once sent 306 of its men to die at the Cremera. Quintus Fabius Maximus, 'the Delayer', wore down Hannibal through sheer patience.",
    praenomina: ["Quintus", "Marcus", "Kaeso", "Numerius", "Gaius"],
    cognomina: ["Maximus", "Pictor", "Buteo", "Ambustus", "Vibulanus", "Labeo"],
  },
  {
    id: "Julia",
    nomen: "Julius",
    status: "Patrician",
    desc: "A patrician house from Alba Longa claiming descent from Iulus, son of Aeneas, and thus from Venus herself. Ancient and proud, though rarely at the summit of power.",
    praenomina: ["Gaius", "Lucius", "Sextus"],
    cognomina: ["Caesar", "Iulus", "Libo", "Mento"],
  },
  {
    id: "Junia",
    nomen: "Junius",
    status: "Plebeian",
    desc: "A plebeian family claiming descent from Lucius Junius Brutus, who expelled the last king and founded the Republic. Tyranny is an inherited enemy.",
    praenomina: ["Marcus", "Decimus", "Lucius", "Gaius"],
    cognomina: ["Brutus", "Silanus", "Pera", "Pullus"],
  },
  {
    id: "Licinia",
    nomen: "Licinius",
    status: "Plebeian",
    desc: "A plebeian gens of great wealth and ambition. Gaius Licinius Stolo opened the consulship to plebeians; the Crassi and Luculli grew legendarily rich.",
    praenomina: ["Publius", "Marcus", "Lucius", "Gaius"],
    cognomina: ["Crassus", "Lucullus", "Murena", "Stolo", "Calvus", "Nerva"],
  },
  {
    id: "Manlia",
    nomen: "Manlius",
    status: "Patrician",
    desc: "A patrician house of stern virtue. Marcus Manlius saved the Capitol from the Gauls; Titus Manlius Torquatus executed his own son for disobeying orders.",
    praenomina: ["Aulus", "Titus", "Lucius", "Gnaeus", "Publius", "Marcus"],
    cognomina: ["Torquatus", "Capitolinus", "Vulso", "Acidinus"],
  },
  {
    id: "Porcia",
    nomen: "Porcius",
    status: "Plebeian",
    desc: "A plebeian family from Tusculum, made famous by Cato the Elder, a 'new man' who rose to the censorship by preaching austerity and old Roman virtue.",
    praenomina: ["Marcus", "Lucius", "Gaius", "Publius"],
    cognomina: ["Cato", "Laeca", "Licinus"],
  },
  {
    id: "Sempronia",
    nomen: "Sempronius",
    status: "Plebeian",
    desc: "A plebeian gens of reformers and generals. The brothers Tiberius and Gaius Sempronius Gracchus championed land reform for the poor, and died for it.",
    praenomina: ["Tiberius", "Gaius", "Publius", "Aulus", "Lucius", "Marcus"],
    cognomina: ["Gracchus", "Tuditanus", "Sophus", "Longus", "Atratinus", "Blaesus"],
  },
  {
    id: "Sergia",
    nomen: "Sergius",
    status: "Patrician",
    desc: "A patrician house claiming descent from Sergestus, companion of Aeneas. Marcus Sergius fought on against Hannibal with an iron hand in place of the one he lost. The family has since fallen on hard times, and its sons are restless.",
    praenomina: ["Lucius", "Marcus", "Gaius", "Manius"],
    cognomina: ["Catilina", "Silus", "Fidenas", "Esquilinus", "Orata"],
  },
  {
    id: "Servilia",
    nomen: "Servilius",
    status: "Patrician",
    desc: "A patrician house brought to Rome from Alba Longa. Gaius Servilius Ahala struck down the would-be tyrant Spurius Maelius; the Caepiones were among Rome's richest men.",
    praenomina: ["Quintus", "Gnaeus", "Gaius", "Publius", "Marcus"],
    cognomina: ["Caepio", "Ahala", "Geminus", "Vatia", "Casca", "Structus"],
  },
  {
    id: "Sulpicia",
    nomen: "Sulpicius",
    status: "Patrician",
    desc: "An old patrician gens noted for orators and jurists. The Galbae served as generals and consuls, and Servius Sulpicius Rufus was the Republic's finest legal mind.",
    praenomina: ["Servius", "Publius", "Gaius", "Quintus"],
    cognomina: ["Galba", "Rufus", "Camerinus", "Gallus", "Paterculus"],
  },
  {
    id: "Valeria",
    nomen: "Valerius",
    status: "Patrician",
    desc: "Among the first families of the Republic: Publius Valerius Poplicola was one of its first consuls. The Messallae and Flacci kept the name in the fasti for centuries.",
    praenomina: ["Publius", "Marcus", "Lucius", "Manius", "Gaius", "Quintus"],
    cognomina: ["Flaccus", "Messalla", "Corvus", "Laevinus", "Poplicola", "Triarius"],
  },
];

CH.SLIDER_GROUPS = [
  {
    title: "Head",
    sliders: [
      { key: "headLength", label: "Head length", min: "Short", max: "Long" },
      { key: "headWidth", label: "Head width", min: "Narrow", max: "Broad" },
      { key: "jawWidth", label: "Jaw width", min: "Tapered", max: "Square" },
      { key: "chinSize", label: "Chin size", min: "Small", max: "Prominent" },
    ],
  },
  {
    title: "Nose",
    sliders: [
      { key: "noseSize", label: "Nose size", min: "Button", max: "Aquiline" },
      { key: "noseHeight", label: "Nose height", min: "High", max: "Low" },
    ],
  },
  {
    title: "Eyes",
    sliders: [
      { key: "eyeSize", label: "Eye size", min: "Small", max: "Large" },
      { key: "eyeAngle", label: "Eye angle", min: "Drooping", max: "Upturned" },
      { key: "eyeNarrow", label: "Eye narrowness", min: "Wide open", max: "Narrow" },
      { key: "squint", label: "Squint", min: "Cross-eyed", max: "Wall-eyed", randomRange: [40, 60] },
      { key: "eyeRedness", label: "Eye redness", min: "Clear", max: "Bloodshot", randomRange: [0, 65] },
    ],
  },
  {
    title: "Ears",
    sliders: [
      { key: "earSize", label: "Ear size", min: "Small", max: "Large" },
      { key: "earAngle", label: "Ear angle", min: "Flat", max: "Sticking out" },
    ],
  },
  {
    title: "Physique",
    sliders: [
      { key: "weight", label: "Weight", min: "Lean", max: "Portly" },
      { key: "wrinkles", label: "Wrinkles", min: "Smooth", max: "Weathered", randomRange: [0, 75] },
    ],
  },
  {
    title: "Expression",
    sliders: [
      { key: "frown", label: "Frown", min: "Smiling", max: "Scowling", randomRange: [30, 70] },
    ],
  },
];

CH.HAIR_STYLES = [
  { id: "full", label: "Full head" },
  { id: "balding", label: "Balding" },
  { id: "bald", label: "Bald" },
];

CH.BEARD_STYLES = [
  { id: "none", label: "Clean-shaven" },
  { id: "stubble", label: "Stubble" },
  { id: "full", label: "Bearded" },
];

CH.HAIR_COLORS = [
  { id: "black", label: "Black", hex: "#1f1a17" },
  { id: "darkbrown", label: "Dark brown", hex: "#3b2618" },
  { id: "chestnut", label: "Chestnut", hex: "#6b3e22" },
  { id: "auburn", label: "Auburn", hex: "#8e3b1b" },
  { id: "bronze", label: "Bronze", hex: "#b5652b" },
  { id: "fair", label: "Fair", hex: "#c9a463" },
  { id: "grey", label: "Grey", hex: "#8d8a86" },
  { id: "white", label: "White", hex: "#e4e1dc" },
];

// From pale to sun-tanned.
CH.SKIN_TONES = [
  { id: "pale", label: "Pale", hex: "#f6d6bf", shade: "#e3b597", neck: "#ecc3a6", outline: "#9a6248" },
  { id: "fair", label: "Fair", hex: "#f1c6a5", shade: "#dea884", neck: "#e6b391", outline: "#915839" },
  { id: "light", label: "Light", hex: "#ecb892", shade: "#d99c76", neck: "#dfa47e", outline: "#8a4f36" },
  { id: "olive", label: "Olive", hex: "#dfab7f", shade: "#c78d63", neck: "#d1996c", outline: "#7e4831" },
  { id: "tanned", label: "Tanned", hex: "#cd9366", shade: "#b47a4f", neck: "#be8458", outline: "#703e27" },
];

CH.EYE_COLORS = [
  { id: "darkbrown", label: "Dark brown", hex: "#3d2414" },
  { id: "brown", label: "Brown", hex: "#6b4226" },
  { id: "hazel", label: "Hazel", hex: "#8a6a2f" },
  { id: "green", label: "Green", hex: "#4f7a3a" },
  { id: "grey", label: "Grey", hex: "#7d8a92" },
  { id: "blue", label: "Blue", hex: "#4a7bb5" },
];

CH.getGens = (id) => CH.GENTES.find((g) => g.id === id);
CH.getColor = (list, id) => (list.find((c) => c.id === id) || list[0]).hex;
