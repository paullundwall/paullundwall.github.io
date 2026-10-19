'use strict';
// World coordinates are metres. North is up, x grows east, y grows south.
// x = (longitude − 11.39°) × 70 000, y = (51.00° − latitude) × 111 200,
// taken from the modern positions of Jena, Cospeda, Closewitz, Vierzehnheiligen...
A.MAP = { W: 16000, H: 10500 };
A.T_START = 6 * 60;
A.T_END = 17 * 60;

A.STREAMS = [
  {
    name: 'Saale',
    pts: [[15350, 0], [15150, 1400], [15000, 2700], [14950, 3900], [14980, 5005], [14700, 5700], [14520, 6300], [14380, 7000], [14250, 7700], [14200, 8400], [14250, 9200], [14450, 10500]],
  },
  {
    name: 'Mühlbach',
    pts: [[7600, 7350], [8600, 7250], [9600, 7150], [10500, 7250], [11300, 7450], [12100, 7650], [12900, 7900], [13600, 8100], [14220, 8150]],
  },
];
A.STREAMS_SMOOTH = A.STREAMS.map((s) => A.chaikin(s.pts, 3));

A.PONDS = [];

A.WOODS = [
  { name: 'Bois de Closewitz', poly: A.blob(11250, 4700, 430, 260, 0.6, 21, 22) },
  { name: "Forêt d'Isserstedt", poly: [[3900, 6500], [5200, 6050], [6500, 6000], [7500, 6350], [7800, 7300], [7300, 8500], [5900, 9000], [4500, 8700], [3700, 7700]] },
  { name: 'Bois du Rautal', poly: A.blob(13350, 5150, 420, 260, -0.4, 23, 20) },
  { name: 'Forst', poly: A.blob(11600, 9400, 1500, 600, 0.1, 24, 26) },
];
A.CASTLE = { x: 1880, y: 3620, name: 'Wasserburg Kapellendorf' };
// The slopes of the Saale valley around Jena were planted with vines.
A.VINEYARDS = [
  [[12950, 7050], [13450, 6950], [13650, 7450], [13150, 7550]],
  [[13650, 5800], [14100, 5700], [14250, 6250], [13800, 6350]],
  [[12400, 8250], [13000, 8300], [12950, 8750], [12350, 8650]],
];

A.ROADS = [
  { name: 'Chaussée de Weimar', main: true, pts: [[0, 5150], [2200, 5250], [4300, 5450], [6090, 5560], [7600, 6000], [8800, 6600], [9800, 6950], [10600, 7150], [11600, 7500], [12700, 7800], [13720, 8118]] },
  { name: 'Route de Dornburg', main: true, pts: [[13720, 8118], [14000, 7400], [14250, 6700], [14420, 6116], [14700, 5500], [14700, 4300], [14750, 2800], [15000, 1300], [15100, 0]] },
  { main: false, pts: [[13720, 8118], [16000, 8000]] },
  { main: false, pts: [[13720, 8118], [13700, 10500]] },
  { main: false, pts: [[14420, 6116], [16000, 5900]] },
  { main: false, pts: [[13500, 7750], [12900, 7100], [12450, 6500], [12150, 5900], [11620, 4170]] },
  { main: false, pts: [[12150, 5900], [11300, 6050], [10465, 6060]] },
  { main: false, pts: [[14420, 6116], [13600, 5400], [12600, 4700], [11620, 4170]] },
  { main: false, pts: [[11620, 4170], [11300, 3000], [11130, 1724], [10570, 780], [10300, 0]] },
  { main: false, pts: [[11620, 4170], [10600, 4500], [10010, 4948], [10465, 6060], [10600, 7150]] },
  { main: false, pts: [[10010, 4948], [9300, 4400], [8575, 3781], [7490, 4392], [6090, 5560]] },
  { main: false, pts: [[8575, 3781], [9695, 2390], [11130, 1724]] },
  { main: false, pts: [[7490, 4392], [6500, 3900], [5600, 3447], [3800, 3600], [1960, 3780], [0, 4400]] },
  { main: false, pts: [[5600, 3447], [4690, 2057], [3200, 2800], [1960, 3780]] },
  { main: false, pts: [[4690, 2057], [5800, 1200], [7000, 0]] },
  { main: false, pts: [[1960, 3780], [2300, 4600], [2600, 5300]] },
  { main: false, pts: [[6090, 5560], [5600, 4500], [5600, 3447]] },
];

