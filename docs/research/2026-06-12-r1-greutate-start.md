# Research R1 — Greutatea de start estimată din greutatea corporală

Data: 12 iunie 2026 · Pentru: v0.10 (calibrare) — cerut de `drum_spre_v1.md` §1.4 „de făcut ÎNAINTE de implementare"
Regula proiectului: minim 2 surse independente per afirmație · Statut: propunere spre decizia lui Andrei (formula și coeficienții intră în spec cap. 6 la aprobare)

---

## 1. Metoda propusă (în doi pași, ambii ancorați în surse)

**Pasul A — estimează maximul (1RM) al unui începător din greutatea corporală:**
`1RM estimat = greutate corporală × coeficient[tipar mișcare][gen]`

**Pasul B — greutatea primei sesiuni = ~50–55% din acel maxim estimat, rotunjită ÎN JOS la incrementul categoriei de echipament:**
- ACSM/NSCA: începătorii lucrează la **40–60% din 1RM** (10–15 repetări) — exact zona noastră de prescripție.
- Rhea et al. 2003 (meta-analiză): neantrenații răspund optim la **~60% 1RM**.
- Alegem capătul conservator (50–55%) pentru că: (a) valorile vin precompletate → riscul de ancorare documentat în `decizii_deschise.md` (Î1); (b) calibrarea din v0.10 corectează oricum în sus în 2–3 sesiuni cu pași de 5–10%; (c) principiul spec cap. 1: siguranța înaintea performanței. O subestimare costă o sesiune ușoară; o supraestimare costă formă proastă sau accidentare.
- Surse pas B: [NSCA Training Load Chart](https://www.nsca.com/contentassets/61d813865e264c6e852cadfe247eae52/nsca_training_load_chart.pdf) · [ghid ACSM/NSCA repetări-intensitate](https://www.back9rehab.com/blog/the-science-of-strength-choosing-the-right-reps-and-sets-for-your-goals) · [review minimalist training, PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10933173/) (Rhea)

## 2. Coeficienții (pasul A) — verificați pe 2+ surse

Surse independente folosite:
- **S1 — StrengthLevel** (bază crowdsourced, >150 mil. ridicări; nivelul „Beginner" = min. o lună de practică): valori per greutate corporală extrase din tabelele kg pentru bench/squat/deadlift/press.
- **S2 — Tim Henriques** (standard „decent după 6–12 luni", via Legion): bench 0,5×, squat 1,0×, deadlift 1,25×, press 0,4× pentru bărbați.
- **S3 — Jeff Nippard** („Beginner"): confirmă ordinea de mărime și raportul femei/bărbați (~50–60% la împins, ~60–75% la picioare/tracțiune — confirmat și de [Legion](https://legionathletics.com/strength-standards/)).

Convergența celor 3 surse pe „începător timpuriu" (1RM ca multiplu de greutate corporală) și **coeficienții propuși** (capătul de jos al intervalului — conservator):

| Tipar de mișcare | Interval surse (M) | **Coeficient M** | Interval surse (F) | **Coeficient F** |
|---|---|---|---|---|
| Împins orizontal (bench) | 0,50–0,65 | **0,50** | 0,25–0,30 | **0,25** |
| Genuflexiune (squat) | 0,75–1,00 | **0,75** | 0,48–0,50 | **0,45** |
| Hinge (deadlift) | 1,00–1,25 | **1,00** | 0,50–0,62 | **0,50** |
| Împins vertical (press) | 0,35–0,40 | **0,35** | 0,20 | **0,20** |

Exemplu de sanity-check (bărbat 75 kg, bench): 1RM estimat = 37,5 kg → start ~20 kg (bara goală) — prima sesiune realistă și sigură. Femeie 60 kg, squat: 1RM estimat 27 kg → start ~15 kg. Plauzibil.

Valori-sursă brute (StrengthLevel, Beginner 1RM kg): bench M 60/75/90 kg → 34/49/62; F 50/60/75 kg → 12/17/22 · squat M 47/66/83; F 23/29/37 · deadlift M 58/79/99; F 31/37/45 · press M 21/30/39; F 10/12/16.
Linkuri: [bench](https://strengthlevel.com/strength-standards/bench-press/kg) · [squat](https://strengthlevel.com/strength-standards/squat/kg) · [deadlift](https://strengthlevel.com/strength-standards/deadlift/kg) · [press](https://strengthlevel.com/strength-standards/overhead-press/kg) · [Henriques/Rippetoe via Legion](https://legionathletics.com/strength-standards/) · [Nippard](https://jeffnippard.com/blogs/news/how-strong-should-you-be-noob-to-freak-1)

## 3. Limitele și cum le tratăm

1. **StrengthLevel reprezintă oameni care se antrenează și se măsoară**, nu populația generală → bias în sus. Tratament: coeficienții aleși la capătul de jos + procentul conservator de la pasul B.
2. **„Începător" diferă între surse** (1 lună vs. 6–12 luni). Tratament: am ancorat pe definițiile cele mai timpurii; pentru utilizatorii cu experiență declarată >1 an se poate aplica un multiplicator (de decis la implementare — sau, mai simplu, MVP: aceiași coeficienți pentru toți + calibrarea corectează).
3. **Acoperire:** coeficienții sunt pe tiparele cu halteră. Tracțiune orizontală (row) nu are date solide la începători în sursele consultate — propunere: derivare din bench (~0,9× coeficientul de bench, de verificat la implementare pe paginile per-exercițiu StrengthLevel). Exercițiile bodyweight/bandă/izolare NU primesc estimare — rămâne flow-ul actual (conform §1.4 din drum_spre_v1).
4. **Maparea per-exercițiu** (85 de exerciții ale noastre → coeficient sau „fără estimare") e muncă de implementare, nu de research: StrengthLevel are pagini per exercițiu (inclusiv gantere — ex. dumbbell bench beginner M: 16 kg/ganteră), iar ExRx servește ca a doua sursă (necesită verificare manuală în browser — blochează accesul automat).
5. **Notă de actualitate:** ghidul ACSM 2026 (prima revizuire din 17 ani) mută accentul de pe %1RM pe RIR ca măsură de intensitate — întărește decizia din `decizii_deschise.md` Î4 (semnal de efort categoric la toți + RIR doar la experimentați). [Sursa](https://acsm.org/resistance-training-guidelines-update-2026/).

## 4. Formula finală propusă (pentru spec cap. 6, la aprobarea lui Andrei)

```
dacă exercițiul are coeficient (compound cu sarcină externă):
    1RM_estimat = greutate_corporală × coef[tipar][gen]
    start = rotunjit_în_jos(0,55 × 1RM_estimat, increment_categorie_echipament)
    afișat ca sugestie precompletată + badge „Calibrare" (v0.10)
altfel (bodyweight, benzi, izolare fără date):
    flow-ul actual (câmp gol / progresie pe variații)
dacă utilizatorul nu a dat greutatea corporală (Î2 e opțională):
    flow-ul actual — nicio estimare
```

## 5. Ce rămâne deschis (decizia lui Andrei)

- Aprobă metoda + coeficienții? (intră în spec cap. 6 la sesiunea de integrare)
- Multiplicator pe experiență (>1 an) sau aceiași coeficienți pentru toți în MVP? (recomandarea mea: pentru toți — calibrarea corectează oricum, complexitate mai mică)
- Procentul exact de la pasul B: 50% sau 55%? (recomandarea mea: 55%, rotunjit în jos)
