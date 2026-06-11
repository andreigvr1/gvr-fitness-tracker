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
      sum + a.exercitii.reduce((s, e) =>
        s + (e.skip ? 0 : e.serii.reduce((v, x) =>
          v + (x.greutate || 0) * (x.repetari || 0), 0)), 0), 0);
  }

  getActivityHistory(antrenamente = [], limit = 7) {
    const completed = antrenamente
      .filter(a => a.zi_complet)
      .sort((a, b) => b.data - a.data)
      .slice(0, limit);

    return completed.map(a => {
      const d = new Date(a.data);
      const skipped = a.exercitii.filter(e => e.skip).length;
      return {
        data: a.data,
        dateStr: d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' }),
        weekday: d.toLocaleDateString('ro-RO', { weekday: 'short' }),
        label: a.zi_label,
        totalEx: a.exercitii.length,
        completedEx: a.exercitii.length - skipped,
        skippedEx: skipped,
      };
    });
  }

  getNextWorkoutInfo(program, antrenamente = []) {
    const completed = antrenamente
      .filter(a => a.zi_complet)
      .sort((a, b) => b.data - a.data);
    const nextIdx = completed.length === 0
      ? 0
      : (completed[0].zi_index + 1) % program.zile.length;
    const nextDay = program.zile[nextIdx];

    return {
      idx: nextIdx,
      day: nextDay,
      number: nextIdx + 1,
      totalDays: program.zile.length,
    };
  }
}
