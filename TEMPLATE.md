# Vademecum del template

Template per progetti sviluppati con agenti AI. Ogni modifica parte da una spec OpenSpec approvata, l'agente lavora in un worktree isolato, e il rispetto del flusso è imposto da hook locali, CI e permessi di OpenCode invece che da istruzioni.

Le regole, gli strumenti e la CI arrivano dal pacchetto [agent-harness](https://github.com/aimha/agent-harness), installato come dipendenza e allineato con `npx agent-harness sync`. Il template aggiunge solo lo scheletro del progetto. Questo file è per le persone.

## Cosa contiene

| Percorso | Di chi è | Ruolo |
| --- | --- | --- |
| `.agent-guidelines/PATTERNS.md` | progetto | Stack, struttura, naming, pattern e regole che valgono solo per il progetto, compresi i file protetti dello stack |
| `opencode.local.json` (facoltativo) | progetto | Permessi di OpenCode in più rispetto a quelli del pacchetto |
| `GLOSSARY.md`, `docs/adr/` | progetto | Glossario di dominio ed eventuali ADR, scritti durante l'analisi |
| `openspec/specs/`, `openspec/changes/` | progetto | Spec del sistema, change in corso e archiviati |
| `README.md`, `package.json` | progetto | Descrizione e metadati del progetto |
| `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/base.mdc` | pacchetto | Regole per gli agenti: quelle del pacchetto più `PATTERNS.md` |
| `opencode.json` | pacchetto | Permessi del pacchetto più `opencode.local.json` |
| `.opencode/` | pacchetto | Comandi e skill: `/opsx-*`, `/grill`, `/update-context`, skill `grilling` e `domain-modeling` |
| `openspec/config.yaml` | pacchetto | Lingua e regole per gli artefatti OpenSpec |
| `.husky/` | pacchetto | Hook git di una riga, che chiamano `agent-harness` |
| `.github/workflows/ci.yml` | pacchetto | CI su ogni PR e su ogni push su `main` |
| `agent-harness.lock.json` | pacchetto | Versione del pacchetto ed elenco dei file che gestisce |

I file del pacchetto si rigenerano con `npx agent-harness sync` e non si modificano a mano: la CI e il pre-commit falliscono se non corrispondono. Le modifiche locali vanno in `PATTERNS.md` o in `opencode.local.json`, poi `sync`.

## Avviare un nuovo progetto

1. **Crea il repo dal template** con "Use this template" su GitHub, poi clonalo.
2. **Installa e attiva gli hook**:
```bash
   npm ci
   git config core.hooksPath   # deve rispondere .husky/_
```
   Gli hook si attivano solo con `npm ci` o `npm install` senza argomenti. Se `core.hooksPath` è vuoto, `npm run prepare`.
3. **Aggiorna i metadati** in `package.json`: `name`, `description`, `repository`, `bugs`, `homepage`, `license`.
4. **Proteggi `main` su GitHub**, in Settings → Rules → Rulesets (oppure Settings → Branches). Con il piano gratuito è possibile solo nei repository pubblici.
   - "Require a pull request before merging" attivo;
   - "Require status checks to pass before merging" attivo, con il controllo `checks` **selezionato** nell'elenco dei controlli richiesti. Compare dopo la prima esecuzione della CI; attivare l'opzione senza selezionarlo non blocca niente;
   - nessuno nella lista di bypass, altrimenti chi amministra il repo può mergiare con la CI rossa;
   - force push e cancellazione del branch bloccati;
   - "Require approvals": l'autore di una PR non può approvarla da solo. Attivala quando nel progetto lavora più di una persona, sapendo che anche le PR di chi approva avranno bisogno di un'altra approvazione.

   In Settings → General attiva anche "Automatically delete head branches".

   **Verifica**: apri una PR da un branch con un nome non valido (per esempio `prova/x`). La CI deve fallire e il pulsante di merge deve risultare bloccato.
5. **Descrivi il progetto** in `.agent-guidelines/PATTERNS.md`: stack, struttura delle cartelle, naming, pattern. Nell'intestazione di `GLOSSARY.md`, una o due frasi su cosa copre il progetto.
6. **Aggiungi il tooling dello stack**:
   - script `lint`, `test` e `build` in `package.json`: la CI li esegue in automatico;
   - i file di configurazione dello stack (per esempio `vite.config.*`): elencati come protetti in `PATTERNS.md` e negati in `opencode.local.json`, per esempio `{ "permission": { "edit": { "vite.config.*": "deny" } } }`;
   - un job di CI in più (database, e2e) va in un file suo accanto a `ci.yml`, non dentro `ci.yml`.
7. **Sostituisci `README.md`** con quello del progetto. Questo file resta come riferimento.
8. `npx agent-harness sync`, commit su un branch `chore/`, prima PR.

## Il flusso in breve

Il dettaglio è nella sezione WORKFLOW di `AGENTS.md`.

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

**CI rossa attesa.** In due momenti la CI è rossa per scelta, non per un errore:

- **PR della spec durante la review**: manca ancora `tasks.md`, che arriva al passo 5, dopo l'approvazione. La PR si mergia solo dopo il piano.
- **PR `ai/` che crea una capability nuova**: dopo l'archive la spec principale ha un `Purpose` segnaposto e `openspec validate --strict` la rifiuta. Una persona scrive lo scopo della capability, almeno 50 caratteri, in `openspec/specs/<capability>/spec.md` e lo committa come `docs` sullo stesso branch. Gli agenti non possono farlo: `openspec/specs/` è protetto.

## Comandi

| Comando | Quando |
| --- | --- |
| `npx agent-harness sync` | Dopo ogni modifica a `PATTERNS.md` o a `opencode.local.json`, e dopo un aggiornamento del pacchetto |
| `npx agent-harness sync --check` | Per controllare senza scrivere: è quello che fanno CI e pre-commit |
| `/grill <descrizione>` | Passo 1, in OpenCode |
| `/update-context` | Fine di ogni sessione agente |

## Chi controlla cosa

| Controllo | Hook locale | CI | OpenCode |
| --- | --- | --- | --- |
| Niente commit e push diretti su `main` | ✓ (anche `git push origin HEAD:main`) | protezione del branch | `deny` su checkout, merge, push forzati |
| Messaggi Conventional Commits | ✓ | ✓ | |
| File del pacchetto allineati e non modificati a mano | ✓ | ✓ | `deny` su tutti i file del pacchetto |
| OpenSpec del progetto nella versione del pacchetto | ✓ | ✓ | `deny` su `openspec update`, `init`, `config` |
| Nessun `.env*` nel repo né letto dall'agente (eccetto `.env.example`) | `.gitignore` | | `deny` in lettura su `.env*` |
| Nome del branch, PR della spec solo documenti e solo commit `docs` | | ✓ | |
| Change archiviato e summary presenti prima del merge | | ✓ | |
| Spec e change OpenSpec validi | | ✓ | `deny` su `openspec/specs/` |
| Vulnerabilità nelle dipendenze di produzione | | ✓ | `ask` su `npm install <pacchetto>` |
| Lint, test e build dello stack | | ✓ (se presenti) | |

Gli hook locali si possono saltare: il gate vero è la CI con la protezione di `main`.

## Regole di manutenzione

- **Prefissi dei branch**: `spec/` e `ai/` per il flusso OpenSpec; `feature/`, `fix/` e `chore/` per il lavoro delle persone. La CI rifiuta qualsiasi altro prefisso.
- **Aggiornare agent-harness**: `npm i -D -E github:aimha/agent-harness#<tag nuovo>`, `npx agent-harness sync`, PR. Il diff mostra cosa cambia per gli agenti e per la CI.
- **OpenSpec e commitlint arrivano con il pacchetto**: non vanno tra le dipendenze del progetto. Una versione diversa nel progetto prenderebbe il posto di quella del pacchetto, e `sync --check` lo segnala.
- **Le correzioni alle regole, alle skill o alla CI vanno nel pacchetto**, non nel progetto: una modifica locale verrebbe sovrascritta dal prossimo `sync`.
- **Mai `npx openspec update` a mano**: i comandi `/opsx-*` arrivano già pronti dal pacchetto.
- **Mai `--no-verify`, mai `npm audit fix --force`.**
- **Ogni modifica al template passa da una PR**, come nei progetti.

## Limiti noti

- **I permessi di OpenCode non sono una sandbox**: un agente può scrivere su un file protetto o leggere un `.env` passando dalla shell (`cat` è permesso). Il contenimento vero sono CI, protezione del branch e, in futuro, `sbx`.
- **Con il piano gratuito di GitHub, nei repository privati `main` non si può proteggere**: la CI segnala i problemi ma non blocca il merge.
- **I branch `feature/`, `fix/` e `chore/` non richiedono un change OpenSpec**: la CI ne controlla solo il nome. Nei progetti sono una porta laterale rispetto al flusso, da regolare.
- **Cursor riceve le regole ma non i comandi `/opsx-*`**: OpenSpec è generato solo per OpenCode.
- **La copertura scenari → test non è ancora un gate**: dipende dal test runner dello stack e va aggiunta per progetto.
