# Analiza întrebărilor de onboarding

Stare: **în analiză** · Creat: 12 iunie 2026 · Decident: Andrei
Metodă: fiecare întrebare verificată în cod (ce afectează concret) + confruntată cu spec cap. 3.

---

## Întrebările actuale (9, în ordinea din aplicație) — ce afectează fiecare răspuns

| # | Întrebarea | Ce afectează concret (verificat în cod) | Verdict |
|---|---|---|---|
| 1 | Femeie/bărbat | Incremente de greutate (1,25/2,5 kg vs 2,5/5 kg), +2 repetări la range-urile feminine, avertisment valgus la genunchi (squat/fandări), silueta BMI, prescripția skandenberg | ✅ Pertinentă — efect real, multiplu |
| 2 | Înălțime + greutate | **DOAR silueta BMI.** Generatorul nu le folosește deloc (verificat: zero referințe în generator.js) | ⚠️ **Promisiune falsă** — textul întrebării zice „folosite pentru a personaliza exercițiile și valorile de start" |
| 3 | Obiectiv | Range-uri de rep, pauze, raport compound:izolare, tip de progresie, recomandarea de split | ✅ Pertinentă — cea mai mare pârghie |
| 4 | Zile/săptămână | Split-ul recomandat + alternativele (tabelul cap. 5) | ✅ Pertinentă |
| 5 | Timp/sesiune | Numărul de sloturi (4/5/7/9 exerciții) | ✅ Pertinentă · minor: codul afișează valori fixe, spec-ul dă intervale (4-5, 5-6…) |
| 6 | Experiență | Pragul de progresie N (1 vs 2 sesiuni curate), filtrul de nivel al exercițiilor, recomandarea de split | ✅ Pertinentă · caveat: auto-raportată, imprecisă — calibrarea (decizii_deschise Î1) compensează |
| 7 | Echipament | Filtru strict în pipeline, ramura bodyweight a progresiei, incremente | ✅ Pertinentă — poartă tare |
| 8 | Grupe prioritare | Sloturi dedicate `prio` în șablonul fiecărei zile | ✅ Pertinentă · drift: spec promite „+2-4 seturi", codul face sloturi prioritare — aceeași intenție, alt mecanism |
| 9 | Articulații sensibile | Filtru strict contraindicații (invariant de siguranță, CLAUDE.md regula 5) | ✅ Pertinentă — neatinsă, nenegociabilă |

## Constatări principale

