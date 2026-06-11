// ── Pattern groups ──────────────────────────────────────────────────────────
const PUSH_P  = ['impins orizontal', 'impins vertical', 'izolare-triceps', 'izolare-piept'];
const PULL_P  = ['tractiune orizontala', 'tractiune verticala', 'izolare-biceps', 'izolare-umeri', 'izolare-antebrat'];
const LEGS_P  = ['squat', 'hinge', 'unilateral picior', 'flexie genunchi', 'izolare-fesieri', 'izolare-gambe'];
const CORE_P  = ['core', 'carry'];
const COND_P  = ['conditie'];
export const SKAND_P = ['skandenberg-cupping','skandenberg-pronation','skandenberg-rise','skandenberg-grip','skandenberg-static-biceps','skandenberg-static-triceps','skandenberg-side-pressure'];

const DAY_PATTERNS = {
  upper: [...PUSH_P, ...PULL_P, ...CORE_P],
  lower: [...LEGS_P, ...CORE_P],
  push:  [...PUSH_P, ...CORE_P],
  pull:  [...PULL_P, ...CORE_P],
  legs:  [...LEGS_P, ...CORE_P],
  full:  [...PUSH_P, ...PULL_P, ...LEGS_P, ...CORE_P, ...COND_P],
};

// ── Splits ──────────────────────────────────────────────────────────────────
const SPLITS = {
  full_body_ab: {
    label: 'Full body A/B',
    desc: 'Tot corpul de 2 ori, eficiență maximă pe frecvență',
    zile_target: [2],
    days: [{ label: 'Full body A', tip: 'full' }, { label: 'Full body B', tip: 'full' }],
  },
  upper_lower_2: {
    label: 'Upper / Lower',
    desc: 'O zi trunchi, o zi picioare; frecvență 1x pe grupă',
    zile_target: [2],
    days: [{ label: 'Upper', tip: 'upper' }, { label: 'Lower', tip: 'lower' }],
  },
  full_body_abc: {
    label: 'Full body A/B/C',
    desc: 'Fiecare grupă de 3 ori pe săptămână',
    zile_target: [3],
    days: [{ label: 'Full body A', tip: 'full' }, { label: 'Full body B', tip: 'full' }, { label: 'Full body C', tip: 'full' }],
  },
  upper_lower_full: {
    label: 'Upper / Lower / Full',
    desc: 'Echilibru între volum concentrat și frecvență',
    zile_target: [3],
    days: [{ label: 'Upper', tip: 'upper' }, { label: 'Lower', tip: 'lower' }, { label: 'Full body', tip: 'full' }],
  },
  push_pull_legs: {
    label: 'Push / Pull / Legs',
    desc: 'Zile tematice; fiecare grupă 1x, volum mare per sesiune',
    zile_target: [3],
    days: [{ label: 'Push', tip: 'push' }, { label: 'Pull', tip: 'pull' }, { label: 'Legs', tip: 'legs' }],
  },
  upper_lower_x2: {
    label: 'Upper / Lower × 2',
    desc: 'Fiecare grupă de 2 ori pe săptămână, sesiuni echilibrate',
    zile_target: [4],
    days: [{ label: 'Upper A', tip: 'upper' }, { label: 'Lower A', tip: 'lower' }, { label: 'Upper B', tip: 'upper' }, { label: 'Lower B', tip: 'lower' }],
  },
  ppl_upper: {
    label: 'Push / Pull / Legs / Upper',
    desc: 'PPL + o zi de trunchi în plus',
    zile_target: [4],
    days: [{ label: 'Push', tip: 'push' }, { label: 'Pull', tip: 'pull' }, { label: 'Legs', tip: 'legs' }, { label: 'Upper', tip: 'upper' }],
  },
  upper_lower_ppl: {
    label: 'Upper / Lower / Push / Pull / Legs',
    desc: 'Hibrid: 2× frecvență + zile tematice',
    zile_target: [5],
    days: [{ label: 'Upper', tip: 'upper' }, { label: 'Lower', tip: 'lower' }, { label: 'Push', tip: 'push' }, { label: 'Pull', tip: 'pull' }, { label: 'Legs', tip: 'legs' }],
  },
  ppl_upper_lower: {
    label: 'Push / Pull / Legs / Upper / Lower',
    desc: 'PPL clasic + repetarea trunchiului și picioarelor',
    zile_target: [5],
    days: [{ label: 'Push', tip: 'push' }, { label: 'Pull', tip: 'pull' }, { label: 'Legs', tip: 'legs' }, { label: 'Upper', tip: 'upper' }, { label: 'Lower', tip: 'lower' }],
  },
};

