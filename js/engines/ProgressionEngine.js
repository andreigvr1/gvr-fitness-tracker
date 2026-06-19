// ProgressionEngine — recomandări de greutate / progresie bazate pe istoric + feedback
//
// Surse de decizie (în ordine de prioritate):
//   1. Feedback explicit al utilizatorului (prea_greu / prea_usor / durere)
//   2. RIR raportat față de RIR țintă
//   3. Reps completate față de intervalul prescris
//   4. Regresie pe sesiuni consecutive
//
// T2 — Increment personalizat: dacă userul are ≥3 sesiuni cu creșteri de greutate,
// motorul calculează incrementul REAL (median din istoricul progresiei) în loc de
// cel fix. Ritmul personalizat apare cu badge „ritm tău" în ecranul de antrenament.
//
// T3 — Interval natural de reps: dacă userul tinde consistent spre capătul greu/ușor
// al intervalului prescris (≥5 sesiuni, ≥5 serii), motorul detectează intervalul
// natural și îl afișează ca hint în bannerul de recomandare.

// Increment fix bazat pe gen și sarcina curentă (fallback / decrescent întotdeauna)
function getIncrement(gen, isLowerBody, kg = 0) {
  if (gen === 'feminin') {
    if (isLowerBody) return kg < 60 ? 2.5 : 5;
    return kg < 40 ? 1.25 : 2.5;
  }
  // masculin / nedefinit
  return isLowerBody ? 5 : 2.5;
}

// Prag reps la care bodyweight fără centură urcă la variație mai grea (evităm anduranță pură)
const BW_REPS_UPGRADE = 20;

// Plafon de intensitate în săptămâna de descărcare (~70% — regula 50/70 din research).
const DELOAD_WEIGHT_FACTOR = 0.70;

export class ProgressionEngine {
  /**
   * Starea de calibrare a unui exercițiu (derivată din istoric, fără câmp nou în schemă).
   * Un exercițiu e „în calibrare" până când: 2 sesiuni consecutive cu greutate stabilă
   * (±1 increment) ȘI repetări în interval ȘI răspuns de efort „ok" — SAU până la a 4-a
   * sesiune (plasă de siguranță). Vezi docs/drum_spre_v1.md §1.A.1.
   * @returns {{calibrating: boolean, sessionNumber: number}}
   */
  getCalibrationState(exId, repMin, repMax, antrenamente = [], opts = {}) {
    const { isLowerBody = false, gen } = opts;
    const sessions = (antrenamente || [])
      .filter(a => a.exercitii?.some(e => e.ex_id === exId && !e.skip))
      .sort((a, b) => a.data - b.data); // vechi → nou
    const n = sessions.length;

    if (n === 0) return { calibrating: true, sessionNumber: 1 };
    if (n >= 4)  return { calibrating: false, sessionNumber: n }; // plasă de siguranță

    if (n >= 2) {
      const exA = sessions[n - 2].exercitii.find(e => e.ex_id === exId);
      const exB = sessions[n - 1].exercitii.find(e => e.ex_id === exId);
      if (this._converged(exA, exB, repMin, repMax, gen, isLowerBody)) {
        return { calibrating: false, sessionNumber: n };
      }
    }
    return { calibrating: true, sessionNumber: n + 1 };
  }

  _converged(exA, exB, repMin, repMax, gen, isLowerBody) {
    if (!exA || !exB) return false;
    const kgA = Math.max(0, ...exA.serii.map(s => s.greutate || 0));
    const kgB = Math.max(0, ...exB.serii.map(s => s.greutate || 0));
    const inc = getIncrement(gen, isLowerBody, kgB);
    const stable = Math.abs(kgB - kgA) <= inc; // ±1 increment
    const repsInRange = exB.serii.every(s => s.reusit && s.repetari >= repMin && s.repetari <= repMax);
    const effortOk = exB.efort === 'ok';
    return stable && repsInRange && effortOk;
  }

