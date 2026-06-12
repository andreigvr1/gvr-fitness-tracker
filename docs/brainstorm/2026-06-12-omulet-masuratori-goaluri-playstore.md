# Brainstorm — Vizualizare corp, ținte și drumul spre Play Store — 12 iunie 2026

Sesiune /brainstorm cu Andrei. Raportul NU e comis automat în documentație — Andrei decide ce intră.

---

## Ideea 1: Omulețul BMI caricatural din Profil

- **Ideea, dezvoltată:** În Profil, o siluetă-caricatură care arată exagerat comic gras sau slab în funcție de BMI.
- **Nevoia din spate:** feedback vizual instant și memorabil despre starea corporală — mai puternic decât o cifră.
- **În contextul proiectului:** **EXISTĂ DEJA, integral**, în `js/utils/BodyViz.js` — siluetă SVG procedurală, 4 trepte BMI, diferențiată pe gen, cu exagerare intenționat comică („subponderal = băț cu cap mare, obez = balon cu cap mic"). E live în Profil din v0.9.x.
- **Versiune propusă:** — (livrat)
- **Mărime:** S, doar dacă Andrei vrea retușuri vizuale după ce o revede.
- **Întrebări rămase deschise:** Andrei a văzut omulețul actual? Corespunde viziunii (mai exagerat? cu față? cu brațe — vezi Ideea 2)?
- **Recomandarea mea, sinceră:** **adoptă** (e gata) — Andrei să-l revadă în aplicație și să spună ce ar schimba.

## Ideea 2: Măsurători corporale lunare + omulețul cu proporții reale

- **Ideea, dezvoltată:** O dată pe lună, la deschiderea aplicației, un banner cere setul de măsurători (antebrațe, brațe, piept/stern, abdomen, șold, picioare) — utilizatorul înregistrează sau amână; oricând poate adăuga manual din Profil. La fiecare câmp, silueta existentă servește drept „manechin": o animație simplă (linie punctată în jurul zonei) + instrucțiune scurtă arată punctul corect de măsurare. Cifrele și graficele de evoluție trăiesc în Statistici; omulețul din Profil își ia proporțiile din ultimele măsurători — el e recompensa vizuală, graficele sunt adevărul în cifre.
- **Nevoia din spate:** tracking al evoluției fizice pe zone (nu doar greutate totală) + motivație vizuală: „se vede că am progresat".
- **În contextul proiectului:** silueta e desenată parametric (lățimi separate pentru umeri/talie/șold/picioare în BodyViz.js) → legarea de măsurători reale e evoluție naturală, nu reconstrucție. **Lipsă vizuală: omulețul actual nu are brațe** — trebuie desenate pentru antebrațe/brațe. Schema de date primește un câmp nou aditiv (`masuratori[]`) cu migrare conform regulii 3 din CLAUDE.md. „O dată pe lună cere" = banner la deschidere (PWA fără server nu poate notifica cu aplicația închisă) — Andrei a confirmat implicit mecanismul.
- **Versiune propusă:** v1.2 (se așază natural lângă pagina Statistici planificată acolo).
- **Mărime:** M–L — formular + istoric + grafice (M), plus omulețul cu brațe și proporții din date + animațiile de măsurare (încă un M).
- **Întrebări rămase deschise:** măsurăm stânga/dreapta separat la brațe/antebrațe/picioare? (relevant pentru skandenberg — asimetria antebrațelor; costul: ~9-10 câmpuri în loc de ~6). **De verificat (research):** protocoale standard de măsurare antropometrică (punct, stare relaxat/contractat) — min. 2 surse.
- **Recomandarea mea, sinceră:** **adoptă**, pentru v1.2 — idee matură, cost rezonabil, se sprijină pe ce există. Aș faza: întâi colectarea + grafice, apoi omulețul dinamic.

## Ideea 3: „Cât de bine stai față de restul lumii" (percentile / niveluri)

- **Ideea, dezvoltată:** La anumite exerciții sau zone, aplicația îți spune unde te afli față de populație — ex. „20 de flotări = top X%". Variantă alternativă discutată: scară de niveluri (Începător → Intermediar → Avansat → Elită) cu praguri vizibile („încă 8 flotări până la Avansat").
- **Nevoia din spate:** motivație prin comparație socială + repere obiective („e mult sau puțin ce fac eu?").
- **În contextul proiectului:** nimic existent. Datele ar sta într-un fișier local (ca `exercises.json`) — offline, zero dependențe, conform regulilor. **Capcană semnalată:** date despre „planetă" nu există serios; există norme științifice pentru puține teste (ex. flotări pe vârstă/sex) și baze crowdsourced de „strength standards" care reprezintă practicanți, nu populația. Formularea onestă: „față de practicanți" sau niveluri cu praguri.
- **Versiune propusă:** v1.2+ (după Recorduri, cu care se înrudește).
- **Mărime:** M — fișierul de norme + afișare; research-ul e partea grea.
- **Întrebări rămase deschise:** procente „top X%" (cu asterisc de onestitate) sau niveluri cu praguri? Andrei: îi plac ambele — decizie amânată. **Research obligatoriu (min. 2 surse):** ce norme există, pentru ce exerciții, cât de solide.
- **Recomandarea mea, sinceră:** **adoptă conceptul, cu varianta niveluri** — pragurile („următoarea treaptă") motivează mai mult decât un procent abstract și sunt apărabile științific. Procentele se pot adăuga peste, unde există date bune.

## Ideea 4: Pagina Recorduri (PR-uri)

- **Ideea, dezvoltată:** Secțiune cu recordurile personale: cel mai bun set (greutate × repetări) la fiecare exercițiu, calculat din istoricul de antrenamente.
- **Nevoia din spate:** sentimentul de progres + punct de plecare pentru goal-uri (Ideea 5).
- **În contextul proiectului:** cardul „Recorduri — În curând" există deja pe dashboard (placeholder pentru v1.2). **Datele există deja integral** — fiecare serie logată (kg, rep, reușit) e în `antrenamente[]`; recordurile se calculează, nu se colectează. StatsEngine (fără UI încă) e locul natural.
- **Versiune propusă:** v1.2 (conform planului existent); poate fi tras mai devreme dacă se vrea — e ieftin.
- **Mărime:** S — calcul din istoric + un ecran.
- **Întrebări rămase deschise:** —
- **Recomandarea mea, sinceră:** **adoptă** — cost mic, valoare motivațională mare, fundație pentru Ideea 5.

## Ideea 5: Goal-uri pe exerciții + drumul calculat spre ele

- **Ideea, dezvoltată:** Utilizatorul își setează ținte la exercițiile alese — tipic un PR absolut („să ridic o dată 100 kg la împins la piept"). Aplicația: (a) estimează maximul actual din seriile logate (fără test periculos de „cât duci o dată"), (b) estimează un interval realist de timp până la țintă, recalculat continuu din ritmul real — ca un GPS care actualizează ora de sosire, (c) ajustează prescripțiile (repetări, greutăți) ca să te ducă acolo.
- **Nevoia din spate:** antrenament cu scop concret, nu doar „mai mult decât data trecută"; răspunsul la „când ajung acolo?".
- **În contextul proiectului:** v1.1 conține deja rândul nedetaliat „PR-uri țintă + milestones" — ideea asta ÎI DĂ conținutul. Se sprijină pe ProgressionEngine (există) + Recorduri (Ideea 4). Goal-urile = câmp nou aditiv în storage. **Principiu de siguranță fixat în sesiune:** dacă progresul nu ține ritmul țintei, aplicația MUTĂ DATA, nu umflă greutățile — termenul se adaptează la om, nu invers (spec cap. 1 invariant).
- **Versiune propusă:** v1.1 (înlocuiește/detaliază rândul existent), fazat: afișare PR (v1.2/Ideea 4) → setare goal + estimare termen → ajustarea prescripțiilor (partea grea).
- **Mărime:** L — partea de estimare + ajustare e cea mai complexă idee din sesiune.
- **Întrebări rămase deschise:** (1) goal de forță într-un program cu alt obiectiv (ex. masă) — ajustăm doar exercițiul respectiv spre schemă de forță? (propus de mine, decizie Andrei); (2) goal-uri și pe repetări la exerciții fără greutăți („20 flotări") — s-ar lega de Ideea 3. **Research obligatoriu (min. 2 surse):** formule de estimare a maximului (Epley/Brzycki etc.), ritmuri realiste de progres pe nivel de experiență, scheme sigure de periodizare spre un PR.
- **Recomandarea mea, sinceră:** **adoptă, fazat** — e cea mai valoroasă idee de produs din sesiune (diferențiator real față de aplicațiile de logare), dar și cea mai scumpă; research-ul decide cât de departe mergem cu „ajustarea automată".

## Ideea 6: Publicarea în Play Store (împachetare TWA)

- **Ideea, dezvoltată:** Aplicația intră în Play Store fără rescriere, ca PWA împachetată (TWA — „coajă" Android care deschide site-ul pe tot ecranul). Update-urile continuă să curgă prin site, fără re-aprobare în Store. Motivația lui Andrei: distribuție ușoară către testeri + obișnuirea cu workflow-ul.
- **Nevoia din spate:** instalare credibilă și simplă pentru testeri/utilizatori („e în Play Store") + canal de testare organizat.
- **În contextul proiectului:** v2 avea „aplicații native — de evaluat"; TWA e varianta ieftină care devansează asta. Cerințele tehnice (manifest, HTTPS, offline) sunt deja bifate. **Checklist verificat (surse: doc. oficial Google, ghid Google Codelabs, comunitate):** (1) cont dezvoltator personal ~25 $ taxă unică + verificare identitate; (2) împachetare cu PWABuilder → pachet Android + CHEIA DE SEMNĂTURĂ (de păstrat cu backup — pierderea ei = nu mai poți publica update-uri niciodată); (3) fișier Digital Asset Links pe site (leagă aplicația de domeniu); (4) fișa de magazin: descriere, capturi, icoană + politică de confidențialitate obligatorie + formular „siguranța datelor"; (5) **testare închisă: min. 12 testeri înscriși neîntrerupt 14 zile, cu folosire reală** (regulă pentru conturi personale create după nov. 2023; redusă de la 20 în dec. 2024) → abia apoi cerere de acces la producție; (6) recenzia Google → public. Mentenanță recurentă: reîmpachetare ~anuală cerută de Google (țintirea versiunii curente de Android) — administrativ, ~1 oră. Lighthouse ≥80 de verificat (aproape sigur trecem).
- **Versiune propusă:** în paralel cu drumul spre v1.0 — **cele 14 zile de testare închisă se suprapun natural cu validarea pe profiluri din Etapa 6**; testerii din comunitate devin beta-testerii v1.0.
- **Mărime:** S–M — 1-2 zile tehnice + ~1 zi birocrație + ~3 săptămâni de așteptări (în care se lucrează normal).
- **Întrebări rămase deschise:** găsește Andrei 12+ oameni reali care să o folosească 2 săptămâni? **Atenție:** exportul/importul .json (promis pentru v1.0) ar trebui livrat ÎNAINTE de testeri, ca să nu-și piardă progresul la reinstalări. **De verificat la momentul respectiv:** politicile Google pentru categoria sănătate/fitness.
- **Recomandarea mea, sinceră:** **adoptă** — cost mic, se aliniază perfect cu validarea v1.0, iar cerința de testeri devine avantaj. Condiționat de Ideea 7 (domeniul ÎNTÂI).

## Ideea 7: Domeniu propriu + mutarea pe Cloudflare Pages + pipeline automat

- **Ideea, dezvoltată:** (a) Cumpărarea unui domeniu propriu (~10–15 $/an, singura cheltuială recurentă) ÎNAINTE de împachetarea pentru Play Store — aplicația din Store se leagă pe viață de adresă; cu domeniu propriu, hosting-ul devine interschimbabil invizibil. (b) Mutarea hosting-ului pe Cloudflare Pages: trafic nelimitat gratuit, uz comercial permis (GitHub Pages îl interzice — blocant pentru planul de monetizare), statistici agregate de vizitatori fără cookies/consimțământ. (c) Pipeline: Cloudflare se conectează o dată la repo-ul GitHub → fiecare push publică automat; update-ul ajunge pe telefoane la următoarea deschidere prin banner-ul existent. Lanțul „Claude → push → Cloudflare → telefoane" funcționează deci din prima zi, fără automatizare de construit. **Decizie Andrei în sesiune: FĂRĂ notificări push** — ideea e abandonată.
- **Nevoia din spate:** independență de platformă pentru Play Store + drum legal spre monetizare + vizibilitate asupra utilizării.
- **În contextul proiectului:** GitHub Pages e fixat în CLAUDE.md (stack) — mutarea cere „motiv întemeiat": planul de monetizare ÎL CONSTITUIE (clauza comercială GitHub). Limitele actuale nu ne strâng (folosim ~0,1%); mutarea nu e urgentă tehnic, dar e curată înainte de împachetarea TWA. CLAUDE.md + arhitectura.md de actualizat la mutare.
- **Versiune propusă:** domeniul — imediat ce Andrei alege numele; mutarea — înainte de pasul de împachetare din Ideea 6.
- **Mărime:** S — configurare de o zi, fără cod.
- **Întrebări rămase deschise:** numele domeniului (decizie Andrei). **Research dedicat cerut de Andrei (sesiune separată):** comparație platforme prin lentila finală — monetizare, analytics, costuri la creștere.
- **Recomandarea mea, sinceră:** **adoptă** — domeniul e mișcarea strategică ieftină care deblochează tot restul fără riscuri.

## Ideea 8: Monetizare

- **Ideea, dezvoltată:** Andrei nu vrea să ceară bani de la oameni. Variante discutate: (a) reclame — respinse de mine cu argumente, rămân pe masă; (b) buton de donații tip „dă-mi o cafea" — i-a plăcut lui Andrei: zero infrastructură legală, zero degradare UX, S de implementat.
- **Nevoia din spate:** acoperirea costurilor + eventual venit, fără barieră de preț pentru utilizatori.
- **În contextul proiectului:** argumentele puse pe masă la reclame: (1) rețelele de reclame colectează date → consimțământ GDPR, politică de confidențialitate rescrisă, declarații Play Store — anulează povestea „nu colectăm nimic"; (2) matematica: câțiva $/mia de afișări → la sute/mii de utilizatori = bani de cafea, cu cost real în experiență (reclamă în mijlocul logării rupe fluxul). Donațiile evită ambele.
- **Versiune propusă:** post-v1.0; donațiile pot intra oricând (S).
- **Mărime:** donații S / reclame M (incl. infrastructura legală).
- **Întrebări rămase deschise:** **Research cerut explicit de Andrei (sesiune separată): surse potențiale de venit** pentru o aplicație de fitness gratuită — cifre reale de venit din reclame la scara noastră, modele de donații, sponsorizări de nișă (echipament skandenberg?), versiune premium viitoare etc. — cu regula de 2 surse.
- **Recomandarea mea, sinceră:** **adoptă donațiile, parchează reclamele** până la research-ul de venit — decizia finală după cifre, nu după impresii.

## Ideea 9: Telemetrie de produs + GDPR

- **Ideea, dezvoltată:** Colectare de date de folosire pentru dezvoltarea produsului, în două trepte: (1) **statistici agregate Cloudflare** (câți utilizatori, ce ecrane, ce țări — măsurate pe serverele lor, fără cookies, fără consimțământ, gratuite) — disponibile automat după mutarea de la Ideea 7; (2) **telemetrie adevărată din aplicație** (evenimente: „onboarding abandonat la pasul X") — cere: lista de evenimente definită pe principiul minimizării, punct de colectare (Cloudflare Workers, nivel gratuit suficient), ecran de consimțământ la primul start cu „Nu" perfect funcțional + buton de răzgândire în profil, politică de confidențialitate extinsă + formularul Play Store actualizat.
- **Nevoia din spate:** decizii de produs pe date, nu pe presupuneri.
- **În contextul proiectului:** contrazice filosofia local-first implicită din spec — schimbare de poziționare care **necesită decizia explicită a lui Andrei**, documentată. Infrastructura legală e comună cu reclamele (Ideea 8) — dacă se fac ambele, se fac împreună, o singură dată.
- **Versiune propusă:** treapta 1 — odată cu mutarea pe Cloudflare; treapta 2 — doar când există o întrebare concretă la care treapta 1 nu răspunde.
- **Mărime:** treapta 1 = 0 (vine gratis cu mutarea); treapta 2 = M (jumătate gândire și acte, jumătate cod).
- **Întrebări rămase deschise:** ce întrebări de produs ar justifica treapta 2? **De verificat (research legal):** cerințele GDPR exacte pentru telemetrie anonimă vs. pseudonimă.
- **Recomandarea mea, sinceră:** **adoptă treapta 1, parchează treapta 2** — nu construi infrastructură de colectare înainte să ai întrebarea.

---

## Decizii luate de Andrei în sesiune (de reflectat în documentație la integrare)

1. Fără notificări push — abandonat.
2. Monetizare fără a cere bani de la oameni; preferință pentru donații; reclamele rămân de evaluat după research.
3. Mecanismul „cere o dată pe lună" = banner la deschidere + adăugare manuală din Profil — acceptat.
4. Cifrele măsurătorilor în Statistici, omulețul din Profil le reflectă — împărțire confirmată.

## Research de făcut (sesiuni separate, regula: min. 2 surse independente + confruntare cu spec/cod)

| # | Subiect | Deblochează |
|---|---|---|
| R-a | Protocoale de măsurare antropometrică (puncte, stare) | Ideea 2 |
| R-b | Norme de performanță pe exerciții (științifice vs. crowdsourced) | Ideea 3 |
| R-c | Formule estimare 1RM + ritmuri sigure de progres pe nivel | Ideea 5 |
| R-d | Comparație finală platforme hosting (monetizare, analytics, costuri la creștere) | Ideea 7 |
| R-e | **Surse potențiale de venit** (cerut explicit: reclame cu cifre reale, donații, sponsorizări, premium) | Ideea 8 |
| R-f | GDPR pentru telemetrie anonimă/pseudonimă | Ideea 9 |

## Dacă adopți — pașii următori

- **Ideea 1:** nimic de documentat; Andrei revede omulețul în Profil → eventual listă de retușuri.
- **Ideea 2:** spec — capitol nou „Măsurători corporale" (schema `masuratori[]`, fluxul lunar, punctele de măsurare); plan_versiuni v1.2 + arhitectura.md §3 (schema) la implementare.
- **Ideea 3:** plan_versiuni v1.2+ rând nou; spec după research R-b.
- **Ideea 4:** plan_versiuni v1.2 — detaliere rând „Recorduri" existent.
- **Ideea 5:** drum_spre_v1 / plan_versiuni v1.1 — înlocuirea rândului „PR-uri țintă + milestones" cu spec-ul fazat + principiul „muți data, nu greutățile"; decizii_deschise — cele 2 întrebări (goal vs. obiectiv program; goal-uri pe repetări).
- **Ideea 6:** plan_versiuni — secțiune nouă „Drumul spre Play Store" lângă v1.0, cu checklist-ul + dependența de export/import .json (de tras înaintea testerilor); CHANGELOG la fiecare pas livrat.
- **Ideea 7:** decizie nume domeniu → la mutare: CLAUDE.md (stack: hosting) + arhitectura.md în același commit (regula 7).
- **Ideile 8-9:** plan_versiuni post-v1.0 după research R-e/R-f; spec — capitol „Confidențialitate și date" la activarea oricărei trepte.