A.VILLAGES = [
  { name: 'Iéna', x: 13720, y: 8118, rx: 520, ry: 420, rot: 0.1, town: true },
  { name: 'Löbstedt', x: 14420, y: 6116, rx: 230, ry: 160, rot: -0.5 },
  { name: 'Zwätzen', x: 14700, y: 5005, rx: 240, ry: 170, rot: -1.2 },
  { name: 'Cospeda', x: 10465, y: 6060, rx: 280, ry: 190, rot: 0.2 },
  { name: 'Lützeroda', x: 10010, y: 4948, rx: 230, ry: 160, rot: -0.3 },
  { name: 'Closewitz', x: 11620, y: 4170, rx: 260, ry: 180, rot: 0.4 },
  { name: 'Krippendorf', x: 8575, y: 3781, rx: 270, ry: 180, rot: -0.2 },
  { name: 'Vierzehnheiligen', x: 7490, y: 4392, rx: 300, ry: 200, rot: 0.3 },
  { name: 'Isserstedt', x: 6090, y: 5560, rx: 330, ry: 220, rot: -0.1 },
  { name: 'Klein-Romstedt', x: 5600, y: 3447, rx: 240, ry: 170, rot: 0.5 },
  { name: 'Gross-Romstedt', x: 4690, y: 2057, rx: 300, ry: 200, rot: -0.4 },
  { name: 'Kapellendorf', x: 1960, y: 3780, rx: 320, ry: 230, rot: 0.2 },
  { name: 'Altengönna', x: 9695, y: 2390, rx: 250, ry: 170, rot: 0.1 },
  { name: 'Lehesten', x: 11130, y: 1724, rx: 230, ry: 160, rot: -0.6 },
  { name: 'Rödigen', x: 10570, y: 780, rx: 220, ry: 150, rot: 0.3 },
];

A.LABELS = [
  { t: 'L A N D G R A F E N B E R G', x: 12650, y: 6780, s: 150, rot: -0.75, kind: 'region' },
  { t: 'Windknollen', x: 12150, y: 5750, s: 110, kind: 'hill' },
  { t: 'Dornberg', x: 10200, y: 3150, s: 110, kind: 'hill' },
  { t: 'Sperlingsberg', x: 6800, y: 4950, s: 100, kind: 'hill' },
  { t: 'Saale', x: 15250, y: 3300, s: 120, rot: -1.5, kind: 'water' },
  { t: 'Saale', x: 14500, y: 9300, s: 120, rot: 1.45, kind: 'water' },
  { t: 'Mühltal', x: 11500, y: 7300, s: 110, rot: 0.25, kind: 'water' },
  { t: 'Schnecke', x: 9500, y: 6700, s: 80, rot: 0.3, kind: 'small' },
  { t: 'Steiger', x: 13050, y: 7300, s: 70, rot: -0.9, kind: 'small' },
  { t: 'Bois de Closewitz', x: 11250, y: 4380, s: 80, kind: 'small' },
  { t: "Forêt d'Isserstedt", x: 5700, y: 7500, s: 110, kind: 'small' },
  { t: 'Wasserburg', x: 1700, y: 3360, s: 70, kind: 'small' },
  { t: 'Chaussée de Weimar', x: 3200, y: 5100, s: 90, rot: 0.05, kind: 'road' },
  { t: 'vers Weimar', x: 700, y: 4950, s: 90, kind: 'road' },
  { t: 'vers Dornburg', x: 15500, y: 600, s: 90, rot: -1.45, kind: 'road' },
  { t: 'vers Kahla', x: 13300, y: 10250, s: 90, rot: -1.5, kind: 'road' },
];

A.OBJECTIVES = [
  { id: 'landgraf', name: 'Landgrafenberg', x: 12250, y: 6150, r: 450, pts: 3, owner: 'F', hq: true },
  { id: 'clo', name: 'Closewitz', x: 11620, y: 4170, r: 400, pts: 2, owner: 'A' },
  { id: 'cos', name: 'Cospeda', x: 10465, y: 6060, r: 380, pts: 2, owner: 'A' },
  { id: 'lue', name: 'Lützeroda', x: 10010, y: 4948, r: 380, pts: 2, owner: 'A' },
  { id: 'kri', name: 'Krippendorf', x: 8575, y: 3781, r: 380, pts: 2, owner: 'A' },
  { id: 'vier', name: 'Vierzehnheiligen', x: 7490, y: 4392, r: 420, pts: 3, owner: 'A', key: true },
  { id: 'iss', name: 'Isserstedt', x: 6090, y: 5560, r: 420, pts: 3, owner: 'A', key: true },
  { id: 'klr', name: 'Klein-Romstedt', x: 5600, y: 3447, r: 380, pts: 2, owner: 'A' },
  { id: 'grr', name: 'Gross-Romstedt', x: 4690, y: 2057, r: 400, pts: 2, owner: 'A' },
  { id: 'kap', name: 'Kapellendorf', x: 1960, y: 3780, r: 450, pts: 3, owner: 'A', key: true },
  { id: 'roe', name: 'Rödigen', x: 10570, y: 780, r: 380, pts: 1, owner: 'A' },
];

