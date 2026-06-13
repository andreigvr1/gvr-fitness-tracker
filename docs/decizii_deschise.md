# Decizii deschise — calibrare și progresie

Stare: **ÎNCHISE** (decizii luate de Andrei pe 13.06.2026) · Creat: 12 iunie 2026 · Decident: Andrei

> **Deciziile finale sunt rezumate la final** („Decizii finale — 13.06.2026"). Secțiunile Î1–Î5 de mai jos rămân ca istoric al analizei. Următorul pas: actualizare spec cap. 6–7 + implementare în v0.10.

Context: scenariul de utilizare descris de Andrei (onboarding → program → ghidare la primele antrenamente → acomodare la greutatea potrivită → sugestii precompletate pe baza performanței). Research-ul inițial (surse: ACSM, NSCA/CSCS, studii de familiarizare — vezi istoricul sesiunii) a generat 3 întrebări; validarea lor critică le-a reformulat și a scos la iveală una nouă.

---

## Î1 — Când trece aplicația din „căutare" în „progres"?

**Formularea inițială:** extindem calibrarea de la prima sesiune (spec cap. 6) la 2–4 sesiuni cu criteriu de convergență?

**Validare:** pertinentă, dar incompletă în 2 puncte:
1. Î1 și Î2 sunt o singură decizie — „calibrarea" nu e o etichetă, e perioada în care corecțiile sunt mari. Una fără alta nu schimbă nimic real în aplicație.
2. Presupune că putem detecta convergența din datele logate. Dar valorile vin precompletate → utilizatorul tinde să le accepte (ancorare) → datele pot părea stabile artificial. Criteriul are nevoie de un semnal de efort real (vezi Î4).

**Formularea corectată:** *Pe ce semnale și după câte sesiuni trece aplicația, per exercițiu, din modul „căutare" (corecții mari) în modul „progres" (incremente mici + reguli de sesiuni curate)?*

**Cum afectează flow-ul:**
- **Răspuns „doar prima sesiune" (spec actual):** utilizatorul vede mesajul de calibrare o singură dată; de la sesiunea 2 intră direct pe reguli de progresie. Risc: greutatea inițială greșită se corectează lent (increment fix pe sesiune).
- **Răspuns „2–4 sesiuni cu convergență":** badge „Calibrare · sesiunea X" pe exercițiu; corecții mari permise; regulile de „sesiuni curate" încep abia după. Risc: complexitate UI + nevoie de semnal de efort ca să nu convergem pe date false.

## Î2 — Cât de mari sunt corecțiile în calibrare?

**Formularea inițială:** pași de 5–10% în calibrare (corectat din 10–20% după verificarea ACSM/NSCA)?

**Validare:** pertinentă, dar ignora granularitatea echipamentului: gantere fixe sar în trepte (2→4→6 kg), discuri minime 1,25 kg, benzi discrete. La sarcini mici, incrementul fizic minim depășește oricum 10% (2,5 kg la 15 kg = 17%). Procentul teoretic trebuie rotunjit la ce există fizic.

**Formularea corectată:** *În calibrare, pasul de corecție = max(un increment de echipament, ~5–10%), rotunjit la saltul fizic posibil pe echipamentul utilizatorului (cunoscut din onboarding)?*

**Cum afectează flow-ul:**
- **Da:** după o sesiune evident prea ușoară, sugestia sare direct cu 5–10% (rotunjit) — convergență în 2–3 sesiuni. Necesită logică de rotunjire per tip de echipament.
- **Nu (incremente fixe peste tot):** cod neschimbat, dar acomodarea durează mai mult — utilizatorul cu greutate inițială mult greșită face 4–6 sesiuni suboptimale.

## Î3 — Treapta 2 de stagnare: MVP sau v1.1?

**Formularea inițială:** schemă nouă de rep / înlocuire exercițiu la a doua stagnare — în MVP sau rămâne v1.1 (cum zice spec-ul)?

**Validare:** pertinentă ca roadmap, dar urgența e artificială. Test de realitate: calea „stagnare → -7,5% → reconstrucție → a doua stagnare" cere realist **6–10+ săptămâni** de utilizare pe același exercițiu. Profilurile de validare (cap. 10) nu o ating în testare. A o lăsa în v1.1 nu pierde nimic în MVP.

**Întrebarea reală pentru MVP:** *stocăm de pe acum, per exercițiu, istoricul ciclurilor de stagnare (când, la ce greutate, ce s-a propus), ca treapta 2 să fie posibilă în v1.1 fără migrare de date?*

**Cum afectează flow-ul:**
- **Stocăm acum:** zero schimbări vizibile; schema de date capătă un câmp nou; v1.1 se construiește direct.
- **Nu stocăm:** MVP neschimbat; v1.1 va putea reconstrui parțial din istoricul brut al seriilor (datele primare există), cu logică retroactivă mai complicată.

## Î4 (nouă) — Întrebăm „câte repetări mai puteai face?" (RIR)?

**Origine:** descoperită la validarea Î1. Motorul de progresie suportă deja semnalul RIR (`ProgressionEngine`, `opts.rir`, logică completă), dar interfața nu îl colectează. Fără un semnal de efort, convergența calibrării se poate baza pe date ancorate.

**Întrebarea:** *colectăm RIR de la utilizator — niciodată / doar în calibrare / mereu?*

**Cum afectează flow-ul:**
- **Niciodată:** zero fricțiune; calibrarea se bazează doar pe ✓/✗ și rep — semnal slab când utilizatorul acceptă valorile precompletate.
- **Doar în calibrare (2–4 sesiuni/exercițiu):** o întrebare scurtă după ultima serie a exercițiului, doar cât durează calibrarea; semnal bun exact când contează; fricțiunea dispare după.
- **Mereu:** date maximale, dar fricțiune permanentă — aplicațiile mari evită asta (Fitbod întreabă ocazional, nu mereu).

## Î5 (candidat, nevalidată) — Ajustăm și numărul de serii în acomodare?

Scenariul lui Andrei menționa „ajustam seriile/repetarile". Reducerea numărului de serii la oboseală evidentă nu e acoperită de nicio întrebare de mai sus și nici de spec (seriile sunt fixate de slot/timp, cap. 5). De decis dacă e o întrebare reală pentru MVP sau zgomot.

---

## Rezultatele verificărilor (12 iunie 2026)

Fiecare afirmație: minim 2 surse independente + verificare în contextul proiectului.

### Î1 — riscul de ancorare: CONFIRMAT
- Surse independente: NN/g („The Power of Defaults" — utilizatorii rămân pe valorile implicite), Zuko/Baymard (utilizatorii acceptă valori precompletate chiar și greșite), studiu arXiv pe automation bias + ancorare.
- Practica aplicațiilor (2 surse): Fitbod pornește conservator din date populaționale și întreabă ocazional efortul real („max effort day"); Alpha Progression lasă utilizatorul să-și găsească greutatea inițială și învață din sesiunile logate. Ambele converg cu abordarea spec-ului nostru.
- **Consecință:** criteriul de convergență NU se poate baza doar pe stabilitatea valorilor logate — are nevoie de un semnal activ de efort (vezi Î4 revizuit).

### Î2 — constrânsă de o limită a proiectului
- Verificat în `data/exercises.json`: avem 15 categorii de echipament, dar NU inventarul utilizatorului (ce gantere are, ce discuri). Rotunjirea exactă la salturi fizice e imposibilă fără întrebări noi în onboarding.
- **Formulare finală:** pas de calibrare = max(incrementul categoriei de echipament, ~5–10%), rotunjit la incrementul categoriei. Alternativă (decizie de produs): adăugăm în onboarding o întrebare de inventar — mai multă precizie, mai multă fricțiune.

### Î3 — se dizolvă într-o întrebare mai mică
- Verificat în `js/storage.js`: un singur blob JSON aditiv — câmpuri noi nu strică datele vechi; risc de migrare zero.
- Verificat în `ProgressionEngine`: stagnarea se derivă deja din istoricul brut al seriilor la fiecare apel → istoricul stagnărilor e reconstruibil pentru v1.1 fără câmp nou.
- **Singura informație care se pierde azi:** răspunsul utilizatorului la bannerele de progresie (a confirmat / a modificat / a ignorat) nu se loghează. Întrebarea reală: *logăm răspunsurile la bannere?* (utval și pentru alte analize viitoare).

### Î4 — INFIRMATĂ pentru începători (recomandarea inițială retrasă)
- Steele et al. 2017, 141 participanți: cei neexperimentați estimează greșit cu ~4–5 repetări câte mai puteau face (experimentații: 1–2). Confirmare independentă: studiul PubMed 30747900 (precizia rămâne slabă chiar aproape de eșec) și Refalo 2024 (doar antrenații sunt preciși, eroare medie ~0,65 rep).
- **Consecință:** întrebarea numerică „câte mai puteai face?" produce date sistematic distorsionate exact la publicul-țintă al calibrării (începătorii).
- **Formulare finală:** ce semnal de efort colectăm per nivel de experiență? Propunere revizuită: întrebare categorică „prea ușor / ok / prea greu" pentru toți (motorul o suportă deja prin `feedbackUser`) + RIR numeric doar la experimentați (unde e fiabil).

### Î5 — necercetată încă (rămâne candidat, în așteptarea deciziei)

---

## Decizii finale — 13.06.2026

| # | Întrebare | Decizia lui Andrei | Implicație de implementare |
|---|---|---|---|
| **Î1** | Cât „caută" aplicația greutatea? | **2–4 sesiuni** cu semnal de efort, apoi progresie normală | `getCalibrationState(exId, antrenamente)` derivat din istoric; badge „Calibrare · sesiunea X"; regulile de sesiuni curate încep după ieșirea din calibrare |
| **Î2** | Cât de mari sunt corecțiile? | **Procent rotunjit pe categoria de echipament** (~5–10%). NU adăugăm întrebare de inventar. | **Nuanță cheie de la Andrei:** sugestia e doar un punct de pornire — utilizatorul scrie oricum greutatea reală cu care lucrează. Corecția se aplică **relativ la greutatea logată de el**, nu la cea propusă de noi. Asta elimină ancorarea (riscul confirmat la Î1). |
| **Î3** | Logăm răspunsurile la bannere? | **Da** | Câmp aditiv `banner: {tip, kg_propus, raspuns}` pe exercițiul din sesiune. Zero UI nou. Fundație pentru v1.1. |
| **Î4** | Ce semnal de efort? | **Categoric „prea ușor / ok / prea greu" pentru toți + RIR numeric DOAR la avansați** (experiență ≥ 2) | Categoric → `feedbackUser` (există). RIR numeric → doar pentru `experienta >= 2`, unde studiile arată că e fiabil. La începători RIR numeric NU se cere. |
| **Î5** | Reducem și nr. de serii la oboseală? | **Amânat v1.1+** | Seriile rămân fixe în MVP. Oboseala e deja tratată prin skip-adaptation (oboseală ×3 → propune program mai scurt). Se cercetează serios înainte de implementare. |

### Pași următori (după decizii)
1. Actualizare spec cap. 6–7 cu deciziile de mai sus.
2. Implementare v0.10 (vezi `docs/drum_spre_v1.md` §1) — acum deblocată.
