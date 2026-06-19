// DeloadEngine — detectează oboseala sistemică din istoric și propune o săptămână de descărcare.
//
// Protocol (research multi-sursă, docs/research/2026-06-19-deload-metodologie.md):
//  - DECLANȘATOR (conservator): 1RM estimat scade ≥5% față de vârful recent, pe ≥2 exerciții COMPUSE.
//    ≥2 lifturi = corroborare cross-exercițiu (anti-zgomot); compusele = unde oboseala chiar contează.
//  - CUI: doar intermediari+ (experiență ≥2). Începătorii progresează liniar, nu au nevoie de deload.
//  - CE FACE: o săptămână cu −50% serii + greutate plafonată la ~70% (scop = recuperare, nu progres).
//  - CUM: ofertă, niciodată automat. Reversibil.

import { StatsEngine } from './StatsEngine.js';

// 1RM estimat — aceleași două formule ca EfficacyEngine (media lor = estimare onestă).
function epley(w, r)   { return w * (1 + r / 30); }
function brzycki(w, r) { return r < 37 ? w * 36 / (37 - r) : w * (1 + r / 30); }
function e1rm(p)       { return (epley(p.greutate, p.repetari) + brzycki(p.greutate, p.repetari)) / 2; }

// Tiparele compuse (multi-articulare) — singurele care acumulează oboseală sistemică.
const COMPOUND = new Set([
  'squat', 'hinge', 'impins orizontal', 'impins vertical',
  'tractiune orizontala', 'tractiune verticala', 'unilateral picior',
]);

const DROP_THRESHOLD = 0.05; // ≥5% scădere e1RM = semnal de oboseală
const MIN_LIFTS      = 2;    // pe ≥2 compuse deodată (conservator)
const WINDOW         = 6;    // câte sesiuni recente per exercițiu se uită la vârf
const MIN_SESSIONS   = 3;    // minim sesiuni per exercițiu ca să avem vârf + recent

export class DeloadEngine {
  constructor() { this.stats = new StatsEngine(); }

  // Reducerile aplicate în săptămâna de descărcare (folosite și de WorkoutSession/Renderer).
  static get WEIGHT_FACTOR() { return 0.70; }
  static deloadSets(n)       { return Math.max(1, Math.round(n / 2)); }

  /**
   * Detectează oboseala sistemică. Întoarce null dacă nu sunt condiții, altfel
   * { lifts: [{id, dropPct}], count }.
   * @param {Array}  antrenamente
   * @param {object} program   - pentru maparea ex_id → pattern (care e compus)
   * @param {object} profile   - pentru gate-ul de experiență
   */
  detectFatigue(antrenamente = [], program = null, profile = {}) {
    if ((profile.experienta ?? 0) < 2) return null; // doar intermediari+

    // Mapă ex_id → pattern din program (ca să știm care exerciții sunt compuse).
    const patternOf = {};
    (program?.zile || []).forEach(zi =>
      (zi.exercitii || []).forEach(ex => { patternOf[ex.id] = ex.pattern; }));

    const series = this.stats.getExerciseSeries(antrenamente); // {id: [{data,greutate,repetari}] vechi→nou}
    const drops = [];

    for (const [id, pts] of Object.entries(series)) {
      if (!COMPOUND.has(patternOf[id])) continue;          // doar compuse
      if (pts.length < MIN_SESSIONS) continue;             // nevoie de vârf + recent

      const recent = pts.slice(-WINDOW);
      const last   = recent[recent.length - 1];
      const prior  = recent.slice(0, -1);                  // tot ce e înainte de ultima sesiune
      const peak   = Math.max(...prior.map(e1rm));
      if (peak <= 0) continue;

      const dropPct = (peak - e1rm(last)) / peak;
      if (dropPct >= DROP_THRESHOLD) {
        drops.push({ id, dropPct: +(dropPct * 100).toFixed(1) });
      }
    }

    if (drops.length < MIN_LIFTS) return null;
    return { lifts: drops, count: drops.length };
  }
}
