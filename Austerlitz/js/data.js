'use strict';
// World coordinates are metres. North is up, x grows east, y grows south.
// Positions are derived from the modern locations of the villages
// (Tvarožná, Jiříkovice, Ponětovice, Kobylnice, Sokolnice, Telnice, Prace...).
A.MAP = { W: 14600, H: 14500 };
A.T_START = 7 * 60;
A.T_END = 17 * 60;

A.STREAMS = [
  {
    name: 'Goldbach',
    pts: [[6950, 1300], [6600, 2600], [6250, 3700], [5850, 4700], [5500, 5600], [5150, 6200], [4800, 6800], [4550, 7400], [4150, 8100], [3950, 8800], [3600, 9800], [3400, 10600], [3300, 11300], [3000, 12100], [2800, 12700], [2750, 13300]],
  },
  {
    name: 'Littawa',
    pts: [[14600, 7700], [13300, 7900], [12000, 8200], [10900, 8750], [9900, 9700], [9000, 10600], [7900, 11500], [6800, 12000], [5900, 12450], [5100, 12900], [4650, 13250]],
  },
];
A.STREAMS_SMOOTH = A.STREAMS.map((s) => A.chaikin(s.pts, 3));

A.PONDS = [
  { name: 'Étang de Satschan', poly: A.blob(3950, 13450, 950, 360, -0.25, 11) },
  { name: 'Étang de Menitz', poly: A.blob(1550, 13950, 1150, 420, 0.12, 12) },
  { name: 'Étang de Kobelnitz', poly: A.blob(4000, 9150, 380, 160, 1.1, 13) },
];

A.WOODS = [
  { name: 'Bois de Bosenitz', poly: [[7000, 0], [10200, 0], [10300, 700], [9600, 1250], [8500, 1650], [7600, 1550], [6950, 950]] },
  { name: 'Bois de Turas', poly: A.blob(1300, 9900, 520, 300, 0.4, 21, 24) },
];
A.PHEASANTRY = A.rect(3150, 10420, 460, 300, 0.35);
A.CASTLE = { x: 2830, y: 11020 };
A.VINEYARDS = [[[7350, 6150], [8050, 6050], [8150, 6600], [7450, 6750]], [[5300, 9900], [5750, 9800], [5800, 10200], [5350, 10300]]];

A.ROADS = [
  { name: "Route d'Olmütz", main: true, pts: [[0, 4950], [2500, 4550], [4300, 4050], [5600, 3700], [7000, 3200], [9490, 2250], [11500, 1500], [14600, 600]] },
  { name: 'Route de Brünn à Austerlitz', main: true, pts: [[0, 5750], [1800, 5450], [3430, 5200], [4500, 5450], [5330, 5660], [6700, 5850], [7900, 5900], [9600, 6600], [11200, 7300], [12800, 7200], [14600, 6950]] },
  { main: false, pts: [[4250, 4250], [4800, 4900], [5330, 5660], [4900, 6400], [4530, 7100], [4100, 7800], [3720, 8550], [3350, 9800], [3070, 11200], [2560, 12650], [1800, 12950], [300, 13250]] },
  { main: false, pts: [[0, 12350], [1400, 12450], [2560, 12650]] },
  { main: false, pts: [[0, 10900], [1600, 11000], [3070, 11200]] },
  { main: false, pts: [[0, 7500], [900, 8300], [2400, 8500], [3720, 8550]] },
  { main: false, pts: [[900, 8300], [1500, 9800], [3070, 11200]] },
  { main: false, pts: [[4530, 7100], [5300, 7600], [5990, 8200], [7000, 8100], [8400, 8000], [10880, 8200], [12800, 7200]] },
  { main: false, pts: [[5990, 8200], [6900, 6900], [7960, 5440]] },
  { main: false, pts: [[3720, 8550], [4800, 8450], [5990, 8200]] },
  { main: false, pts: [[2560, 12650], [4100, 12500], [5690, 12200], [7670, 11100], [9000, 10100], [10880, 8200]] },
  { main: false, pts: [[5690, 12200], [6000, 10800], [6060, 9660], [5990, 8200]] },
  { main: false, pts: [[3430, 5200], [4250, 4250]] },
  { main: false, pts: [[3430, 5200], [3600, 7000], [3720, 8550]] },
  { main: false, pts: [[7960, 5440], [8540, 4900], [9560, 4220], [9490, 2250]] },
  { main: false, pts: [[6640, 2780], [6400, 3400]] },
  { main: false, pts: [[4000, 14200], [4900, 13850], [5690, 12200]] },
];

