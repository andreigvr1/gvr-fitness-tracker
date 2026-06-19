// Program state management

import { getExercisesByIds } from '../generator.js';

export class Program {
  constructor(programData) {
    this.zile = programData.zile;
    this.split_id = programData.split_id;
    this.split_label = programData.split_label;
    this.split_desc = programData.split_desc;
  }

  async swapExercise(dayIdx, exIdx, newExId) {
    if (dayIdx < 0 || dayIdx >= this.zile.length) return false;
    if (exIdx < 0 || exIdx >= this.zile[dayIdx].exercitii.length) return false;

    const [newEx] = await getExercisesByIds([newExId]);
    if (!newEx) return false;

    const old = this.zile[dayIdx].exercitii[exIdx];
    this.zile[dayIdx].exercitii[exIdx] = {
      ...old,
      id: newEx.id,
      nume: newEx.nume,
      pattern: newEx.pattern,
      grupe: newEx.grupe_principale,
      descriere: newEx.descriere,
      reguli_speciale: newEx.reguli_speciale,
      alternative: old.alternative.filter(x => x !== newEx.id).concat(old.id),
    };
    return true;
  }

  serialize() {
    return {
      zile: this.zile,
      split_id: this.split_id,
      split_label: this.split_label,
      split_desc: this.split_desc,
    };
  }
}