  /**
   * @param {string}   exId
   * @param {number}   repMin
   * @param {number}   repMax
   * @param {Array}    antrenamente   - toate sesiunile salvate
   * @param {number}   profileExp     - 0/1/2/3
   * @param {object}   opts
   *   @param {number}  [opts.rir]            - RIR raportat pe ultimul set (0–5+)
   *   @param {string}  [opts.feedbackUser]   - 'prea_greu' | 'prea_usor' | 'ok' | 'durere'
   *   @param {boolean} [opts.isBodyweight]   - exercițiu pur bodyweight (echipament: ['corp'])
   *   @param {boolean} [opts.hasCenturaGreutati] - utilizatorul are centură de greutăți
   *   @param {boolean} [opts.isLowerBody]    - true = increment lower body
   *   @param {string}  [opts.gen]            - 'masculin' | 'feminin'
   *   @param {boolean} [opts.deload]         - săptămână de descărcare → plafonează la ~70%
   */
  getRecommendation(exId, repMin, repMax, antrenamente = [], profileExp = 0, opts = {}) {
    const { rir, feedbackUser, isBodyweight = false, hasCenturaGreutati = false, isLowerBody = false, gen, deload = false } = opts;

    // ── Fără istoric ─────────────────────────────────────────────────────────
    const sessions = (antrenamente || [])
      .filter(a => a.exercitii?.some(e => e.ex_id === exId))
      .sort((a, b) => b.data - a.data);

    if (!sessions.length) {
      return {
        tip: 'calibrare',
        mesaj: isBodyweight
          ? 'Prima sesiune — execută varianta de bază și raportează câte reps mai puteai face.'
          : 'Prima sesiune — alege o greutate cu care poți face 2–3 rep în plus față de target.',
      };
    }

    const last    = sessions[0].exercitii.find(e => e.ex_id === exId);
    const weights = last.serii.map(s => s.greutate).filter(Boolean);
    const kg      = weights.length ? Math.max(...weights) : 0;
    const inc     = getIncrement(gen, isLowerBody, kg);

    // T2 — increment personalizat din istoricul real (doar pentru exerciții cu greutate)
    const pi    = !isBodyweight ? this._personalIncrement(exId, antrenamente, gen, isLowerBody) : null;
    const incUp = pi ? pi.value : inc; // increment „spre sus"; fixul rămâne pentru scăderi

    // ── Săptămână de descărcare (deload) — plafonează la ~70%, prioritate maximă ──
    if (deload) {
      if (kg > 0) {
        const dkg = Math.max(inc, Math.round((kg * DELOAD_WEIGHT_FACTOR) / inc) * inc);
        return { tip: 'deload', kg: dkg, mesaj: `Săptămână de descărcare — ~70% (${dkg} kg) și mai puține serii. Recuperare, nu progres.` };
      }
      return { tip: 'deload', mesaj: 'Săptămână de descărcare — mai puține serii, intensitate ușoară. Recuperare, nu progres.' };
    }

    if (last.skip) {
      return { tip: 'info', mesaj: `Ultima sesiune ai sărit acest exercițiu. Reia de unde ai lăsat.` };
    }

    // Semnalul de efort din sesiunea trecută (colectat în calibrare) devine feedback
    // pentru recomandarea de azi, dacă nu s-a pasat explicit unul. Vezi §1.A.2.
    let fb = feedbackUser;
    if (!fb && last.efort) {
      if (last.efort === 'usor') fb = 'prea_usor';
      else if (last.efort === 'greu') fb = 'prea_greu';
      // 'ok' → lăsăm logica normală (reps/RIR)
    }

    // ── 1. Feedback explicit — prioritate maximă ──────────────────────────────
    if (fb === 'durere') {
      return {
        tip: 'durere',
        kg,
        mesaj: 'Durere raportată — recomandăm o variantă alternativă pentru aceeași grupă.',
        actiune: 'swap',
      };
    }

    if (fb === 'prea_greu') {
      return this._decrease(kg, inc, 'Feedback: prea greu');
    }

    if (fb === 'prea_usor') {
      if (isBodyweight && !hasCenturaGreutati) {
        return {
          tip: 'upgrade_variatie',
          mesaj: 'Prea ușor! Trecem la o variație mai dificilă a exercițiului.',
          actiune: 'upgrade_bw',
        };
      }
      const newKg = kg + this._calibStep(kg, inc, 0.10);
      return { tip: 'creste', kg: newKg, mesaj: `Prea ușor! Sari direct la ${newKg} kg.` };
    }

    // ── 2. Bodyweight fără centură — progresie prin variații ─────────────────
    if (isBodyweight && !hasCenturaGreutati) {
      return this._bodyweightProgression(last, repMin, repMax, rir);
    }

    // T3 — interval natural de reps (derivat din seriile salvate, fără câmpuri noi)
    const nrr = !isBodyweight ? this._naturalRepRange(exId, antrenamente, repMin, repMax) : null;

    // ── 3. RIR — dacă e disponibil ───────────────────────────────────────────
    if (rir !== undefined && rir !== null) {
      const rec = this._rirDecision(kg, inc, rir, repMin, repMax, last, incUp);
      if (nrr) rec.naturalRepRange = nrr;
      return rec;
    }

    // ── 4. Logică clasică reps ────────────────────────────────────────────────
    const rec = this._repsDecision(kg, inc, last, repMin, repMax, sessions, profileExp, incUp);
    if (nrr) rec.naturalRepRange = nrr;
    return rec;
  }

