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

  /**
   * Verifică dacă trebuie afișat un prompt de check-in pentru articulații sensibile.
   * Reguli:
   *  - Check-in după sesiunea #6 de la declararea injury-ului (≈ 2 săptămâni)
   *  - Ulterior, o dată la fiecare 6 sesiuni cât timp injury-ul e activ
   *  - Dacă injury-ul persistă >4 săptămâni → sugestie specialist
   *
   * @param {Array}   antrenamente
   * @param {object}  profile         - profilul cu articulatii_sensibile + injury_log
   * @param {number}  [now]           - timestamp curent (default Date.now())
   * @returns {object|null}           - { zona, tip: 'checkin'|'specialist' } sau null
   */
  checkInjuryFollowUp(antrenamente = [], profile = {}, now = Date.now()) {
    const injuries = profile.injury_log || [];
    if (!injuries.length) return null;

    const sessionCount = antrenamente.length;

    for (const inj of injuries) {
      if (inj.status !== 'active') continue;

      const sessionsSinceReport  = sessionCount - (inj.session_index_la_raportare ?? sessionCount);
      const daysSinceReport      = (now - inj.raportat_la) / (1000 * 60 * 60 * 24);
      const lastCheckin          = inj.ultima_verificare_session ?? inj.session_index_la_raportare ?? 0;
      const sessionsSinceCheckin = sessionCount - lastCheckin;

      // Nu deranjăm utilizatorul înainte de al 6-lea antrenament de la raportare
      if (sessionsSinceReport < 6) continue;

      // Sugestie specialist după 4 săptămâni (28 zile) fără ameliorare
      if (daysSinceReport >= 28) {
        return {
          zona: inj.zona,
          tip: 'specialist',
          mesaj: `${_zonaLabel(inj.zona)} te deranjează de peste 4 săptămâni. E recomandat să consulți un fizioterapeut înainte de a forța zona.`,
        };
      }

      // Check-in la sesiunea 6 după raportare, apoi la fiecare 6 sesiuni
      if (sessionsSinceCheckin >= 6) {
        return {
          zona: inj.zona,
          tip: 'checkin',
          mesaj: `Data trecută ai menționat că te deranjează ${_zonaLabel(inj.zona)}. Cum se simte acum?`,
          optiuni: ['S-a ameliorat', 'La fel', 'Mai rău'],
        };
      }
    }

    return null;
  }

  /**
   * Procesează răspunsul utilizatorului la check-in-ul de injury.
   * Returnează injury_log-ul actualizat.
   *
   * @param {object} injuryLog  - intrarea din injury_log
   * @param {string} raspuns    - 'ameliorat' | 'la_fel' | 'mai_rau'
   * @param {number} sessionIndex - indexul sesiunii curente
   * @returns {object}          - injury_log actualizat
   */
  processInjuryCheckin(injuryLog, raspuns, sessionIndex) {
    const updated = { ...injuryLog, ultima_verificare_session: sessionIndex };
    if (raspuns === 'ameliorat') {
      updated.status = 'recovering';  // Filtrele rămân, dar reintroducere graduală
    } else if (raspuns === 'mai_rau') {
      updated.status = 'active';      // Filtrele rămân stricte
    }
    return updated;
  }
}

function _zonaLabel(zona) {
  const map = { umar: 'umărul', genunchi: 'genunchiul', lombar: 'lombarul', cot: 'cotul' };
  return map[zona] || zona;
}