A.NATIONS = {
  F: { name: 'French', morale: 1.1, fire: 1.0, fill: '#2d4f97', dark: '#121f40', glyph: '#f3ead6', flag: ['#1f3c8a', '#f4efe2', '#c0262d'] },
  P: { name: 'Prussian', morale: 1.0, fire: 0.92, fill: '#2a2c33', dark: '#0c0d10', glyph: '#efe7d0', flag: ['#f4efe2', '#1a1a1a'], track: '#2a2c33' },
  S: { name: 'Saxon', morale: 0.88, fire: 0.88, fill: '#efe8d6', dark: '#2f5a2f', glyph: '#2f5a2f', flag: ['#f4efe2', '#2f6b2f'], track: '#3f7a3a' },
};

A.TYPES = {
  line: { cls: 'inf', label: 'Line infantry', fire: 1.0, melee: 1.0, morale: 1.0, sight: 2100 },
  light: { cls: 'inf', label: 'Light infantry', fire: 1.15, melee: 0.95, morale: 1.0, sight: 2300, speedMul: 1.1 },
  grenadier: { cls: 'inf', label: 'Grenadiers', fire: 1.0, melee: 1.3, morale: 1.2, sight: 2100 },
  guard: { cls: 'inf', label: 'Guard infantry', fire: 1.15, melee: 1.5, morale: 1.4, sight: 2100 },
  hussar: { cls: 'cav', label: 'Light cavalry', melee: 1.0, morale: 1.0, speed: 175, sight: 2700 },
  dragoon: { cls: 'cav', label: 'Dragoons', melee: 1.15, morale: 1.0, speed: 155, sight: 2500 },
  cuirassier: { cls: 'cav', label: 'Cuirassiers', melee: 1.65, morale: 1.15, speed: 145, sight: 2400 },
  guardcav: { cls: 'cav', label: 'Guard cavalry', melee: 1.8, morale: 1.4, speed: 160, sight: 2500 },
  uhlan: { cls: 'cav', label: 'Uhlans', melee: 1.15, morale: 1.0, speed: 170, sight: 2600 },
  cossack: { cls: 'cav', label: 'Cossacks', melee: 0.75, morale: 0.8, speed: 190, sight: 2900 },
  art: { cls: 'art', label: 'Artillery', melee: 0.25, morale: 1.0, speed: 55, sight: 2300 },
  staff: { cls: 'staff', label: 'Imperial headquarters', melee: 0.1, morale: 2.0, speed: 190, sight: 3900 },
};

A.CORPS = {
  Q: { side: 'F', name: 'Quartier impérial', cmd: "L'Empereur", short: 'NAPOLÉON', color: '#c9a043' },
  V: { side: 'F', name: 'Ve Corps', cmd: 'Maréchal Lannes', short: 'LANNES', color: '#d4a017' },
  VII: { side: 'F', name: 'VIIe Corps', cmd: 'Maréchal Augereau', short: 'AUGEREAU', color: '#3e7d4f' },
  G: { side: 'F', name: 'Garde impériale', cmd: 'Maréchal Lefebvre', short: 'LEFEBVRE', color: '#e0c050' },
  IV: { side: 'F', name: 'IVe Corps', cmd: 'Maréchal Soult', short: 'SOULT', color: '#b8352b' },
  VI: { side: 'F', name: 'VIe Corps', cmd: 'Maréchal Ney', short: 'NEY', color: '#4f86c6' },
  RC: { side: 'F', name: 'Réserve de cavalerie', cmd: 'Maréchal Murat', short: 'MURAT', color: '#d9782d' },
  T: { side: 'A', name: "Tauentzien's Division", cmd: 'Generalleutnant von Tauentzien', short: 'TAUENTZIEN' },
  GW: { side: 'A', name: "Grawert's Division", cmd: 'Generalleutnant von Grawert', short: 'GRAWERT' },
  HC: { side: 'A', name: "Hohenlohe's Cavalry", cmd: 'Prince Hohenlohe', short: 'HOHENLOHE' },
  SX: { side: 'A', name: 'Saxon Division', cmd: 'Generalleutnant von Zezschwitz', short: 'ZEZSCHWITZ' },
  HZ: { side: 'A', name: "Holtzendorff's Detachment", cmd: 'Generalleutnant von Holtzendorff', short: 'HOLTZENDORFF' },
  RU: { side: 'A', name: "Rüchel's Corps", cmd: 'General von Rüchel', short: 'RÜCHEL' },
};

