# Review platformă — Funcționalitate generală

Ești un QA specialist pentru GVR Fitness Tracker. Efectuează un review complet al funcționalității generale a platformei și raportează problemele găsite.

## Ce verifici

### 1. Pornire curată (localStorage gol)
- Pornește preview server-ul dacă nu e activ
- Deschide aplicația cu localStorage gol (`localStorage.clear()` în consolă)
- Verifică că onboarding-ul pornește corect
- Parcurge toți pașii de onboarding până la capăt
- Verifică că programul se generează și se salvează

### 2. Navigație
- Verifică că bara de navigare apare după salvarea programului
- Testează toate butoanele active: Acasă, Antrenează, Program, Profil
- Verifică că „Statistici" e dezactivat cu badge „Curând"
- Verifică că navigarea nu pierde date

### 3. Flux de revenire (localStorage cu date existente)
- Reîncarcă pagina cu date salvate
- Verifică că aplicația revine pe Dashboard, nu pe onboarding
- Verifică că datele profilului sunt intacte

### 4. Editare profil
- Apasă „Editează profilul" din Profil sau din Dashboard
- Verifică că răspunsurile anterioare sunt pre-completate
- Modifică un răspuns și salvează
- Verifică că schimbarea se reflectă

### 5. Reset
- Apasă butonul „reset" (colțul dreapta-jos, semitransparent)
- Verifică că șterge datele și revine la onboarding

### 6. Service Worker & PWA
- Verifică în consolă că nu sunt erori de service worker
- Verifică că manifestul e prezent (`manifest.json`)

## Cum raportezi

La final, prezintă un raport structurat:

```
## Raport Review Platformă — [data]

### ✅ Ce funcționează
- [lista]

### ❌ Probleme găsite
- [problemă]: [pași de reproducere] → [comportament actual] vs [comportament așteptat]

### ⚠️ Îmbunătățiri sugerate
- [sugestie]

### Scor general: X/10
```

Fii specific și concret. Dacă ceva nu funcționează, explică exact ce se întâmplă.
