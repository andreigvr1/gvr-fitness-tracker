# GVR Fitness Tracker — Specificație funcțională MVP
Versiune document: 0.2 · iunie 2026 · status: în review

Schimbări față de v0.1: echipament skandenberg detaliat (Î6), stiluri de skandenberg (Î9 + cap. 8), split-uri alternative cu override manual (cap. 5), corelații obiective rescrise pe 4 dimensiuni (Pas 3), regula scapulară devenită condiționată (Pas 6), decizii închise (cap. 11), capitol nou de design (cap. 12), nume oficial.

---

## 1. Viziune și principii

O aplicație care construiește programul de antrenament în locul utilizatorului și ia deciziile de antrenor pe parcurs (când crești, când scazi, când schimbi), pentru orice profil: de la performanță (masă + skandenberg) până la mișcare ușoară pentru sănătate.

Principii care nu se negociază:

1. **Aplicația propune, utilizatorul confirmă.** Nicio decizie (creștere, regresie, schimbare de exercițiu, split) nu se aplică silențios — și utilizatorul poate suprascrie manual orice propunere.
2. **Recomandă doar ce poți face fizic.** Niciun exercițiu fără echipamentul necesar bifat.
3. **Siguranța filtrează înaintea performanței.** Articulațiile sensibile declarate elimină exercițiile cu risc, indiferent cât de "bune" sunt.
4. **Aderența reală bate planul ideal.** Ce loghează utilizatorul contează mai mult decât ce a declarat.
5. **Datele aparțin utilizatorului.** Stocare locală pe telefon, export/import oricând.

---

## 2. Scope MVP

| În MVP | NU în MVP (roadmap) |
|---|---|
| Onboarding complet (cap. 3) | Check-in periodic la 4-6 săpt. (v1.1) |
| Bibliotecă ~60-80 exerciții etichetate | PR-uri țintă + milestones (v1.1) |
| Generator + split-uri alternative (cap. 5) | Deload automat propus (v1.1) |
| Logare pe serie + calibrare | Faze de revenire după pauză (v1.1) |
| Motor de progresie/regresie (cap. 7) | Înlocuire automată la stagnare repetată (v1.1) |
| Înlocuire manuală exerciții + split | Statistici avansate, grafice pe grupe (v1.2) |
| Modul skandenberg cu stiluri (cap. 8) | Skandenberg: niveluri av./încep., zi grea/moderată, izometrie la masă (v1.2) |
| Interfață simplă / completă (toggle) | Conturi online, sincronizare cloud (v2) |
| PWA: offline, instalabilă, export/import | Versiuni iOS/Android native (v2) |

Criteriul de tăiere: MVP-ul trebuie să genereze un program corect pentru cele 4 profiluri-test (cap. 10) și să ghideze progresia săptămână de săptămână. Tot ce nu servește direct asta iese.

---

## 3. Onboarding (o singură dată, ~2 minute)

Fiecare răspuns e modificabil ulterior din setări.

**Î1. Cât de serios vrei să iei antrenamentul?**
- Vreau doar să mă mișc și să fiu sănătos → interfața simplă
- Vreau rezultate serioase (forță / mușchi / sport) → interfața completă

**Î2. Obiectivul principal?** (unul singur)
- Sănătate generală / tonifiere · Masă musculară · Forță / putere · Anduranță / condiție

**Î3. Câte zile pe săptămână poți antrena realist?** — 2 / 3 / 4 / 5

**Î4. Cât timp ai pe sesiune?** — ~30 / ~45 / ~60 / 75+ min

**Î5. Experiența cu greutățile?** — Încep de la zero / Sub 1 an / 1-3 ani / Peste 3 ani

**Î6. Ce echipament ai?** (bifare multiplă)

*General:*
- Nimic / doar corpul · Benzi elastice · Gantere · Halteră + discuri · Bancă · Power rack / suport · Bară de tracțiuni · Scripete / cablu · Sală completă (bifează tot generalul)