A.VILLAGES = [
  { name: 'Bosenitz', x: 6640, y: 2780, rx: 330, ry: 220, rot: 0.4 },
  { name: 'Bellowitz', x: 4250, y: 4250, rx: 230, ry: 160, rot: -0.3 },
  { name: 'Schlapanitz', x: 3430, y: 5200, rx: 430, ry: 300, rot: 0.1 },
  { name: 'Girzikowitz', x: 5330, y: 5660, rx: 290, ry: 200, rot: -0.6 },
  { name: 'Puntowitz', x: 4530, y: 7100, rx: 250, ry: 170, rot: -0.9 },
  { name: 'Kobelnitz', x: 3720, y: 8550, rx: 330, ry: 220, rot: 0.2 },
  { name: 'Sokolnitz', x: 3070, y: 11200, rx: 340, ry: 260, rot: 1.2 },
  { name: 'Telnitz', x: 2560, y: 12650, rx: 310, ry: 230, rot: 0.3 },
  { name: 'Pratze', x: 5990, y: 8200, rx: 310, ry: 220, rot: -0.2 },
  { name: 'Blasowitz', x: 7960, y: 5440, rx: 300, ry: 200, rot: 0.3 },
  { name: 'Krug', x: 8540, y: 4900, rx: 150, ry: 120, rot: 0 },
  { name: 'Holubitz', x: 9560, y: 4220, rx: 260, ry: 180, rot: -0.4 },
  { name: 'Krzenowitz', x: 10880, y: 8200, rx: 350, ry: 230, rot: 0.2 },
  { name: 'Hostieradek', x: 7670, y: 11100, rx: 240, ry: 170, rot: 0.6 },
  { name: 'Aujezd', x: 5690, y: 12200, rx: 310, ry: 210, rot: -0.4 },
  { name: 'Satschan', x: 4000, y: 14200, rx: 290, ry: 200, rot: 0 },
  { name: 'Turas', x: 900, y: 8300, rx: 320, ry: 230, rot: 0.5 },
  { name: 'Poste de Posorschitz', x: 9490, y: 2250, rx: 120, ry: 90, rot: 0.3, small: true },
  { name: 'Austerlitz', x: 14250, y: 6950, rx: 480, ry: 360, rot: 0, town: true },
];

A.LABELS = [
  { t: 'P L A T E A U   D E   P R A T Z E N', x: 7050, y: 8150, s: 190, rot: -1.095, kind: 'region' },
  { t: 'Santon', x: 5690, y: 3170, s: 120, kind: 'hill' },
  { t: 'Zuran', x: 4530, y: 4770, s: 120, kind: 'hill' },
  { t: 'Pratzeberg', x: 6060, y: 9400, s: 120, kind: 'hill' },
  { t: 'Staré Vinohrady', x: 7740, y: 6200, s: 110, kind: 'hill' },
  { t: 'Goldbach', x: 4300, y: 7700, s: 110, rot: -1.05, kind: 'water' },
  { t: 'Goldbach', x: 3450, y: 10200, s: 110, rot: -1.35, kind: 'water' },
  { t: 'Littawa', x: 9450, y: 10000, s: 110, rot: -0.78, kind: 'water' },
  { t: 'Étang de Satschan', x: 3950, y: 13470, s: 110, rot: -0.25, kind: 'water' },
  { t: 'Étang de Menitz', x: 1550, y: 13970, s: 110, rot: 0.12, kind: 'water' },
  { t: 'Faisanderie', x: 3150, y: 10200, s: 80, kind: 'small' },
  { t: 'Château', x: 2700, y: 10900, s: 70, kind: 'small' },
  { t: "Route d'Olmütz", x: 8200, y: 2580, s: 90, rot: -0.36, kind: 'road' },
  { t: 'vers Brünn', x: 650, y: 4700, s: 90, rot: -0.16, kind: 'road' },
  { t: 'vers Olmütz', x: 13600, y: 700, s: 90, rot: -0.28, kind: 'road' },
  { t: 'vers Raigern', x: 650, y: 12200, s: 90, kind: 'road' },
  { t: 'Bois de Bosenitz', x: 8600, y: 700, s: 110, kind: 'small' },
];

