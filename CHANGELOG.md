# Changelog — GVR Fitness Tracker

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
