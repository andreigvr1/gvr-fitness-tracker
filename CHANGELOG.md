# Changelog — GVR Fitness Tracker

## v0.9.1 — Bugfix-uri după review complet

- **Bugfix: split duplicat** în „Alte variante" — split-ul activ nu mai apărea și în lista de alternative
- **Bugfix: Skandenberg fără gen** — modulul de skandenberg transmitea acum corect parametrul `gen` la `prescribe()`, evitând recomandări greșite pentru femei
- **Bugfix: pauza la forță** — perioada de odihnă la exerciții de forță corectată la 180s (era 150s, sub minimul CSCS recomandat de 3 min)
- **Touch targets mărite**: butoanele +/− (step) 28→40px, butoanele ✓/✗ per serie 34→44px, butonul „Sari" min-height 36px — conform standardului Apple HIG
- **Bara de progres** din topbar antrenament îngroșată 3→4px pentru vizibilitate mai bună
- **Reducere mișcare** (`prefers-reduced-motion`): animațiile sunt dezactivate pentru utilizatorii care au setat această preferință în sistem

## v0.9.0 — Îmbunătățiri vizuale

- **Inel de progres SVG** pe cardul „Următorul antrenament" — arc colorat care arată ziua curentă din total (ex. 2/4), nu doar cifre
- **Animații de intrare** pe carduri: statisticile și istoricul de antrenamente apar cu un efect de fade-in cu decalaj (stagger), nu brusc
- **Numere statistici mai mari** — valorile principale (total antrenamente, volum, etc.) sunt acum mai lizibile
- **Animație flash la completarea unei serii** — când apeși ✓ sau ✗, rândul are un scurt flash verde înainte să se estompeze
- **Puls pe butonul CTA** din bara de navigare — butonul violet de start pulsează subtil continuu
- **Fade-in la schimbarea ecranului** — trecerea între Dashboard, Program și Profil e acum fluidă, nu instant

## v0.8.0 — Pagina Profil + siluetă caricaturală animată

- **Pagina Profil e activă** în meniu: vezi BMI-ul cu silueta, genul, înălțimea, greutatea, obiectivul, zilele și experiența + buton de editare
- **Silueta e acum caricaturală**: exagerată comic spre extreme — foarte subțire la subponderal, balon cu cap mic la obezitate
- **Animație elastică** (squash & stretch) când silueta își schimbă categoria
- La obezitate, silueta **tremură lent continuu**, ca o gelatină — efect amuzant
- Logica BMI mutată în modul comun (`BodyViz.js`), folosită și de onboarding și de Profil

## v0.7.3 — BMI cu siluetă vizuală

- La pasul de înălțime + greutate, **BMI-ul se calculează live** pe măsură ce tastezi
- Apare o **siluetă** care reflectă categoria: subțire la subponderal, normală, mai lată la supraponderal, și mai lată la obezitate
- Silueta e diferită pentru femei (șolduri mai late, talie marcată) și bărbați (umeri mai lați)
- Culori pe categorie: verde = normal, portocaliu = sub/supraponderal, roșu = obezitate

## v0.7.2 — Logică de gen implementată

- **Intervale de repetări feminine**: +2 rep față de bărbați la exerciții compuse și izolare (ex. 8–12 în loc de 6–10 la masă musculară) — femeile au mai mulți mușchi de rezistență și pot face mai multe rep la aceeași greutate relativă
- **Incremente de greutate mai mici pentru femei**: 1,25 kg la upper body (sub 40 kg) / 2,5 kg la lower body (sub 60 kg) — evită salturi procentuale prea mari la sarcini mici
- **Pauze mai scurte între serii pentru femei**: ~20% mai puțin față de bărbați — recuperare mai rapidă dovedită fiziologic
- **Hip thrust și abductie sold prioritizate** în programele feminine — activare maximă a fesierilor + prevenție prăbușire genunchi (ACL)
- **Exercițiu nou**: Abductie sold culcat lateral (fără echipament) — pentru utilizatoarele fără benzi elastice
- **Cue de formă la ghemuit/fandare pentru femei**: "Menține genunchii deasupra degetelor mari" — prevenție activă a riscului ACL mai mare la femei
- **Factori de corecție 1RM pentru femei** în motorul de progresie — increment dinamic bazat pe gen și sarcina curentă

## v0.7.1 — Înălțime și greutate adăugate în profil

- Pas nou în onboarding (pasul 2): **Înălțime** (cm) și **Greutate** (kg)
- Câmpurile sunt opționale — poți trece mai departe fără să le completezi
- La editarea preferințelor, valorile salvate se pre-completează automat
- Datele sunt salvate în profil și vor fi folosite pentru personalizare avansată

## v0.7.0 — Setări fixate, gen adăugat, navigație completă

- **Fix Setări**: buton ✕ de închidere în colțul de sus; răspunsurile existente sunt pre-completate — nu mai ești întrebat de la zero
- **Întrebare gen** adăugată ca primul pas al onboarding-ului (Bărbat / Femeie) — influențează selecția exercițiilor și progresia greutăților (implementare completă urmează)
- **Statistici și Profil** apar acum în bara de navigare cu badge „Curând" — placeholdere vizuale pentru funcții viitoare
- Motor de progresie RIR rescris: scădere automată la RIR=0, progresie mai rapidă la RIR≥4
- Progresie bodyweight: la exerciții fără echipament, trecere la variații mai grele în loc de greutăți; centura de greutăți tratează BW ca echipament
- Selecție split îmbunătățită: matrice pe baza zilelor + experiență + obiectiv (nu mai e Full Body by default)
- Managementul accidentărilor: check-in la sesiunea 6 după raportare, sugestie specialist după 28 de zile
- Fix pull-up: rămâne exercițiu competitiv chiar dacă utilizatorul are cablu
- Fix genunchi/coapse: increment implicit 2,5 kg în loc de 5 kg

## v0.6.2 — Layout adaptat pe ecrane late

- **Dashboard pe 2 coloane** pe desktop: antrenamentul următor + statistici + „În curând" în stânga, activitatea recentă în dreapta
- **Programul pe 2 coloane**: variantele de split și zilele de antrenament una lângă alta
- Butoanele din subsolul programului stau pe un rând
- Ecranul de antrenament: coloană mai lată, centrată
- Pe mobil totul rămâne neschimbat (o coloană)

## v0.6.1 — Fix actualizare

- Pagina principală (HTML) se încarcă acum mereu de pe internet când ești online, cu fallback offline din cache — versiunile noi apar imediat la refresh, fără așteptare

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
