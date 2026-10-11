## Naming conventions

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

## Commit

- Conventional Commits con commitlint
- `subject-case: lower-case` — nomi di librerie vanno lowercased nel subject

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
.husky/*
commitlint.config.js
.npmrc
scripts/sync-agents.js
.agent-guidelines/*
AGENTS.md
CLAUDE.md
openspec/config.yaml
opencode/commands/
.opencode/skills/
```