// Order of battle at dawn, 14 October 1806. face: degrees, 0 = east, 90 = south.
A.OOB = [
  // ---- Grande Armée: packed onto the Landgrafenberg and in the Mühltal ----
  { side: 'F', nation: 'F', corps: 'Q', id: 'nap', name: "L'Empereur et son escorte", cmd: 'Napoléon', type: 'staff', men: 300, x: 12350, y: 6400, face: 200, q: 1.2 },
  { side: 'F', nation: 'F', corps: 'V', id: 'v17', name: '17e Léger', cmd: 'Claparède', type: 'light', men: 1600, x: 11750, y: 4950, face: 255, q: 1.15, form: 'line' },
  { side: 'F', nation: 'F', corps: 'V', id: 'vsuc', name: 'Division Suchet', cmd: 'Suchet', type: 'line', men: 6400, guns: 8, x: 12000, y: 5450, face: 245, q: 1.1 },
  { side: 'F', nation: 'F', corps: 'V', id: 'vgaz', name: 'Division Gazan', cmd: 'Gazan', type: 'line', men: 7100, guns: 8, x: 11550, y: 6050, face: 190, q: 1.1 },
  { side: 'F', nation: 'F', corps: 'V', id: 'vart', name: 'Artillerie du Ve Corps', cmd: 'Lannes', type: 'art', men: 400, guns: 14, x: 12150, y: 5850, face: 215, q: 1.1 },
  { side: 'F', nation: 'F', corps: 'V', id: 'vtre', name: 'Cavalerie légère du Ve Corps', cmd: 'Treilhard', type: 'hussar', men: 1300, x: 12550, y: 5750, face: 230, q: 1.05 },
  { side: 'F', nation: 'F', corps: 'G', id: 'ginf', name: 'Garde impériale à pied', cmd: 'Lefebvre', type: 'guard', men: 5000, x: 12650, y: 6450, face: 200, q: 1.25 },
  { side: 'F', nation: 'F', corps: 'G', id: 'gart', name: 'Artillerie de la Garde', cmd: 'Couin', type: 'art', men: 450, guns: 24, x: 12450, y: 6150, face: 210, q: 1.2 },
  { side: 'F', nation: 'F', corps: 'VII', id: 'ades', name: 'Division Desjardin', cmd: 'Desjardin', type: 'line', men: 7500, guns: 8, x: 12450, y: 7600, face: 195, q: 1.05 },
  { side: 'F', nation: 'F', corps: 'VII', id: 'aheu', name: 'Division Heudelet', cmd: 'Heudelet', type: 'line', men: 6500, guns: 8, x: 13150, y: 7900, face: 195, q: 1.05 },
  { side: 'F', nation: 'F', corps: 'VII', id: 'adur', name: 'Cavalerie légère du VIIe Corps', cmd: 'Durosnel', type: 'hussar', men: 1000, x: 13450, y: 7550, face: 195, q: 1.0 },

  // ---- Prussian and Saxon army of Prince Hohenlohe ----
  { side: 'A', nation: 'P', corps: 'T', id: 'tclo', name: 'Closewitz Battalions', cmd: 'Tauentzien', type: 'line', men: 2600, guns: 4, x: 11550, y: 4250, face: 70, q: 0.95 },
  { side: 'A', nation: 'P', corps: 'T', id: 'tjae', name: 'Füsiliers & Jäger', cmd: 'Erichsen', type: 'light', men: 1200, x: 11250, y: 4700, face: 60, q: 1.0, form: 'line' },
  { side: 'A', nation: 'S', corps: 'T', id: 'tlue', name: 'Cospeda & Lützeroda Battalions', cmd: 'Tauentzien', type: 'line', men: 3000, guns: 6, x: 10350, y: 5400, face: 15, q: 0.9 },
  { side: 'A', nation: 'P', corps: 'T', id: 'tcav', name: "Tauentzien's Hussars", cmd: 'Bila', type: 'hussar', men: 1400, x: 9500, y: 4500, face: 20, q: 1.0 },
  { side: 'A', nation: 'P', corps: 'GW', id: 'gr1', name: 'Grawert (1st line)', cmd: 'Grawert', type: 'line', men: 5600, guns: 10, x: 5300, y: 4050, face: 5, q: 1.05 },
  { side: 'A', nation: 'P', corps: 'GW', id: 'gr2', name: 'Grawert (2nd line)', cmd: 'Grawert', type: 'line', men: 4600, guns: 6, x: 4700, y: 4350, face: 5, q: 1.0 },
  { side: 'A', nation: 'P', corps: 'GW', id: 'grc', name: 'Cuirassiers & Dragoons', cmd: 'Grawert', type: 'cuirassier', men: 1800, x: 5150, y: 3250, face: 5, q: 1.05 },
  { side: 'A', nation: 'P', corps: 'HC', id: 'hcav', name: 'Reserve Cavalry', cmd: 'Hohenlohe', type: 'dragoon', men: 2400, x: 4000, y: 3050, face: 5, q: 1.0 },
  { side: 'A', nation: 'S', corps: 'SX', id: 'sx1', name: 'Saxon Division', cmd: 'Zezschwitz', type: 'line', men: 5000, guns: 8, x: 8350, y: 6450, face: 0, q: 0.9 },
  { side: 'A', nation: 'S', corps: 'SX', id: 'sx2', name: 'Saxon Grenadiers', cmd: 'Winkel', type: 'grenadier', men: 2400, guns: 4, x: 6900, y: 5800, face: 0, q: 0.95 },
  { side: 'A', nation: 'S', corps: 'SX', id: 'sxc', name: 'Saxon Cuirassiers', cmd: 'Zastrow', type: 'cuirassier', men: 1200, x: 6500, y: 5000, face: 10, q: 1.0 },
  { side: 'A', nation: 'P', corps: 'HZ', id: 'ho1', name: "Holtzendorff's Infantry", cmd: 'Holtzendorff', type: 'line', men: 4000, guns: 6, x: 10900, y: 550, face: 100, q: 1.0 },
  { side: 'A', nation: 'P', corps: 'HZ', id: 'hoc', name: "Holtzendorff's Hussars", cmd: 'Holtzendorff', type: 'hussar', men: 1200, x: 11850, y: 750, face: 100, q: 1.0 },
];

