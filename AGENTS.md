<!-- GENERATED — non modificare direttamente. Fonte: .agent-guidelines/ → npm run sync-agents -->

## Naming conventions

### Branch

- `ai/<descrizione-breve-kebab-case>` — branch agenti AI
- `feature/<descrizione>` — feature developer
- `fix/<descrizione>` — bugfix developer
- `spec/<nome-change>`
- `chore/<descrizione>`

## Lingua

- **Commenti nel codice:** inglese
- **Documentazione** (README, docs/): italiano

## Header e commenti

### Header obbligatorio

Ogni file di codice inizia con questo blocco, seguito da una riga vuota. Si usa la sintassi di commento del linguaggio: `//` per TS/JS, `#` per shell e YAML.

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

- ROLE è una sola riga
- GOTCHAS è la sezione più importante: solo ciò che morde
- LAST UPDATED si aggiorna solo per modifiche semanticamente rilevanti
- Al termine di ogni sessione, `/update-context` aggiorna gli header dei file modificati

### Commenti inline

- Una riga sopra ogni metodo o funzione: **cosa fa**, non come

  ```typescript
  // Calculates the order total applying discounts and VAT
  function calculateTotal(order: Order): number { ... }
  ```

- Una riga sopra ogni gruppo logico di stato o costanti: il **dominio** che rappresenta
- I commenti descrivono il perché o il dominio, mai il cosa se è già evidente dal nome
- Sempre una riga sola, mai blocchi di commento su più righe
- Nessun commento su codice auto-esplicativo (getter banali, assegnazioni ovvie)

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
config/
docker-compose.yml
Makefile
openspec/config.yaml
openspec/specs/
opencode.json
package-lock.json
package.json        (root e ogni sub-package)
scripts/check-flow.sh
scripts/openspec-update.sh
scripts/sync-agents.js
```

---

# WORKFLOW — Dalla spec al merge

Ogni modifica al progetto è un **change OpenSpec**. Nessun codice viene scritto prima che la spec del change sia conclusa.

Una spec è **conclusa** quando:

1. `npx openspec validate <nome-change> --strict` passa
2. proposal, spec e design sono stati approvati da un umano nella PR della spec
3. la PR della spec è stata mergiata su `main`

## Il flusso in 8 passi

| Passo                 | Dove                         | Comando / artefatto                                   |
| --------------------- | ---------------------------- | ----------------------------------------------------- |
| 1. Analisi            | branch `spec/<nome-change>`  | `/grill` → `GLOSSARY.md`, eventuali ADR in `docs/adr/` |
| 2. Formalizzazione    | branch `spec/<nome-change>`  | `/opsx-new`, poi `/opsx-continue` → `proposal.md` e spec delta |
| 3. Dettaglio tecnico  | branch `spec/<nome-change>`  | `/opsx-continue` → `design.md`                        |
| 4. Validazione        | PR della spec                | `openspec validate --strict` + review umana           |
| 5. Piano              | branch `spec/<nome-change>`  | `/opsx-continue` → `tasks.md`, poi merge della PR     |
| 6. Lavorazioni        | worktree `ai/<nome-change>`  | sessione test, poi `/opsx-apply`                      |
| 7. Verifica           | worktree + PR                | `/opsx-verify`, test, summary, review umana           |
| 8. Chiusura           | worktree, prima del merge    | `npx openspec archive <nome-change> --yes`            |

### 1. Analisi

- Scegliere il nome del change (kebab-case) e creare il branch `spec/<nome-change>` da `main` aggiornato.
- `/grill <descrizione del change>` avvia l'intervista: una decisione alla volta, ogni decisione esplicita.
- I **fatti** (com'è il codice, cosa dicono le spec esistenti) li verifica l'agente. Le **decisioni** le prende l'umano: l'agente le propone con una raccomandazione e aspetta la risposta.
- I termini di dominio emersi vanno in `GLOSSARY.md` appena sono definiti.
- Le decisioni che valgono oltre il singolo change, difficili da invertire e frutto di un trade-off reale, vanno in un ADR in `docs/adr/`. Quelle locali al change finiranno in `design.md`.
- Nessun artefatto OpenSpec e nessun codice in questo passo. L'analisi si chiude con il riepilogo delle decisioni, input dei passi successivi.

### 2–3. Formalizzazione e dettaglio tecnico

- Sullo stesso branch, `/opsx-new <nome-change>` crea la cartella del change, senza artefatti.
- `/opsx-continue` crea un artefatto alla volta: `proposal.md`, spec delta, poi `design.md`. Rileggere ogni artefatto prima di passare al successivo.
- `design.md` rimanda agli ADR del passo 1 invece di ripeterli.
- I comandi OpenSpec di questi passi producono solo documenti: nessuna modifica al codice.

### 4. Validazione

- `npx openspec validate <nome-change> --strict` deve passare.
- Aprire la PR `spec/<nome-change>` → `main` e chiedere la review di proposal, spec, design, glossario ed eventuali ADR.
- `validate` controlla la forma, non il significato: la review umana è la parte che conta.

### 5. Piano

- Solo dopo l'approvazione: `/opsx-continue` crea `tasks.md` sullo stesso branch.
- Il primo gruppo di task è sempre la scrittura dei test derivati dagli scenari.
- Merge della PR: da questo momento la spec è conclusa.

### 6. Lavorazioni

Creare il worktree da `main` aggiornato, con lo stesso nome del change:

```bash
git worktree add ../worktrees/ai-<nome-change> -b ai/<nome-change>
cd ../worktrees/ai-<nome-change>
npm install
opencode .
```

Le lavorazioni sono divise in due sessioni separate:

| Sessione   | Contenuto                                                                   |
| ---------- | --------------------------------------------------------------------------- |
| Sessione 1 | test derivati dagli scenari, un test per scenario con il titolo esatto dello scenario; i test devono fallire; commit |
| Sessione 2 | `/opsx-apply`: implementazione fino al verde dei test, task spuntati in `tasks.md` |

L'agente della sessione 2 non modifica i test. Se un test sembra sbagliato, si ferma e lo segnala.

### 7. Verifica

- `/opsx-verify` confronta l'implementazione con gli artefatti del change.
- Tutti i test passano, ogni scenario ha il suo test.
- Summary obbligatorio in `docs/summaries/<nome-change>.md` (vedi sotto).
- PR `ai/<nome-change>` → `main` con review umana.

### 8. Chiusura

- Prima del merge, `npx openspec archive <nome-change> --yes` sposta il change in `openspec/changes/archive/` e fonde il delta nelle spec principali in `openspec/specs/`.
- Si usa la CLI e non `/opsx-archive`: la CLI fonde i delta in modo deterministico e si rifiuta di procedere se un `MODIFIED` perderebbe scenari esistenti. `/opsx-archive` fa riscrivere le spec all'agente.
- Se l'archive crea una capability nuova, la spec principale ha un `Purpose` segnaposto e la CI resta rossa finché l'umano non lo compila (almeno 50 caratteri) con un commit sul branch: gli agenti non possono modificare `openspec/specs/`. L'agente lo segnala nel summary, in "Domande aperte e suggerimenti".
- Il commit di archiviazione è l'ultimo dell'agente nella PR: codice e spec aggiornata entrano in `main` insieme.

## Change senza comportamento nuovo

Refactor, tooling e documentazione passano comunque da un change OpenSpec, ma senza spec delta: impostare `skip_specs: true` in `openspec/changes/<nome-change>/.openspec.yaml` e motivarlo nella proposal. L'eccezione resta esplicita e tracciata.

## Summary obbligatorio

Al termine del change creare `docs/summaries/<nome-change>.md`. Il nome corrisponde al change e al branch senza il prefisso `ai/`.

```markdown
# <nome-change>

