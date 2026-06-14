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