// French corps coming up through Jena and the Saale valley, and Rüchel's
// corps marching from Weimar.
A.REINFORCEMENTS = [
  { t: 420, dest: [12900, 4700], from: 'Maréchal Soult', text: 'has crossed at Löbstedt and is climbing onto the plateau towards Closewitz.',
    banner: ['Soult arrive !', 'Saint-Hilaire climbs onto the plateau on the right'], note: "Soult's IV Corps comes up on the right through Löbstedt.",
    u: { side: 'F', nation: 'F', corps: 'IV', id: 'shi', name: 'Division Saint-Hilaire', cmd: 'Saint-Hilaire', type: 'line', men: 8000, guns: 10, x: 15900, y: 5900, face: 180, q: 1.15 } },
  { t: 440, dest: [13200, 4000], from: 'Maréchal Soult', text: 'has come up behind Saint-Hilaire.',
    u: { side: 'F', nation: 'F', corps: 'IV', id: 'sguy', name: 'Cavalerie légère du IVe Corps', cmd: 'Guyot', type: 'hussar', men: 1200, x: 15900, y: 5800, face: 180, q: 1.05 } },
  { t: 570, dest: [11300, 6350], from: 'Maréchal Ney', text: 'has come through Jena at the double.',
    banner: ['Ney arrive !', 'His vanguard hurries up from Jena'], note: "Ney's vanguard arrives and, without orders, pushes into the line between Lannes and Augereau.",
    u: { side: 'F', nation: 'F', corps: 'VI', id: 'navg', name: 'Avant-garde du VIe Corps', cmd: 'Ney', type: 'light', men: 3000, x: 13650, y: 10450, face: 270, q: 1.15, form: 'line' } },
  { t: 580, dest: [11700, 6650], from: 'Maréchal Ney', text: 'has come up with the vanguard.',
    u: { side: 'F', nation: 'F', corps: 'VI', id: 'ncol', name: 'Brigade Colbert', cmd: 'Colbert', type: 'hussar', men: 1200, x: 13750, y: 10450, face: 270, q: 1.1 } },
  { t: 690, dest: [12600, 5000], from: 'Maréchal Soult', text: 'has come up from the Saale.',
    u: { side: 'F', nation: 'F', corps: 'IV', id: 'slev', name: 'Division Leval', cmd: 'Leval', type: 'line', men: 6500, guns: 8, x: 15900, y: 6000, face: 180, q: 1.1 } },
  { t: 720, dest: [11800, 6900], from: 'Maréchal Murat', text: 'is through Jena and climbing onto the plateau.',
    banner: ['Murat arrive !', 'The reserve cavalry is coming up from Jena'], note: 'Murat arrives with the reserve cavalry.',
    u: { side: 'F', nation: 'F', corps: 'RC', id: 'rkle', name: 'Division de dragons', cmd: 'Klein', type: 'dragoon', men: 3000, x: 13600, y: 10450, face: 270, q: 1.05 } },
  { t: 750, dest: [12200, 7000], from: 'Maréchal Murat', text: 'has come up behind the dragoons.',
    u: { side: 'F', nation: 'F', corps: 'RC', id: 'rhau', name: 'Division de cuirassiers', cmd: "d'Hautpoul", type: 'cuirassier', men: 2200, x: 13700, y: 10450, face: 270, q: 1.15 } },
  { t: 780, dest: [12000, 6700], from: 'Maréchal Ney', text: 'has come through Jena.',
    u: { side: 'F', nation: 'F', corps: 'VI', id: 'nmar', name: 'Division Marchand', cmd: 'Marchand', type: 'line', men: 6500, guns: 8, x: 13650, y: 10450, face: 270, q: 1.05 } },
  { t: 840, note: "Rüchel's corps arrives from Weimar by Kapellendorf.", key: 'ruchel',
    u: { side: 'A', nation: 'P', corps: 'RU', id: 'ru1', name: 'Rüchel (1st line)', cmd: 'Rüchel', type: 'line', men: 6000, guns: 10, x: 60, y: 4450, face: 0, q: 1.0 } },
  { t: 852, u: { side: 'A', nation: 'P', corps: 'RU', id: 'ru2', name: 'Rüchel (2nd line)', cmd: 'Rüchel', type: 'line', men: 5500, guns: 8, x: 60, y: 4300, face: 0, q: 0.95 } },
  { t: 860, u: { side: 'A', nation: 'P', corps: 'RU', id: 'ruc', name: "Rüchel's Cavalry", cmd: 'Rüchel', type: 'dragoon', men: 2500, x: 60, y: 4150, face: 0, q: 1.0 } },
];