A.OBJECTIVES = [
  { id: 'zuran', name: 'Zuran', x: 4530, y: 5100, r: 450, pts: 3, owner: 'F', hq: true },
  { id: 'santon', name: 'Santon', x: 5690, y: 3440, r: 380, pts: 3, owner: 'F' },
  { id: 'girz', name: 'Girzikowitz', x: 5330, y: 5660, r: 380, pts: 1, owner: 'F' },
  { id: 'kob', name: 'Kobelnitz', x: 3720, y: 8550, r: 400, pts: 1, owner: 'F' },
  { id: 'sok', name: 'Sokolnitz', x: 3070, y: 11100, r: 450, pts: 2, owner: 'F' },
  { id: 'tel', name: 'Telnitz', x: 2560, y: 12650, r: 420, pts: 2, owner: 'F' },
  { id: 'pratze', name: 'Pratze', x: 5990, y: 8200, r: 420, pts: 3, owner: 'A', plateau: true },
  { id: 'pratzeberg', name: 'Pratzeberg', x: 6060, y: 9660, r: 450, pts: 3, owner: 'A', plateau: true },
  { id: 'vino', name: 'Staré Vinohrady', x: 7740, y: 6400, r: 450, pts: 3, owner: 'A', plateau: true },
  { id: 'blas', name: 'Blasowitz', x: 7960, y: 5440, r: 400, pts: 2, owner: 'A' },
  { id: 'aujezd', name: 'Aujezd', x: 5690, y: 12200, r: 420, pts: 2, owner: 'A' },
];

A.NATIONS = {
  F: { name: 'French', morale: 1.1, fire: 1.0, fill: '#2d4f97', dark: '#121f40', glyph: '#f3ead6', flag: ['#1f3c8a', '#f4efe2', '#c0262d'] },
  R: { name: 'Russian', morale: 1.05, fire: 0.95, fill: '#3f5c33', dark: '#18240f', glyph: '#efe7d0', flag: ['#f4efe2', '#2b4ea0'] },
  Au: { name: 'Austrian', morale: 0.9, fire: 0.9, fill: '#efe8d6', dark: '#3e3628', glyph: '#3e3628', flag: ['#f2c200', '#1a1a1a'] },
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
  RC: { side: 'F', name: 'Réserve de cavalerie', cmd: 'Maréchal Murat', short: 'MURAT', color: '#d9782d' },
  I: { side: 'F', name: 'Ier Corps', cmd: 'Maréchal Bernadotte', short: 'BERNADOTTE', color: '#3e7d4f' },
  IV: { side: 'F', name: 'IVe Corps', cmd: 'Maréchal Soult', short: 'SOULT', color: '#b8352b' },
  G: { side: 'F', name: 'Garde impériale', cmd: 'Maréchal Bessières', short: 'BESSIÈRES', color: '#e0c050' },
  GR: { side: 'F', name: 'Grenadiers réunis', cmd: 'Général Oudinot', short: 'OUDINOT', color: '#9c2a5a' },
  III: { side: 'F', name: 'IIIe Corps', cmd: 'Maréchal Davout', short: 'DAVOUT', color: '#6b4c9a' },
  AG: { side: 'A', name: "Advance Guard of the Left Wing", cmd: 'FML Kienmayer', short: 'KIENMAYER' },
  C1: { side: 'A', name: '1st Column', cmd: 'General Buxhöwden', short: 'BUXHÖWDEN' },
  C2: { side: 'A', name: '2nd Column', cmd: 'General Langeron', short: 'LANGERON' },
  C3: { side: 'A', name: '3rd Column', cmd: 'General Przybyszewski', short: 'PRZYBYSZEWSKI' },
  C4: { side: 'A', name: '4th Column', cmd: 'General Kutuzov', short: 'KUTUZOV' },
  C5: { side: 'A', name: '5th Column (cavalry)', cmd: 'Prince Johann of Liechtenstein', short: 'LIECHTENSTEIN' },
  AB: { side: 'A', name: "Bagration's Advance Guard", cmd: 'Prince Bagration', short: 'BAGRATION' },
  RG: { side: 'A', name: 'Russian Imperial Guard', cmd: 'Grand Duke Constantine', short: 'CONSTANTINE' },
};

