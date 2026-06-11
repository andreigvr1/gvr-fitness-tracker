# GVR Fitness Tracker — instrucțiuni de proiect

## Ce este proiectul
PWA de antrenament care generează programe personalizate și ghidează progresia.
Specificația completă și OBLIGATORIE: `docs/specificatie_mvp.md` (v0.2). Citește-o integral la începutul fiecărei sesiuni înainte de orice modificare. Spec-ul e sursa de adevăr; dacă o cerință din chat contrazice spec-ul, semnalează și cere confirmare înainte de implementare.

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
index.html          — shell-ul aplicației
css/                — stiluri (un fișier principal + tokens de design)
js/                 — module: onboarding, generator, logare, progresie, skandenberg, storage, ui
data/exercises.json — biblioteca de exerciții
sw.js               — service worker (incrementezi CACHE_VERSION la FIECARE release)
manifest.json       — manifest PWA
docs/               — specificația și deciziile de proiect
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

## Ce NU faci
- Nu adaugi dependențe externe / CDN-uri fără să întrebi (offline-first).
- Nu implementezi features din roadmap (v1.1+) în MVP, oricât de tentant.
- Nu publici nimic în afara repository-ului acestuia.
