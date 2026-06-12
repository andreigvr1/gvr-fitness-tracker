# Arhitectura proiectului — harta completă

Ultima actualizare: 12 iunie 2026 (v0.9.2)

**Scopul fișierului:** orice sesiune de lucru (om sau Claude) citește ÎNTÂI acest fișier în loc să exploreze codul — economisește timp și tokeni. Regulă: când structura se schimbă, acest fișier se actualizează în același commit.

---

## 1. Harta codului

```
index.html                      Shell: view-uri goale (onboarding/program/today/dashboard/profil),
                                nav bar, APP_VERSION, înregistrare ES modules
sw.js                           Service worker: CACHE_VERSION (incrementat la ORICE release),
                                precache + network-first pe HTML/JS/CSS
manifest.json                   PWA manifest
css/main.css                    TOT stilul. Tokens în :root (--bg, --surf, --accent #7c6ff7,
                                --green, --orange, --t1/t2/t3, --r 16px, --rs 10px)
data/exercises.json             85 exerciții: {id, nume, pattern, grupe_principale, tip
                                (compound/izolare/static/conditie), echipament[], nivel 1-3,
                                risc_articular[], descriere, reguli_speciale[], progressie_bw}

js/app.js          (~340 l.)    ORCHESTRATOR. Boot + router (fără profil→onboarding;
                                program_salvat→dashboard; altfel→program). Funcțiile
                                renderProgram/renderDashboard/renderToday/renderProfil leagă
                                renderers de storage. initNav, registerSW + update banner.
js/onboarding.js   (~515 l.)    STEPS[] (cele 9 întrebări), render pași, buildProfile()
                                (aici sunt fixate: skandenberg:false, manere:[], interfata:'completa'),
                                la final: generateProgram + saveData
js/generator.js    (~410 l.)    SPLITS (9 split-uri), _recSplit (matricea zile×experiență×obiectiv),
                                numSlots (timp→4/5/7/9), maxLevel (experiență→nivel),
                                PRESC (obiectiv→serii/rep/pauze), FEMALE_REP_BONUS, prescribe(),
                                SLOT_TEMPLATES (șabloane pe zi, slot 'prio'), scoreEx() (+jitter ±2),
                                selectForDay, generateProgram, getExercisesByIds,
                                getRecommendedSplit, getSplitsForZile, blocul skandenberg (adormit)
js/storage.js      (20 l.)      loadData/saveData/clearData pe cheia localStorage `gvr-data-v1`

js/engines/ProgressionEngine.js getRecommendation(exId,...): prioritate feedbackUser(durere/prea_greu/
                   (~215 l.)    prea_usor) → bodyweight (variații, prag 20 rep) → RIR (suportat,
                                NECOLECTAT din UI) → reps clasic (N sesiuni curate→+inc;
                                2 stagnări→−7,5%). getIncrement pe gen+grupă.
js/engines/AdaptiveEngine.js    analyzeSkips (durere×2→swap, prea_greu×2→swap, timp×3/oboseală×3→info).
                   (~150 l.)    checkInjuryFollowUp + processInjuryCheckin: ADORMITE (nechemat din UI,
                                injury_log nu e populat nicăieri).
js/engines/StatsEngine.js       Statistici dashboard: total sesiuni, săptămâna curentă, volum total,
                   (60 l.)      istoric 7, următorul antrenament. Fără UI propriu încă (nav „Statistici" e placeholder).

js/models/Program.js (44 l.)    Wrapper program: swapExercise, serialize
js/models/WorkoutSession.js     Starea sesiunii curente: markSetDone, skipExercise+setSkipReason,
                   (84 l.)      isComplete, serialize → intră în antrenamente[]

js/renderers/DashboardRenderer.js  Dashboard: card „următorul antrenament" + inel SVG progres,
                                   stat-cards, istoric, carduri „În curând"
js/renderers/ProgramRenderer.js    Programul: split activ + alternative (filtrate de cel activ),
                                   zile cu exerciții, swap/delete/add (modal), evenimente
                                   'program-updated', 'start-workout'
js/renderers/WorkoutRenderer.js    Logarea: carduri exercițiu colapsabile, rânduri serii
                                   (input kg/rep + ✓/✗), banner recomandare (ProgressionEngine),
                                   skip cu motive, eveniment 'switch-day', onSessionSaved

js/utils/Constants.js           ICONS (SVG-uri inline), SKIP_REASONS
js/utils/UIHelpers.js           ico(), formatDate/Weekday/Volume, getWeekStart, getNextDayIdx
js/utils/ViewManager.js         showView/updateNav (nav vizibil doar după program_salvat,
                                pe dashboard/program/profil)
js/utils/TemplateLoader.js      loadTemplate(nume) → fetch templates/<nume>.html
js/utils/ExerciseManager.js     loadAll (fetch exercises.json), filtre grupă/tip,
                                getNextBWProgression (lanț progressie_bw), getAlternatives
js/utils/BodyViz.js             bmiCategory, silhouetteSVG (caricatură pe gen), bmiPanelHTML

templates/dashboard.html        HTML-ul ecranelor (încărcat la runtime de TemplateLoader)
templates/program.html
templates/today.html
templates/add-exercise.html
```

