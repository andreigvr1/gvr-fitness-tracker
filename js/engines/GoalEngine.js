// GoalEngine — progres și pronostic pentru obiective de forță (kg sau repetări la un exercițiu)
//
// Pronosticul = regresie liniară (least squares) pe punctele de progres logate, proiectată
// până la țintă. Onest prin construcție: fără destule date / ritm plat / ritm prea lent →
// NU inventăm o dată, întoarcem o stare care spune asta.
// v2: realism față de standarde (ACHIEVABLE→WORLD_CLASS) + ETA decelerat aproape de Elită.

import { StatsEngine } from './StatsEngine.js';
import { LIFT_OF, evalLift, getWorldRecord, getWeightClass, ABSOLUTE_WR } from '../utils/StrengthStandards.js';

const DAY = 24 * 60 * 60 * 1000;
const MIN_POINTS = 3;
const MAX_DAYS_ETA = 730;

// Factori de decelerare ETA aproape de plafonul biologic (progresul se înjumătățește anual)
function _decelerationFactor(percentile) {
  if (percentile >= 90) return 0.25;
  if (percentile >= 80) return 0.5;
  if (percentile >= 65) return 0.75;
  return 1.0;
}

export class GoalEngine {
  constructor() { this.stats = new StatsEngine(); }

  /**
   * @param {object} goal     { ex_id, nume, tip_tinta: 'kg'|'rep', tinta, creat_la }
   * @param {Array}  antrenamente
   * @param {number} [now]    timestamp curent
   * @param {object} [profile] { greutate, gen } — pentru context forță
   * @returns {object} { status, current, target, pct, realism?, strengthCtx?, etaTs?, slopePerWeek?, needed? }
   *   status:  'done' | 'need_data' | 'stalled' | 'slow' | 'on_track'
   *   realism: 'achievable' | 'challenging' | 'exceptional' | 'world_class' | 'impossible'
   */
  evaluate(goal, antrenamente = [], now = Date.now(), profile = null) {
    const series = this.stats.getExerciseSeries(antrenamente)[goal.ex_id] || [];
    const valOf  = p => goal.tip_tinta === 'rep' ? (p.repetari || 0) : (p.greutate || 0);
    const target = goal.tinta || 0;

    const current = series.length ? Math.max(...series.map(valOf)) : 0;
    const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

    // Context forță (doar pentru obiective de kg la ridicări principale)
    let realism = null;
    let strengthCtx = null;
    const liftKey = LIFT_OF[goal.ex_id];
    if (liftKey && goal.tip_tinta === 'kg' && profile?.greutate && profile?.gen) {
      const bw  = profile.greutate;
      const sex = profile.gen;
      const curEval = current > 0 ? evalLift(liftKey, sex, current, bw) : null;
      const tgtEval = target  > 0 ? evalLift(liftKey, sex, target,  bw) : null;
      const wr      = getWorldRecord(liftKey, sex, bw);
      const wrClass = getWeightClass(liftKey, sex, bw);
      const absWr   = ABSOLUTE_WR[liftKey]?.[sex === 'feminin' ? 'f' : 'm'] ?? null;

      if (tgtEval) {
        const tgtIdx = tgtEval.levelIdx;
        if ((absWr && target >= absWr) || (wr && target >= wr * 1.25)) {
          // depășește recordul absolut SAU cu >25% peste recordul natural al clasei
          realism = 'impossible';
        } else if (wr && target >= wr * 0.85) {
          realism = 'world_class';
        } else if (tgtIdx >= 4) {
          realism = 'exceptional';
        } else if (tgtIdx >= 3) {
          realism = 'challenging';
        } else {
          realism = 'achievable';
        }
      }

      strengthCtx = { curEval, tgtEval, wr, wrClass, absWr, bw, liftKey };
    }

    if (target > 0 && current >= target) {
      return { status: 'done', current, target, pct: 100, realism, strengthCtx };
    }
    if (series.length < MIN_POINTS) {
      return { status: 'need_data', current, target, pct, needed: MIN_POINTS - series.length, realism, strengthCtx };
    }

    // Regresie liniară value = a + slope·zi
    const t0  = series[0].data;
    const xs  = series.map(p => (p.data - t0) / DAY);
    const ys  = series.map(valOf);
    const n   = xs.length;
    const sx  = xs.reduce((s, x) => s + x, 0);
    const sy  = ys.reduce((s, y) => s + y, 0);
    const sxx = xs.reduce((s, x) => s + x * x, 0);
    const sxy = xs.reduce((s, x, i) => s + x * ys[i], 0);
    const denom = n * sxx - sx * sx;
    const slope = denom !== 0 ? (n * sxy - sx * sy) / denom : 0;

    if (slope <= 0) {
      return { status: 'stalled', current, target, pct, realism, strengthCtx };
    }

    const rawDaysLeft = (target - current) / slope;
    const slopePerWeek = Math.round(slope * 7 * 10) / 10;

    // Decelerare ETA aproape de plafon (progresul încetinește la >65 percentilă)
    const decFactor = strengthCtx?.curEval?.percentile
      ? _decelerationFactor(strengthCtx.curEval.percentile)
      : 1.0;
    const daysLeft = rawDaysLeft / decFactor;

    if (!isFinite(daysLeft) || daysLeft > MAX_DAYS_ETA) {
      return { status: 'slow', current, target, pct, slopePerWeek, realism, strengthCtx };
    }

    return { status: 'on_track', current, target, pct, slopePerWeek, etaTs: now + daysLeft * DAY, realism, strengthCtx };
  }
}