// Hohenlohe believed he faced only a flank guard: Tauentzien holds the edge of
// the plateau, the main body waits round Kapellendorf until the danger is clear.
// mode: wait, hold (fight near the post), march (keep moving), attack (seek combat near the route).
A.PLANS = {
  tclo: [{ t: 360, mode: 'hold', x: 11550, y: 4250 }],
  tjae: [{ t: 360, mode: 'hold', x: 11250, y: 4700 }],
  tlue: [{ t: 360, mode: 'hold', x: 10350, y: 5400 }],
  tcav: [{ t: 360, mode: 'hold', x: 9500, y: 4500 }],
  gr1: [{ t: 360, mode: 'hold', x: 5300, y: 4050 }],
  gr2: [{ t: 360, mode: 'hold', x: 4700, y: 4350 }],
  grc: [{ t: 360, mode: 'hold', x: 5150, y: 3250 }],
  hcav: [{ t: 360, mode: 'hold', x: 4000, y: 3050 }],
  sx1: [{ t: 360, mode: 'hold', x: 8350, y: 6450 }],
  sx2: [{ t: 360, mode: 'hold', x: 6900, y: 5800 }],
  sxc: [{ t: 360, mode: 'hold', x: 6500, y: 5000 }, { t: 640, mode: 'attack', x: 7700, y: 5000 }],
  ho1: [{ t: 360, mode: 'wait', x: 10900, y: 550 }, { t: 480, mode: 'march', x: 10900, y: 2500 }, { t: 560, mode: 'attack', x: 11600, y: 3900 }],
  hoc: [{ t: 360, mode: 'wait', x: 11850, y: 750 }, { t: 490, mode: 'march', x: 11900, y: 2400 }, { t: 565, mode: 'attack', x: 12400, y: 3700 }],
  ru1: [{ t: 840, mode: 'march', x: 2700, y: 3500 }, { t: 885, mode: 'attack', x: 4700, y: 2600 }],
  ru2: [{ t: 852, mode: 'march', x: 2700, y: 4300 }, { t: 895, mode: 'attack', x: 5500, y: 3700 }],
  ruc: [{ t: 860, mode: 'march', x: 3100, y: 2700 }, { t: 900, mode: 'attack', x: 5300, y: 2500 }],
};

