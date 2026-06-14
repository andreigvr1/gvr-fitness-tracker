# Plan pe versiuni — GVR Fitness Tracker

Stare: activ · Ultima actualizare: 15 iunie 2026 · Deciziile de mutare între versiuni: Andrei

Regulă de întreținere: la fiecare release se actualizează secțiunea „Unde suntem" și inventarul de placeholder-e. Orice mutare între versiuni se notează cu data.

---

## Unde suntem: v0.9.9

Funcționează end-to-end: onboarding 9 pași → generator (85 exerciții, 9 split-uri, prescripții pe obiectiv+gen) → editare program (schimbare split, înlocuire/ștergere/adăugare exerciții) → logare pe serie (kg, rep, ✓/✗) → motor de progresie (+increment după N sesiuni curate, −7,5% la stagnare, skip cu motive + adaptare) → dashboard (statistici, istoric, calendar, recorduri) → profil (BMI + siluetă, editare) → PWA offline cu banner de update. Vizual: teme Chalk + Slate, fonturi self-hosted.

Fix recent (nepublicat încă): câmpul de kg dispare la exercițiile pur bodyweight dacă utilizatorul nu are centură de greutăți (spec cap. 7) — logarea afișează doar repetări; reapare automat dacă bifează centura.

### Inventar placeholder-e și conținut „în adormire"

| Ce | Unde | Planificat pentru |
|---|---|---|
| „Statistici — CURÂND" | bara de navigare | v1.2 (`StatsEngine.js` există în cod, fără interfață) |
| Carduri „În curând": Calendar, Progres, Recorduri | dashboard | v1.2 |
| Card „În curând": Skandenberg | dashboard | v1.1+ (la reactivarea modulului) |
| Măsurători (înălțime/greutate) nefolosite la generare | onboarding Î2 | greutate de start = research R1 (AMÂNAT, sesiune dedicată) · jurnal de măsurători extins (talie/braț/piept/vârstă) = Modul B din corpul de lucru curent |
| Exerciții skandenberg blocate (pattern `skandenberg-*` + echipament dedicat neselectabil) | `data/exercises.json` | se deblochează cu modulul |
| `skandenberg: false`, `manere: []`, `interfata: 'completa'` fixate în cod | `js/onboarding.js` (buildProfile) | se dezgheață cu modulul / interfața simplă |
| ~~Export/import .json lipsește~~ **LIVRAT în v0.9.6** (Profil → Exportă/Importă) | `js/utils/DataTransfer.js` | ✅ gata |
| Check-in accidentări: motor complet, fără UI (`checkInjuryFollowUp`) | `js/engines/AdaptiveEngine.js` | v1.1 propus — vezi `docs/drum_spre_v1.md` §2.2 |
| Preferințe „nu-mi place / mă doare": inițializate, nefolosite (promise în spec cap. 6) | storage `preferinte` | v1.0 sau v1.1 — decizie Andrei |
| Branch `develop` rămas pe GitHub | remote | de curățat sau refolosit |

Detaliile funcționale pentru v0.10 și v1.0 (spec calibrare, export/import, protocol de validare, checklist lansare, idei): `docs/drum_spre_v1.md`. Harta codului: `docs/arhitectura.md`.

---

## Următorul corp de lucru — Calibrare + Măsurători + Analiză de eficiență

