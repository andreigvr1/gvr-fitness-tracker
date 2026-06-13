# Drumul spre v1.0 — documentație funcțională detaliată

Ultima actualizare: 12 iunie 2026 · Acoperă: v0.10 și v1.0 (roadmap-ul general: `docs/plan_versiuni.md`)
Marcaj: ⚠ = punct care așteaptă decizia lui Andrei · ✏ = propunerea mea, neaprobată încă

---

## Partea 1 — v0.10: Calibrare inteligentă

### Comportamentul țintă (rezumat pe limbaj simplu)
La primele 2–4 sesiuni pe fiecare exercițiu, aplicația „caută" greutatea potrivită cu corecții mari și o întrebare scurtă de efort. După ce găsește greutatea, trece pe modul normal: incremente mici, reguli de sesiuni curate.

### 1.1 Starea de calibrare (per exercițiu)
- Un exercițiu e „în calibrare" până când: 2 sesiuni consecutive cu greutate stabilă (±1 increment) ȘI repetări în interval ȘI răspuns de efort „ok" — SAU până la a 4-a sesiune (plasă de siguranță).
- ⚠ Pragurile exacte (2 stabile / max 4) — de confirmat (decizii_deschise Î1).
- UI: badge „Calibrare · sesiunea X" pe cardul exercițiului în ecranul de logare.
- Implementare: stare DERIVATĂ din `antrenamente[]` la cerere (fără câmp nou în schemă, fără migrare); funcție nouă în ProgressionEngine, ex. `getCalibrationState(exId, antrenamente)`.

### 1.2 Semnalul de efort
- După ultima serie a unui exercițiu în calibrare: „Cum a fost? Prea ușor / Ok / Prea greu" (3 butoane, un tap).
- Merge direct în `feedbackUser` din ProgressionEngine — mecanismul există deja.
- NU întrebăm RIR numeric la începători (infirmat de studii — vezi decizii_deschise Î4). ✏ RIR numeric doar pentru experienta ≥ 2, ulterior (v1.1+).
- Răspunsul se salvează pe exercițiul din sesiune: câmp aditiv `efort: 'usor'|'ok'|'greu'` în obiectul exercițiului din `antrenamente[]`.

### 1.3 Corecții în calibrare
- „Prea ușor" sau toate seriile peste target+3 → +5–10% (procentul mare la picioare/compound, mic la izolări), rotunjit la incrementul categoriei de echipament.
- „Prea greu" sau serii ratate → −5–10%, aceeași rotunjire.
- ⚠ Rotunjire pe categorie vs. întrebare de inventar în onboarding — de decis (Î2). Propunerea mea ✏: categorie acum, inventar poate în v1.1.
- După calibrare: regulile actuale rămân neschimbate (N sesiuni curate → +increment fix; −7,5% la stagnare).

### 1.4 Greutatea de start din greutatea corporală (research R1 — de făcut ÎNAINTE de implementare)
- Scop: prima sugestie de kg să nu fie câmp gol, ci o estimare din greutatea corporală + gen + experiență (ex. „goblet squat: începe cu ~25% din greutatea corpului").
- Face utilă întrebarea de măsurători (decizia din 12.06).
- Regula proiectului: minim 2 surse independente per coeficient + verificare pe biblioteca noastră (multe exerciții bodyweight/bandă nu au coeficient — acolo rămâne flow-ul actual).
- ⚠ Pornirea research-ului R1 — de confirmat.

### 1.5 Logarea răspunsurilor la bannere (fundație v1.1)
- La fiecare banner de progresie afișat: salvăm aditiv `banner: {tip, kg_propus, raspuns: 'confirmat'|'modificat'|'ignorat'}` pe exercițiul din sesiune.
- Zero UI nou — doar instrumentare. Necesară pentru treapta 2 de stagnare (v1.1) și pentru a măsura dacă oamenii au încredere în sugestii.

### 1.6 Criterii de acceptare v0.10
- Profil nou, exercițiu cu greutăți: în ≤4 sesiuni ajunge la greutate stabilă; badge-ul dispare.
- Bodyweight/statice: calibrarea folosește rep/secunde, nu kg (ramura existentă rămâne).
- Datele vechi (fără câmpurile noi) se încarcă fără eroare.

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
