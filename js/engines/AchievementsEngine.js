// AchievementsEngine — realizări: consecvență, forță per lift, skandenberg.
// Totul derivat la cerere din istoric + profil; niciun câmp nou în schema de date.

import { StatsEngine } from './StatsEngine.js';
import { LIFT_OF, LIFT_NAMES, LEVELS, evalLift, evalSkandbLift, SKAND_LIFT_OF, SKAND_LIFT_NAMES, CHAMPION_CURLS } from '../utils/StrengthStandards.js';

const WEEK = 7 * 24 * 60 * 60 * 1000;

function weekStartOf(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

export class AchievementsEngine {
  constructor() { this.stats = new StatsEngine(); }

  // ── Rangul de forță per ridicare principală logată ──────────────────────────
  getStrengthRanks(data) {
    const sex = data.profile?.gen;
    const bw  = data.profile?.greutate;
    const recMap = {};
    this.stats.getRecords(data.antrenamente || []).forEach(r => { recMap[r.exId] = r; });

    const ranks = [];
    for (const [exId, lift] of Object.entries(LIFT_OF)) {
      const rec = recMap[exId];
      if (!rec || !(rec.greutate > 0)) continue;
      const r = { exId, lift, nume: LIFT_NAMES[exId], bestKg: rec.greutate };
      if (bw && sex) Object.assign(r, evalLift(lift, sex, rec.greutate, bw));
      ranks.push(r);
    }
    return { ranks, hasBodyweight: !!bw, hasSex: !!sex };
  }

  _bestKg(records, ...exIds) {
    for (const exId of exIds) {
      const r = records.find(x => x.exId === exId);
      if (r && r.greutate > 0) return r.greutate;
    }
    return 0;
  }

  // ── Toate realizările ───────────────────────────────────────────────────────
  getAchievements(data) {
    const ant     = data.antrenamente || [];
    const records = this.stats.getRecords(ant);
    const sessions = this.stats.getTotalSessions(ant);
    const bw  = data.profile?.greutate;
    const sex = data.profile?.gen;

    const list = [];

    // Helper: realizare simplă cu progres
    const add = (id, cat, titlu, desc, unlocked, progress = null, extra = {}) =>
      list.push({ id, categorie: cat, titlu, desc, unlocked, progress, ...extra });

    // ══ CONSECVENȚĂ ══════════════════════════════════════════════════════════
    const cons = (id, titlu, desc, target, icon = 'bolt') => add(
      id, 'consecventa', titlu, desc,
      sessions >= target,
      sessions >= target ? null : { current: Math.min(sessions, target), target, unit: 'antren.' },
      { icon },
    );
    cons('first', 'Primul pas',   'Ai logat primul antrenament.',    1);
    cons('w10',   'Constant',     '10 antrenamente logate.',        10);
    cons('w25',   'Dedicat',      '25 de antrenamente logate.',     25);
    cons('w50',   'De neclintit', '50 de antrenamente logate.',     50);

    // Streak săptămâni
    const weeks = [...new Set(ant.filter(a => a.zi_complet).map(a => weekStartOf(a.data)))].sort((a, b) => a - b);
    let best = 0, run = 0;
    for (let i = 0; i < weeks.length; i++) {
      run = (i > 0 && weeks[i] - weeks[i - 1] === WEEK) ? run + 1 : 1;
      if (run > best) best = run;
    }
    add('streak4', 'consecventa', 'Pe val', '4 săptămâni la rând cu cel puțin un antrenament.',
      best >= 4,
      best >= 4 ? null : { current: best, target: 4, unit: 'săpt.' },
      { icon: 'up' });

    // ══ FORȚĂ — per lift × per nivel ════════════════════════════════════════
    // Insigne individuale per ridicare principală (4 lifturi × 4 niveluri = 16)
    const liftEmoji = { bench: '🏋️', squat: '🦵', deadlift: '⛓️', ohp: '🔼' };
    const liftLabel = { bench: 'Bench', squat: 'Squat', deadlift: 'Deadlift', ohp: 'OHP' };

    for (const [exId, liftKey] of Object.entries(LIFT_OF)) {
      const bestKg = this._bestKg(records, exId);
      // la bench acceptăm și gantere ca backup
      const kg = liftKey === 'bench'
        ? Math.max(bestKg, this._bestKg(records, 'bench_press_gantere'))
        : bestKg;

      // Nivelurile 1–4 (Amator→Elită); Începător nu e o realizare
      for (let lvlIdx = 1; lvlIdx <= 4; lvlIdx++) {
        const lvlName = LEVELS[lvlIdx];
        const unlocked = bw && sex && kg > 0 && evalLift(liftKey, sex, kg, bw).levelIdx >= lvlIdx;
        const id = `${liftKey}_${lvlName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ț/g,'t').replace(/ș/g,'s').replace(/ă/g,'a').replace(/î/g,'i').replace(/â/g,'a')}`;
        const needed = bw && sex
          ? (() => {
              // Pragul minim pentru nivelul dorit (multiplu BW)
              const th = { bench: { m:[0.5,0.75,1.0,1.5,2.0], f:[0.3,0.5,0.7,1.0,1.35] },
                           squat: { m:[0.75,1.25,1.5,2.25,2.75], f:[0.6,0.9,1.25,1.75,2.25] },
                           deadlift:{ m:[1.0,1.5,2.0,2.5,3.25], f:[0.75,1.25,1.5,2.0,2.65] },
                           ohp:{ m:[0.35,0.55,0.8,1.1,1.4], f:[0.2,0.35,0.5,0.75,1.0] } };
              const s = sex === 'feminin' ? 'f' : 'm';
              return Math.round(th[liftKey][s][lvlIdx] * bw);
            })()
          : null;

        add(id, 'forta',
          `${liftEmoji[liftKey]} ${liftLabel[liftKey]} ${lvlName}`,
          bw && sex && needed
            ? `${LIFT_NAMES[exId] || liftLabel[liftKey]}: ${needed} kg la greutatea ta.`
            : `Atinge nivelul ${lvlName} la ${liftLabel[liftKey]}.`,
          !!unlocked,
          (!unlocked && kg > 0 && needed) ? { current: kg, target: needed, unit: 'kg' } : null,
          { icon: 'trophy', needsBodyweight: !bw || !sex },
        );
      }
    }

    // Milestone-uri BW (absolute + relative)
    const benchKg = Math.max(
      this._bestKg(records, 'bench_press_haltera'),
      this._bestKg(records, 'bench_press_gantere'),
    );
    const squatKg = this._bestKg(records, 'back_squat');
    const deadKg  = this._bestKg(records, 'deadlift');

    add('bench100', 'forta', 'Clubul 100 kg', 'Împinge 100 kg la piept.',
      benchKg >= 100,
      benchKg >= 100 ? null : { current: benchKg, target: 100, unit: 'kg' },
      { icon: 'trophy', fact: 'Estimativ, doar ~4-5% dintre toți bărbații pot face asta.' });

    const bwM = (id, titlu, desc, kg, factor) => add(id, 'forta', titlu, desc,
      !!bw && kg >= bw * factor,
      (bw && kg < bw * factor) ? { current: kg, target: Math.round(bw * factor), unit: 'kg' } : null,
      { icon: 'trophy', needsBodyweight: !bw });

    bwM('benchBW',  'Propria greutate',  'Împinge la piept cât cântărești.',        benchKg, 1);
    bwM('squat15',  'Picioare de oțel',  'Genuflexiuni cu 1,5× greutatea ta.',      squatKg, 1.5);
    bwM('dead2',    'Dublu cât tine',    'Îndreptări cu 2× greutatea ta.',           deadKg,  2);

    // ══ SKANDENBERG ══════════════════════════════════════════════════════════

    // Detectează dacă există antrenamente cu exerciții skand
    const skandIds = new Set(Object.keys(SKAND_LIFT_OF));
    const hasSkandSession = ant.some(a =>
      (a.exercitii || []).some(e => skandIds.has(e.ex_id) && !e.skip &&
        (e.serii || []).some(s => s.reusit)));

    add('skand_novice', 'skandenberg', '🤝 Primul pull', 'Ai logat primul antrenament de skandenberg.',
      hasSkandSession, null, { icon: 'bolt' });

    // Hammer curl per mână (BW-relative) — 4 niveluri
    const hammerKg = this._bestKg(records, 'hammer_curl_gantere');
    for (let lvlIdx = 1; lvlIdx <= 4; lvlIdx++) {
      const lvlName = LEVELS[lvlIdx];
      const evalR = bw && sex && hammerKg > 0 ? evalSkandbLift('hammer_curl', sex, hammerKg, bw) : null;
      const unlocked = evalR && evalR.levelIdx >= lvlIdx;
      const threshold = bw && sex ? evalSkandbLift('hammer_curl', sex, 1, bw)?.thresholds?.[lvlIdx] : null;
      add(`skand_hammer_${lvlIdx}`, 'skandenberg',
        `💪 Hammer Curl ${lvlName}`,
        threshold && bw ? `Hammer curl ${threshold} kg per mână (la ${bw} kg corp).` : `Atinge nivelul ${lvlName} la hammer curl.`,
        !!unlocked,
        (!unlocked && hammerKg > 0 && threshold) ? { current: hammerKg, target: threshold, unit: 'kg/mână' } : null,
        { icon: 'trophy', needsBodyweight: !bw || !sex });
    }

    // Wrist curl ganteră — milestone-uri absolute (per mână)
    const wristKg = this._bestKg(records, 'wrist_curl_gantera');
    [[10,'🌱','Wrist Curl Debut','Wrist curl 10 kg per mână — fundament.'],
     [20,'⚡','Wrist Curl Solid', 'Wrist curl 20 kg per mână.'],
     [30,'🔥','Wrist Curl Avansat','Wrist curl 30 kg per mână — nivel competițional.'],
    ].forEach(([target, emoji, titlu, desc]) =>
      add(`skand_wrist_${target}`, 'skandenberg', `${emoji} ${titlu}`, desc,
        wristKg >= target,
        wristKg >= target ? null : { current: wristKg, target, unit: 'kg/mână' },
        { icon: 'bolt' }));

    // Bicep curl bară (Z sau dreaptă) — repere campioni
    const curlBara = Math.max(
      this._bestKg(records, 'bicep_curl_bara_z'),
      this._bestKg(records, 'bicep_curl_haltera'),
    );
    [
      [60,  '🏋️', 'Curl Competițional', 'Curl bară 60 kg — nivel serios de arm wrestler.'],
      [CHAMPION_CURLS.cyplenkov, '🦾', 'Nivelul Cyplenkov',
        `Curl bară ${CHAMPION_CURLS.cyplenkov} kg — recordul strict curl al lui Denis Cyplenkov (campion mondial).`],
      [CHAMPION_CURLS.levan_level, '👑', 'Nivelul Levan',
        `Curl bară ${CHAMPION_CURLS.levan_level} kg — aproape de recordul lui Levan Saginashvili.`],
      [CHAMPION_CURLS.georgian_hulk, '🌍', 'Georgian Hulk',
        `Curl bară ${CHAMPION_CURLS.georgian_hulk} kg — recordul mondial absolut al lui Levan Saginashvili (2025).`],
    ].forEach(([target, emoji, titlu, desc]) =>
      add(`skand_curl_${target}`, 'skandenberg', `${emoji} ${titlu}`, desc,
        curlBara >= target,
        curlBara >= target ? null : { current: curlBara, target, unit: 'kg' },
        { icon: 'trophy' }));

    // Nivel competițional compus
    const isAmateurSkand = hammerKg >= 20 && wristKg >= 15;
    add('skand_amateur', 'skandenberg', '🥊 Luptător Amator',
      'Hammer curl ≥ 20 kg/mână și wrist curl ≥ 15 kg — profil de competitor regional.',
      isAmateurSkand, null, { icon: 'flag' });

    const isProSkand = hammerKg >= 35 && wristKg >= 25 && curlBara >= 80;
    add('skand_pro', 'skandenberg', '🏆 Luptător Pro',
      'Hammer ≥ 35 kg, wrist ≥ 25 kg, curl bară ≥ 80 kg — profil competițional național.',
      isProSkand, null, { icon: 'trophy' });

    return list;
  }
}
