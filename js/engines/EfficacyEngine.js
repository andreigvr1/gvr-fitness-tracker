// EfficacyEngine — analiză DESCRIPTIVĂ a eficienței (Modul C).
// Principii (decizie Andrei): doar tendințe + marjă de eroare, FĂRĂ verdict, FĂRĂ
// cauzalitate. Date insuficiente → null (UI afișează mesaj onest). Vezi docs/drum_spre_v1.md §1.C.

import { StatsEngine } from './StatsEngine.js';

// 1RM estimat — două formule uzuale; divergența lor = marja de eroare onestă.
function epley(w, r)   { return w * (1 + r / 30); }
function brzycki(w, r) { return r < 37 ? w * 36 / (37 - r) : w * (1 + r / 30); }

export class EfficacyEngine {
  constructor() { this.stats = new StatsEngine(); }

  // ── Consecvență (încredere mare) ────────────────────────────────────────────
  consistency(antrenamente = [], profile = {}, program = null) {
    const total = this.stats.getTotalSessions(antrenamente);
    if (!total) return null;
    const weekly = this.stats.getWeeklyCounts(antrenamente, 8);
    const activeWeeks = weekly.filter(w => w.count > 0);
    const avgPerActive = activeWeeks.length
      ? +(activeWeeks.reduce((s, w) => s + w.count, 0) / activeWeeks.length).toFixed(1)
      : 0;
    // Streak de săptămâni consecutive cu ≥1 antrenament. Săptămâna curentă (în curs)
    // are voie să fie încă 0 fără să rupă streak-ul.
    let streak = 0;
    let i = weekly.length - 1;
    if (weekly[i]?.count === 0) i--;
    for (; i >= 0; i--) { if (weekly[i].count > 0) streak++; else break; }
    // Rata de skip
    let exTotal = 0, exSkip = 0;
    antrenamente.forEach(a => (a.exercitii || []).forEach(e => { exTotal++; if (e.skip) exSkip++; }));
    const skipRate = exTotal ? Math.round((exSkip / exTotal) * 100) : 0;
    return {
      weekly, total,
      avgPerActive,
      target: profile.zile || null,
      weeksActive: activeWeeks.length,
      streak,
      skipRate,
    };
  }

  // ── Forță (încredere medie, cu marjă) ───────────────────────────────────────
  // Pentru ridicările cu greutate logate în ≥2 sesiuni: 1RM estimat acum (±marjă) + tendința.
  strength(antrenamente = [], exName = (id) => id, maxLifts = 3) {
    const series = this.stats.getExerciseSeries(antrenamente);
    const lifts = Object.entries(series)
      .map(([id, pts]) => ({ id, pts: pts.filter(p => p.greutate > 0) }))
      .filter(l => l.pts.length >= 2)
      .sort((a, b) => b.pts.length - a.pts.length)
      .slice(0, maxLifts);
    if (!lifts.length) return null;
    return lifts.map(({ id, pts }) => {
      const est = p => (epley(p.greutate, p.repetari) + brzycki(p.greutate, p.repetari)) / 2;
      const margin = p => Math.abs(epley(p.greutate, p.repetari) - brzycki(p.greutate, p.repetari)) / 2;
      const first = pts[0], last = pts[pts.length - 1];
      const e1 = est(last);
      const delta = e1 - est(first);
      return {
        id, name: exName(id),
        est1rm: Math.round(e1),
        margin: Math.max(1, Math.round(margin(last))),
        delta: Math.round(delta),
        sessions: pts.length,
      };
    });
  }

  // ── Corp (descriptiv, marjă mare) ───────────────────────────────────────────
  body(masuratori = []) {
    const METRICS = [
      { key: 'greutate', label: 'Greutate', unit: 'kg', margin: '±1–2 kg variație zilnică — contează tendința, nu o cântărire' },
      { key: 'talie',    label: 'Talie',    unit: 'cm', margin: '±0,5–1 cm la măsurare' },
      { key: 'brat',     label: 'Braț',     unit: 'cm', margin: '±0,5–1 cm la măsurare' },
      { key: 'piept',    label: 'Piept',    unit: 'cm', margin: '±0,5–1 cm la măsurare' },
      { key: 'antebrat', label: 'Antebraț', unit: 'cm', margin: '±0,5–1 cm la măsurare' },
    ];
    const list = [...masuratori].sort((a, b) => a.data - b.data);
    const out = METRICS.map(m => {
      const pts = list.filter(e => e[m.key] != null);
      if (pts.length < 2) return null;
      const first = pts[0][m.key], last = pts[pts.length - 1][m.key];
      return { label: m.label, unit: m.unit, first, last, delta: +(last - first).toFixed(1), margin: m.margin };
    }).filter(Boolean);
    return out.length ? out : null;
  }

  // ── Aliniere program ↔ obiectiv (descriptiv) ────────────────────────────────
  // grupeMap: ex_id → [grupe]. Numără seriile reușite pe fiecare grupă musculară.
  alignment(antrenamente = [], grupeMap = {}, profile = {}) {
    const counts = {};
    antrenamente.forEach(a => (a.exercitii || []).forEach(e => {
      if (e.skip) return;
      const done = (e.serii || []).filter(s => s.reusit === true).length;
      if (!done) return;
      (grupeMap[e.ex_id] || []).forEach(g => { counts[g] = (counts[g] || 0) + done; });
    }));
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (!entries.length) return null;
    const totalSets = entries.reduce((s, [, n]) => s + n, 0);
    return {
      top: entries.slice(0, 5).map(([grupa, n]) => ({ grupa, sets: n, pct: Math.round((n / totalSets) * 100) })),
      obiectiv: profile.obiectiv || null,
      prioritare: (profile.grupe_prioritare || []),
    };
  }
}
