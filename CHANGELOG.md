# Changelog — GVR Fitness Tracker

## v0.9.10 — Pas de design (aspect rafinat)

Set nou de aspect, fără funcționalitate adăugată sau scoasă — doar cum arată:
- **Schimbarea temei s-a mutat în Profil**: butonul „Temă" din bara de jos a fost înlocuit cu un comutator clar Chalk / Slate în pagina Profil (secțiunea „Afișare"). Bara de navigație rămâne mai curată, cu butonul „Antrenează" pus în centru.
- **Calendar reproiectat**: zilele antrenate apar ca pastile pline (accent), „azi" ca inel, pronosticurile cu contur punctat; numărul de sesiuni dintr-o zi cu 2+ apare ca un badge. Sub calendar e acum o **legendă** care explică cele trei marcaje.
- **Ștergerea unui exercițiu** din program are acum o fereastră de confirmare îngrijită (cu numele exercițiului) în loc de pop-up-ul standard al browserului.
- **Realizări**: insigna deblocată își păstrează pictograma proprie și primește o bifă verde în colț; insignele de nivel arată și progresul către treapta următoare.
- **Detalii**: butoane „Înapoi" cu săgeată, pictograme consistente (coș de gunoi, ✕), cifre pe grafice și pe inelul de progres cu fontul aplicației (Bricolage Grotesque). Câteva etichete clarificate („Acasă", „Adaugă în program").
- Sub capotă: încărcarea ecranelor funcționează acum corect indiferent de calea de găzduire.

## v0.9.9 — Pronosticuri pe calendar + fix vizual

- **Calendarul arată acum pronosticurile obiectivelor tale**: luna estimată în care atingi fiecare țintă apare marcată cu un steguleț pe ziua respectivă, plus o listă „Pronostice obiective" sub calendar (ex. *„Împins la piept → 100 kg · ~iulie 2026"*). Atingi ziua marcată și vezi detaliul. Estimări orientative — apar doar pentru obiectivele cu suficiente date logate.
- **Fix vizual**: în secțiunea „Explorează" de pe dashboard, cardul rămas singur pe ultimul rând se întinde acum pe toată lățimea (după ce am adăugat cardul „Realizări", al cincilea card rămânea orfan, dezechilibrat).

## v0.9.8 — Realizări: nivel de forță + insigne (și fix obiective bodyweight)

- **Ecran nou „Realizări"** (din dashboard, cardul Realizări):
  - **Nivelul tău de forță** la ridicările principale (împins la piept, genuflexiuni, îndreptări, împins deasupra capului): pe ce treaptă ești (Începător → Elită, raportat la greutatea ta) și *„mai puternic decât ~X% dintre cei care se antrenează"*. Pragurile vin din surse credibile (Strength Level, Barbell Medicine, Legion) și sunt orientative. Comparația e **față de practicanți**, nu față de toată populația.
  - **Insigne** pe două categorii: *Consecvență* (primul antrenament, 10/25/50, săptămâni la rând) și *Forță* (Clubul 100 kg, împingi cât cântărești, squat 1,5×, deadlift dublu, atingi nivel Intermediar/Avansat). Multe cu bară de progres.
  - „Clubul 100 kg" arată și un fapt despre populația generală — clar etichetat ca estimare.
  - Nivelul de forță are nevoie de greutate + sex în profil; dacă lipsesc, îți spune să le completezi.
- **Fix obiective**: la exercițiile pur cu greutatea corpului (ex. flotări), ținta e doar pe **repetări** — opțiunea „kg" dispare (reapare dacă ai bifat centură de greutăți).

## v0.9.7 — Obiective cu progres și pronostic

- **Secțiune nouă „Obiectivele tale" pe Dashboard**: îți pui o țintă (ex. *Bench press → 100 kg* sau *Tracțiuni → 15 repetări*) și vezi o bară de progres + procentul față de țintă.
- **Pronostic cinstit**: aplicația estimează din evoluția ta logată când ai putea atinge ținta — ex. *„în ritmul actual (+2 kg/săpt.), estimat ~ septembrie 2026"*. Dacă n-ai destule date sau ritmul e plat, **nu inventează o dată** — îți spune clar „mai loghează câteva sesiuni".
- **🎉 La atingerea țintei** cardul devine verde și te felicită.
- Adaugi un obiectiv alegând un exercițiu din programul tău + tipul țintei (kg sau repetări); îl ștergi cu un tap. Datele se salvează lângă restul, fără să afecteze nimic existent.
- **Fix siguranță date**: editarea profilului nu mai poate șterge obiectivele sau tema aleasă (păstrăm tot ce ține de tine la re-editare).

## v0.9.6 — Backup: export și import al datelor tale

