# Changelog — GVR Fitness Tracker

## v0.6.0 — Navigație adaptivă (mobil vs desktop)

- **Pe telefon**: bară de navigare fixă jos (Acasă · Antrenează · Program), cu butonul de start central, proeminent — ca în aplicațiile native de fitness
- **Pe laptop/desktop** (ecrane late): sidebar lateral cu logo „GVR Fitness" și etichete complete
- Navigația apare doar după salvarea programului; în timpul antrenamentului ecranul rămâne „focus", fără bară (nu pierzi seriile logate dintr-o atingere greșită)
- Butonul „Antrenează" pornește direct ziua care urmează
- Respectă zona de siguranță a telefoanelor cu notch (safe-area)

## v0.5.3 — Refactor vizual pe toată aplicația

- **Iconițe SVG peste tot** — au dispărut toate simbolurile text (▶ ↔ ⊘ ✓ ✗ ⚑ 🎉) și emoji-urile inconsistente
- **Ecranul de antrenament**: bară de progres sub topbar care se umple pe măsură ce termini exercițiile, buton „Înapoi" cu săgeată, butoane Sari conturate, ✓/✗ desenate
- **Ecranul de program**: butoane play violet cu strălucire, bifă verde pe zilele complete, iconițe pe toate acțiunile din subsol
- **Ecranul de motive (skip)**: butoane radio ca în onboarding, în loc de emoji
- **Onboarding**: bară de progres cu gradient
- Bannerele de recomandare și tempo au acum iconițe aliniate și spațiere corectă

## v0.5.2 — Dashboard redesenat

- Header personal: salut + data de azi + buton de preferințe (iconiță, nu text)
- Cardul „Următorul antrenament" cu inel de progres (ziua X din Y) și durată estimată
- **3 statistici reale**: total antrenamente, antrenamente săptămâna asta, volum total ridicat (kg/tone)
- Secțiuni cu titluri și linii separatoare („Activitate recentă", „În curând")
- **4 carduri placeholder** pentru features viitoare: Calendar, Progres, Recorduri, Skandenberg
- Iconițe SVG în loc de emoji — arată identic pe orice telefon

## v0.5.1 — Polish vizual

- Fundal cu gradient violet subtil în partea de sus
- Carduri cu adâncime: umbre fine, borduri delicate, gradient discret
- Butonul principal cu gradient și strălucire violet
- Cardul „Urmează" de pe Dashboard cu efect de lumină
- Câmpurile de input cu inel de focus violet
- Micro-animație la apăsarea butoanelor

## v0.5.0 — Dashboard + generator inteligent + skip cu motive

### Dashboard și flux de antrenament
- Buton **„✓ Salvează programul"** după configurare → te duce pe noul **Dashboard**
- Dashboard-ul știe ce zi urmează (după Ziua 1 urmează Ziua 2, apoi reia ciclul)
- **Istoric cu date calendaristice**: fiecare antrenament salvat apare cu ziua și data
- Buton **„Modifică preferințele"** — refaci onboarding-ul fără să pierzi istoricul de antrenamente

### Generator de exerciții rescris (selecție pe sloturi)
- Fiecare zi pornește de la mișcările fundamentale: picioare (squat/hinge), împins, tracțiune — apoi exerciții pe grupele tale prioritare, iar core/carry doar la final
- La antrenamente scurte (4-5 exerciții), carry și exercițiile de condiție nu mai ocupă sloturi importante
- Alternativele propuse la swap sunt acum din același tipar de mișcare
- **3 exerciții noi bodyweight** (ramat inversat, ramat cu prosop la ușă, superman) — acum și fără echipament primești un program complet, inclusiv spate

### Skip exerciții cu motive
- Buton „⊘ Sari" pe fiecare exercițiu în timpul antrenamentului
- La finalul zilei: întrebare „De ce ai sărit?" cu 6 motive (oboseală, timp, durere, prea greu, echipament, altceva)
- **Adaptare automată**: durere/prea greu de 2+ ori pe același exercițiu → aplicația propune înlocuirea; lipsă de timp/oboseală de 3+ ori → sugerează program mai scurt / volum redus
- Ziua finalizată apare cu bifă verde în lista programului

## v0.4.0 — Etapa 4: Logare serii + Motor de progresie

### Ce s-a adăugat
- **Logare pe serie**: la fiecare exercițiu poți înregistra greutatea (kg) și repetările, cu butoane + / − pentru ajustare rapidă
- **Marcare reușit/nereușit**: bifă verde (✓) sau cruce portocalie (✗) per serie
- **Motor de progresie automată**:
  - Prima sesiune: banner albastru cu instrucțiune de calibrare
  - Sesiuni curate la capătul de sus al range-ului → banner verde "+2,5 kg"
  - 2 sesiuni consecutive nereușite → banner portocaliu "-7,5%"
  - Altfel: banner gri cu greutatea recomandată
- **Explicație tempo 3-1-3**: la exercițiile Skandenberg cu tempo specific, apare un banner portocaliu cu explicația completă (3 sec coborâre · 1 sec pauză · 3 sec ridicare)
- **Progres vizual**: counter "X / Y exerciții" în topbar, exercițiile completate se marchează automat
- **Salvare antrenament**: la finalul sesiunii, un buton salvează totul în localStorage (array `antrenamente`)
- Trecere automată la exercițiul următor după completarea tuturor seriilor

## v0.3.0 — Etapa 3: Onboarding + Generator + Today view

- 9 pași de onboarding (obiectiv, experiență, zile, timp, echipament, articulații, grupe prioritare, Skandenberg)
- Generator de program cu split A/B, scoring și filtre de siguranță
- Motor Skandenberg cu 4 stiluri (Top Roll, Hook, Presă, Bază)
- Vizualizare program cu switcher de split și swap per exercițiu
- Today view cu tab-uri pe zile și detalii exerciții

## v0.2.0 — Etapa 2: Prototip design + Bibliotecă exerciții

- 77 exerciții în `data/exercises.json`
- Prototip de design static (3 ecrane, accent Violet ales de Andrei)

## v0.1.0 — Etapa 0+1: Setup

- Setup inițial: specificație v0.2, instrucțiuni de proiect, structură repository
- Pagină "în construcție" publicată pe GitHub Pages