const REC_SPLIT = { 2: 'full_body_ab', 3: 'full_body_abc', 4: 'upper_lower_x2', 5: 'upper_lower_ppl' };

// ── Helpers ─────────────────────────────────────────────────────────────────
function numSlots(timp) {
  if (timp <= 30) return 4;
  if (timp <= 45) return 5;
  if (timp <= 60) return 7;
  return 9;
}

function maxLevel(exp) {
  if (exp === 0) return 1;
  if (exp === 1) return 2;
  return 3;
}

function canDo(ex, equipment) {
  return ex.echipament.every(e => equipment.has(e));
}

function isSafe(ex, badJoints) {
  if (!ex.risc_articular || ex.risc_articular.length === 0) return true;
  return !ex.risc_articular.some(r => badJoints.has(r));
}

// ── Prescription ─────────────────────────────────────────────────────────────
const PRESC = {
  //              compound          izolare          static        conditie
  forta:     { c: [4,3,5,150],  i: [3,6,10,90],  s: [3,30,60,90],  d: [3,10,15,45] },
  masa:      { c: [3,6,10,105], i: [3,8,15,60],  s: [3,30,60,75],  d: [3,12,15,45] },
  sanatate:  { c: [3,8,12,75],  i: [3,10,15,60], s: [3,20,45,60],  d: [3,10,15,30] },
  anduranta: { c: [3,12,15,45], i: [3,15,20,30], s: [3,20,45,45],  d: [3,15,20,30] },
};

function prescribe(ex, obiectiv) {
  const key = ex.tip === 'izolare' ? 'i' : ex.tip === 'static' ? 's' : ex.tip === 'conditie' ? 'd' : 'c';
  const [seturi, rep_min, rep_max, pauza_sec] = PRESC[obiectiv][key];
  return {
    id: ex.id, nume: ex.nume, pattern: ex.pattern, tip: ex.tip,
    grupe: ex.grupe_principale, descriere: ex.descriere,
    reguli_speciale: ex.reguli_speciale,
    seturi, rep_min, rep_max, pauza_sec,
    alternative: [],
  };
}

// ── Slot templates ────────────────────────────────────────────────────────────
// Fiecare zi are sloturi ordonate pe priorități: mișcările fundamentale primele
// (squat/hinge, împins, tracțiune), apoi sloturi prioritare/libere, core la final.
// '*' = orice pattern din ziua respectivă; 'prio' = exerciții pe grupele prioritare.
const SQ_H   = ['squat', 'hinge', 'unilateral picior'];
const PUSH_C = ['impins orizontal', 'impins vertical'];
const PULL_C = ['tractiune orizontala', 'tractiune verticala'];

const SLOT_TEMPLATES = {
  full: [
    SQ_H, PUSH_C, PULL_C,
    ['prio'],
    ['hinge', 'squat', 'flexie genunchi', 'unilateral picior'],
    [...PUSH_C, ...PULL_C],
    ['*'],
    ['core'], ['core', 'carry'],
  ],
  upper: [
    ['impins orizontal'], ['tractiune orizontala'],
    ['impins vertical'],  ['tractiune verticala'],
    ['prio'], ['*'], ['*'],
    ['core'], ['core', 'carry'],
  ],
  lower: [
    ['squat'], ['hinge'],
    ['unilateral picior'], ['flexie genunchi'],
    ['prio'], ['*'], ['*'],
    ['core'], ['core', 'carry'],
  ],
  push: [
    ['impins orizontal'], ['impins vertical'], ['impins orizontal', 'impins vertical'],
    ['prio'], ['*'], ['*'], ['*'],
    ['core'], ['core'],
  ],
  pull: [
    ['tractiune orizontala'], ['tractiune verticala'], ['tractiune orizontala', 'tractiune verticala'],
    ['prio'], ['*'], ['*'], ['*'],
    ['core'], ['core', 'carry'],
  ],
  legs: [
    ['squat'], ['hinge'], ['unilateral picior'], ['flexie genunchi'],
    ['prio'], ['*'], ['*'],
    ['core'], ['core'],
  ],
};

