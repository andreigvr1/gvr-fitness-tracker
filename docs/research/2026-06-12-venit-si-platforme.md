# Research R-d + R-e — Platforme de hosting și surse de venit

Data: 12 iunie 2026 · Regula proiectului respectată: minim 2 surse independente per afirmație.
Statut: spre decizia lui Andrei. Research-urile rămase (R-a măsurare antropometrică, R-b norme de performanță, R-c formule 1RM + ritmuri de progres, R-f GDPR telemetrie) se fac la apropierea de versiunile care le folosesc.

---

## R-e: Surse potențiale de venit

### 1. Reclame (AdMob/AdSense) — cifrele reale

- **eCPM** (venit la 1.000 de afișări): bannere 0,20–0,80 $ global (0,50–1,50 $ în țările bogate „Tier 1"); interstițiale (ecran întreg) 2,50–5 $ global. România NU e Tier 1 → capătul de jos al intervalelor.
- **Reper practic:** o aplicație mică cu **10.000 de utilizatori activi lunar** face din reclame **50–500 $/lună**. Sub 1.000 de utilizatori: ordinul câtorva dolari pe lună.
- Veniturile reale ies de regulă la 70–80% din estimările calculatoarelor (fill rate, sezonalitate).
- Costuri ascunse: consimțământ GDPR + politică de confidențialitate rescrisă + declarații Play Store + degradarea experienței (interstițialele plătesc decent doar dacă întrerup fluxul).
- Surse: [Playwire — AdMob eCPM benchmarks](https://www.playwire.com/blog/admob-ecpm-benchmarks-what-publishers-should-expect) · [MonetizeMore — cât fac aplicațiile din reclame](https://www.monetizemore.com/blog/how-much-ad-revenue-can-apps-generate/) · [Reacheffect](https://reacheffect.com/blog/how-much-can-an-app-make-from-advertising/)

**Concluzie:** sub ~10.000 de utilizatori activi, reclamele nu acoperă nici măcar efortul de implementare. De reevaluat doar dacă aplicația crește serios.

### 2. Donații („dă-mi o cafea") — comparația platformelor

| Platformă | Comision platformă | Note |
|---|---|---|
| **Ko-fi** | **0% pe donații unice** (doar procesarea plății ~3%) | 5% pe abonamente în planul gratuit; Gold 6 $/lună le elimină |
| Buy Me a Coffee | 5% + ~3% procesare (~8% total) | cel mai cunoscut brand |
| GitHub Sponsors | 0% | public de programatori, nepotrivit pentru utilizatori de fitness |

- Surse: [EarnifyHub — Ko-fi vs BMC 2026](https://earnifyhub.com/blog/kofi-vs-buy-me-a-coffee) · [SchoolMaker — BMC pricing](https://www.schoolmaker.com/blog/buy-me-a-coffee-pricing) · [Talks.co — ghid 2026](https://talks.co/p/kofi-vs-buy-me-a-coffee/)

**Concluzie:** **Ko-fi** e alegerea rațională pentru cazul nostru (donații unice, 0% comision). Implementare: un buton/link în Profil sau pe dashboard — efort S, zero infrastructură legală (plata se întâmplă pe platforma lor).

### 3. Premium / freemium — pentru viitor

- Conversie tipică freemium → plătit: **2–5%** din utilizatori.
- Aplicațiile de sănătate/fitness cu trial: conversie mediană trial→plătit 39,9% (top 10%: 68%) — dar modelul cu trial/paywall dur e alt produs decât al nostru.
- Paywall-ul dur convertește de ~5,5× mai bine decât freemium, dar contrazice filosofia aplicației (gratuită, datele la utilizator).
- Surse: [RevenueCat — State of Subscription Apps 2025](https://www.revenuecat.com/state-of-subscription-apps-2025/) · [Adapty — benchmarks fitness](https://adapty.io/blog/health-fitness-app-subscription-benchmarks/) · [First Page Sage — conversii freemium](https://firstpagesage.com/seo-blog/saas-freemium-conversion-rates/)

**Concluzie:** irelevant la scara actuală; de rediscutat doar la mii de utilizatori activi (eventual funcții v2 — sincronizare cloud — ca diferențiator premium natural).

### Recomandare finală R-e

1. **Acum → v1.0:** nimic — focus pe produs.
2. **Post-v1.0:** buton Ko-fi (donații unice, 0% comision) — efort S.
3. **Reclame:** prag de reevaluare ~10.000 utilizatori activi lunar; sub el, costă mai mult decât aduc.
4. **Premium:** parcat pentru v2, eventual legat de sincronizarea cloud.

---

## R-d: Platforma de hosting

### Cloudflare Pages — verificat în detaliu

- **Trafic nelimitat gratuit** + **uz comercial permis explicit** pe planul gratuit (fără card). Limita practică: 500 publicări/lună (noi: câteva/săptămână) și interdicție pe streaming video / fișiere mari (nu e cazul nostru).
- Surse: [Cloudflare — plan gratuit](https://www.cloudflare.com/plans/free/) · [doc. oficial limite Pages](https://developers.cloudflare.com/pages/platform/limits/) · [comunitate — uz comercial](https://community.cloudflare.com/t/cloudflare-pages-for-commercial-use/306890)

### Cloudflare Web Analytics — verificat

- Gratuit, **fără cookies, fără fingerprinting, fără urmărire individuală** — construit „privacy by design"; poziția oficială Cloudflare: „dacă site-ul tău are nevoie de banner de cookies, nu va fi din cauza noastră". Acoperă nevoia de „câți oameni folosesc aplicația" fără consimțământ și fără a atinge promisiunea de confidențialitate.
- Limită cunoscută: metrici simple (vizite, pagini, țări) — nu telemetrie de produs pe evenimente (aia rămâne decizia separată, R-f).
- Surse: [Cloudflare blog — analytics privacy-first](https://blog.cloudflare.com/privacy-first-web-analytics/) · [Ctrl blog — review tehnic independent](https://www.ctrl.blog/entry/review-cloudflare-analytics.html) · [Plausible — comparație critică](https://plausible.io/vs-cloudflare-web-analytics)

### Alternativele (verificate în sesiunea de brainstorm)

- Netlify: 100 GB/lună (egal cu GitHub Pages, fără avantaj real). Vercel: uz comercial interzis pe gratuit — descalificat. GitHub Pages: uz comercial interzis — descalificat de planul de monetizare.
- Surse: [DanubeData — comparație 2026](https://danubedata.ro/blog/cloudflare-pages-vs-netlify-vs-vercel-static-hosting-2026) · [DevToolReviews](https://www.devtoolreviews.com/reviews/vercel-vs-netlify-vs-cloudflare-pages-pricing-comparison-2026)

### Domeniul .ro — cost verificat

- Tarif oficial ROTLD: **12 EUR + TVA/an** (înregistrare și reînnoire); prin registrari acreditați, practic **7–12 EUR/an**.
- Surse: [ROTLD — prețuri oficiale](https://www.rotld.ro/prices/) · [HostX](https://www.hostx.ro/inregistrare-domenii/domeniu-ro.html) · [RCHost](https://rchost.ro/inregistrari-domenii/)

### Recomandare finală R-d

**Cloudflare Pages, cu domeniu propriu .ro (~10 EUR/an).** Singura platformă care bifează tot: trafic nelimitat, uz comercial permis (deblochează Ko-fi/reclame), statistici fără consimțământ, publicare automată din GitHub la fiecare push, Workers gratuit disponibil pentru viitor (telemetrie/notificări dacă se decid vreodată). Ordinea: domeniul → mutarea → abia apoi împachetarea Play Store.

**Cost total anual al întregii infrastructuri: ~10–15 EUR (domeniul). Restul: 0.**

---

## Pașii următori (dacă Andrei aprobă)

1. Andrei alege numele domeniului → înregistrare la un registrar ROTLD.
2. Configurare Cloudflare Pages legat de repository (o zi, fără cod).
3. Actualizare CLAUDE.md (stack: hosting) + arhitectura.md în același commit (regula 7).
4. Post-v1.0: cont Ko-fi + buton în aplicație (efort S, decizie de plasament la Andrei).
