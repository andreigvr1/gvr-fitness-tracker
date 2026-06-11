# /review-all — Review complet GVR Fitness Tracker

Rulează cele trei review-uri specializate în ordine și produce un raport consolidat.

1. Execută instrucțiunile din `/review-platform` complet
2. Execută instrucțiunile din `/review-workout` complet
3. Execută instrucțiunile din `/review-ui` complet

La final, sintetizează rezultatele într-un **Raport Master**:

```
## Raport Master GVR Fitness Tracker — [data]

### Scoruri
| Categorie            | Scor  | Probleme critice | Probleme majore |
|----------------------|-------|------------------|-----------------|
| Platformă (QA)       | X/10  | N                | N               |
| Antrenamente (Fitness)| X/10 | N                | N               |
| UI/Grafică (Design)  | X/10  | N                | N               |
| **TOTAL**            | X/30  |                  |                 |

### Probleme critice (de rezolvat imediat)
1. [problemă — categorie]
2. ...

### Probleme majore (de rezolvat în sprint-ul următor)
1. [problemă — categorie]
2. ...

### Top 3 îmbunătățiri recomandate
1. [sugestie]
2. [sugestie]
3. [sugestie]

### Concluzie
[2-3 propoziții: starea generală a produsului, cel mai important lucru de făcut acum]
```