// ── Scoring ──────────────────────────────────────────────────────────────────
function scoreEx(ex, obiectiv, prioritati, usedGroups, slotsTotal) {
  let s = 10;
  // Fundamentalele (compound multi-articular) au mereu prioritate
  if (ex.tip === 'compound') s += 10;
  if (obiectiv === 'forta'    && ex.tip === 'compound')  s += 8;
  if (obiectiv === 'masa'     && ex.tip === 'izolare')   s += 4;
  if (obiectiv === 'anduranta'&& ex.tip === 'conditie')  s += 8;
  if (ex.grupe_principale.some(g => prioritati.has(g)))  s += 20;
  // Carry / condiție / static nu merită un slot când timpul e scurt
  if (slotsTotal <= 5 && (ex.pattern === 'carry' || ex.tip === 'conditie')) s -= 25;
  if (slotsTotal <= 5 && ex.tip === 'static') s -= 10;
  const overlap = ex.grupe_principale.filter(g => usedGroups.has(g)).length;
  s -= overlap * 8;
  s += (Math.random() * 4 - 2); // slight variety
  return s;
}

// ── Day selection ─────────────────────────────────────────────────────────────
function selectForDay(dayTip, allValid, profile, usedIds) {
  const patterns = DAY_PATTERNS[dayTip];
  const slots    = numSlots(profile.timp);
  const prior    = new Set(profile.grupe_prioritare);
  const obj      = profile.obiectiv;
  const template = SLOT_TEMPLATES[dayTip];

  let candidates = allValid.filter(ex =>
    patterns.includes(ex.pattern) && !usedIds.has(ex.id)
  );

  const selected   = [];
  const usedGroups = new Set();

  for (let si = 0; si < template.length && selected.length < slots && candidates.length > 0; si++) {
    const slotDef = template[si];

    let pool;
    if (slotDef.includes('*')) {
      pool = candidates;
    } else if (slotDef.includes('prio')) {
      pool = prior.size
        ? candidates.filter(ex => ex.grupe_principale.some(g => prior.has(g)))
        : candidates;
    } else {
      pool = candidates.filter(ex => slotDef.includes(ex.pattern));
    }
    if (!pool.length) pool = candidates; // fallback: nu pierdem slotul

    const scored = pool
      .map(ex => ({ ex, sc: scoreEx(ex, obj, prior, usedGroups, slots) }))
      .sort((a, b) => b.sc - a.sc);

    const winner = scored[0].ex;
    const item   = prescribe(winner, obj);
    // alternativele: întâi același pattern, apoi restul candidaților din slot
    const samePattern = scored.slice(1).filter(s => s.ex.pattern === winner.pattern);
    const others      = scored.slice(1).filter(s => s.ex.pattern !== winner.pattern);
    item.alternative = [...samePattern, ...others].slice(0, 4).map(s => s.ex.id);

    selected.push(item);
    usedIds.add(winner.id);
    winner.grupe_principale.forEach(g => usedGroups.add(g));
    candidates = candidates.filter(c => c.id !== winner.id);
  }

  // Rule: deadlift + back squat can't coexist same day
  if (selected.some(s => s.id === 'deadlift')) {
    const idx = selected.findIndex(s => s.id === 'back_squat');
    if (idx !== -1) selected.splice(idx, 1);
  }

  // Scapular exercise rule: if shoulder sensitive OR ≥6 push sets, add face_pull/band_pull_apart
  const pushSets = selected.filter(s => PUSH_P.includes(s.pattern)).reduce((n, s) => n + s.seturi, 0);
  const hasUmar  = profile.articulatii_sensibile.includes('umar');
  if ((hasUmar || pushSets >= 6) && ['upper','push','full'].includes(dayTip)) {
    const scap = allValid.find(ex =>
      ['face_pull_banda','band_pull_apart','reverse_fly_gantere'].includes(ex.id) &&
      !usedIds.has(ex.id)
    );
    if (scap) {
      const item = prescribe(scap, obj);
      selected.push(item);
      usedIds.add(scap.id);
    }
  }

  // Compound first
  const tipOrd = { compound: 0, izolare: 1, static: 2, conditie: 3 };
  selected.sort((a, b) => (tipOrd[a.tip] ?? 1) - (tipOrd[b.tip] ?? 1));

  return selected;
}

