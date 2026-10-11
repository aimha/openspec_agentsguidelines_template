# CORE — Architettura, naming, restrizioni assolute

## Stack

## Struttura del progetto 

## Naming conventions

### File e cartelle

### Branch

- `ai/<descrizione-breve-kebab-case>` — branch agenti AI
- `feature/<descrizione>` — feature developer
- `fix/<descrizione>` — bugfix developer

## Lingua

- **Commenti nel codice:** inglese
- **Documentazione** (README, docs/): italiano

## File header obbligatorio

Ogni file TS/JS deve iniziare con questo blocco:

```
// ============================================================
// ROLE: [cosa fa questo file, 1 riga]
// DEPENDS ON: [file/moduli da cui dipende]
// USED BY: [chi usa questo modulo]
// KEY DECISIONS: [perché alcune scelte non ovvie]
// GOTCHAS: [trappole, edge case, comportamenti inattesi]
// LAST UPDATED: [data ISO + breve descrizione]
// ============================================================
```

## Regole ESLint

- `explicit-function-return-type`, `no-floating-promises`, `complexity` max 10, `max-lines-per-function` 50, `no-console`, `no-explicit-any`
- Override per `**/*.spec.ts`: disabilita `explicit-function-return-type`, `max-lines-per-function`, `no-unsafe-*`, `unbound-method`

## Commit

- Conventional Commits con commitlint
- `subject-case: lower-case` — nomi di librerie vanno lowercased nel subject
- Pre-commit hook con Husky + lint-staged

## Regole generali

- Non duplicare logica già esistente: cercare prima
- Prima di modificare un file esistente, leggerlo interamente
- Al termine di ogni modifica, elencare i file toccati
- Problemi fuori scope: segnalare nel summary senza sistemare autonomamente

## Gestione dipendenze

Nessuna nuova dipendenza senza approvazione esplicita. Segnalare nel summary come domanda aperta.

## Gestione ambiguità

Se un requisito è ambiguo, l'agente si ferma e formula la domanda specifica nel summary. Nessuna implementazione basata su assunzioni non dichiarate.

## File protetti — mai toccati dagli agenti

```
package.json        (root e ogni sub-package)
package-lock.json
.env*               (eccetto .env.example)
docker-compose.yml
.github/workflows/*
Makefile
```
