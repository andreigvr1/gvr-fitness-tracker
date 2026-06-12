# GVR Fitness Tracker — instrucțiuni de proiect

## Ce este proiectul
PWA de antrenament care generează programe personalizate și ghidează progresia.
Specificația completă și OBLIGATORIE: `docs/specificatie_mvp.md` (v0.3). Citește-o integral la începutul fiecărei sesiuni înainte de orice modificare. Spec-ul e sursa de adevăr; dacă o cerință din chat contrazice spec-ul, semnalează și cere confirmare înainte de implementare.
Pentru orientare în cod, citește ÎNTÂI `docs/arhitectura.md` (harta fișierelor, schema datelor, „unde modifici ce") în loc să explorezi fișierele — economisește tokeni. Dacă schimbi structura, actualizează harta în același commit.

## Proprietarul proiectului
Andrei — decide tot, dar NU e programator. Consecințe:
- Explică deciziile tehnice pe limbaj simplu, fără jargon neexplicat.
- Propune → așteaptă confirmare pentru orice decizie de produs (UX, funcționalitate, design). Deciziile pur tehnice (structură de cod, refactorizări) le iei singur.
- La finalul fiecărei sesiuni: rezumat scurt a ce s-a schimbat + ce urmează.

## Stack tehnic (fix, nu se schimbă fără motiv întemeiat)
- PWA: HTML + CSS + JavaScript vanilla (ES modules), FĂRĂ framework, FĂRĂ build step.
  Motiv: deploy direct pe GitHub Pages prin push, fără toolchain de întreținut.
- Date: localStorage (cheie unică `gvr-data-v1`), export/import .json.
- Offline + upgrade-uri: service worker cu cache versionat (`CACHE_VERSION`) + banner de actualizare cu confirmare.
- Biblioteca de exerciții: `data/exercises.json` (schema din spec cap. 4) — separată de cod, ca să poată fi reviewuită și editată independent.
- Hosting: GitHub Pages de pe branch-ul main, root.

## Structura repository-ului
```
index.html          — shell-ul aplicației (APP_VERSION)
css/main.css        — stiluri + design tokens (variabilele :root)
js/app.js           — orchestrator slim
js/onboarding.js    — pașii de onboarding + construirea profilului
js/generator.js     — split-uri, selecție exerciții, prescripții
js/storage.js       — localStorage (cheia `gvr-data-v1`)
js/engines/         — ProgressionEngine, AdaptiveEngine, StatsEngine
js/models/          — Program, WorkoutSession
js/renderers/       — DashboardRenderer, ProgramRenderer, WorkoutRenderer
js/utils/           — Constants, UIHelpers, ViewManager, TemplateLoader, ExerciseManager, BodyViz
templates/          — HTML-ul ecranelor (dashboard, program, today, add-exercise)
data/exercises.json — biblioteca de exerciții (schema din spec cap. 4)
sw.js               — service worker (incrementezi CACHE_VERSION la FIECARE release)
manifest.json       — manifest PWA
docs/               — specificația (sursa de adevăr), deciziile deschise, analizele, planul pe versiuni
CHANGELOG.md        — fiecare versiune: ce s-a schimbat, pe limbaj simplu
```

## Reguli de lucru
1. **Etape de construcție (în ordine, nu sări):**
   - Etapa 0: schelet repo + pagină "în construcție" publicată pe Pages (validează pipeline-ul de deploy de la început)
   - Etapa 1: biblioteca de exerciții (`data/exercises.json`) → livrată lui Andrei pentru review ÎNAINTE de a construi pe ea
   - Etapa 2: prototip de design — 2-3 ecrane statice (cap. 12 din spec) → Andrei alege direcția
   - Etapa 3: onboarding + generator
   - Etapa 4: logare + calibrare + motor de progresie
   - Etapa 5: modul skandenberg + interfața simplă
   - Etapa 6: validare pe cele 5 profiluri din spec cap. 10 + lansare v1.0
2. **Fiecare release:** incrementează versiunea în `index.html` (APP_VERSION) și `sw.js` (CACHE_VERSION), actualizează CHANGELOG.md, commit cu mesaj clar, push.
3. **Nu șterge și nu migra distructiv datele utilizatorilor.** Orice schimbare de schemă de date are migrare automată de la versiunea anterioară.
4. **Limba aplicației și a commit-urilor vizibile: română.** Codul (variabile, funcții): engleză.
5. **Siguranță:** principiile din spec cap. 1 sunt invariante. Filtrele de articulații sensibile și echipament nu se relaxează niciodată pentru "mai multe opțiuni".
6. **Testare minimă per etapă:** înainte de push, verifică manual fluxul atins de schimbare + că aplicația pornește curat cu localStorage gol ȘI cu date existente.
7. **Harta proiectului (`docs/arhitectura.md`) e prima sursă de orientare.** Caută ÎNTÂI în ea (fișiere, schema datelor, „unde modifici ce") înainte de a explora sau citi cod — explorezi doar ce harta nu acoperă. Reversul obligatoriu: orice schimbare de structură, schemă de date, fișier nou sau funcționalitate nouă actualizează harta ÎN ACELAȘI commit. O hartă învechită e mai rea decât niciuna.

## Ce NU faci
- Nu adaugi dependențe externe / CDN-uri fără să întrebi (offline-first).
- Nu implementezi features din roadmap (v1.1+) în MVP, oricât de tentant.
- Nu publici nimic în afara repository-ului acestuia.