// Order of battle at dawn, 2 December 1805. face: degrees, 0 = east.
A.OOB = [
  // ---- Grande Armée ----
  { side: 'F', nation: 'F', corps: 'Q', id: 'nap', name: "L'Empereur et son escorte", cmd: 'Napoléon', type: 'staff', men: 300, x: 4530, y: 5100, face: 0, q: 1.2 },
  { side: 'F', nation: 'F', corps: 'V', id: 'v17', name: '17e Léger', cmd: 'Claparède', type: 'light', men: 1500, x: 5600, y: 3430, face: 10, q: 1.15, form: 'line' },
  { side: 'F', nation: 'F', corps: 'V', id: 'vsan', name: 'Batterie du Santon', cmd: 'Lannes', type: 'art', men: 400, guns: 18, x: 5720, y: 3520, face: 10, q: 1.1 },
  { side: 'F', nation: 'F', corps: 'V', id: 'vsuc', name: 'Division Suchet', cmd: 'Suchet', type: 'line', men: 5300, guns: 8, x: 4900, y: 3450, face: 5, q: 1.1 },
  { side: 'F', nation: 'F', corps: 'V', id: 'vcaf', name: 'Division Caffarelli', cmd: 'Caffarelli', type: 'line', men: 7000, guns: 8, x: 5000, y: 4350, face: 5, q: 1.05 },
  { side: 'F', nation: 'F', corps: 'RC', id: 'rkel', name: 'Division de cavalerie légère', cmd: 'Kellermann', type: 'hussar', men: 1300, x: 5450, y: 4800, face: 0, q: 1.1 },
  { side: 'F', nation: 'F', corps: 'RC', id: 'rwal', name: 'Division de dragons', cmd: 'Walther', type: 'dragoon', men: 2200, x: 4550, y: 4550, face: 0, q: 1.05 },
  { side: 'F', nation: 'F', corps: 'RC', id: 'rnan', name: '1re Division de cuirassiers', cmd: 'Nansouty', type: 'cuirassier', men: 1700, x: 4150, y: 4250, face: 0, q: 1.15 },
  { side: 'F', nation: 'F', corps: 'RC', id: 'rhau', name: '2e Division de cuirassiers', cmd: "d'Hautpoul", type: 'cuirassier', men: 1300, x: 3850, y: 4650, face: 0, q: 1.15 },
  { side: 'F', nation: 'F', corps: 'I', id: 'iriv', name: 'Division Rivaud', cmd: 'Rivaud', type: 'line', men: 5000, guns: 8, x: 4950, y: 5250, face: 0, q: 1.0 },
  { side: 'F', nation: 'F', corps: 'I', id: 'idro', name: 'Division Drouet', cmd: 'Drouet', type: 'line', men: 6200, guns: 8, x: 4150, y: 5000, face: 0, q: 1.0 },
  { side: 'F', nation: 'F', corps: 'IV', id: 'ivan', name: 'Division Vandamme', cmd: 'Vandamme', type: 'line', men: 7600, guns: 10, x: 4700, y: 6250, face: 0, q: 1.15 },
  { side: 'F', nation: 'F', corps: 'IV', id: 'ishi', name: 'Division Saint-Hilaire', cmd: 'Saint-Hilaire', type: 'line', men: 7000, guns: 10, x: 4150, y: 7050, face: 0, q: 1.15 },
  { side: 'F', nation: 'F', corps: 'IV', id: 'iart', name: 'Réserve d’artillerie du IVe Corps', cmd: 'Soult', type: 'art', men: 500, guns: 16, x: 4050, y: 6450, face: 0, q: 1.05 },
  { side: 'F', nation: 'F', corps: 'IV', id: 'ileg', name: 'Division Legrand', cmd: 'Legrand', type: 'line', men: 4500, guns: 8, x: 2850, y: 9900, face: 20, q: 1.05 },
  { side: 'F', nation: 'F', corps: 'IV', id: 'itir', name: 'Tirailleurs du Pô et Corses', cmd: 'Legrand', type: 'light', men: 1200, x: 2980, y: 11150, face: 0, q: 1.1, form: 'line' },
  { side: 'F', nation: 'F', corps: 'IV', id: 'i3e', name: '3e de Ligne', cmd: 'Schobert', type: 'line', men: 1800, guns: 2, x: 2500, y: 12620, face: 0, q: 1.1, form: 'line' },
  { side: 'F', nation: 'F', corps: 'IV', id: 'imar', name: 'Brigade de cavalerie légère', cmd: 'Margaron', type: 'hussar', men: 1200, x: 2000, y: 11850, face: 0, q: 1.05 },
  { side: 'F', nation: 'F', corps: 'G', id: 'ginf', name: 'Garde impériale à pied', cmd: 'Bessières', type: 'guard', men: 4000, x: 3850, y: 5650, face: 0, q: 1.25 },
  { side: 'F', nation: 'F', corps: 'G', id: 'gcav', name: 'Cavalerie de la Garde', cmd: 'Rapp', type: 'guardcav', men: 1100, x: 3600, y: 5950, face: 0, q: 1.25 },
  { side: 'F', nation: 'F', corps: 'G', id: 'gart', name: 'Artillerie de la Garde', cmd: 'Bessières', type: 'art', men: 500, guns: 24, x: 4150, y: 5550, face: 0, q: 1.2 },
  { side: 'F', nation: 'F', corps: 'GR', id: 'oud', name: 'Grenadiers réunis', cmd: 'Oudinot', type: 'grenadier', men: 5700, guns: 6, x: 3350, y: 6450, face: 0, q: 1.2 },

  // ---- Armée austro-russe ----
  { side: 'A', nation: 'Au', corps: 'AG', id: 'agi', name: 'Advance Guard Infantry', cmd: 'Carneville', type: 'light', men: 2700, guns: 6, x: 5100, y: 12050, face: 180, q: 0.95 },
  { side: 'A', nation: 'Au', corps: 'AG', id: 'agc', name: 'Advance Guard Cavalry', cmd: 'Kienmayer', type: 'hussar', men: 3400, guns: 6, x: 5600, y: 11650, face: 180, q: 1.0 },
  { side: 'A', nation: 'R', corps: 'C1', id: 'c1a', name: '1st Column (van)', cmd: 'Dokhturov', type: 'line', men: 7000, guns: 12, x: 6350, y: 10850, face: 200, q: 1.0 },
  { side: 'A', nation: 'R', corps: 'C1', id: 'c1b', name: '1st Column (rear)', cmd: 'Dokhturov', type: 'line', men: 6600, guns: 12, x: 6800, y: 10350, face: 200, q: 1.0 },
  { side: 'A', nation: 'R', corps: 'C2', id: 'c2a', name: '2nd Column', cmd: 'Langeron', type: 'line', men: 7700, guns: 12, x: 6700, y: 9450, face: 200, q: 1.0 },
  { side: 'A', nation: 'R', corps: 'C2', id: 'c2k', name: 'Kamensky Brigade', cmd: 'Kamensky', type: 'line', men: 4000, guns: 6, x: 7100, y: 9000, face: 200, q: 1.05 },
  { side: 'A', nation: 'R', corps: 'C3', id: 'c3a', name: '3rd Column (van)', cmd: 'Przybyszewski', type: 'line', men: 4000, guns: 8, x: 6400, y: 8750, face: 200, q: 0.95 },
  { side: 'A', nation: 'R', corps: 'C3', id: 'c3b', name: '3rd Column (rear)', cmd: 'Przybyszewski', type: 'line', men: 3800, guns: 6, x: 6800, y: 8400, face: 200, q: 0.95 },
  { side: 'A', nation: 'R', corps: 'C4', id: 'c4m', name: "Miloradovich's Russians", cmd: 'Miloradovich', type: 'line', men: 7500, guns: 10, x: 8300, y: 7550, face: 200, q: 1.0 },
  { side: 'A', nation: 'Au', corps: 'C4', id: 'c4j', name: 'Jurczik Brigade', cmd: 'Kolowrat', type: 'line', men: 6000, guns: 8, x: 8800, y: 8000, face: 200, q: 0.8 },
  { side: 'A', nation: 'Au', corps: 'C4', id: 'c4r', name: 'Rottermund Brigade', cmd: 'Kolowrat', type: 'line', men: 6000, guns: 8, x: 9300, y: 8400, face: 200, q: 0.8 },
  { side: 'A', nation: 'Au', corps: 'C5', id: 'c5h', name: 'Austrian Cuirassiers', cmd: 'Hohenlohe', type: 'cuirassier', men: 1400, x: 7900, y: 7150, face: 270, q: 1.05 },
  { side: 'A', nation: 'R', corps: 'C5', id: 'c5u', name: 'Russian Cavalry', cmd: 'Uvarov', type: 'dragoon', men: 2600, guns: 6, x: 8350, y: 6950, face: 270, q: 1.0 },
  { side: 'A', nation: 'R', corps: 'C5', id: 'c5l', name: 'Grand Duke Constantine Uhlans', cmd: 'Liechtenstein', type: 'uhlan', men: 1300, x: 8700, y: 7200, face: 270, q: 1.0 },
  { side: 'A', nation: 'R', corps: 'AB', id: 'ab1', name: 'Advance Guard (1st line)', cmd: 'Bagration', type: 'line', men: 4800, guns: 8, x: 8800, y: 2850, face: 195, q: 1.1 },
  { side: 'A', nation: 'R', corps: 'AB', id: 'ab2', name: 'Advance Guard (2nd line)', cmd: 'Bagration', type: 'line', men: 4300, guns: 6, x: 9500, y: 3200, face: 195, q: 1.05 },
  { side: 'A', nation: 'R', corps: 'AB', id: 'abc', name: "Bagration's Cavalry", cmd: 'Bagration', type: 'hussar', men: 3000, guns: 6, x: 9300, y: 3800, face: 195, q: 1.05 },
  { side: 'A', nation: 'R', corps: 'AB', id: 'abk', name: 'Don Cossacks', cmd: 'Bagration', type: 'cossack', men: 900, x: 10100, y: 2200, face: 195, q: 0.9 },
  { side: 'A', nation: 'R', corps: 'RG', id: 'rg1', name: 'Preobrazhensky & Semyonovsky', cmd: 'Constantine', type: 'guard', men: 3300, guns: 6, x: 10200, y: 5800, face: 200, q: 1.2 },
  { side: 'A', nation: 'R', corps: 'RG', id: 'rg2', name: 'Izmailovsky & Guard Jägers', cmd: 'Constantine', type: 'guard', men: 2800, guns: 6, x: 10750, y: 6250, face: 200, q: 1.15 },
  { side: 'A', nation: 'R', corps: 'RG', id: 'rgc', name: 'Chevalier Guard & Horse Guards', cmd: 'Kologrivov', type: 'guardcav', men: 2600, x: 10650, y: 5450, face: 200, q: 1.2 },
  { side: 'A', nation: 'R', corps: 'RG', id: 'rga', name: 'Russian Guard Artillery', cmd: 'Constantine', type: 'art', men: 400, guns: 30, x: 10300, y: 5300, face: 200, q: 1.1 },
];

