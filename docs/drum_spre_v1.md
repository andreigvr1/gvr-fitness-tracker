# Drumul spre v1.0 — documentație funcțională detaliată

Ultima actualizare: 15 iunie 2026 · Acoperă: corpul de lucru „Calibrare + Măsurători + Analiză de eficiență" și v1.0 (roadmap-ul general: `docs/plan_versiuni.md`)
Marcaj: ⚠ = punct care așteaptă decizia lui Andrei · ✏ = propunerea mea, neaprobată încă

---

## Partea 1 — Următorul corp de lucru: Calibrare + Măsurători + Analiză de eficiență

**Decizie Andrei (14.06.2026):** cele trei module de mai jos se planifică **împreună** (un corp de lucru coerent) și se construiesc **în pași revizuiți** („o să facem revizuiri"). Packaging-ul de release (incremental pe module vs. un release mare la final) se decide la final; fiecare pas se testează pe localStorage gol ȘI cu date existente.
- **Modul A — Calibrare inteligentă** (§1.A): bucla motor efort → corecție. Deciziile Î1–Î5 sunt luate.
- **Modul B — Jurnal de măsurători** (§1.B): măsurători de corp în timp, cu grafice.
- **Modul C — Analiză de eficiență** (§1.C): tendințe DESCRIPTIVE (fără verdict), cu marjă de eroare explicită.
- **Research R1** (§1.D): greutate de start din greutatea corporală — **amânat pentru o sesiune dedicată, mai în adâncime** (decizie 14.06.2026). NU blochează modulele de mai sus.

---

## §1.A Modul A — Calibrare inteligentă

### Comportamentul țintă (rezumat pe limbaj simplu)
La primele 2–4 sesiuni pe fiecare exercițiu, aplicația „caută" greutatea potrivită cu corecții mari și o întrebare scurtă de efort. După ce găsește greutatea, trece pe modul normal: incremente mici, reguli de sesiuni curate.

### 1.A.1 Starea de calibrare (per exercițiu)
- Un exercițiu e „în calibrare" până când: 2 sesiuni consecutive cu greutate stabilă (±1 increment) ȘI repetări în interval ȘI răspuns de efort „ok" — SAU până la a 4-a sesiune (plasă de siguranță).
- ⚠ Pragurile exacte (2 stabile / max 4) — de confirmat (decizii_deschise Î1).
- UI: badge „Calibrare · sesiunea X" pe cardul exercițiului în ecranul de logare.
- Implementare: stare DERIVATĂ din `antrenamente[]` la cerere (fără câmp nou în schemă, fără migrare); funcție nouă în ProgressionEngine, ex. `getCalibrationState(exId, antrenamente)`.

### 1.A.2 Semnalul de efort
- După ultima serie a unui exercițiu în calibrare: „Cum a fost? Prea ușor / Ok / Prea greu" (3 butoane, un tap).
- Merge direct în `feedbackUser` din ProgressionEngine — mecanismul există deja. **Constatare cod (14.06.2026):** azi `WorkoutRenderer` NU pasează niciun semnal de efort către motor (doar `isLowerBody/isBodyweight/hasCenturaGreutati/gen`), deci ramurile `feedbackUser`/`rir` sunt cod adormit. Modulul A le trezește.
- NU întrebăm RIR numeric la începători (infirmat de studii — vezi decizii_deschise Î4). ✏ RIR numeric doar pentru experienta ≥ 2, ulterior (v1.1+).
- Răspunsul se salvează pe exercițiul din sesiune: câmp aditiv `efort: 'usor'|'ok'|'greu'` în obiectul exercițiului din `antrenamente[]`.

### 1.A.3 Corecții în calibrare
- „Prea ușor" sau toate seriile peste target+3 → +5–10% (procentul mare la picioare/compound, mic la izolări), rotunjit la incrementul categoriei de echipament.
- „Prea greu" sau serii ratate → −5–10%, aceeași rotunjire.
- **Nuanță cheie (Î2):** corecția se aplică **relativ la greutatea logată de utilizator**, nu la cea sugerată de noi — sugestia e doar punct de pornire (anti-ancorare).
- Rotunjire pe categoria de echipament (Î2 — luat); NU adăugăm întrebare de inventar în onboarding.
- După calibrare: regulile actuale rămân neschimbate (N sesiuni curate → +increment fix; −7,5% la stagnare).

### 1.A.4 Logarea răspunsurilor la bannere (fundație v1.1)
- La fiecare banner de progresie afișat: salvăm aditiv `banner: {tip, kg_propus, raspuns: 'confirmat'|'modificat'|'ignorat'}` pe exercițiul din sesiune.
- Zero UI nou — doar instrumentare. Necesară pentru treapta 2 de stagnare (v1.1), pentru a măsura dacă oamenii au încredere în sugestii ȘI ca intrare pentru Analiza de eficiență (Modul C).

### 1.A.5 Criterii de acceptare (Modul A)
- Profil nou, exercițiu cu greutăți: în ≤4 sesiuni ajunge la greutate stabilă; badge-ul „Calibrare" dispare.
- Bodyweight/statice: calibrarea folosește rep/secunde, nu kg (ramura existentă rămâne).
- Datele vechi (fără câmpurile noi) se încarcă fără eroare.

---

## §1.B Modul B — Jurnal de măsurători

### Comportamentul țintă
Utilizatorul își poate înregistra periodic măsurătorile de corp și vede evoluția în timp, ca grafice (la fel ca graficele de progres la forță, dar pentru corp). Câmpurile cerute de Andrei (14.06.2026): **talie, brațe, piept, greutate, vârstă, sex**; opțional **antebraț** (sub cot). („Partea superioară" = brațul/bicepsul; antebrațul = sub cot.)

### 1.B.1 Unde stau datele (schemă aditivă, fără migrare distructivă — regula #3)
- **În profil** (se schimbă rar): `varsta` *(NOU — azi nu se colectează deloc)*, `gen` *(există)*.
- **Serie în timp** (relogabilă, cu dată): câmp nou `masuratori: [{ data, greutate, talie, brat, piept, antebrat? }]`. Circumferințe în cm, greutate în kg.
- Greutatea apare în două locuri logic distincte: `profile.greutate` (instantaneu, folosit la BMI/generare) + seria `masuratori[]` (evoluție). La logarea unei măsurători noi de greutate, actualizăm și `profile.greutate` (sursa unică pentru BMI).
- Toate aditive cu default; datele vechi se încarcă neatins.

### 1.B.2 UI
- Secțiune nouă „Măsurători" în Profil: buton „Adaugă măsurătoare" (formular scurt) + grafice de evoluție per metrică.
- Refolosim codul de grafic liniar SVG din `StatsRenderer` (desenat în cod, fără bibliotecă).
- ✏ Vârsta se adaugă la pasul de măsurători din onboarding (e nevoie de ea și se schimbă rar); circumferințele rămân opționale, doar în jurnalul din Profil (ca să nu îngreunăm onboarding-ul). De confirmat la implementare.
- Fără bătut la cap: logare manuală; eventual un reminder blând (opțional).

### 1.B.3 Criterii de acceptare (Modul B)
- Adăugarea unei măsurători apare imediat în grafic; profilul fără măsurători arată un gol curat („încă nu ai măsurători").
- Vârstă/sex editabile din profil; datele vechi (fără `varsta`/`masuratori`) se încarcă fără eroare.

---

## §1.C Modul C — Analiză de eficiență (DESCRIPTIVĂ)

### Comportamentul țintă
**Ton ales de Andrei (14.06.2026): DESCRIPTIV** — arătăm tendințe și cifre cu marja lor, FĂRĂ verdict „bine/rău" și FĂRĂ recomandări. Utilizatorul trage concluzia. Tonul ăsta ne ține și departe de zona de sfat medical/nutrițional.

### 1.C.1 Cele patru dimensiuni (fiecare cu nivelul ei de încredere)
1. **Consecvență — încredere mare.** Sesiuni/săptămână vs. țintă, rată de completare, skip-uri, streak. Logat direct, marjă ~zero. (Sursă: `StatsEngine`.)
2. **Forță — încredere medie, cu marjă.** Tendință per ridicare principală (regresia există deja, `StatsEngine.getExerciseSeries`), 1RM estimat din greutate×repetări, volum pe grupe în timp. Marja: formulele 1RM (Epley vs Brzycki) diferă ~5–10%, mai ales peste 10 rep → afișăm „estimat ~X kg (±Y)".
3. **Corp (din Modul B) — descriptiv, marjă mare.** Tendințe greutate/talie/braț, prezentate alături de obiectiv. Marja tratată explicit: bandă de măsurat ±0,5–1 cm (schimbări de câțiva mm NU sunt progres); greutatea fluctuează ±1–2 kg/zi → folosim **medie mobilă**, nu cântărirea de azi.
4. **Aliniere program ↔ obiectiv — încredere mare.** Grupa prioritară primește destul volum? Echilibrul push:pull ok? Frecvența potrivită? Derivat din program + istoric.

### 1.C.2 Principii invariante
- **Fără cauzalitate.** Nu spunem „antrenamentul ăsta ți-a adus 2 cm la braț". Descriem tendințe corelate cu obiectivul, atât.
- **Date insuficiente → mesaj onest** („mai loghează câteva sesiuni / măsurători"), nu un grafic inventat (la fel ca `GoalEngine` la pronostic).
- **Orice formulă sau prag** (1RM, ritm așteptat de progres) trece prin regula proiectului: minim 2 surse independente + etichetă „estimare". Vezi `feedback_research_verification`.

### 1.C.3 Unde trăiește
- Extinde direcția v1.2 „Statistici și vizualizare" (`plan_versiuni.md`). Probabil un tab/ecran „Eficiență" lângă Sumar/Progres/Recorduri.
- Sursă de date: `antrenamente[]` + `masuratori[]` + profil. Refolosește `StatsEngine`/`GoalEngine`/`StrengthStandards`.

### 1.C.4 Criterii de acceptare (Modul C)
- Fiecare cifră derivată dintr-o estimare e etichetată ca atare și are marjă/bandă.
- Cu puține date: mesaje oneste, fără grafice goale sau false.
- Tendințele de corp folosesc medie mobilă, nu valori brute zilnice.

---

## §1.D Research R1 — greutate de start din greutatea corporală (AMÂNAT)

**Decizie Andrei (14.06.2026): amânat pentru o sesiune dedicată, mai în adâncime.** NU blochează Modulele A–C.
- Scop: prima sugestie de kg să nu fie câmp gol, ci o estimare din greutatea corporală + gen + (acum) vârstă (ex. „goblet squat: începe cu ~25% din greutatea corpului").
- Face puntea între Modul B (măsurători) și Modul A (calibrare): un punct de start mai bun = mai puține sesiuni de „căutare".
- Regula proiectului: minim 2 surse independente per coeficient + verificare pe biblioteca noastră (multe exerciții bodyweight/bandă nu au coeficient — acolo rămâne flow-ul actual).

---

## §1.E Cum construim (decizie Andrei 14.06.2026)
- Cele trei module se planifică **împreună**, dar se construiesc **în pași revizuiți** — fiecare pas livrat → revizuit de Andrei → următorul.
- Packaging-ul de release (incremental pe module vs. un release mare la final) se decide la final.
- Fiecare pas: testat pe localStorage gol ȘI cu date din v0.9.x (migrare aditivă, fără pierderi).

---

## Partea 2 — v1.0: Lansarea MVP

### 2.1 Export / import .json — ✅ LIVRAT în v0.9.6 (13.06.2026)
Implementat în `js/utils/DataTransfer.js` + `renderProfil`/`showImportModal` din `js/app.js`, conform propunerii de mai jos (butoane în Profil, pachet `{schema, exportat_la, app_version, data}`, ecran de confirmare cu rezumat, import eșuat = date neatinse, acceptă și blob brut fără wrapper). Bonus „reminder backup la 10 antrenamente" rămâne neimplementat (opțional, vezi §3.5).

Propunerea originală (păstrată ca referință):
- **Unde:** pagina Profil, sub „Editează profilul": butoane „Exportă datele" + „Importă date".
- **Export:** descarcă `gvr-backup-AAAA-LL-ZZ.json` = `{ schema: 'gvr-data-v1', exportat_la, app_version, data: <tot blob-ul> }`.
- **Import:** file picker → validare (schema recunoscută, chei obligatorii prezente) → ecran de confirmare cu rezumat („profil: bărbat, masă, 4 zile · 23 antrenamente · ultima activitate: 10 iunie") → abia apoi suprascrie. Import eșuat = datele actuale rămân neatinse.
- **De ce critic:** localStorage poate fi șters de browser (curățare automată pe spațiu redus, ștergere istoric); fără export, utilizatorul își poate pierde tot istoricul. E singura plasă de siguranță în lipsa unui cont.
- ✏ Bonus mic: după fiecare 10 antrenamente, un hint discret „Fă-ți un backup".

### 2.2 Gap-uri față de spec, găsite la auditul din 12.06 (de rezolvat sau de amânat EXPLICIT)
| Gap | Spec | Stare | Propunere ✏ |
|---|---|---|---|
| „Nu-mi place" / „Mă doare" per exercițiu | cap. 6 | `preferinte` inițializate, nefolosite | v1.0 (e promisiune de bază) sau v1.1 — ⚠ decide |
| Check-in accidentări (după 6 sesiuni) + prag fizioterapeut | implicit cap. 1 (siguranță) | motor complet în AdaptiveEngine, fără UI | v1.1 (motorul există, e doar UI) — ⚠ decide |
| Echilibru push:pull ≥1:1 pe săptămână + regula scapulară condiționată | cap. 5 | NEVERIFICATE în cod | de verificat la auditul v1.0; dacă lipsesc → implementare înainte de lansare (sunt reguli de siguranță/echilibru) |
| Export/import | cap. 10 | lipsește | v1.0 (mai sus) |

### 2.3 Protocolul de validare (spec cap. 10, adaptat la amânarea skandenberg)
Pentru fiecare profil: onboarding complet → verificare program → 2 sesiuni logate → verificare recomandări.

| # | Profil | Verificări specifice |
|---|---|---|
| 1 | Masă+forță, 5 zile×60min, echipament complet (fără partea skandenberg) | split 5 zile corect, 7 sloturi/zi, compound dominant, pauze forță 180s |
| 2 | Sănătate, 3 zile×30min, gantere+bandă | doar 4 ex/zi, nivel ≤ după experiență, fără exerciții cu halteră/rack |
| 3 | Sănătate + fesieri prioritar, 3 zile×45min, acasă | slotul prio = fesieri în fiecare zi, hip thrust/glute bridge prezente |
| 4 | Începător total, 2 zile×30min, fără echipament | Full body A/B, 4 ex bodyweight nivel 1, progresie prin variații (nu kg) |
| 5 | 4 zile×60min, scripete + mâner rotativ (fără partea skandenberg) | program valid pe echipamentul dat; exercițiile skandenberg NU apar |

Plus, transversal: femeie vs bărbat pe același profil (range-uri +2, pauze −20%, incremente mici); fiecare articulație sensibilă bifată pe rând (exercițiile cu risc dispar).

### 2.4 Checklist de lansare v1.0
- [ ] Toate gap-urile din 2.2 rezolvate sau amânate explicit (decizie scrisă în plan_versiuni)
- [ ] Protocolul 2.3 trecut integral, verificat manual de Andrei
- [ ] Pornire curată: localStorage gol ȘI date din v0.9.x (migrare ok)
- [ ] Mobil 375px fără overflow orizontal pe toate ecranele
- [ ] Offline complet după prima încărcare (avion mode test)
- [ ] Export → ștergere date → import → totul identic
- [ ] APP_VERSION 1.0.0 + CACHE_VERSION + CHANGELOG + tag git `v1.0.0`

---

## Partea 3 — Idei de îmbunătățire (✏ toate; niciuna aprobată — de discutat la prioritizare)

1. **Cronometru de pauză** după bifarea unei serii (pauza_sec există deja per exercițiu!) — standardul Hevy/Strong; cea mai cerută funcție la concurență. Țintă naturală: v1.1.
2. **„Ultima dată: 20kg × 10"** mic, pe cardul exercițiului la logare — context instant, datele există. Posibil chiar v0.10 (efort mic).
3. **Feedback haptic** la bifarea seriei (navigator.vibrate, unde există) — promis de spec cap. 12 la micro-interacțiuni; efort minuscul.
4. **Hint de instalare iOS** („Adaugă pe ecranul principal") — PWA-ul pe iPhone nu se instalează singur; un banner o dată, discret.
5. **Auto-backup reminder** (legat de 2.1) — la fiecare 10 antrenamente.
6. **Calendarul vizual pe dashboard** — ideea mai veche a lui Andrei, țintă v1.2 (cardul „Calendar" există deja ca placeholder).
7. **Seturi minime vs. recomandate** — ideea mai veche a lui Andrei; de definit împreună înainte de a o programa.