// ── Skandenberg block ────────────────────────────────────────────────────────
const SKAND_STYLE = {
  top_roll: { primar: ['skandenberg-cupping','skandenberg-pronation','skandenberg-rise'], sec: ['skandenberg-grip'] },
  hook:     { primar: ['skandenberg-cupping','skandenberg-static-biceps'],               sec: ['skandenberg-grip'] },
  presa:    { primar: ['skandenberg-static-triceps','skandenberg-side-pressure','skandenberg-cupping'], sec: ['skandenberg-grip'] },
  baza:     { primar: ['skandenberg-cupping','skandenberg-pronation','skandenberg-rise','skandenberg-grip'], sec: [] },
};

function addSkandenbergBlock(zile, profile, allExercises) {
  const stil   = profile.stil_skandenberg || 'baza';
  const def    = SKAND_STYLE[stil];
  const equip  = new Set([...profile.echipament, ...profile.manere]);
  const bad    = new Set(profile.articulatii_sensibile);

  const validS = allExercises.filter(ex =>
    SKAND_P.includes(ex.pattern) && canDo(ex, equip) && isSafe(ex, bad)
  );

  const targetDays = zile.filter(d => ['upper','pull','full'].includes(d.tip));
  if (targetDays.length === 0) return;

  const usedS = new Set();

  // Day 0: first 2 primary components; Day 1: rest of primary + secondary
  [[def.primar.slice(0,2)], [def.primar.slice(2).concat(def.sec)]].forEach((patternGroups, di) => {
    if (di >= targetDays.length) return;
    const day = targetDays[di];
    patternGroups[0].forEach(pattern => {
      const c = validS.filter(ex => ex.pattern === pattern && !usedS.has(ex.id));
      if (!c.length) return;
      const winner = c[0];
      const item   = prescribe(winner, profile.obiectiv);
      item.seturi = 3; item.rep_min = 8; item.rep_max = 12;
      item.reguli_speciale = item.reguli_speciale || 'tempo 3-1-3';
      day.exercitii.push(item);
      usedS.add(winner.id);
    });
  });
}

// ── Exercises loader ─────────────────────────────────────────────────────────
let _cache = null;
async function loadExercises() {
  if (_cache) return _cache;
  const url = new URL('../data/exercises.json', import.meta.url);
  const r   = await fetch(url);
  _cache    = (await r.json()).exercitii;
  return _cache;
}

export async function getExercisesByIds(ids) {
  const all = await loadExercises();
  return ids.map(id => all.find(ex => ex.id === id)).filter(Boolean);
}

// ── Public API ───────────────────────────────────────────────────────────────
export async function generateProgram(profile, splitId) {
  const all   = await loadExercises();
  const equip = new Set([...profile.echipament, ...profile.manere]);
  const bad   = new Set(profile.articulatii_sensibile);
  const lvl   = maxLevel(profile.experienta);

  const validMain = all.filter(ex =>
    canDo(ex, equip) && isSafe(ex, bad) && ex.nivel <= lvl && !SKAND_P.includes(ex.pattern)
  );

  const split  = SPLITS[splitId];
  const usedIds = new Set();

  const zile = split.days.map(day => ({
    label: day.label,
    tip:   day.tip,
    exercitii: selectForDay(day.tip, validMain, profile, usedIds),
  }));

  if (profile.skandenberg) addSkandenbergBlock(zile, profile, all);

  return { split_id: splitId, split_label: split.label, split_desc: split.desc, zile, generat_la: Date.now() };
}

export function getRecommendedSplit(zile) {
  return REC_SPLIT[zile] || 'full_body_ab';
}

export function getSplitsForZile(zile) {
  return Object.entries(SPLITS)
    .filter(([, s]) => s.zile_target.includes(zile))
    .map(([id, s]) => ({ id, label: s.label, desc: s.desc, recomandat: REC_SPLIT[zile] === id }));
}