// Davout's III Corps, arriving from Raigern after a forced march from Vienna.
A.REINFORCEMENTS = [
  { t: 490, dest: [1500, 12250], u: { side: 'F', nation: 'F', corps: 'III', id: 'dbou', name: 'Division de dragons', cmd: 'Bourcier', type: 'dragoon', men: 2500, x: 80, y: 12350, face: 0, q: 1.0 } },
  { t: 505, dest: [1900, 12450], u: { side: 'F', nation: 'F', corps: 'III', id: 'dheu', name: 'Brigade Heudelet', cmd: 'Heudelet', type: 'light', men: 1300, x: 80, y: 12250, face: 0, q: 1.1 } },
  { t: 540, dest: [1900, 11050], u: { side: 'F', nation: 'F', corps: 'III', id: 'dfri', name: 'Division Friant', cmd: 'Friant', type: 'line', men: 2800, guns: 9, x: 80, y: 10950, face: 0, q: 1.15 } },
];

// The Weyrother plan: turn the French right at Telnitz and Sokolnitz,
// then wheel north to cut the Brünn road.
// mode: march (keep moving), attack (seek combat near the route), hold.
A.PLANS = {
  agi: [{ t: 420, mode: 'attack', x: 2650, y: 12650 }, { t: 600, mode: 'attack', x: 1900, y: 11900 }],
  agc: [{ t: 420, mode: 'march', x: 4300, y: 12850 }, { t: 470, mode: 'attack', x: 2300, y: 13050 }, { t: 620, mode: 'attack', x: 1800, y: 12300 }],
  c1a: [{ t: 425, mode: 'march', x: 4600, y: 12300 }, { t: 480, mode: 'attack', x: 2600, y: 12600 }, { t: 630, mode: 'attack', x: 1900, y: 11500 }],
  c1b: [{ t: 440, mode: 'march', x: 5000, y: 11900 }, { t: 495, mode: 'attack', x: 2900, y: 12200 }, { t: 640, mode: 'attack', x: 2300, y: 10900 }],
  c2a: [{ t: 470, mode: 'march', x: 4700, y: 11300 }, { t: 510, mode: 'attack', x: 3100, y: 11500 }, { t: 650, mode: 'attack', x: 2400, y: 10300 }],
  c2k: [{ t: 485, mode: 'march', x: 5100, y: 10900 }, { t: 525, mode: 'attack', x: 3300, y: 11100 }],
  c3a: [{ t: 480, mode: 'march', x: 4300, y: 10500 }, { t: 505, mode: 'attack', x: 2900, y: 11050 }, { t: 660, mode: 'attack', x: 2800, y: 9700 }],
  c3b: [{ t: 495, mode: 'march', x: 4500, y: 10200 }, { t: 520, mode: 'attack', x: 3150, y: 10450 }],
  c4m: [{ t: 525, mode: 'march', x: 6300, y: 8100 }, { t: 555, mode: 'attack', x: 4000, y: 8400 }],
  c4j: [{ t: 530, mode: 'march', x: 6700, y: 8600 }, { t: 565, mode: 'attack', x: 4100, y: 9000 }],
  c4r: [{ t: 540, mode: 'march', x: 7100, y: 8900 }, { t: 575, mode: 'attack', x: 4300, y: 9400 }],
  c5h: [{ t: 430, mode: 'march', x: 8300, y: 5100 }, { t: 630, mode: 'attack', x: 5800, y: 4700 }],
  c5u: [{ t: 440, mode: 'march', x: 8700, y: 4800 }, { t: 640, mode: 'attack', x: 6000, y: 4400 }],
  c5l: [{ t: 435, mode: 'march', x: 8000, y: 5000 }, { t: 600, mode: 'attack', x: 5500, y: 4800 }],
  ab1: [{ t: 600, mode: 'attack', x: 5750, y: 3450 }],
  ab2: [{ t: 610, mode: 'attack', x: 5900, y: 4250 }],
  abc: [{ t: 620, mode: 'attack', x: 6300, y: 4700 }],
  abk: [{ t: 615, mode: 'march', x: 7400, y: 1900 }, { t: 660, mode: 'attack', x: 5000, y: 2700 }],
  rg1: [{ t: 540, mode: 'march', x: 8700, y: 6000 }, { t: 600, mode: 'hold', x: 8000, y: 6150 }],
  rg2: [{ t: 550, mode: 'march', x: 9100, y: 6500 }, { t: 610, mode: 'hold', x: 8400, y: 6650 }],
  rgc: [{ t: 560, mode: 'march', x: 9300, y: 5800 }, { t: 780, mode: 'attack', x: 7000, y: 7000 }],
  rga: [{ t: 550, mode: 'march', x: 8900, y: 5800 }, { t: 610, mode: 'hold', x: 8300, y: 6000 }],
};

A.HISTORY = {
  fr: { losses: 8800, text: 'about 1,300 killed, 6,900 wounded and 570 captured' },
  al: { losses: 27000, text: 'about 16,000 killed and wounded, 11,000 prisoners and 180 guns' },
};