A.HISTORY = {
  fr: { losses: 5000, text: 'about 5,000 killed and wounded' },
  al: { losses: 25000, text: 'about 10,000 killed and wounded and 15,000 prisoners' },
};

// Who the player commands. units/corps limit what can be ordered; targets are
// the objectives that judge the commander personally at the end of the day.
A.COMMANDERS = [
  {
    id: 'nap', name: "L'Empereur", sub: 'The whole Grande Armée',
    objectives: [
      'Break out of the Landgrafenberg in the fog: Lannes to take <b>Closewitz</b>, <b>Cospeda</b> and <b>Lützeroda</b>.',
      'Augereau to climb out of the <b>Mühltal</b>; Soult to come up on the right and deal with Holtzendorff; Ney and Murat follow through Jena.',
      'Take <b>Vierzehnheiligen</b>, <b>Isserstedt</b> and <b>Kapellendorf</b>, and break Hohenlohe before Rüchel arrives from Weimar.',
      'Never lose the <b>Landgrafenberg</b>, your command post.',
    ],
  },
  {
    id: 'lannes', name: 'Maréchal Lannes', sub: 'Ve Corps — Suchet and Gazan', corps: ['V'],
    objectives: [
      'Advance off the Landgrafenberg in the fog and clear <b>Closewitz</b>, <b>Cospeda</b> and <b>Lützeroda</b>, so the army has room to deploy.',
      'Push on across the plateau and take <b>Vierzehnheiligen</b>; hold it against Grawert\'s counter-attack.',
      'Never let the enemy near the <b>Landgrafenberg</b>.',
    ],
    targets: ['clo', 'cos', 'lue', 'vier'],
  },
  {
    id: 'augereau', name: 'Maréchal Augereau', sub: 'VIIe Corps — Desjardin and Heudelet', corps: ['VII'],
    objectives: [
      'Climb out of the Mühltal by the Schnecke and the Weimar road, on the left of Lannes.',
      'Drive the Saxons back and take <b>Isserstedt</b> and the edge of its forest.',
      'Then turn the Prussian right towards <b>Kapellendorf</b>.',
    ],
    targets: ['cos', 'iss', 'kap'],
  },
  {
    id: 'soult', name: 'Maréchal Soult', sub: 'IVe Corps — Saint-Hilaire, then Leval', corps: ['IV'], arrives: 420,
    objectives: [
      'Your corps comes up from the Saale at Löbstedt from 7 h: Saint-Hilaire first, then Guyot\'s cavalry and, about 11 h 30, Leval\'s division.',
      'Beat Holtzendorff when he comes down from <b>Rödigen</b> against the right of the army.',
      'Turn the Prussian left by <b>Krippendorf</b> and <b>Gross-Romstedt</b>.',
    ],
    targets: ['roe', 'kri', 'grr'],
  },
  {
    id: 'ney', name: 'Maréchal Ney', sub: 'VIe Corps — the vanguard, then Marchand', corps: ['VI'], arrives: 570,
    objectives: [
      'Your vanguard comes through Jena at about 9 h 30. The battle will already be three hours old.',
      'Take <b>Vierzehnheiligen</b> and hold it against the Prussian cavalry and Grawert\'s lines — without getting cut off, as Ney nearly was.',
      'Marchand\'s division follows at about 13 h: push on to <b>Klein-Romstedt</b>.',
    ],
    targets: ['vier', 'klr'],
  },
  {
    id: 'murat', name: 'Maréchal Murat', sub: 'Réserve de cavalerie — Klein and d\'Hautpoul', corps: ['RC'], arrives: 720,
    objectives: [
      'The reserve cavalry comes up through Jena about noon. The battle will already be six hours old.',
      'When the Prussian line wavers, break it and pursue towards <b>Gross-Romstedt</b> and <b>Kapellendorf</b>.',
      'Meet Rüchel\'s corps when it comes up from Weimar.',
    ],
    targets: ['grr', 'kap'],
  },
];

