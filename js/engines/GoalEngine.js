// GoalEngine — progres și pronostic pentru obiective de forță (kg sau repetări la un exercițiu)
//
// Pronosticul = regresie liniară (least squares) pe punctele de progres logate, proiectată
// până la țintă. Onest prin construcție: fără destule date / ritm plat / ritm prea lent →
// NU inventăm o dată, întoarcem o stare care spune asta. Spec idee: docs/drum_spre_v1.md §3.

import { StatsEngine } from './StatsEngine.js';

const DAY = 24 * 60 * 60 * 1000;
const MIN_POINTS = 3;       // sub atât nu estimăm
const MAX_DAYS_ETA = 730;   // peste 2 ani = „prea lent pentru o estimare clară"

export class GoalEngine {
  constructor() { this.stats = new StatsEngine(); }

  /**
   * @param {object} goal  { ex_id, nume, tip_tinta: 'kg'|'rep', tinta, creat_la }
   * @param {Array}  antrenamente
   * @param {number} [now]  timestamp curent (injectabil pentru teste)
   * @returns {object} { status, current, target, pct, etaTs?, slopePerWeek?, needed? }
   *   status: 'done' | 'need_data' | 'stalled' | 'slow' | 'on_track'
   */
  evaluate(goal, antrenamente = [], now = Date.now()) {
    const series = this.stats.getExerciseSeries(antrenamente)[goal.ex_id] || [];
    const valOf  = p => goal.tip_tinta === 'rep' ? (p.repetari || 0) : (p.greutate || 0);
    const target = goal.tinta || 0;

    const current = series.length ? Math.max(...series.map(valOf)) : 0;
    const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

    if (target > 0 && current >= target) {
      return { status: 'done', current, target, pct: 100 };
    }
    if (series.length < MIN_POINTS) {
      return { status: 'need_data', current, target, pct, needed: MIN_POINTS - series.length };
    }

    // Regresie liniară value = a + slope·zi
    const t0 = series[0].data;
    const xs = series.map(p => (p.data - t0) / DAY);
    const ys = series.map(valOf);
    const n  = xs.length;
    const sx = xs.reduce((s, x) => s + x, 0);
    const sy = ys.reduce((s, y) => s + y, 0);
    const sxx = xs.reduce((s, x) => s + x * x, 0);
    const sxy = xs.reduce((s, x, i) => s + x * ys[i], 0);
    const denom = n * sxx - sx * sx;
    const slope = denom !== 0 ? (n * sxy - sx * sy) / denom : 0; // pe zi

    if (slope <= 0) {
      return { status: 'stalled', current, target, pct };
    }

    const daysLeft = (target - current) / slope;
    const slopePerWeek = Math.round(slope * 7 * 10) / 10;
    if (!isFinite(daysLeft) || daysLeft > MAX_DAYS_ETA) {
      return { status: 'slow', current, target, pct, slopePerWeek };
    }

    return { status: 'on_track', current, target, pct, slopePerWeek, etaTs: now + daysLeft * DAY };
  }
}
