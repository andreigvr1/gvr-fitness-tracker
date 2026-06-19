// StrengthStandards — praguri de forță orientative (multipli de greutate corporală), per sex.
//
// Surse confruntate (regula de research a proiectului): Legion Athletics (tabel Rippetoe,
// Începător→Elită) + Barbell Medicine (percentile din date competiționale). Valorile „Elită"
// sunt aliniate cu percentila 90 de la Barbell Medicine (ex. F bench 1,35× / squat 2,26× /
// deadlift 2,66×). Pragurile sunt APROXIMATIVE — folosite ca reper motivațional, nu verdict.
//
// Indici nivel: 0 Începător · 1 Amator · 2 Intermediar · 3 Avansat · 4 Elită
export const LEVELS = ['Începător', 'Amator', 'Intermediar', 'Avansat', 'Elită'];

// [Începător, Amator, Intermediar, Avansat, Elită] ca multipli din greutatea corporală
const STANDARDS = {
  bench:    { m: [0.5,  0.75, 1.0,  1.5,  2.0 ], f: [0.3,  0.5,  0.7,  1.0,  1.35] },
  squat:    { m: [0.75, 1.25, 1.5,  2.25, 2.75], f: [0.6,  0.9,  1.25, 1.75, 2.25] },
  deadlift: { m: [1.0,  1.5,  2.0,  2.5,  3.25], f: [0.75, 1.25, 1.5,  2.0,  2.65] },
  ohp:      { m: [0.35, 0.55, 0.8,  1.1,  1.4 ], f: [0.2,  0.35, 0.5,  0.75, 1.0 ] },
};

// Percentile-reper (printre cei care se antrenează) pentru fiecare prag de nivel
const PCT_ANCHORS = [5, 20, 50, 80, 95];

// Exercițiile (cu halteră) care contează ca „ridicare principală" pentru rang
export const LIFT_OF = {
  bench_press_haltera:   'bench',
  back_squat:            'squat',
  deadlift:              'deadlift',
  overhead_press_haltera:'ohp',
};

export const LIFT_NAMES = {
  bench_press_haltera:    'Împins la piept (bară)',
  back_squat:             'Genuflexiuni (bară)',
  deadlift:               'Îndreptări (deadlift)',
  overhead_press_haltera: 'Împins deasupra capului',
};

/**
 * @returns {object} { level, levelIdx, multiplier, percentile } — percentila = „mai puternic
 *   decât ~X% dintre cei care se antrenează, la greutatea ta". Orientativ.
 */
export function evalLift(lift, sex, kg, bw) {
  const s  = sex === 'feminin' ? 'f' : 'm';
  const th = STANDARDS[lift][s];
  const mult = kg / bw;

  let idx = 0;
  for (let i = 0; i < th.length; i++) if (mult >= th[i]) idx = i;

  let pct;
  if (mult <= th[0]) {
    pct = Math.max(1, Math.round(PCT_ANCHORS[0] * (mult / th[0])));
  } else if (mult >= th[th.length - 1]) {
    pct = Math.min(99, Math.round(PCT_ANCHORS[4] + (mult - th[4]) / th[4] * 4));
  } else {
    let i = 0;
    while (i < th.length - 1 && mult >= th[i + 1]) i++;
    const frac = (mult - th[i]) / (th[i + 1] - th[i]);
    pct = Math.round(PCT_ANCHORS[i] + frac * (PCT_ANCHORS[i + 1] - PCT_ANCHORS[i]));
  }

  return {
    level: LEVELS[idx],
    levelIdx: idx,
    multiplier: Math.round(mult * 100) / 100,
    percentile: Math.min(99, Math.max(1, pct)),
  };
}

// ── Recorduri mondiale drug-tested raw (per categorie greutate) ───────────────
// Sursa: worldpowerlifting.com (Open, drug-tested, raw) + IPF + BarBend 2025.
// Format per categorie: [limita_categorie_kg, record_kg]. Ultima = +∞.
const WR_CLASSES = {
  bench: {
    m: [[62,145],[69,169],[77,186],[85,208],[94,205],[105,234],[120,236],[Infinity,272]],
    f: [[48,90],[53,110],[58,120],[64,115],[72,125],[84,135],[100,140],[Infinity,145]],
  },
  squat: {
    m: [[62,247],[69,246],[77,275],[85,301],[94,322],[105,335],[120,351],[Infinity,460]],
    f: [[48,136],[53,157],[58,160],[64,170],[72,191],[84,203],[100,221],[Infinity,232]],
  },
  deadlift: {
    m: [[62,273],[69,305],[77,306],[85,322],[94,326],[105,400],[120,380],[Infinity,370]],
    f: [[48,168],[53,185],[58,193],[64,205],[72,228],[84,227],[100,230],[Infinity,252]],
  },
};

// Recordul absolut al omenirii (echipat, netestat) — pentru mesaj contextual explicit.
export const ABSOLUTE_WR = {
  deadlift: { m: 501, f: 280 },  // Björnsson 2020 (chingi+curea, fără costum); Becca Swanson aprox.
  bench:    { m: 508, f: 240 },  // Dean Billington (echipat cu cămașă); aprox. femei
  squat:    { m: 595, f: 400 },  // Johnny Kolb (combinezoane speciale); aprox. femei
};