### C1. Întrebarea 2 (măsurători) promite ce nu face
Textul de sub întrebare: „Folosite pentru a personaliza exercițiile și valorile de start" — fals azi. Trei opțiuni:
- **(a)** Corectăm textul („folosite pentru indicele BMI și siluetă") — onest, 1 minut.
- **(b)** Le folosim cu adevărat: euristici de greutate de start raportată la greutatea corporală (de cercetat — candidat R1). S-ar lega direct de calibrare: o primă sugestie de greutate ar scurta convergența din decizii_deschise Î1/Î2.
- **(c)** Scoatem întrebarea — pierdem silueta BMI (feature plăcut).

### C2. Spec-ul cap. 3 nu mai reflectă realitatea (drift documentat)
- Î1 (seriozitate → interfață simplă/completă) și Î9 (skandenberg + stil) au fost **scoase** din onboarding prin decizia lui Andrei (commit 940fff7); codul fixează `interfata: 'completa'`, `skandenberg: false`.
- Genul și măsurătorile au fost **adăugate** (v0.7.2–v0.7.3) fără actualizarea cap. 3.
- Acțiune necesară: actualizat spec cap. 3 (+ cap. 2 dacă interfața simplă iese din MVP) ca sursa de adevăr să redevină adevărată.

### C3. Echipament skandenberg absent → conținut mort în bibliotecă
`data/exercises.json` conține variante blocate pe echipament skandenberg (masă, centură judo, FG, mânere) care **nu pot fi selectate de nimeni** azi, pentru că secțiunea de echipament skandenberg din spec Î6 nu există în cod. Acceptabil cât timp modulul e amânat, dar de notat în roadmap ca dependență a reactivării.

### C4. Întrebări candidat lipsă (de decis dacă merită fricțiunea)
- **Vârsta** — studiile de familiarizare arată diferențe mari pe vârstă (3-4 sesiuni tineri vs 8-9 vârstnici) → ar putea modula lungimea calibrării. Cost: +1 întrebare.
- **Inventar de greutăți** (din decizii_deschise Î2) — ar permite rotunjirea exactă a sugestiilor. Cost: fricțiune mare (listă de greutăți deținute).

## Research candidat (după validarea lui Andrei)

- **R1:** euristici de greutate de start pe baza greutății corporale la începători (pentru C1-b) — min. 2 surse independente + fezabilitate pe biblioteca noastră de 85 exerciții.
- **R2 (prioritate mică):** fiabilitatea experienței auto-raportate la clasificarea începător/avansat.

## Decizii luate (12 iunie 2026)

- **C1 → opțiunea (b) amânată:** păstrăm întrebarea de măsurători, dezvoltăm folosirea lor (greutate de start) mai târziu.
- **C3:** conținutul skandenberg rămâne în bibliotecă, va fi folosit la reactivarea modulului.
- **C2:** spec-ul se aduce la zi (acțiune separată).

---

## Maparea punctuală: întrebare → opțiune → efect (extras din cod, 12 iunie 2026)

Termeni: **compound** = exercițiu pe mai multe grupe simultan (genuflexiune, împins la piept); **izolare** = un singur mușchi (flexii biceps). Prescripția = serii × repetări + pauză între serii.

### 1. Femeie / bărbat
| Opțiune | Efect |
|---|---|
| Bărbat | Incremente standard: +2,5 kg trunchi / +5 kg picioare. Range-uri și pauze standard (vezi Obiectiv). |
| Femeie | +2 repetări la compound și izolare (ex. la masă: 8–12 în loc de 6–10) · pauze cu 20% mai scurte la compound/izolare (105s→84s) · incremente înjumătățite: 1,25 kg trunchi (<40 kg) / 2,5 kg picioare (<60 kg) · hip thrust / glute bridge primesc bonus mare de selecție (+18 pct), abducțiile bonus dublu (+10, prevenție ligament genunchi) · avertisment de tehnică (valgus) la squat/fandări/flexii genunchi · silueta BMI feminină. |

### 2. Înălțime + greutate
Azi: doar indicele BMI + silueta animată. Decis: va alimenta mai târziu sugestia greutății de start.

### 3. Obiectiv — prescripția completă (serii × rep interval, pauză)
| Obiectiv | Compound | Izolare | Static (planșă etc.) | Condiție | Alte efecte |
|---|---|---|---|---|---|
| Forță | 4 × 3–5, 180s | 3 × 6–10, 90s | 3 × 30–60s, 90s | 3 × 10–15, 45s | compound-urile +8 pct selecție → program dominant compound; la 3 zile forțează Full body (frecvență) |
| Masă | 3 × 6–10, 105s | 3 × 8–15, 60s | 3 × 30–60s, 75s | 3 × 12–15, 45s | izolările +4 pct; la 3 zile + experiență ≥ 1–3 ani → PPL |
| Sănătate | 3 × 8–12, 75s | 3 × 10–15, 60s | 3 × 20–45s, 60s | 3 × 10–15, 30s | profil echilibrat (referința) |
| Anduranță | 3 × 12–15, 45s | 3 × 15–20, 30s | 3 × 20–45s, 45s | 3 × 15–20, 30s | exercițiile de condiție +8 pct → apar în program |

### 4. Zile pe săptămână → split-ul recomandat
| Zile | Recomandat | Excepții după experiență/obiectiv |
|---|---|---|
| 2 | Full body A/B | alternativă oferită: Upper/Lower |
| 3 | după profil | începător SAU forță → Full body A/B/C; masă cu ≥1 an → Push/Pull/Legs; sănătate/anduranță → Upper/Lower/Full |
| 4 | Upper/Lower ×2 | peste 3 ani → PPL + Upper |
| 5 | Upper/Lower/Push/Pull/Legs | forță cu ≥1–3 ani → PPL + Upper/Lower |

### 5. Timp pe sesiune
| Opțiune | Sloturi | Efect secundar |
|---|---|---|
| ~30 min | 4 exerciții | sub 6 sloturi: carry/condiție −25 pct, statice −10 pct → primești aproape exclusiv fundamentale |
| ~45 min | 5 | la fel ca mai sus |
| ~60 min | 7 | loc pentru izolări + core |
| 75+ min | 9 | program complet cu accesorii |

### 6. Experiență
| Opțiune | Nivel max. exerciții | Prag de creștere a greutății | Split |
|---|---|---|---|
| De la zero | doar nivel 1 (cele mai simple) | crești după **1** sesiune curată | vezi tabelul 4 (ramurile „începător") |
| Sub 1 an | nivel ≤ 2 | după **2** sesiuni curate | idem |
| 1–3 ani | toate (nivel 3) | după 2 | deblochează PPL la masă, PPL+UL la forță |
| Peste 3 ani | toate | după 2 | deblochează PPL+Upper la 4 zile |

### 7. Echipament
- Filtru **strict**: un exercițiu intră doar dacă ai TOT echipamentul lui. Fiecare bifă deblochează exerciții noi.
- Cu echipament disponibil, variantele cu echipament primesc +7 pct față de bodyweight (excepție: tracțiuni, core).
- **Centura de greutăți** schimbă progresia la exercițiile bodyweight: cu ea adaugi kg; fără ea, la 20 rep/serie treci la o variație mai grea.

### 8. Grupe prioritare (0–3)
- Fiecare zi are un **slot rezervat** grupelor alese (al 4-lea/5-lea exercițiu).
- Pe toate sloturile, exercițiile care ating grupa aleasă primesc +20 pct → apar mult mai des.
- 0 selecții = slotul rezervat devine liber, programul e echilibrat.

### 9. Articulații sensibile
- Fiecare bifă **elimină complet** exercițiile care încarcă articulația respectivă (câmpul `risc_articular` din bibliotecă), fără excepții — regulă de siguranță nenegociabilă (CLAUDE.md regula 5).
- „Niciuna" = nimic eliminat.

**Notă de transparență:** scorul de selecție are și o componentă aleatoare mică (±2 pct) — de-asta două generări cu același profil pot diferi ușor la exercițiile accesorii. Fundamentalele rămân stabile.

## Pași următori

1. ~~Andrei decide C1~~ → decis: păstrăm + dezvoltăm mai târziu.
2. Actualizare spec cap. 3 la realitate (C2).
3. R1 (greutate de start din greutatea corporală) — de programat când reluăm calibrarea.
