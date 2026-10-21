# Vademecum del template

Template per progetti sviluppati con agenti AI. Ogni modifica parte da una spec OpenSpec approvata, l'agente lavora in un worktree isolato, e il rispetto del flusso è imposto da hook locali, CI e permessi di OpenCode invece che da istruzioni.

Le regole per gli agenti stanno in `.agent-guidelines/` e vengono distribuite in `AGENTS.md`, `CLAUDE.md` e `.cursor/rules/base.mdc`. Questo file è per le persone.

## Cosa contiene

| Percorso | Ruolo |
| --- | --- |
| `.agent-guidelines/` | Sorgente delle regole per gli agenti: `CORE.md` (regole generali), `WORKFLOW.md` (il flusso), `PATTERNS.md` (stack del progetto) |
| `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/base.mdc` | Generati da `npm run sync-agents`, mai modificati a mano |
| `openspec/` | Spec del sistema (`specs/`), change in corso e archiviati (`changes/`), configurazione (`config.yaml`) |
| `config/openspec-profile.json` | Workflow OpenSpec attivi, pinnati nel repo |
| `.opencode/` | Comandi e skill per OpenCode: `/opsx-*` generati da OpenSpec, `/grill`, `/update-context`, skill `grilling` e `domain-modeling` |
| `opencode.json` | Permessi dell'agente su file e comandi |
| `GLOSSARY.md` | Glossario di dominio, compilato durante l'analisi |
| `scripts/` | `sync-agents.js`, `openspec-update.sh`, `check-flow.sh` |
| `.husky/`, `commitlint.config.js` | Hook locali |
| `.github/workflows/ci.yml` | CI su ogni PR e su ogni push su `main` |

## Avviare un nuovo progetto

1. **Crea il repo dal template** con "Use this template" su GitHub, poi clonalo.
2. **Installa e attiva gli hook**:
```bash
   npm ci
   git config core.hooksPath   # deve rispondere .husky/_
```
   Gli hook si attivano solo con `npm ci` o `npm install` senza argomenti. Se `core.hooksPath` è vuoto, `npm run prepare`.
3. **Applica il profilo OpenSpec** (disattiva anche la telemetria):
```bash
   npm run openspec-update
```
4. **Aggiorna i metadati** in `package.json`: `name`, `description`, `repository`, `bugs`, `homepage`, `license`.
5. **Proteggi `main` su GitHub**, in Settings → Branches:
   - "Require a pull request before merging" attivo;
   - "Require status checks to pass before merging" attivo, con il controllo `checks` **selezionato** nell'elenco dei controlli richiesti. Compare dopo la prima esecuzione della CI; attivare l'opzione senza selezionarlo non blocca niente;
   - "Do not allow bypassing the above settings" attivo, altrimenti chi amministra il repo può mergiare con la CI rossa;
   - "Allow force pushes" e "Allow deletions" disattivi;
   - "Require approvals": l'autore di una PR non può approvarla da solo. Attivala quando nel progetto lavora più di una persona, sapendo che anche le PR di chi approva avranno bisogno di un'altra approvazione.

   In Settings → General attiva anche "Automatically delete head branches".

   **Verifica**: apri una PR da un branch con un nome non valido (per esempio `prova/x`). La CI deve fallire e il pulsante di merge deve risultare bloccato.
6. **Descrivi il progetto** in `.agent-guidelines/PATTERNS.md`: stack, struttura delle cartelle, naming, pattern. Nell'intestazione di `GLOSSARY.md`, una o due frasi su cosa copre il progetto.
7. **Aggiungi il tooling dello stack**:
   - script `lint`, `test` e `build` in `package.json`: la CI li esegue in automatico;
   - i file di configurazione dello stack (per esempio `vite.config.*`) nei file protetti di `CORE.md` e nei `deny` di `opencode.json`;
   - se serve lint-staged, installalo come devDependency con la sua configurazione prima di aggiungerlo al pre-commit.
8. **Sostituisci `README.md`** con quello del progetto. Questo file resta come riferimento.
9. `npm run sync-agents`, commit su un branch `chore/`, prima PR.

## Il flusso in breve

Il dettaglio è in `.agent-guidelines/WORKFLOW.md`.