## 2. Fluxuri-cheie

- **Boot (app.js):** DOMContentLoaded → loadData → fără profil/program? onboarding : program_salvat? dashboard : program.
- **Onboarding → program:** buildProfile → getRecommendedSplit → generateProgram → saveData({profile, program, antrenamente păstrate, preferinte, program_salvat:false}) → ecran program → „Salvează programul" → program_salvat:true → nav apare.
- **Generare (generator.js):** split → per zi: SLOT_TEMPLATES + filtre stricte (echipament, articulații, nivel) → scoreEx → câștigător + următorii 2-3 ca `alternative` → prescribe(obiectiv, gen).
- **Logare:** WorkoutSession nou per zi → ✓/✗ per serie → la salvare: serialize → push în `antrenamente[]`.
- **Recomandări:** WorkoutRenderer cheamă ProgressionEngine.getRecommendation per exercițiu, cu istoricul complet — totul derivat la cerere, nimic precalculat.
- **Evenimente custom DOM:** 'program-updated', 'start-workout' (ProgramRenderer→app), 'switch-day' (WorkoutRenderer→app).

## 3. Schema datelor (localStorage `gvr-data-v1`)

```json
{
  "profile": {
    "gen": "masculin|feminin", "inaltime": 175, "greutate": 75,
    "obiectiv": "sanatate|masa|forta|anduranta", "zile": 2-5, "timp": 30|45|60|75,
    "experienta": 0-3, "echipament": ["corp", ...],
    "manere": [], "grupe_prioritare": [], "articulatii_sensibile": [],
    "skandenberg": false, "stil_skandenberg": null, "interfata": "completa"
  },
  "program": {
    "split_id": "...", "split_label": "...", "split_desc": "...",
    "zile": [{ "label": "...", "tip": "full|upper|...", "exercitii": [{
      "id","nume","pattern","tip","grupe","descriere","reguli_speciale","echipament",
      "seturi","rep_min","rep_max","pauza_sec","alternative":["id",...] }] }]
  },
  "antrenamente": [{
    "data": 1718..., "zi_index": 0, "zi_label": "...", "zi_complet": true,
    "exercitii": [{ "ex_id": "...", "skip": null | {"motiv","label"},
      "serii": [{ "greutate","repetari","reusit",true|false|null,"target_min","target_max" }] }]
  }],
  "preferinte": { "nu_imi_place": [], "ma_doare": [] },
  "program_salvat": true,
  "_savedAt": 1718...
}
```
Regulă (CLAUDE.md #3): schimbările de schemă au migrare automată; câmpurile noi se adaugă aditiv cu default.

## 4. Cod adormit (există, nu e legat la interfață)

| Ce | Unde | Stare |
|---|---|---|
| RIR ca semnal de progresie | ProgressionEngine `opts.rir` | logică completă, UI nu colectează (decizie: semnal categoric în v0.10) |
| Check-in accidentări + prag fizioterapeut | AdaptiveEngine `checkInjuryFollowUp` | motor complet, nechemat; `injury_log` nepopulat |
| Preferințe „nu-mi place / mă doare" | `preferinte` în storage | inițializate, necitite/nescrise (promise în spec cap. 6) |
| Exerciții + bloc skandenberg | exercises.json `skandenberg-*`, generator | modul amânat post-MVP |
| StatsEngine fără pagină | nav „Statistici — CURÂND" | v1.2 |

## 5. Harta documentației

| Fișier | Conține | Îl citești când |
|---|---|---|
| `CLAUDE.md` | reguli de lucru, etape, ce NU se face | mereu (instrucțiuni de proiect) |
| `docs/specificatie_mvp.md` | SURSA DE ADEVĂR funcțională (v0.3) | orice schimbare de comportament |
| `docs/arhitectura.md` | acest fișier — unde e fiecare lucru | începutul oricărei sesiuni de cod |
| `docs/plan_versiuni.md` | roadmap v0.10→v2 + inventar placeholder-e | prioritizare / „la ce lucrăm" |
| `docs/drum_spre_v1.md` | spec detaliat v0.10 + v1.0, protocol validare, idei | implementarea următoarelor versiuni |
| `docs/decizii_deschise.md` | întrebările de calibrare/progresie + research verificat | înainte de v0.10 |
| `docs/analiza_onboarding.md` | întrebare→opțiune→efect, constatări | schimbări la onboarding/generator |
| `CHANGELOG.md` | istoric pe limbaj simplu | la fiecare release (se completează) |

## 6. „Unde modific ce" (scurtături)

| Vreau să... | Umblu în |
|---|---|
| schimb o întrebare de onboarding | js/onboarding.js STEPS + buildProfile + spec cap. 3 |
| schimb serii/rep/pauze pe obiectiv | js/generator.js PRESC (+ FEMALE_REP_BONUS) |
| schimb regulile de creștere/scădere | js/engines/ProgressionEngine.js |
| adaug/editez un exercițiu | data/exercises.json (schema spec cap. 4) |
| schimb aspectul | css/main.css (tokens în :root) + templates/*.html |
| schimb un ecran | js/renderers/*.js + templates/*.html |
| public o versiune | index.html APP_VERSION + sw.js CACHE_VERSION + CHANGELOG (regula 2) |
