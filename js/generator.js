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

// Split recommendation matrix: (zile, experienta, obiectiv) → split_id
// experienta: 0=incepator, 1=sub1an, 2=1-3ani, 3=peste3ani
function _recSplit(zile, experienta, obiectiv) {
  if (zile === 2) return 'full_body_ab';
  if (zile === 3) {
    if (experienta <= 1) return 'full_body_abc';             // beginner: frecvență mare
    if (obiectiv === 'forta') return 'full_body_abc';        // forță: frecvență obligatorie
    if (obiectiv === 'masa')  return 'push_pull_legs';       // masă intermediar: volum per grupă
    return 'upper_lower_full';                               // sănătate/anduranță
  }
  if (zile === 4) {
    if (experienta <= 1) return 'upper_lower_x2';
    if (experienta >= 3) return 'ppl_upper';
    return 'upper_lower_x2';
  }
  // 5 zile
  if (obiectiv === 'forta' && experienta >= 2) return 'ppl_upper_lower';
  return 'upper_lower_ppl';
}

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
  //              normal           static        conditie
  forta:     { n: [3,4,6,150],  s: [3,30,60,90],  d: [3,10,15,45] },
  masa:      { n: [3,8,12,90],  s: [3,30,60,75],  d: [3,12,15,45] },
  sanatate:  { n: [3,10,15,60], s: [3,20,45,60],  d: [3,10,15,30] },
  anduranta: { n: [3,15,20,30], s: [3,20,45,45],  d: [3,15,20,30] },
};

// Femeile au mai mulți mușchi tip I → pot face mai multe repetări la același %1RM.
const FEMALE_REP_BONUS = { n: 2, s: 0, d: 0 };

