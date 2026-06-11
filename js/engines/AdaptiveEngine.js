// Adaptive engine — analyzes skip patterns and generates suggestions

export class AdaptiveEngine {
  analyzeSkips(antrenamente = [], program) {
    const suggestions = [];
    const exSkips = {};

    // Aggregate skip reasons per exercise
    for (const session of antrenamente) {
      for (const ex of session.exercitii || []) {
        if (!ex.skip || ex.skip.motiv === '__pending__') continue;
        if (!exSkips[ex.ex_id]) exSkips[ex.ex_id] = [];
        exSkips[ex.ex_id].push(ex.skip.motiv);
      }
    }

    // Analyze patterns
    for (const [exId, motivs] of Object.entries(exSkips)) {
      const durereCount = motivs.filter(m => m === 'durere').length;
      if (durereCount >= 2) {
        const dayEx = program?.zile?.flatMap(z => z.exercitii).find(e => e.id === exId);
        suggestions.push({
          tip: 'durere',
          exId,
          mesaj: `Am observat că ${dayEx?.nume || exId} îți cauzează durere de ${durereCount} ori. Recomand să îl înlocuim.`,
          actiune: 'swap',
        });
      }

      const greuCount = motivs.filter(m => m === 'prea_greu').length;
      if (greuCount >= 2) {
        const dayEx = program?.zile?.flatMap(z => z.exercitii).find(e => e.id === exId);
        suggestions.push({
          tip: 'prea_greu',
          exId,
          mesaj: `${dayEx?.nume || exId} pare prea greu momentan (sărit de ${greuCount} ori). Recomand o variantă mai ușoară.`,
          actiune: 'swap',
        });
      }
    }

    // Session-level patterns
    const timpSessions = antrenamente.filter(s =>
      s.exercitii?.some(e => e.skip?.motiv === 'timp')
    ).length;
    if (timpSessions >= 3) {
      suggestions.push({
        tip: 'timp',
        mesaj: `De ${timpSessions} ori nu ai terminat din lipsă de timp. Vrei să reducem durata antrenamentului?`,
        actiune: 'info',
      });
    }

    const oboselaSessions = antrenamente.filter(s =>
      s.exercitii?.some(e => e.skip?.motiv === 'oboseala')
    ).length;
    if (oboselaSessions >= 3) {
      suggestions.push({
        tip: 'oboseala',
        mesaj: `Ai raportat oboseală acumulată de ${oboselaSessions} ori. Recomand o săptămână cu volum redus.`,
        actiune: 'info',
      });
    }

    // Deduplicate by tip + exId
    const seen = new Set();
    return suggestions.filter(s => {
      const key = s.tip + (s.exId || '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
