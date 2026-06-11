// Progression engine — calculates weight recommendations based on history

export class ProgressionEngine {
  getRecommendation(exId, repMin, repMax, antrenamente = [], profileExp) {
    const sessions = (antrenamente || [])
      .filter(a => a.exercitii?.some(e => e.ex_id === exId))
      .sort((a, b) => b.data - a.data);

    if (!sessions.length) {
      return {
        tip: 'calibrare',
        mesaj: 'Prima sesiune — alege o greutate cu care poți face 2–3 rep în plus față de target. Loghează ce ai făcut și data viitoare recomand eu.',
      };
    }

    const last = sessions[0].exercitii.find(e => e.ex_id === exId);
    const weights = last.serii.map(s => s.greutate).filter(Boolean);
    const kg = weights.length ? Math.max(...weights) : 0;

    if (last.skip) {
      return {
        tip: 'info',
        mesaj: `Ultima sesiune ai sărit acest exercițiu. Continuă cu ${kg || '?'} kg.`,
      };
    }

    const allOk = last.serii.every(s => s.reusit);
    const atTop = last.serii.every(s => s.reusit && s.repetari >= repMax);

    // Detect regression (2+ consecutive failed sessions)
    if (sessions.length >= 2) {
      const prev = sessions[1].exercitii.find(e => e.ex_id === exId);
      if (!prev?.skip && prev?.serii.some(s => !s.reusit) && last.serii.some(s => !s.reusit)) {
        const newKg = Math.round(kg * 0.925 / 2.5) * 2.5;
        return {
          tip: 'regresia',
          kg: newKg,
          mesaj: `Stagnare — recomand ${newKg} kg (-7,5%) și reconstruire.`,
        };
      }
    }

    if (!allOk) {
      return {
        tip: 'mentine',
        kg,
        mesaj: `Rămâi la ${kg} kg până închizi toate seriile la ${repMin}–${repMax} rep.`,
      };
    }

    // Check consecutive successful sessions
    const N = profileExp === 0 ? 1 : 2;
    const cleanCount = sessions.filter(s => {
      const e = s.exercitii.find(x => x.ex_id === exId);
      return !e?.skip && e?.serii.every(x => x.reusit && x.repetari >= repMax);
    }).length;

    if (atTop && cleanCount >= N) {
      const newKg = kg + 2.5;
      return {
        tip: 'creste',
        kg: newKg,
        mesaj: `+2,5 kg azi! Treci la ${newKg} kg.`,
      };
    }

    if (atTop && cleanCount < N) {
      return {
        tip: 'aproape',
        kg,
        mesaj: `Bine! Încă ${N - cleanCount} sesiune(i) identică și crești.`,
      };
    }

    return {
      tip: 'mentine',
      kg,
      mesaj: `Continuă cu ${kg} kg.`,
    };
  }
}
