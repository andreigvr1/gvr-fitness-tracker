// Workout session state management

export class WorkoutSession {
  constructor(program, dayIndex) {
    const day = program.zile[dayIndex];
    this.data = Date.now();
    this.zi_index = dayIndex;
    this.zi_label = day.label;
    this.zi_complet = false;
    this.exercitii = day.exercitii.map(ex => ({
      ex_id: ex.id,
      skip: null,
      efort: null, // 'usor' | 'ok' | 'greu' — colectat în calibrare (§1.A.2)
      serii: Array.from({ length: ex.seturi }, () => ({
        greutate: null,
        repetari: null,
        reusit: null,
        target_min: ex.rep_min,
        target_max: ex.rep_max,
      })),
    }));
  }

  markSetDone(exIdx, setIdx, kg, reps, reusit) {
    if (exIdx < 0 || exIdx >= this.exercitii.length) return;
    if (setIdx < 0 || setIdx >= this.exercitii[exIdx].serii.length) return;

    this.exercitii[exIdx].serii[setIdx] = {
      greutate: kg,
      repetari: reps,
      reusit,
      target_min: this.exercitii[exIdx].serii[setIdx].target_min,
      target_max: this.exercitii[exIdx].serii[setIdx].target_max,
    };
  }

  setEffort(exIdx, value) {
    if (exIdx < 0 || exIdx >= this.exercitii.length) return;
    this.exercitii[exIdx].efort = value;
  }

  skipExercise(exIdx, motiv = '__pending__') {
    if (exIdx < 0 || exIdx >= this.exercitii.length) return;
    this.exercitii[exIdx].skip = { motiv, label: '' };
  }

  setSkipReason(exIdx, motiv, label) {
    if (exIdx < 0 || exIdx >= this.exercitii.length) return;
    if (this.exercitii[exIdx].skip) {
      this.exercitii[exIdx].skip = { motiv, label };
    }
  }

  isExerciseResolved(exIdx) {
    if (exIdx < 0 || exIdx >= this.exercitii.length) return false;
    const ex = this.exercitii[exIdx];
    return ex.skip !== null || ex.serii.every(s => s.reusit !== null);
  }

  getUnresolvedExercises() {
    return this.exercitii
      .map((ex, idx) => ({ ex, idx }))
      .filter(({ ex }) => ex.skip === null && !ex.serii.every(s => s.reusit !== null))
      .map(({ idx }) => idx);
  }

  getPendingSkips() {
    return this.exercitii
      .map((ex, idx) => ({ ex, idx }))
      .filter(({ ex }) => ex.skip?.motiv === '__pending__')
      .map(({ idx }) => idx);
  }

  isComplete() {
    return this.exercitii.every(ex =>
      ex.skip !== null || ex.serii.every(s => s.reusit !== null)
    );
  }

  serialize() {
    return {
      data: this.data,
      zi_index: this.zi_index,
      zi_label: this.zi_label,
      zi_complet: this.zi_complet,
      exercitii: this.exercitii,
    };
  }
}