function prescribe(ex, obiectiv, gen) {
  const isTimed = (ex.reguli_speciale || '').includes('timp');
  const key = isTimed ? 's' : ex.pattern === 'conditie' ? 'd' : 'n';
  let [seturi, rep_min, rep_max, pauza_sec] = PRESC[obiectiv][key];
  if (gen === 'feminin') {
    const bonus = FEMALE_REP_BONUS[key];
    rep_min += bonus;
    rep_max += bonus;
    // Femeile se recuperează mai repede între serii → pauze ~20% mai scurte
    if (key === 'n') pauza_sec = Math.round(pauza_sec * 0.8);
  }
  return {
    id: ex.id, nume: ex.nume, pattern: ex.pattern,
    grupe: ex.grupe_principale, descriere: ex.descriere,
    reguli_speciale: ex.reguli_speciale,
    echipament: ex.echipament,
    rang: ex.rang || 2,
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

// Exerciții prioritare pentru femei (fesieri + prevenție genunchi)
const FEMALE_PRIORITY_IDS  = new Set(['hip_thrust_haltera','hip_thrust_gantera','glute_bridge','glute_bridge_unilateral','abductie_sold_banda','abductie_sold_corp']);
const FEMALE_ABDUCTION_IDS = new Set(['abductie_sold_banda','abductie_sold_corp']);

// ── Scoring ──────────────────────────────────────────────────────────────────
function scoreEx(ex, obiectiv, prioritati, usedGroups, slotsTotal, equipment, gen, exp = 3, priorUsed = null) {
  let s = 10;
  // Rang 1 = fundamental universal → prioritat; rang 3 = alternativă situațională → ultim resort
  const rang = ex.rang || 2;
  if (rang === 1) s += 15;
  if (rang === 3) s -= 12;

  if (obiectiv === 'anduranta' && ex.pattern === 'conditie') s += 8;
  if (ex.grupe_principale.some(g => prioritati.has(g)))  s += 20;
  if (slotsTotal <= 5 && (ex.pattern === 'carry' || ex.pattern === 'conditie')) s -= 25;
  if (slotsTotal <= 5 && (ex.reguli_speciale || '').includes('timp') && ex.pattern !== 'carry' && ex.pattern !== 'conditie') s -= 10;
  const overlap = ex.grupe_principale.filter(g => usedGroups.has(g)).length;
  s -= overlap * 8;

  // Preferă exercițiile cu echipament față de bodyweight-only când echipamentul e disponibil.
  const isBWOnly = ex.echipament.length === 1 && ex.echipament[0] === 'corp';
  const isPullUp  = ex.id === 'pullup' || ex.id === 'chinup';
  const isCore    = CORE_P.includes(ex.pattern);
  if (!isBWOnly && !isCore && !isPullUp && equipment && ex.echipament.some(e => e !== 'corp' && equipment.has(e))) {
    s += 7;
  }

  // Bonus pentru femei: hip thrust și abductie sold au prioritate crescută
  if (gen === 'feminin') {
    if (FEMALE_PRIORITY_IDS.has(ex.id))  s += 18;
    if (FEMALE_ABDUCTION_IDS.has(ex.id)) s += 10; // bonus dublu pentru abductie (preventie ACL)
  }

  // Începători: mișcările fundamentale înaintea variațiilor mai grele/tehnice.
  // Squat bilateral înainte de fandare/unilateral; flotări (orizontal) înainte de pike
  // (vertical, dominant umăr); core familiar (plank/abdomene) înainte de dead bug.
  if (exp <= 1) {
    if (ex.pattern === 'impins orizontal') s += 6;
    if (ex.pattern === 'squat')            s += 6;
    if (ex.id === 'genuflexiuni' || ex.id === 'flotari') s += 8;
    if (ex.id === 'plansa' || ex.id === 'abdomene')      s += 8;  // core familiar înaintea dead bug
    if (ex.id === 'dead_bug' || ex.id === 'hollow_body') s -= 4;  // bun, dar mai puțin intuitiv la început
  }

  // Penalizare soft pentru exercițiile deja folosite în zilele anterioare: la full-body
  // fundamentele bune tot revin în fiecare zi (învățare motorie), dar accesoriile se rotesc.
  if (priorUsed && priorUsed.has(ex.id)) s -= 5;

  s += (Math.random() * 4 - 2);
  return s;
}

// ── Day selection ─────────────────────────────────────────────────────────────
function selectForDay(dayTip, allValid, profile, priorUsed) {
  const patterns = DAY_PATTERNS[dayTip];
  const slots    = numSlots(profile.timp);
  const prior    = new Set(profile.grupe_prioritare);
  const obj      = profile.obiectiv;
  const gen      = profile.gen;
  const exp      = profile.experienta;
  const template = SLOT_TEMPLATES[dayTip];

  // Nu mai excludem global între zile (cauza zilelor goale); dublurile din aceeași zi sunt
  // evitate scoțând câștigătorul din `candidates`, iar repetarea între zile e penalizată soft.
  let candidates = allValid.filter(ex => patterns.includes(ex.pattern));

  const selected   = [];
  const usedGroups = new Set();
  const dayUsed    = new Set();
  const equipSet   = new Set(profile.echipament || []);

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
    // Fallback special pentru hinge fără echipament: slotul cere 'hinge' dar nu există
    // hinge real bodyweight-only — folosim izolare-fesieri (glute bridge) ca substitut funcțional.
    if (!pool.length && slotDef.includes('hinge')) {
      pool = candidates.filter(ex => ex.pattern === 'izolare-fesieri');
    }
    if (!pool.length) pool = candidates; // fallback generic: nu pierdem slotul

    const scored = pool
      .map(ex => ({ ex, sc: scoreEx(ex, obj, prior, usedGroups, slots, equipSet, gen, exp, priorUsed) }))
      .sort((a, b) => b.sc - a.sc);

    const winner = scored[0].ex;
    const item   = prescribe(winner, obj, gen);
    // alternativele: întâi același pattern, apoi restul candidaților din slot
    const samePattern = scored.slice(1).filter(s => s.ex.pattern === winner.pattern);
    const others      = scored.slice(1).filter(s => s.ex.pattern !== winner.pattern);
    item.alternative = [...samePattern, ...others].slice(0, 4).map(s => s.ex.id);

    selected.push(item);
    dayUsed.add(winner.id);
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
      !dayUsed.has(ex.id)
    );
    if (scap) {
      const item = prescribe(scap, obj, gen);
      selected.push(item);
      dayUsed.add(scap.id);
    }
  }

  // Ordinea în sesiune: grupe mari (picioare/piept/spate) → umeri/unilateral → izolate → core → condiție
  const patternOrd = p => {
    if (SKAND_P.includes(p))  return 5;
    if (p === 'conditie')      return 4;
    if (p === 'core' || p === 'carry') return 3;
    if ((p || '').includes('izolare')) return 2;
    if (p === 'impins vertical' || p === 'unilateral picior') return 1;
    return 0; // squat, hinge, impins orizontal, tractiune orizontala/verticala
  };
  selected.sort((a, b) => {
    const oa = patternOrd(a.pattern);
    const ob = patternOrd(b.pattern);
    if (oa !== ob) return oa - ob;
    return (a.rang || 2) - (b.rang || 2); // la egalitate de tip: rang 1 înainte de rang 2
  });

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
      const item   = prescribe(winner, profile.obiectiv, profile.gen);
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
  const priorUsed = new Set();

  const zile = split.days.map(day => {
    const exercitii = selectForDay(day.tip, validMain, profile, priorUsed);
    exercitii.forEach(e => priorUsed.add(e.id));
    return { label: day.label, tip: day.tip, exercitii };
  });

  if (profile.skandenberg) addSkandenbergBlock(zile, profile, all);

  return { split_id: splitId, split_label: split.label, split_desc: split.desc, zile, generat_la: Date.now() };
}

export function getRecommendedSplit(zile, experienta = 0, obiectiv = 'sanatate') {
  return _recSplit(zile, experienta, obiectiv);
}

export function getSplitsForZile(zile, experienta = 0, obiectiv = 'sanatate') {
  const rec = _recSplit(zile, experienta, obiectiv);
  return Object.entries(SPLITS)
    .filter(([, s]) => s.zile_target.includes(zile))
    .map(([id, s]) => ({ id, label: s.label, desc: s.desc, recomandat: rec === id }));
}