*Skandenberg / armwrestling* (secțiune separată, vizibilă mereu dar relevantă mai ales cu modulul activ):
- Masă de skandenberg
- Centură de judo (pentru cupping/pronation la scripete)
- Fat Gripz / manșoane de îngroșare
- **Mânere de skandenberg** → dropdown cu bifare multiplă:
  - Mâner rotativ (rolling handle)
  - Mâner conic (con / cone grip)
  - Mâner multi-grip / gros (2-3")
  - Mâner excentric (offset)
  - Wrist wrench
  - Bilă / sferă de grip
  - Altul (text liber)

**Î7. Grupe musculare prioritare?** (0-3 selecții)
Piept · Spate · Umeri · Brațe · Fesieri · Picioare · Abdomen

**Î8. Articulații sensibile sau accidentări?** (bifare multiplă)
Umăr · Genunchi · Lombar · Cot/încheietură · Niciuna

**Î9. Vrei modulul de skandenberg / armwrestling?** — Da / Nu
Dacă DA → **Ce stil tragi / vrei să dezvolți?**
- Top roll
- Hook (cârlig)
- Presă (triceps press)
- Nu știu încă / vreau bază generală
*(stilul determină compoziția blocului — vezi cap. 8; modificabil oricând din setări)*

**Final:** ecran-rezumat cu split-ul propus + programul generat. De aici: "Schimbă split-ul" (cap. 5, Pas 1), "Arată-mi altă variantă" (regenerare exerciții, max. 3 variante), înlocuire manuală per exercițiu. Abia apoi "Începe".

---

## 4. Biblioteca de exerciții

Schema de etichetare per exercițiu:

| Câmp | Valori | Exemplu (Goblet squat) |
|---|---|---|
| id, nume | — | goblet_squat, "Goblet squat" |
| pattern | squat, hinge, împins orizontal, împins vertical*, tracțiune orizontală, tracțiune verticală, unilateral picior, flexie genunchi, core, carry, izolare-[grupă], skandenberg-[componentă], condiție | squat |
| grupe principale | piept, spate, umeri, biceps, triceps, fesieri, cvadriceps, ischio, gambe, abdomen, antebraț | cvadriceps, fesieri |
| tip | compound / izolare / static / condiție | compound |
| echipament necesar | corp, bandă, ganteră, halteră, bancă, rack, bară tracțiuni, scripete, FG, masă, centură judo, mâner-[tip] | ganteră |
| nivel | 1 începător · 2 intermediar · 3 avansat | 1 |
| risc articular | umăr / genunchi / lombar / cot — sau gol | — |
| descriere execuție | 1-2 fraze pe limbaj simplu + 1 indicație de siguranță | "Ține ganterea la piept…" |
| reguli speciale | tempo impus, unilateral, timp în loc de repetări | — |

Reguli de construcție:
- Fiecare pattern acoperit pe **toată scara de echipament** (corp → bandă → ganteră → halteră/scripete) și pe **toate cele 3 niveluri**.
- Grupele prioritare populare (fesieri, brațe, abdomen) primesc min. 5-6 izolări pe echipamente diferite.
- Componentele de skandenberg au variante per echipament, inclusiv per tip de mâner deținut (ex. cupping cu mâner rotativ vs. centură de judo).
- Țintă MVP: **60-80 exerciții**. Calitatea etichetării > numărul.
- *Împinsul vertical există în bibliotecă, dar e blocat automat de "umăr sensibil".

Proces: biblioteca e construită de Claude, review integral făcut de Andrei (cu accent pe skandenberg și siguranța umărului).

---

## 5. Generatorul de program

**Pas 1 — Split-ul: propunere + alternative + override manual.**
Aplicația propune split-ul recomandat pentru zilele alese, dar afișează și alternativele, fiecare cu o explicație de un rând. Utilizatorul poate alege oricare.

| Zile | Recomandat | Alternative oferite |
|---|---|---|
| 2 | Full body A/B — "tot corpul de 2 ori, eficiență maximă pe frecvență" | Upper / Lower — "o zi trunchi, o zi picioare; sesiuni mai scurte per grupă, frecvență 1x" |
| 3 | Full body A/B/C — "fiecare grupă de 3 ori pe săptămână" | Upper / Lower / Full — "echilibru între volum concentrat și frecvență" · Push / Pull / Legs — "zile tematice; fiecare grupă 1x, volum mare per sesiune" |
| 4 | Upper / Lower × 2 — "fiecare grupă de 2 ori, sesiuni echilibrate" | Push / Pull / Legs / Upper — "PPL + o zi de trunchi în plus" · Full body × 4 — "frecvență maximă, volum mic per sesiune" |
| 5 | Upper / Lower / Push / Pull / Legs — "hibrid: tot 2x frecvență + zile tematice" | Push / Pull / Legs / Upper / Lower — "PPL clasic + repetarea trunchiului și picioarelor" |

Regula de afișare: o frază pe alternativă, fără jargon neexplicat; în interfața simplă, alternativele sunt ascunse sub "vezi alte variante".

**Pas 2 — Sloturi pe zi** (din timp): 30 min → 4-5 · 45 min → 5-6 · 60 min → 7-8 · 75+ → 8-10. Compound-urile întotdeauna primele.

**Pas 3 — Profilul obiectivului: 4 dimensiuni, nu doar repetări.**

Notă de fundament: evidența (meta-analizele Schoenfeld et al.) arată că hipertrofia e ~egală pe 5-30 repetări dacă seriile sunt aproape de eșec — range-urile de mai jos sunt alegeri practice, nu legi. Corelația tare e la forță: forța cere sarcini grele (specificitate). De aceea obiectivul modelează programul pe 4 dimensiuni:

| Obiectiv | Selecție (raport compound:izolare) | Repetări (compound / accesorii) | Pauze | Progresie + structură |
|---|---|---|---|---|
| Forță / putere | ~80:20 — dominant compound, izolări minime | 3-6 / 6-10 | 2-3 min / 90 s | pe greutate; mai puține exerciții, mai multe serii pe cele mari |
| Masă | ~60:40 | 6-10 / 8-15 | 90-120 s / 60 s | dublă (repetări → greutate); volum distribuit pe grupe |
| Sănătate / tonifiere | ~60:40, varietate de mișcare | 8-12 / 10-15 | 60-90 s | pe repetări, apoi greutate; sesiuni complete, simple |
| Anduranță / condiție | ~50:50, accent pe densitate | 12-15 / 15-20+ | 30-60 s | pe repetări/timp; opțional structură de circuit + componentă de condiție la final |

**Pas 4 — Selecția pe slot (pipeline):**
1. Filtru echipament (strict) → 2. Filtru contraindicații articulare (strict) → 3. Filtru nivel → 4. Punctaj: potrivire obiectiv + grupă prioritară + penalizare redundanță săptămânală + preferințe învățate → 5. Câștigătorul intră; următorii 2-3 clasați = lista "înlocuiește cu…".

**Pas 5 — Grupe prioritare:** +1 expunere/săptămână și +2-4 seturi pe grupa aleasă, scăzând din grupele neselectate, în plafonul de timp.

**Pas 6 — Reguli de siguranță transversale:**
- Echilibru push/pull verificat **pe săptămână** (raport tracțiune:împins ≥ 1:1).
- *Condițional:* dacă "umăr sensibil" e bifat SAU volumul de împins al zilei e mare (≥6 serii), generatorul adaugă un exercițiu scapular/deltoid posterior în ziua respectivă. Pentru restul utilizatorilor nu e obligatoriu.
- Deadlift greu și squat greu nu coexistă în aceeași zi.
- Niciun exercițiu cu risc pe o articulație declarată sensibilă, fără excepții.

---

## 6. Logare, calibrare, editare manuală

**Calibrare (prima sesiune pe fiecare exercițiu):** aplicația afișează: *"Alege o greutate cu care poți face confortabil 2-3 repetări peste target. Loghează ce ai făcut — de data viitoare îți recomand eu."* De la sesiunea 2, greutatea vine precompletată.

**Logarea pe serie:** greutate + repetări (precompletate cu recomandarea) + **bifă reușit/nereușit per serie**. Serie nereușită = repetări neînchise SAU formă cedată. Exercițiile statice loghează secunde; condiția loghează runde.

**Editare manuală:**
- "Înlocuiește exercițiul" → alternativele din pipeline + căutare în bibliotecă (doar exerciții valide pe echipamentul utilizatorului)
- Per exercițiu: **"Nu-mi place"** (exclus din recomandări) și **"Mă doare"** (exclus + "ce articulație?" → se adaugă la contraindicații)
- Înlocuirile manuale se rețin ca preferințe și influențează punctajul generatorului pe viitor.

---

## 7. Motorul de progresie (propune → confirmi)

**Sesiune curată** = toate seriile exercițiului bifate reușit, la capătul de sus al range-ului, la aceeași greutate.

| Situație | Acțiunea aplicației | Confirmare |
|---|---|---|
| N sesiuni curate consecutive (N=1 începători; N=2 altfel; N=2 întotdeauna la skandenberg) | Banner verde: "+2,5 kg azi" (halteră) / "+1-2 kg" (ganteră) / "+repetări" (corp/bandă) — precompletat | implicită, valoare modificabilă |
| 1 sesiune curată | "Încă una identică și crești" | — |
| Sesiune incompletă | "Rămâi la X kg până închizi toate seriile la Y repetări" | — |
| 2 sesiuni consecutive cu serii nereușite la aceeași greutate | Banner portocaliu: "Stagnare → recomand -7,5% (Z kg) și reconstruire" | Confirmă / "Mai încerc o dată" |

Progresia se urmărește **per exercițiu**, nu per slot. În interfața simplă, aceleași decizii sunt traduse în limbaj natural ("azi încearcă 12 în loc de 10").

---

## 8. Modulul skandenberg

Activat din onboarding (Î9) sau din setări. Două axe de adaptare: **stilul** decide compoziția blocului, **split-ul** decide plasarea.

**8.1 Compoziția blocului după stil** (3 componente + grip, 2x/săptămână unde split-ul permite):

| Stil | Componente prioritare | Componente secundare |
|---|---|---|
| Top roll | Cupping · Pronation · Rise | Back pressure (tracțiune cu cotul jos) · Grip |
| Hook | Cupping profund · Flexie încheietură supinată · Static de biceps (unghi închis) | Side pressure ușor* · Grip |
| Presă | Static de triceps (unghi de masă) · Side pressure* · Cupping | Stabilitate umăr/pect · Grip |
| Bază generală (nu știu încă) | Cupping · Pronation · Rise · Grip | — (blocul echilibrat, default) |

*Side pressure: doar amplitudine mică/izometric, niciodată cu brațul în urma planului corpului; blocat complet de "umăr sensibil" → înlocuit cu componenta următoare din listă.

**8.2 Variante pe echipament:** fiecare componentă există pe min. 2 niveluri de echipament, iar mânerele deținute (din Î6) deblochează variantele specifice:
- Cupping: scripete + centură judo / mâner rotativ la scripete / bandă ancorată
- Pronation: scripete + centură / mâner excentric / bandă / ganteră cu priză excentrică
- Rise: scripete / wrist wrench / ganteră / bandă
- Grip: bară ± FG / mâner gros sau rotativ atârnat / farmer hold

**8.3 Plasarea după split:**

| Split | Plasarea blocului |
|---|---|
| Full body ×2-3 | 2 componente per sesiune, la finalul a 2 sesiuni/săpt. (bloc divizat) |
| Upper / Lower | Blocul complet în zilele de Upper (după tracțiuni) |
| Push / Pull / Legs | Blocul complet în ziua de Pull; la stil presă, staticul de triceps migrează în ziua de Push |
| U/L/P/P/L (5 zile) | Bloc moderat pe Upper + bloc complet pe Pull (modelul validat) |

**Reguli fixe ale modulului:** tempo lent obligatoriu (3-1-3, protecție tendoane) · blocul niciodată înaintea compound-urilor de tracțiune ale zilei · progresie conservatoare (N=2 mereu) · volumul blocului intră în plafonul de timp al sesiunii (dacă nu încape, componentele secundare ies primele).

Amânat v1.2: niveluri începător/avansat, zi grea vs. moderată, izometria la masă, antrenament de meci.

---

## 9. Interfață simplă vs. completă

Comutabilă oricând din setări. Același motor, aceleași date — diferă afișarea:

| | Simplă | Completă |
|---|---|---|
| Antrenamentul zilei | listă cu descrieri pe limbaj normal + bifă "făcut" | serii cu kg/rep precompletate, bifă per serie |
| Progresie | mesaje naturale, fără procente | banner-e cu kg exacte, confirmă/modifică |
| Istoric | streak + "ești în progres la X exerciții" | istoric complet per exercițiu + grafic |
| Greutăți | opționale | obligatorii |
| Split | doar recomandarea (alternativele sub "vezi alte variante") | propunere + alternative + override |

---

## 10. Date, platformă, validare

**Platformă:** PWA instalabilă (Android + iOS), offline, hostată pe GitHub Pages. Upgrade-uri prin fișiere noi în repository → aplicația detectează versiunea și propune actualizarea; datele nu sunt atinse.

**Date:** localStorage local. Export/import .json. Fără cont, fără server în MVP. Limba: **doar română**.

**Profiluri de validare** (generatorul trebuie să producă programe corecte pentru toate, verificate manual):
1. Performanță: masă + forță, 5 zile × 60 min, echipament complet + masă + mânere, skandenberg top roll, umăr sensibil
2. Casual: sănătate, 3 zile × 30 min, doar gantere + bandă, interfață simplă
3. Sănătate + fesieri prioritar: 3 zile × 45 min, echipament de acasă
4. Zero: începător total, 2 zile × 30 min, fără echipament
5. *(nou)* Skandenberg hook, 4 zile × 60 min, scripete + mâner rotativ, fără masă

---

## 11. Decizii închise & întrebări rămase

**Închise (v0.2):**
1. Limba: doar română. ✔
2. Grupe prioritare: 2-3 selecții. ✔
3. Fără imagini; descriere text simplă per exercițiu. ✔
4. Split: aplicația propune → utilizatorul poate selecta manual alt split → aplicația propune exercițiile → utilizatorul le poate schimba; preferințele se rețin pe viitor. ✔
5. Biblioteca: construită de Claude, review de Andrei. ✔
6. Regenerare exerciții: max. 3 variante per slot. ✔
7. Nume: **GVR Fitness Tracker**. ✔

**Rămase:**
1. Lista finală de mânere din dropdown (Î6) — de validat de Andrei (ce există realist pe piață/în uz).
2. Identitate vizuală: paletă/logo GVR — propuneri la prima iterație de design (cap. 12), alegere finală la Andrei.
3. Compoziția exactă a blocurilor hook și presă (8.1) — schiță propusă, de validat de Andrei pe partea tehnică de armwrestling.

---

## 12. Design și identitate

Cerință: aspect de aplicație contemporană, finisată, premium — nu "proiect de weekend".

Direcții concrete prin care se obține asta (toate intră în MVP):
- **Temă dark ca default**, cu paletă restrânsă: un fundal aproape-negru, o suprafață de card, un singur accent puternic (folosit doar pentru acțiuni și progres) + culori semantice (verde = creștere, portocaliu = atenție). Fără curcubeu.
- **Tipografie cu ierarhie clară:** un font modern (variabil), 3 dimensiuni-cheie, numere tabulare pentru kg/repetări (cifrele aliniate vertical — detaliul care desparte aplicațiile finisate de cele cheap).
- **Spațiere generoasă și consecventă** (grid de 4/8 px), colțuri rotunjite uniforme, fără chenare grele — separare prin spațiu și contrast, nu prin linii.
- **Micro-interacțiuni:** tranziții scurte la bifă/salvare/banner (150-250 ms), feedback haptic la salvarea seriei (unde browserul permite), progres animat la milestones (v1.1).
- **Stări goale lucrate:** primul ecran fără date arată ce urmează, nu un gol.
- **Iconografie unitară** dintr-un singur set (linie, aceeași grosime).
- Logo/branding GVR: 2-3 propuneri la prima iterație de design, alegerea la Andrei.

---

*Următorul pas după semnarea spec-ului: construcția bibliotecii de exerciții (livrabil separat pentru review), apoi prototip de design (2-3 ecrane statice pentru validarea direcției vizuale), apoi implementarea.*