  // ── Decizie bazată pe RIR ──────────────────────────────────────────────────
  // RIR țintă implicit: 2 (poți face încă 2 rep). Ajustează în jurul valorii de 2.
  // incUp = incrementul personalizat T2 (sau fixul, dacă lipsesc datele).
  _rirDecision(kg, inc, rir, repMin, repMax, last, incUp = null) {
    const upInc  = incUp ?? inc;
    const piFlag = incUp !== null && incUp !== inc;
    const allOk  = last.serii.every(s => s.reusit);

    if (!allOk) {
      return this._decrease(kg, inc, 'Serii incomplete');
    }

    if (rir === 0) {
      return this._decrease(kg, inc, 'La limita absolută (RIR 0)');
    }

    if (rir === 1) {
      const newKg = kg + upInc;
      return { tip: 'creste', kg: newKg, personalIncrement: piFlag, mesaj: `Aproape de limită — treci la ${newKg} kg.` };
    }

    if (rir >= 4) {
      const newKg = kg + upInc * 2;
      return { tip: 'creste', kg: newKg, personalIncrement: piFlag, mesaj: `Prea ușor (RIR ${rir}) — treci la ${newKg} kg.` };
    }

    if (rir === 2 || rir === 3) {
      const atTop = last.serii.every(s => s.reusit && s.repetari >= repMax);
      if (atTop) {
        const newKg = kg + upInc;
        return { tip: 'creste', kg: newKg, personalIncrement: piFlag, mesaj: `Bine! Treci la ${newKg} kg.` };
      }
      return { tip: 'mentine', kg, mesaj: `Continuă cu ${kg} kg — atinge ${repMax} rep pe toate seriile.` };
    }

    return { tip: 'mentine', kg, mesaj: `Continuă cu ${kg} kg.` };
  }

  // ── Decizie clasică bazată pe reps ────────────────────────────────────────
  // incUp = incrementul personalizat T2 (sau fixul, dacă lipsesc datele).
  _repsDecision(kg, inc, last, repMin, repMax, sessions, profileExp, incUp = null) {
    const upInc  = incUp ?? inc;
    const piFlag = incUp !== null && incUp !== inc;
    const allOk  = last.serii.every(s => s.reusit);
    const atTop  = last.serii.every(s => s.reusit && s.repetari >= repMax);

    // Regresie: 2 sesiuni consecutive cu serii incomplete
    if (sessions.length >= 2) {
      const prev = sessions[1].exercitii.find(e => e.ex_id === last.ex_id);
      if (!prev?.skip && prev?.serii.some(s => !s.reusit) && last.serii.some(s => !s.reusit)) {
        return this._decrease(kg, inc, 'Stagnare 2 sesiuni consecutive');
      }
    }

    if (!allOk) {
      return { tip: 'mentine', kg, mesaj: `Rămâi la ${kg} kg până închizi toate seriile la ${repMin}–${repMax} rep.` };
    }

    const N = profileExp === 0 ? 1 : 2;
    const cleanCount = sessions.filter(s => {
      const e = s.exercitii.find(x => x.ex_id === last.ex_id);
      return !e?.skip && e?.serii.every(x => x.reusit && x.repetari >= repMax);
    }).length;

    if (atTop && cleanCount >= N) {
      const newKg = kg + upInc;
      return { tip: 'creste', kg: newKg, personalIncrement: piFlag, mesaj: `+${upInc} kg azi! Treci la ${newKg} kg.` };
    }

    if (atTop && cleanCount < N) {
      return { tip: 'aproape', kg, mesaj: `Bine! Încă ${N - cleanCount} sesiune(i) identică și crești.` };
    }

    return { tip: 'mentine', kg, mesaj: `Continuă cu ${kg} kg.` };
  }

  // ── Progresie bodyweight fără centură ─────────────────────────────────────
  // Dacă reps-urile depășesc pragul BW_REPS_UPGRADE pe toate seriile → upgrade variație.
  // Altfel crește reps.
  _bodyweightProgression(last, repMin, repMax, rir) {
    const allOk  = last.serii.every(s => s.reusit);
    const avgReps = last.serii.reduce((sum, s) => sum + (s.repetari || 0), 0) / (last.serii.length || 1);

    if (!allOk) {
      return { tip: 'mentine_bw', mesaj: `Continuă cu aceeași variație — completează toate seriile la ${repMin}–${repMax} rep.` };
    }

    if (avgReps >= BW_REPS_UPGRADE || (rir !== undefined && rir >= 4)) {
      return {
        tip: 'upgrade_variatie',
        mesaj: `Ai ajuns la ${Math.round(avgReps)} rep — trecem la o variație mai dificilă!`,
        actiune: 'upgrade_bw',
      };
    }

    const targetReps = Math.min(Math.round(avgReps) + 2, BW_REPS_UPGRADE);
    return {
      tip: 'creste_reps_bw',
      mesaj: `Bine! Încearcă ${targetReps} rep pe serie data viitoare.`,
      targetReps,
    };
  }

