// AchievementsEngine — realizări (consecvență + forță) și rangul de forță per ridicare.
// Totul derivat la cerere din istoric + profil; niciun câmp nou în schema de date.

import { StatsEngine } from './StatsEngine.js';
import { LIFT_OF, LIFT_NAMES, evalLift } from '../utils/StrengthStandards.js';

const WEEK = 7 * 24 * 60 * 60 * 1000;

function weekStartOf(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // luni
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

  // Cel mai bun kg reușit la un exercițiu (din recorduri)
  _bestKg(records, exId) {
    const r = records.find(x => x.exId === exId);
    return r && r.greutate > 0 ? r.greutate : 0;
  }

  // ── Toate realizările ───────────────────────────────────────────────────────
  getAchievements(data) {
    const ant = data.antrenamente || [];
    const records = this.stats.getRecords(ant);
    const sessions = this.stats.getTotalSessions(ant);
    const bw = data.profile?.greutate;

    const list = [];
    const cons = (id, titlu, desc, target, current, icon = 'bolt') => list.push({
      id, categorie: 'consecventa', titlu, desc, icon,
      unlocked: current >= target,
      progress: current >= target ? null : { current: Math.min(current, target), target, unit: 'antren.' },
    });

    // ── Consecvență ──
    cons('first', 'Primul pas', 'Ai logat primul antrenament.', 1, sessions);
    cons('w10', 'Constant', '10 antrenamente logate.', 10, sessions);
    cons('w25', 'Dedicat', '25 de antrenamente logate.', 25, sessions);
    cons('w50', 'De neclintit', '50 de antrenamente logate.', 50, sessions);

    // Streak de săptămâni active (cel mai lung șir consecutiv)
    const weeks = [...new Set(ant.filter(a => a.zi_complet).map(a => weekStartOf(a.data)))].sort((a, b) => a - b);
    let best = 0, run = 0;
    for (let i = 0; i < weeks.length; i++) {
      run = (i > 0 && weeks[i] - weeks[i - 1] === WEEK) ? run + 1 : 1;
      if (run > best) best = run;
    }
    list.push({
      id: 'streak4', categorie: 'consecventa', titlu: 'Pe val', icon: 'up',
      desc: '4 săptămâni la rând cu cel puțin un antrenament.',
      unlocked: best >= 4,
      progress: best >= 4 ? null : { current: best, target: 4, unit: 'săpt.' },
    });

    // ── Forță / milestone-uri ──
    const benchKg = this._bestKg(records, 'bench_press_haltera') || this._bestKg(records, 'bench_press_gantere');
    const squatKg = this._bestKg(records, 'back_squat');
    const deadKg  = this._bestKg(records, 'deadlift');

    // Clubul 100 kg — milestone absolut (nu cere greutatea corporală)
    list.push({
      id: 'bench100', categorie: 'forta', titlu: 'Clubul 100 kg', icon: 'trophy',
      desc: 'Împinge 100 kg la piept.',
      fact: 'Estimativ, doar ~4-5% dintre toți bărbații pot face asta (mult mai mulți printre cei care se antrenează).',
      unlocked: benchKg >= 100,
      progress: benchKg >= 100 ? null : { current: benchKg, target: 100, unit: 'kg' },
    });

    // Milestone-uri raportate la greutatea corporală (cer greutatea în profil)
    const bwMilestone = (id, titlu, desc, exKg, factor) => list.push({
      id, categorie: 'forta', titlu, icon: 'trophy',
      desc, needsBodyweight: !bw,
      unlocked: !!bw && exKg >= bw * factor,
      progress: (bw && exKg < bw * factor) ? { current: exKg, target: Math.round(bw * factor), unit: 'kg' } : null,
    });
    bwMilestone('benchBW', 'Propria greutate', 'Împinge la piept cât cântărești.', benchKg, 1);
    bwMilestone('squat15', 'Picioare de oțel', 'Genuflexiuni cu 1,5× greutatea ta.', squatKg, 1.5);
    bwMilestone('dead2',  'Dublu cât tine', 'Îndreptări cu 2× greutatea ta.', deadKg, 2);

    // Nivel atins pe orice ridicare principală
    const ranks = this.getStrengthRanks(data).ranks.filter(r => r.levelIdx !== undefined);
    const maxLevel = ranks.length ? Math.max(...ranks.map(r => r.levelIdx)) : -1;
    // Progres pentru insignele de nivel (doar dacă există măcar o ridicare principală logată)
    const lvlProgress = (targetIdx) => (maxLevel >= targetIdx || maxLevel < 0)
      ? null
      : { current: maxLevel + 1, target: targetIdx + 1, unit: 'nivel' };
    list.push({
      id: 'lvlInter', categorie: 'forta', titlu: 'Nivel Intermediar', icon: 'flag',
      desc: 'Atinge nivelul Intermediar la o ridicare principală.',
      needsBodyweight: !bw,
      unlocked: maxLevel >= 2, progress: lvlProgress(2),
    });
    list.push({
      id: 'lvlAdv', categorie: 'forta', titlu: 'Nivel Avansat', icon: 'flag',
      desc: 'Atinge nivelul Avansat la o ridicare principală.',
      needsBodyweight: !bw,
      unlocked: maxLevel >= 3, progress: lvlProgress(3),
    });

    return list;
  }
}