- **Buton „Exportă datele"** în pagina Profil → descarcă un fișier `gvr-backup-AAAA-LL-ZZ.json` cu tot ce ai (profil, program, istoric, recorduri). Ține-l în Drive/email — e plasa ta de salvare dacă browserul îți șterge datele sau schimbi telefonul.
- **Buton „Importă date"** → alegi fișierul, vezi un **rezumat de confirmare** (ex. „bărbat, masă, 4 zile · 23 antrenamente · ultima activitate: 13 iunie") și abia după ce confirmi se suprascriu datele. Un fișier greșit sau corupt **nu atinge** datele tale actuale — primești un mesaj clar.
- De ce contează: aplicația ține totul doar pe dispozitivul tău (fără cont online). Export/import e singura modalitate de a-ți muta sau salva istoricul.
- **Robustețe**: un backup parțial sau o versiune mai veche de date nu mai poate bloca dashboard-ul sau statisticile (gărzi defensive în motorul de statistici).

## v0.9.5 — Logare bodyweight curată + etichete zile corecte

- **Exercițiile cu greutatea corpului nu mai cer kg degeaba**: la flotări, genuflexiuni fără greutate, planșă etc. câmpul „kg" dispare — logezi doar repetările (sau secundele). Câmpul reapare automat dacă bifezi **Centură de greutăți** în echipament (atunci faci dips/tracțiuni cu kg adăugat). Aliniat cu modul în care progresează deja aceste exerciții (prin variații mai grele, nu prin greutate).
- **Etichetele de la pasul „Câte zile?" sunt acum corecte**: înainte spuneau un split fix (ex. „4 zile → Upper/Lower × 2"), dar programul real depinde și de experiență (întrebată după). Acum descriu abordarea („Fiecare grupă de ~2 ori"), nu un split care s-ar putea să nu fie cel ales.

## v0.9.4 — Redesign vizual: teme Chalk (luminos) + Slate (întunecat), fonturi noi, logo barbell

- **Două teme de culoare**: Chalk (fundal cald, hârtie) și Slate (cărbune închis) — comuți cu butonul din bara laterală pe desktop; aplicația ține minte alegerea ta
- **Tema se aplică înainte de primul pixel afișat** — nu mai există flash de culori la pornire
- **Accent nou: roșu brand** (#D5362B / #E5463A) înlocuiește violetul — mai atletic, mai clar pe ambele teme
- **Fonturi noi, descărcate local** (funcționează offline):
  - *Bricolage Grotesque* — titluri, cifre mari, statistici
  - *Albert Sans* — text curent, etichete, butoane
  - *Saira Condensed* — logo wordmark
- **Logo barbell nou** în bara laterală desktop: halteră SVG + GVR FITNESS (V roșu)
- **Fix teme luminos**: borduri, umbre și efect de luciu pe carduri tokenizate — nu mai dispar pe fundal alb
- **Cardul „Următorul antrenament"** rămâne inversat (panel întunecat) indiferent de temă — contrast garantat
- **Graficele** din Statistici și calendarele sunt lizibile în ambele teme (folosesc tokeni, nu culori hardcodate)
- Fonturile sunt self-hosted în `assets/fonts/` — nu se face nicio cerere externă

## v0.9.3 — Paginile noi: Statistici, Progres, Recorduri, Calendar + configurare Skandenberg

- **Butonul Statistici din meniu e activ**: pagină nouă cu 3 tab-uri — Sumar (totaluri, volum, serii reușite, graficul ultimelor 8 săptămâni), Progres (graficul evoluției greutății per exercițiu, cu selector) și Recorduri (cel mai bun set al tău la fiecare exercițiu, calculat din istoric)
- **Calendar lunar**: zilele antrenate apar marcate; atingi o zi și vezi ce ai lucrat (sesiune, exerciții, volum); navighezi între luni
- **Cardurile de pe dashboard s-au trezit**: „În curând" a devenit „Explorează" — Calendar, Progres și Recorduri deschid paginile lor; toate cu iconițe
- **Configurare Skandenberg**: cardul deschide un mini-chestionar (stilul tău: Top roll / Hook / Presă / bază + echipamentul dedicat: masă, centură de judo, mânere). Configurarea se salvează și te așteaptă — **programul tău NU se schimbă încă**; modulul de antrenament se activează într-o versiune viitoare
- **Fix de siguranță a datelor**: configurarea de skandenberg nu se mai pierde când îți editezi profilul
- Graficele sunt desenate direct în aplicație (fără biblioteci externe) — totul merge offline, ca până acum
- Stări goale prietenoase peste tot: utilizatorul nou vede ce urmează să apară, nu ecrane goale

## v0.9.2 — Redesign vizual, logare simplificată, documentație la zi

- **Carduri de exerciții cu dungă violet** pe stânga + nume îngroșat, metadata discretă — ierarhie vizuală clară (inspirat din aplicațiile premium)
- **Buton activ evidențiat** în bara de navigare (fundal colorat)
- **Logarea seriilor simplificată**: doar câmpuri de scris pentru kg și repetări (butoanele +/− eliminate) — rezolvă și ieșirea conținutului din ecran pe mobil
- **Documentația adusă la zi**: spec v0.3 (onboarding-ul real, modulul skandenberg și interfața simplă marcate amânate), plan pe versiuni nou (`docs/plan_versiuni.md`), analize de produs (`docs/decizii_deschise.md`, `docs/analiza_onboarding.md`), structura repo corectată în CLAUDE.md și README
- *Notă: schimbările vizuale fuseseră publicate în doi pași intermediari fără incrementarea versiunii — corectat cu acest release.*

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
