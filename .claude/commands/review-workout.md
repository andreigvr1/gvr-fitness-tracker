# Review antrenamente — Logică și funcționalitate fitness

Ești un QA specialist cu cunoștințe de fitness. Verifici că logica de antrenament din GVR Fitness Tracker este corectă, completă și fără bug-uri.

## Ce verifici

### 1. Generator de program
Citește `js/generator.js` și `data/exercises.json`, apoi verifică:
- Că programul generat respectă zilele selectate (ex. 3 zile → 3 zile în program)
- Că exercițiile sunt filtrate corect după echipament (dacă utilizatorul nu are gantere, nu apar exerciții cu gantere)
- Că articulațiile sensibile sunt respectate (genunchi → fără squat, umăr → fără împins deasupra capului)
- Că obiectivul influențează rep range-ul (forță: 3–5 rep, masă: 6–12 rep, sănătate: 12–15 rep)
- Că femeile primesc +2 rep față de bărbați la exerciții compuse și izolare
- Că exercițiile de tip `hip_thrust` și `abductie` sunt prioritizate pentru femei

### 2. Motor de progresie
Citește `js/engines/ProgressionEngine.js`, apoi verifică:
- Că la prima sesiune apare banner de calibrare
- Că după serii reușite la capătul de sus al range-ului, apare sugestia de creștere greutate
- Că după 2 sesiuni consecutive nereușite, apare sugestia de scădere
- Că incrementele sunt corecte: feminin upper body 1.25kg/2.5kg, lower body 2.5kg/5kg; masculin upper 2.5kg, lower 5kg

### 3. Logare serii
- Pornește un antrenament din preview
- Verifică că se pot completa serii (✓ și ✗)
- Verifică că greutatea și repetările din seria precedentă se copiază automat în seria următoare
- Verifică că exercițiul se marchează ca done după completarea tuturor seriilor
- Verifică că bara de progres din topbar se actualizează

### 4. Sărire exerciții
- Apasă „Sari" pe un exercițiu
- Verifică că la finalizarea zilei apare ecranul de motive pentru skip
- Verifică că se pot selecta motive și se poate finaliza

### 5. Finalizare antrenament
- Completează toate exercițiile
- Verifică că apare banner-ul „Antrenament finalizat"
- Verifică că există butonul de salvare
- Verifică că după salvare, antrenamentul apare în istoricul din Dashboard

### 6. Logică de gen
- Parcurge onboarding ca femeie → verifică că apar exerciții hip thrust/abductie în program
- Verifică că apare cue-ul de valgus la ghemuit/fandare pentru femei

### 7. Consistența datelor
Citește `js/storage.js` și verifică:
- Schema `gvr-data-v1` conține toate câmpurile necesare
- Că `antrenamente` se acumulează corect (nu se suprascrie)

## Cum raportezi

```
## Raport Review Antrenamente — [data]

### ✅ Logică corectă
- [lista]

### ❌ Probleme găsite
- [problemă]: [detalii tehnice] → [impact asupra utilizatorului]

### ⚠️ Inconsistențe față de spec (docs/specificatie_mvp.md)
- [dacă există]

### Scor logică fitness: X/10
```

Dacă găsești o problemă de logică fitness (ex. rep range greșit), citează sursa corectă (spec sau literatura de specialitate).
