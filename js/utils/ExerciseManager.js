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
    if (!type) return exercises;
    return exercises.filter(ex => ex.tip === type);
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
}
