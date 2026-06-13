// Stats engine — calculates dashboard statistics

import { getWeekStart } from '../utils/UIHelpers.js';

export class StatsEngine {
  getTotalSessions(antrenamente = []) {
    return antrenamente.filter(a => a.zi_complet).length;
  }

  getThisWeekCount(antrenamente = [], program) {
    const startWeek = getWeekStart();
    const thisWeek = antrenamente.filter(a => a.data >= startWeek).length;
    return { completed: thisWeek, total: program?.zile?.length || 0 };
  }

  getTotalVolume(antrenamente = []) {
    return antrenamente.reduce((sum, a) =>
      sum + (a.exercitii || []).reduce((s, e) =>
        s + (e.skip ? 0 : (e.serii || []).reduce((v, x) =>
          v + (x.greutate || 0) * (x.repetari || 0), 0)), 0), 0);
  }

  getActivityHistory(antrenamente = [], limit = 7) {
    const completed = antrenamente
      .filter(a => a.zi_complet)
      .sort((a, b) => b.data - a.data)
      .slice(0, limit);

    return completed.map(a => {
      const d = new Date(a.data);
      const exs = a.exercitii || [];
      const skipped = exs.filter(e => e.skip).length;
      return {
        data: a.data,
        dateStr: d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' }),
        weekday: d.toLocaleDateString('ro-RO', { weekday: 'short' }),
        label: a.zi_label,
        totalEx: exs.length,
        completedEx: exs.length - skipped,
        skippedEx: skipped,
      };
    });
  }

  getNextWorkoutInfo(program, antrenamente = []) {
    const completed = antrenamente
      .filter(a => a.zi_complet)
      .sort((a, b) => b.data - a.data);
    let nextIdx = completed.length === 0
      ? 0
      : (completed[0].zi_index + 1) % program.zile.length;
    // Plasă de siguranță: date importate/parțiale pot avea zi_index lipsă → NaN. Cădem pe ziua 0.
    if (!Number.isInteger(nextIdx) || !program.zile[nextIdx]) nextIdx = 0;
    const nextDay = program.zile[nextIdx];

    return {
      idx: nextIdx,
      day: nextDay,
      number: nextIdx + 1,
      totalDays: program.zile.length,
    };
  }

  // ── Progres & Recorduri ──────────────────────────────────────────────────────
  // Per exercițiu: cel mai bun set din fiecare sesiune (doar serii reușite),
  // în ordine cronologică. Exercițiile fără greutate folosesc repetările.
  getExerciseSeries(antrenamente = []) {
    const map = {};
    [...antrenamente]
      .sort((a, b) => a.data - b.data)
      .forEach(a => {
        (a.exercitii || []).forEach(e => {
          if (e.skip) return;
          const done = (e.serii || []).filter(s => s.reusit === true && (s.repetari || 0) > 0);
          if (!done.length) return;
          const withW = done.filter(s => (s.greutate || 0) > 0);
          const pool = withW.length ? withW : done;
          const best = pool.reduce((m, s) =>
            ((s.greutate || 0) > (m.greutate || 0) ||
             ((s.greutate || 0) === (m.greutate || 0) && (s.repetari || 0) > (m.repetari || 0))) ? s : m);
          (map[e.ex_id] ||= []).push({
            data: a.data,
            greutate: best.greutate || 0,
            repetari: best.repetari || 0,
          });
        });
      });
    return map;
  }

  // Recordul personal per exercițiu (cel mai greu set reușit; la bodyweight: cele mai multe repetări)
  getRecords(antrenamente = []) {
    const series = this.getExerciseSeries(antrenamente);
    return Object.entries(series)
      .map(([exId, pts]) => {
        const best = pts.reduce((m, p) =>
          (p.greutate > m.greutate ||
           (p.greutate === m.greutate && p.repetari > m.repetari)) ? p : m);
        return { exId, ...best, sesiuni: pts.length };
      })
      .sort((a, b) => b.greutate - a.greutate || b.repetari - a.repetari);
  }

  getTotalSuccessfulSets(antrenamente = []) {
    return antrenamente.reduce((n, a) =>
      n + (a.exercitii || []).reduce((m, e) =>
        m + (e.skip ? 0 : (e.serii || []).filter(s => s.reusit === true).length), 0), 0);
  }

  getDistinctExercisesCount(antrenamente = []) {
    const ids = new Set();
    antrenamente.forEach(a => (a.exercitii || []).forEach(e => { if (!e.skip) ids.add(e.ex_id); }));
    return ids.size;
  }

  // Numărul de antrenamente complete pe fiecare din ultimele N săptămâni (pentru mini-graficul din Sumar)
  getWeeklyCounts(antrenamente = [], weeks = 8) {
    const WEEK = 7 * 24 * 60 * 60 * 1000;
    const thisWeekStart = getWeekStart();
    const out = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const start = thisWeekStart - i * WEEK;
      const end = start + WEEK;
      out.push({
        start,
        count: antrenamente.filter(a => a.zi_complet && a.data >= start && a.data < end).length,
      });
    }
    return out;
  }
}