// The historical moves of the French corps the player does not command.
A.FPLANS = {
  v17: [{ t: 360, mode: 'attack', x: 11600, y: 4200 }, { t: 560, mode: 'attack', x: 10300, y: 3300 }, { t: 780, mode: 'attack', x: 8575, y: 3781 }],
  vsuc: [{ t: 360, mode: 'attack', x: 11400, y: 4500 }, { t: 560, mode: 'attack', x: 10000, y: 4900 }, { t: 640, mode: 'attack', x: 8200, y: 4200 }, { t: 840, mode: 'attack', x: 5600, y: 3447 }],
  vgaz: [{ t: 360, mode: 'attack', x: 10465, y: 6060 }, { t: 520, mode: 'attack', x: 10010, y: 4948 }, { t: 600, mode: 'attack', x: 7490, y: 4392 }, { t: 840, mode: 'attack', x: 5600, y: 3600 }],
  vart: [{ t: 400, mode: 'march', x: 11000, y: 5300 }, { t: 640, mode: 'march', x: 8800, y: 4600 }],
  vtre: [{ t: 360, mode: 'hold', x: 12550, y: 5750 }, { t: 600, mode: 'attack', x: 9500, y: 3800 }, { t: 800, mode: 'attack', x: 7000, y: 3200 }, { t: 880, mode: 'attack', x: 4690, y: 2057 }],
  ginf: [{ t: 360, mode: 'hold', x: 12650, y: 6450 }, { t: 840, mode: 'hold', x: 9800, y: 5400 }],
  gart: [{ t: 360, mode: 'hold', x: 12450, y: 6150 }, { t: 720, mode: 'march', x: 9600, y: 5200 }],
  ades: [{ t: 360, mode: 'attack', x: 10300, y: 6800 }, { t: 480, mode: 'attack', x: 9200, y: 6400 }, { t: 680, mode: 'attack', x: 7600, y: 5800 }, { t: 780, mode: 'attack', x: 6090, y: 5560 }, { t: 880, mode: 'attack', x: 4300, y: 5000 }],
  aheu: [{ t: 400, mode: 'attack', x: 11000, y: 7100 }, { t: 600, mode: 'attack', x: 9000, y: 6600 }, { t: 780, mode: 'attack', x: 6600, y: 5900 }, { t: 880, mode: 'attack', x: 4000, y: 5300 }],
  adur: [{ t: 360, mode: 'hold', x: 13450, y: 7550 }, { t: 700, mode: 'attack', x: 8500, y: 6000 }, { t: 850, mode: 'attack', x: 5000, y: 5000 }],
  shi: [{ t: 425, mode: 'attack', x: 11800, y: 3800 }, { t: 560, mode: 'attack', x: 11000, y: 2200 }, { t: 640, mode: 'attack', x: 10570, y: 900 }, { t: 780, mode: 'attack', x: 8575, y: 3781 }, { t: 880, mode: 'attack', x: 5600, y: 3000 }],
  sguy: [{ t: 445, mode: 'attack', x: 11300, y: 2600 }, { t: 640, mode: 'attack', x: 10600, y: 1200 }, { t: 850, mode: 'attack', x: 6000, y: 2500 }],
  slev: [{ t: 695, mode: 'attack', x: 10500, y: 3500 }, { t: 800, mode: 'attack', x: 8000, y: 3300 }, { t: 880, mode: 'attack', x: 4690, y: 2057 }],
  navg: [{ t: 575, mode: 'attack', x: 9000, y: 5200 }, { t: 620, mode: 'attack', x: 7490, y: 4392 }, { t: 850, mode: 'attack', x: 6000, y: 4200 }],
  ncol: [{ t: 585, mode: 'attack', x: 8500, y: 4800 }, { t: 700, mode: 'attack', x: 7600, y: 3700 }],
  nmar: [{ t: 785, mode: 'attack', x: 9000, y: 5000 }, { t: 830, mode: 'attack', x: 6800, y: 4700 }, { t: 900, mode: 'attack', x: 2600, y: 3900 }],
  rkle: [{ t: 725, mode: 'march', x: 9500, y: 5500 }, { t: 830, mode: 'attack', x: 6000, y: 4500 }, { t: 900, mode: 'attack', x: 3500, y: 4200 }, { t: 960, mode: 'attack', x: 1960, y: 3780 }],
  rhau: [{ t: 755, mode: 'march', x: 9200, y: 5000 }, { t: 830, mode: 'attack', x: 5600, y: 3800 }, { t: 930, mode: 'attack', x: 1960, y: 3780 }],
};