## Cosa è stato modificato
- ...

## Cosa non è stato modificato
- ...

## Domande aperte e suggerimenti
- ...
```

## Sessioni

- Una sessione = un passo del flusso, o una delle due sessioni del passo 6
- Nuovo obiettivo = nuova sessione
- Chiudere la sessione orientativamente al 70-80% della context window; ideale non superare il 40-50%
- Al termine di ogni sessione eseguire `/update-context` per aggiornare gli header dei file modificati

### Segnali di degrado da monitorare

- L'agente ignora vincoli espliciti nelle guidelines
- Produce file non richiesti o modifica file fuori scope
- Il codice prodotto non rispetta le convenzioni di naming o struttura
- Le risposte diventano più generiche e meno specifiche al progetto

## Azioni vietate agli agenti

- Scrivere codice prima che la spec del change sia conclusa
- Modificare i test durante l'implementazione
- Modificare a mano `openspec/specs/`: si aggiorna solo con `npx openspec archive`
- Switch di branch durante una sessione
- Amend su commit già pushati
- Push diretti su branch protetti (`main`, `develop`)
- Operazioni di merge o rebase
- `--no-verify` su commit e push
- `npm audit fix --force`
- Modifica di file protetti (lista in CORE.md)

---

# PATTERNS — Pattern specifici dello stack