/**
 * Returnează recordul drug-tested raw pentru categoria de greutate a userului.
 * @param {'bench'|'squat'|'deadlift'} lift
 * @param {string} sex  'masculin' | 'feminin'
 * @param {number} bw   greutatea corporală în kg
 * @returns {number|null}
 */
export function getWorldRecord(lift, sex, bw) {
  const s = sex === 'feminin' ? 'f' : 'm';
  const classes = WR_CLASSES[lift]?.[s];
  if (!classes) return null;
  const entry = classes.find(([limit]) => bw <= limit) ?? classes[classes.length - 1];
  return entry[1];
}

/**
 * Returnează eticheta categoriei de greutate a userului (ex. "85", "+120").
 * @param {'bench'|'squat'|'deadlift'} lift
 * @param {string} sex  'masculin' | 'feminin'
 * @param {number} bw   greutatea corporală în kg
 * @returns {string|null}
 */
export function getWeightClass(lift, sex, bw) {
  const s = sex === 'feminin' ? 'f' : 'm';
  const classes = WR_CLASSES[lift]?.[s];
  if (!classes) return null;
  const entry = classes.find(([limit]) => bw <= limit) ?? classes[classes.length - 1];
  if (entry[0] === Infinity) {
    const prev = classes[classes.length - 2]?.[0];
    return prev ? `+${prev}` : 'open';
  }
  return `${entry[0]}`;
}

// ── Standarde skandenberg (date StrengthLevel.com, 175k–745k înregistrări) ───
// Tabele [Înc, Amator, Intermediar, Avansat, Elită] la BW: 60,70,80,90,100 kg.
// Hammer curl = ganteră per mână (1RM). Wrist curl = bară (1RM, incl. bara 20kg).

const SKAND_TABLES = {
  hammer_curl: {
    m: { pts: [60,70,80,90,100], vals: [[6,11,17,26,36],[8,13,21,30,41],[10,16,24,34,45],[11,18,27,38,49],[13,21,30,41,53]] },
    f: { pts: [50,60,70,80,90],  vals: [[3,6,10,15,20],[4,8,12,18,24],[5,9,14,20,26],[6,10,15,21,28],[7,11,16,23,30]] },
  },
  wrist_curl: {
    m: { pts: [60,70,80,90,100], vals: [[1,13,37,74,122],[3,18,46,86,137],[6,23,54,97,151],[8,28,62,108,164],[11,33,69,118,176]] },
    f: { pts: [50,60,70,80,90],  vals: [[0,6,22,47,82],[0,8,29,61,104],[1,12,36,72,118],[3,17,43,82,131],[5,21,50,92,143]] },
  },
  reverse_curl: {
    m: { pts: [60,70,80,90,100], vals: [[1,12,38,81,136],[2,17,48,94,153],[4,23,57,107,169],[7,28,66,119,184],[10,34,74,130,198]] },
    f: { pts: [50,60,70,80,90],  vals: [[2,5,10,18,26],[3,6,12,21,30],[3,7,14,22,32],[4,8,15,24,34],[4,9,16,25,35]] },
  },
};

// Exerciții skandenberg → tip standard
export const SKAND_LIFT_OF = {
  hammer_curl_gantere:       'hammer_curl',
  wrist_curl_gantera:        'wrist_curl',
  reverse_curl_gantera:      'reverse_curl',
  reverse_curl_bara_z:       'reverse_curl',
  bicep_curl_bara_z:         'wrist_curl', // cel mai apropiat ca mișcare
};

export const SKAND_LIFT_NAMES = {
  hammer_curl_gantere:   'Hammer curl',
  wrist_curl_gantera:    'Wrist curl',
  reverse_curl_gantera:  'Reverse curl',
  reverse_curl_bara_z:   'Reverse curl (bară Z)',
  bicep_curl_bara_z:     'Bicep curl (bară Z)',
};

// Repere campioni pentru bicep curl bară (absolut, kg): Denis Cyplenkov strict curl 113 kg;
// Levan Saginashvili curl 180 kg (record mondial 2025); Levan single-arm 112 kg.
export const CHAMPION_CURLS = {
  cyplenkov: 113,
  levan_level: 160,
  georgian_hulk: 180,
};

/** Interpolează liniar valorile din tabelul SKAND_TABLES. */
function _interpolateSkand(table, sex, bw) {
  const s = sex === 'feminin' ? 'f' : 'm';
  const { pts, vals } = table[s];
  if (bw <= pts[0]) return vals[0];
  if (bw >= pts[pts.length - 1]) return vals[vals.length - 1];
  let i = 0;
  while (i < pts.length - 1 && bw > pts[i + 1]) i++;
  const frac = (bw - pts[i]) / (pts[i + 1] - pts[i]);
  return vals[i].map((v, j) => Math.round(v + frac * (vals[i + 1][j] - v)));
}

/**
 * Evaluează un exercițiu skandenberg față de standarde per greutate corporală.
 * @param {'hammer_curl'|'wrist_curl'|'reverse_curl'} type
 * @param {string} sex
 * @param {number} kg   greutatea ridicată
 * @param {number} bw   greutatea corporală
 * @returns {{ level, levelIdx, thresholds }} | null
 */
export function evalSkandbLift(type, sex, kg, bw) {
  const table = SKAND_TABLES[type];
  if (!table) return null;
  const th = _interpolateSkand(table, sex, bw);
  let idx = 0;
  for (let i = 0; i < th.length; i++) if (kg >= th[i]) idx = i;
  return { level: LEVELS[idx], levelIdx: idx, thresholds: th };
}