| Passo | Branch | Cosa |
| --- | --- | --- |
| 1. Analisi | `spec/<nome-change>` | `/grill`: una decisione alla volta, glossario ed eventuali ADR |
| 2–3. Formalizzazione e design | `spec/<nome-change>` | `/opsx-new`, poi `/opsx-continue`: proposal, spec, design |
| 4. Validazione | PR della spec | `npx openspec validate <nome-change> --strict` e review |
| 5. Piano | `spec/<nome-change>` | `/opsx-continue`: `tasks.md`, poi merge della PR |
| 6. Lavorazioni | worktree `ai/<nome-change>` | sessione test, poi `/opsx-apply` |
| 7. Verifica | PR di implementazione | `/opsx-verify`, test, summary, review |
| 8. Chiusura | stessa PR, ultimo commit | `npx openspec archive <nome-change> --yes` |

Sui branch `spec/` sono ammessi solo commit `docs`.

## Comandi

| Comando | Quando |
| --- | --- |
| `npm run sync-agents` | Dopo ogni modifica a `.agent-guidelines/` |
| `npm run openspec-update` | Dopo un aggiornamento di OpenSpec o del profilo in `config/openspec-profile.json` |
| `/grill <descrizione>` | Passo 1, in OpenCode |
| `/update-context` | Fine di ogni sessione agente |

## Chi controlla cosa

| Controllo | Hook locale | CI | OpenCode |
| --- | --- | --- | --- |
| Niente commit e push diretti su `main` | ✓ | protezione del branch | `deny` su checkout, merge, push forzati |
| Messaggi Conventional Commits | ✓ | ✓ | |
| File generati allineati alle guidelines | ✓ | ✓ | `deny` sui file generati |
| Comandi OpenSpec allineati al profilo | | ✓ | `deny` su `.opencode/`, su `openspec update`, `init`, `config` e su `npm run openspec-update` |
| Nessun `.env*` nel repo né letto dall'agente (eccetto `.env.example`) | `.gitignore` | | `deny` in lettura su `.env*` |
| Nome del branch, PR della spec solo documenti e solo commit `docs` | | ✓ | |
| Change archiviato e summary presenti prima del merge | | ✓ | |
| Spec e change OpenSpec validi | | ✓ | `deny` su `openspec/specs/` |
| Vulnerabilità nelle dipendenze di produzione | | ✓ | `ask` su `npm install <pacchetto>` |
| Lint, test e build dello stack | | ✓ (se presenti) | |

Gli hook locali si possono saltare: il gate vero è la CI con la protezione di `main`.

## Regole di manutenzione

- **Prefissi dei branch**: `spec/` e `ai/` per il flusso OpenSpec; `feature/`, `fix/` e `chore/` per il lavoro delle persone. La CI rifiuta qualsiasi altro prefisso.
- **Mai `npx openspec update` a mano**: rigenera secondo il profilo globale di chi lo lancia. Usare `npm run openspec-update`.
- **Aggiornare OpenSpec**: cambiare la versione esatta in `package.json` (release di almeno 5 giorni), `npm install`, `npm run openspec-update`, PR.
- **Skill upstream** (`grilling`, `domain-modeling`): sono pinnate al commit indicato in `UPSTREAM.md`. Per aggiornarle, confrontare la nuova versione con le modifiche locali elencate nel frontmatter e riportarle a mano.
- **Mai `--no-verify`, mai `npm audit fix --force`.**
- **Ogni modifica al template passa da una PR**, come nei progetti.

## Limiti noti

- **I permessi di OpenCode non sono una sandbox**: un agente può scrivere su un file protetto o leggere un `.env` passando dalla shell (`cat` è permesso). Il contenimento vero sono CI, protezione del branch e, in futuro, `sbx`.
- **I branch `feature/`, `fix/` e `chore/` non richiedono un change OpenSpec**: la CI ne controlla solo il nome. Nei progetti sono una porta laterale rispetto al flusso, da regolare.
- **Cursor riceve le regole ma non i comandi `/opsx-*`**: OpenSpec è generato solo per OpenCode.
- **`npm audit` segnala `braces`** nelle dipendenze di sviluppo, tramite la CLI di OpenSpec: non sfruttabile in questo contesto, e la CI controlla solo le dipendenze di produzione.
- **La copertura scenari → test non è ancora un gate**: dipende dal test runner dello stack e va aggiunta per progetto.