**Decizie Andrei (14.06.2026):** cele trei module se planifică **împreună** și se construiesc **în pași revizuiți** („o să facem revizuiri"). Packaging-ul de release se decide la final. Detaliul funcțional complet: `docs/drum_spre_v1.md` §1.A–§1.E.

### Modul A — Calibrare inteligentă
**Deciziile Î1–Î5 sunt luate (13.06.2026)** — vezi tabelul din `docs/decizii_deschise.md`. Conținut confirmat:
- **Calibrare 2–4 sesiuni per exercițiu** (Î1): stare derivată din istoric (`getCalibrationState`), badge „Calibrare · sesiunea X"; regulile de sesiuni curate încep după ieșirea din calibrare.
- **Semnal de efort categoric „prea ușor / ok / prea greu" pentru toți + RIR numeric doar la avansați** (Î4, experiență ≥2). Motorul suportă ambele (`feedbackUser`, `opts.rir`) — dar UI-ul NU le pasează azi (cod adormit de trezit).
- **Corecții ~5–10% rotunjite pe categoria de echipament** (Î2), aplicate **relativ la greutatea logată de utilizator**, nu la cea sugerată — anti-ancorare.
- **Logarea răspunsurilor la bannere** (Î3): câmp aditiv `banner: {tip, kg_propus, raspuns}`, zero UI nou — fundație v1.1 + intrare pentru Modul C.
- **Seriile rămân fixe** în MVP (Î5 amânat v1.1+).

### Modul B — Jurnal de măsurători
- **În profil** (rar): `varsta` *(NOU)*, `gen` *(există)*.
- **Serie în timp:** câmp aditiv `masuratori: [{data, greutate, talie, brat, piept, antebrat?}]` (cm + kg). Secțiune „Măsurători" în Profil cu grafice (refolosim graficul din `StatsRenderer`).
- Schemă aditivă, fără migrare distructivă.

### Modul C — Analiză de eficiență (DESCRIPTIVĂ)
- **Ton: descriptiv** (Andrei, 14.06.2026) — tendințe + marjă, fără verdict, fără recomandări.
- Patru dimensiuni: consecvență (încredere mare), forță (1RM ±5–10%), corp (medie mobilă, bandă ±0,5–1 cm), aliniere program↔obiectiv.
- Fără cauzalitate; date insuficiente → mesaj onest; orice formulă/prag: min. 2 surse + etichetă estimare.
- Extinde direcția v1.2 „Statistici și vizualizare".

### Research R1 — AMÂNAT (sesiune dedicată, mai în adâncime)
Greutate de start din greutatea corporală + gen + vârstă. NU blochează Modulele A–C.

**Criteriu de acceptare (Modul A):** un utilizator nou ajunge la greutăți stabile în ≤4 sesiuni per exercițiu, fără sesiuni irosite.

## Revizuire programe (de prioritizat — versiune neasignată)

Temă transversală cerută de Andrei (13.06.2026): o trecere în revistă a calității programelor generate, pe două direcții. Nu blochează v1.0; se prioritizează separat.

### A. Split-uri adiționale — evaluat „bro split" și altele
- **Stare azi:** 9 split-uri în `js/generator.js` (`SPLITS`), toate construite pe tipare push / pull / legs / upper / lower / full body. Selecția automată: matricea `_recSplit(zile, experienta, obiectiv)`.
- **Lipsește un bro split** (split pe grupe musculare: zi de piept, zi de spate, zi de umeri, zi de brațe, zi de picioare) — tipic la 5 zile, popular la cei orientați pe masă/estetică (experiență ≥2).
- De evaluat: introducerea bro split-ului ca opțiune (nu neapărat recomandat automat — rămâne o variantă manuală în lista de la 5 zile); eventual și alte variante (ex. Arnold split, PPL × 2 la 6 zile dacă se deschide opțiunea 6 zile).
- ⚠ Decizii de produs înainte de implementare: la ce nr. de zile apare, pentru ce profiluri îl recomandăm vs. doar îl oferim, cum acoperă slot-urile fiecare zi de grupă (nevoie de `SLOT_TEMPLATES` noi: piept, spate, umeri, brațe).
- Atenție la regulile de siguranță/echilibru (spec cap. 5): bro split-ul concentrează volumul pe o grupă/zi — verificat că echilibrul push:pull săptămânal rămâne ≥1:1.

### B. Organizarea exercițiilor pe nivel de dificultate
- **Stare azi:** fiecare exercițiu are câmpul `nivel` (1–3) în `data/exercises.json`; generatorul filtrează cu `maxLevel(experienta)` (exp 0→nivel 1, exp 1→≤2, exp 2+→≤3).
- De revizuit pe toată biblioteca (85 exerciții): acuratețea atribuirii nivelului per exercițiu, acoperirea fiecărui tipar de mișcare pe toate cele 3 niveluri (spec cap. 4 cere asta), și o progresie clară de la nivel la nivel (varianta de nivel 2 a unei mișcări să fie un pas logic peste nivel 1).
- Scop: un începător (nivel 1) să primească mereu variante sigure și executabile, iar avansul pe niveluri să fie o cale de progresie reală, nu doar un filtru.
- Output propus: un audit tabelar (tipar × nivel → ce exerciții există / unde sunt goluri) → completări în bibliotecă acolo unde lipsesc trepte.

## v1.0 — Lansarea MVP

- ~~Export/import .json al datelor~~ ✅ **livrat în v0.9.6** (Profil → Exportă/Importă datele, cu ecran de confirmare la import)
- Validare pe profilurile-test din spec cap. 10: profilurile 2 (casual), 3 (fesieri prioritar), 4 (zero echipament) integral; profilurile 1 și 5 fără componenta skandenberg
- Audit final: filtrele de siguranță, pornire curată cu localStorage gol ȘI cu date existente, comportament PWA offline

**Criteriu de acceptare:** toate profilurile generează programe corecte, verificate manual de Andrei.

## v1.1 — Antrenorul devine proactiv

### Date → program (adaptare per-utilizator, local) — decizie Andrei 15.06.2026
Bucla „datele tale îmbunătățesc programul TĂU", peste stratul de observație (Modul C). **Principii invariante:** (a) **propune și confirmă** — niciodată rescriere tăcută a programului; (b) **filtrele de siguranță nu se relaxează** (articulații sensibile, echipament) — adaptarea schimbă DOAR în interiorul constrângerilor.
- **Există deja (sămânța):** banner „Înlocuiește" pe ecranul Program când un exercițiu a dat durere ×2 / prea greu ×2 (`AdaptiveEngine.analyzeSkips`, chemat în `app.js`). De întărit.
- **Trezim `preferinte`** (azi doar inițializate): „nu-mi place" → exclus din generările viitoare; „mă doare" → exclus + alternativă.
- **Din efort + progresie (Modul A):** exercițiu care stagnează → propunere de înlocuire / schemă nouă de repetări (= treapta 2 de stagnare, mai jos).
- **Din măsurători (Modul B) + eficiență (Modul C):** dacă tendința nu se mișcă spre obiectiv pe N săptămâni → semnalare descriptivă + **ofertă** de revizuire a programului (ex. mai mult volum pe o grupă). Fără cauzalitate, fără auto-rewrite.
- **Avans pe niveluri:** progres logat → deblocăm variante mai grele / mai mult volum („programul a urcat de nivel").

### Restul v1.1
- Treapta 2 de stagnare: schemă nouă de repetări / propunere de înlocuire exercițiu (folosește log-ul de bannere din v0.10)
- Check-in periodic la 4–6 săptămâni · Deload automat propus · Faze de revenire după pauză
- ~~PR-uri țintă + milestones~~ ✅ **livrat** (v0.9.7 Obiective+pronostic pe Dashboard `GoalEngine.js`; v0.9.9 milestone-urile estimate marcate pe Calendar). Rămas opțional: obiective de greutate corporală/frecvență (Andrei a ales doar forța pentru start)
- ~~Gamificare~~ ✅ **livrat în v0.9.8**: ecran „Realizări" — nivel de forță (Începător→Elită + percentilă față de practicanți, `js/utils/StrengthStandards.js`) + insigne consecvență/forță (`js/engines/AchievementsEngine.js`). Rămas posibil: insigne de volum/varietate (Andrei a ales consecvență+forță), fapte populație generală pe mai multe milestone-uri
- **Reactivarea modulului skandenberg** (mini-onboarding la activare: stil + echipament dedicat) — ordinea exactă de confirmat cu Andrei

## v1.2 — Statistici și vizualizare

- Pagina Statistici (activează item-ul din navigare) + cardurile Progres / Recorduri / Calendar de pe dashboard
- Grafice de evoluție per exercițiu și pe grupe musculare
- **Analiza de eficiență (Modul C)** — tab/ecran „Eficiență": consecvență + forță + corp + aliniere, descriptiv, cu marjă (detaliu: `docs/drum_spre_v1.md` §1.C)
- Interfața simplă (toggle, spec cap. 9) — de confirmat dacă mai e dorită
- Skandenberg avansat: niveluri, zi grea/moderată, izometrie la masă

## v2 — Dincolo de local

- Conturi online + sincronizare cloud · Partajare programe · Aplicații native iOS/Android (de evaluat la momentul respectiv)
- **Învățare din date agregate** (pe radar, FĂRĂ angajament — decizie Andrei 15.06.2026): reglarea generatorului/bibliotecii pentru TOȚI din date anonimizate (scoruri exerciții, tabele de prescripție, atribuirea nivelurilor). Necesită backend + telemetrie + **consimțământ GDPR explicit** — sparge intenționat principiul local-first/confidențialitate, deci e strict v2, doar cu opt-in. NU se atinge înainte de Play Store.