  // ── Pas de corecție (calibrare) ───────────────────────────────────────────
  // pct din greutatea logată, rotunjit la incrementul de echipament, dar MINIM un
  // increment — ca să nu existe corecții nule la greutăți mici (§1.A.3).
  _calibStep(kg, inc, pct) {
    const rounded = Math.round((kg * pct) / inc) * inc;
    return Math.max(inc, rounded);
  }

  // ── Scădere greutate ──────────────────────────────────────────────────────
  _decrease(kg, inc, motiv) {
    const newKg = Math.max(0, kg - this._calibStep(kg, inc, 0.075));
    return {
      tip: 'scade',
      kg: newKg,
      mesaj: `${motiv} — recomandăm ${newKg} kg (~7,5% mai puțin) și reconstrucție graduală.`,
    };
  }

  // ── T3: Interval natural de reps ──────────────────────────────────────────
  // Detectează bias-ul de reps al userului pe un exercițiu. Cere ≥5 sesiuni și
  // ≥5 serii completate (cu aceeași prescripție) pentru a evita zgomotul.
  // Returnează { min, max } (intervalul natural ajustat) sau null.
  _naturalRepRange(exId, antrenamente, repMin, repMax) {
    const span = repMax - repMin;
    if (span < 2) return null; // interval prea îngust pentru a detecta bias

    const sessions = (antrenamente || [])
      .filter(a => a.exercitii?.some(e => e.ex_id === exId && !e.skip))
      .sort((a, b) => b.data - a.data)
      .slice(0, 10); // ultimele 10 sesiuni

    if (sessions.length < 5) return null;

    const repsArr = [];
    for (const s of sessions) {
      const ex = s.exercitii.find(e => e.ex_id === exId);
      if (!ex || ex.skip) continue;
      for (const sr of (ex.serii || [])) {
        // Acceptăm seria dacă: completată, ≥1 rep, prescripția se potrivește (sau e absentă — date vechi)
        const matchPrescription =
          (sr.target_min === undefined || sr.target_min === repMin) &&
          (sr.target_max === undefined || sr.target_max === repMax);
        if (sr.reusit && sr.repetari > 0 && matchPrescription) {
          repsArr.push(sr.repetari);
        }
      }
    }

    if (repsArr.length < 5) return null;

    const sorted = [...repsArr].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    // Poziție în interval: 0 = cap greu (reps min), 1 = cap ușor (reps max)
    const pos = (median - repMin) / span;

    if (pos <= 0.35) {
      // Lucrează în jumătatea inferioară → prescripție mai strânsă pe low end
      return { min: repMin, max: Math.round(repMin + span / 2) };
    }
    if (pos >= 0.65) {
      // Lucrează în jumătatea superioară → prescripție mai strânsă pe high end
      return { min: Math.round(repMin + span / 2), max: repMax };
    }
    return null; // interval natural centrat — fără ajustare
  }

  // ── T2: Increment personalizat din istoricul real ─────────────────────────
  // Calculează mediana incrementelor REALE ale userului pe un exercițiu (≥3 creșteri
  // de greutate necesare). Returnează { value, events } sau null (date insuficiente).
  _personalIncrement(exId, antrenamente, gen, isLowerBody) {
    const sessions = (antrenamente || [])
      .filter(a => a.exercitii?.some(e => e.ex_id === exId && !e.skip))
      .sort((a, b) => a.data - b.data); // vechi → nou

    if (sessions.length < 3) return null;

    // Greutatea maximă per sesiune (ignorăm sesiunile fără greutate)
    const weights = sessions.map(s => {
      const ex = s.exercitii.find(e => e.ex_id === exId);
      const maxW = Math.max(0, ...(ex?.serii || []).filter(sr => sr.greutate > 0).map(sr => sr.greutate));
      return maxW > 0 ? maxW : null;
    }).filter(w => w !== null);

    if (weights.length < 3) return null;

    // Evenimentele de progresie (delta pozitiv între sesiuni consecutive)
    const deltas = [];
    for (let i = 1; i < weights.length; i++) {
      const d = weights[i] - weights[i - 1];
      if (d > 0) deltas.push(d);
    }

    if (deltas.length < 3) return null; // prea puține creșteri pentru estimare

    // Mediana (robustă la sărituri ocazionale mari / mici)
    const sorted = [...deltas].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    // Rotunjire la cel mai apropiat multiplu de jumătate din incrementul standard
    const lastKg  = weights[weights.length - 1];
    const baseInc = getIncrement(gen, isLowerBody, lastKg);
    const step    = baseInc * 0.5;
    const rounded = Math.max(step, Math.round(median / step) * step);

    return { value: rounded, events: deltas.length };
  }
}
