// Exercise management utilities for filtering and searching

export class ExerciseManager {
  static async loadAll() {
    try {
      const res = await fetch('data/exercises.json');
      const data = await res.json();
      return data.exercitii || [];
    } catch (e) {
      console.error('Failed to load exercises:', e);
      return [];
    }
  }

  static getMuscleGroups(exercises) {
    const groups = new Set();
    exercises.forEach(ex => {
      if (ex.grupe_principale) {
        ex.grupe_principale.forEach(g => groups.add(g));
      }
    });
    return Array.from(groups).sort();
  }

  static getExerciseTypes() {
    return ['compound', 'izolat'];
  }

  static filterByMuscleGroup(exercises, muscleGroup) {
    if (!muscleGroup) return exercises;
    return exercises.filter(ex =>
      ex.grupe_principale && ex.grupe_principale.includes(muscleGroup)
    );
  }

  static filterByType(exercises, type) {
    return exercises;
  }

  static filterByMuscleAndType(exercises, muscleGroup, type) {
    let filtered = exercises;
    if (muscleGroup) {
      filtered = this.filterByMuscleGroup(filtered, muscleGroup);
    }
    if (type) {
      filtered = this.filterByType(filtered, type);
    }
    return filtered;
  }

  /**
   * Returnează exercițiul următor din lanțul de progresie bodyweight.
   * Dacă utilizatorul are centură de greutăți, nu mai urcăm la variație —
   * adăugăm greutate pe același exercițiu (gestionat de ProgressionEngine).
   *
   * @param {string}   exId
   * @param {Array}    exercises        - toate exercițiile încărcate
   * @param {Set}      availableEquip   - echipamentul utilizatorului
   * @returns {object|null}             - exercițiul următor sau null dacă n-am mai sus
   */
  static getNextBWProgression(exId, exercises, availableEquip = new Set(), _visited = new Set()) {
    if (_visited.has(exId)) return null; // ciclu detectat — oprire
    _visited.add(exId);

    const current = exercises.find(e => e.id === exId);
    if (!current?.progressie_bw) return null;

    const next = exercises.find(e => e.id === current.progressie_bw);
    if (!next) return null;

    const canDo = next.echipament.every(eq => eq === 'corp' || availableEquip.has(eq));
    if (!canDo) {
      return this.getNextBWProgression(next.id, exercises, availableEquip, _visited);
    }

    return next;
  }

  /**
   * Verifică dacă un exercițiu este bodyweight-only (nu necesită echipament în afară de corp).
   */
  static isBodyweightOnly(ex) {
    return ex.echipament.every(e => e === 'corp');
  }

  /**
   * Returnează toate exercițiile valide ca alternative pentru un exercițiu dat,
   * filtrate pe aceeași grupă musculară principală și echipament disponibil.
   */
  static getAlternatives(exId, exercises, availableEquip = new Set(), badJoints = new Set()) {
    const current = exercises.find(e => e.id === exId);
    if (!current) return [];

    return exercises.filter(e =>
      e.id !== exId &&
      e.grupe_principale.some(g => current.grupe_principale.includes(g)) &&
      e.echipament.every(eq => eq === 'corp' || availableEquip.has(eq)) &&
      !e.risc_articular.some(r => badJoints.has(r))
    );
  }
}
