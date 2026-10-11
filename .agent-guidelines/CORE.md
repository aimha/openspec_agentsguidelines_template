## Naming conventions

### Branch

- `ai/<descrizione-breve-kebab-case>` — branch agenti AI
- `feature/<descrizione>` — feature developer
- `fix/<descrizione>` — bugfix developer
- `spec/<nome-change>`

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
.agent-guidelines/*
.cursor/
.env*               (eccetto .env.example)
.github/workflows/*
.husky/*
.opencode/commands/
.opencode/skills/
.npmrc
AGENTS.md
CLAUDE.md
commitlint.config.js
docker-compose.yml
Makefile
openspec/config.yaml
package-lock.json
package.json        (root e ogni sub-package)
scripts/check-flow.sh
scripts/sync-agents.js
```
