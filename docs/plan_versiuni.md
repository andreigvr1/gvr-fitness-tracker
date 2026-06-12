# Plan pe versiuni — GVR Fitness Tracker

Stare: activ · Ultima actualizare: 12 iunie 2026 · Deciziile de mutare între versiuni: Andrei

Regulă de întreținere: la fiecare release se actualizează secțiunea „Unde suntem" și inventarul de placeholder-e. Orice mutare între versiuni se notează cu data.

---

## Unde suntem: v0.9.2

Funcționează end-to-end: onboarding 9 pași → generator (85 exerciții, 9 split-uri, prescripții pe obiectiv+gen) → editare program (schimbare split, înlocuire/ștergere/adăugare exerciții) → logare pe serie (kg, rep, ✓/✗) → motor de progresie (+increment după N sesiuni curate, −7,5% la stagnare, skip cu motive + adaptare) → dashboard (statistici, istoric) → profil (BMI + siluetă, editare) → PWA offline cu banner de update.

### Inventar placeholder-e și conținut „în adormire"

| Ce | Unde | Planificat pentru |
|---|---|---|
| „Statistici — CURÂND" | bara de navigare | v1.2 (`StatsEngine.js` există în cod, fără interfață) |
| Carduri „În curând": Calendar, Progres, Recorduri | dashboard | v1.2 |
| Card „În curând": Skandenberg | dashboard | v1.1+ (la reactivarea modulului) |
| Măsurători (înălțime/greutate) nefolosite la generare | onboarding Î2 | v0.10 — greutate de start (decizie 12.06.2026) |
| Exerciții skandenberg blocate (pattern `skandenberg-*` + echipament dedicat neselectabil) | `data/exercises.json` | se deblochează cu modulul |
| `skandenberg: false`, `manere: []`, `interfata: 'completa'` fixate în cod | `js/onboarding.js` (buildProfile) | se dezgheață cu modulul / interfața simplă |
| Export/import .json **lipsește** (promis în spec cap. 10) | — | v1.0 (obligatoriu înainte de lansare) |
| Check-in accidentări: motor complet, fără UI (`checkInjuryFollowUp`) | `js/engines/AdaptiveEngine.js` | v1.1 propus — vezi `docs/drum_spre_v1.md` §2.2 |
| Preferințe „nu-mi place / mă doare": inițializate, nefolosite (promise în spec cap. 6) | storage `preferinte` | v1.0 sau v1.1 — decizie Andrei |
| Branch `develop` rămas pe GitHub | remote | de curățat sau refolosit |

Detaliile funcționale pentru v0.10 și v1.0 (spec calibrare, export/import, protocol de validare, checklist lansare, idei): `docs/drum_spre_v1.md`. Harta codului: `docs/arhitectura.md`.

---

## v0.10 — Calibrare inteligentă (următoarea versiune de lucru)

Depinde de deciziile lui Andrei din `docs/decizii_deschise.md` (Î1–Î5). Conținut propus:
- Stare de calibrare per exercițiu: 2–4 sesiuni, criteriu de convergență + semnal de efort „prea ușor / ok / prea greu" (motorul îl suportă deja prin `feedbackUser`)
- Pași de corecție 5–10% în calibrare (conform ACSM/NSCA), rotunjiți pe categoria de echipament
- Greutate de start estimată din greutatea corporală (research R1 — face utilă întrebarea de măsurători)
- Logarea răspunsurilor la bannerele de progresie (confirmat / modificat / ignorat) — fundație pentru v1.1

**Criteriu de acceptare:** un utilizator nou ajunge la greutăți stabile în ≤4 sesiuni per exercițiu, fără sesiuni irosite.

## v1.0 — Lansarea MVP

- **Export/import .json** al datelor (lipsă azi, promis în spec)
- Validare pe profilurile-test din spec cap. 10: profilurile 2 (casual), 3 (fesieri prioritar), 4 (zero echipament) integral; profilurile 1 și 5 fără componenta skandenberg
- Audit final: filtrele de siguranță, pornire curată cu localStorage gol ȘI cu date existente, comportament PWA offline

**Criteriu de acceptare:** toate profilurile generează programe corecte, verificate manual de Andrei.

## v1.1 — Antrenorul devine proactiv

- Treapta 2 de stagnare: schemă nouă de repetări / propunere de înlocuire exercițiu (folosește log-ul de bannere din v0.10)
- Check-in periodic la 4–6 săptămâni · Deload automat propus · Faze de revenire după pauză
- PR-uri țintă + milestones
- **Reactivarea modulului skandenberg** (mini-onboarding la activare: stil + echipament dedicat) — ordinea exactă de confirmat cu Andrei

## v1.2 — Statistici și vizualizare

- Pagina Statistici (activează item-ul din navigare) + cardurile Progres / Recorduri / Calendar de pe dashboard
- Grafice de evoluție per exercițiu și pe grupe musculare
- Interfața simplă (toggle, spec cap. 9) — de confirmat dacă mai e dorită
- Skandenberg avansat: niveluri, zi grea/moderată, izometrie la masă

## v2 — Dincolo de local

- Conturi online + sincronizare cloud · Partajare programe · Aplicații native iOS/Android (de evaluat la momentul respectiv)
