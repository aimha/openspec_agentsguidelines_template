# WORKFLOW — Plan-first, branch, sessioni, summary

## Sequenza per ogni task

1. **Planning** con Claude o ChatGPT prima di aprire la sessione agente
2. **Worktree** dedicato su branch `ai/<descrizione>`
3. **Plan mode** prima di qualsiasi modifica (`/plan` o equivalente)
4. **Summary** obbligatorio al termine in `docs/summaries/ai/<descrizione>.md`
5. **Pull request** verso il branch feature da cui è stato creato il ramo `ai/*`

## Worktree — isolamento fisico

```bash
# 1. Creare il worktree (da un branch feature/*, mai da main)
git worktree add ../worktrees/ai-nome-task -b ai/nome-task

# 2. Entrare nella cartella e installare le dipendenze
cd ../worktrees/ai-nome-task
npm install

# 3. Aprire l'agente sulla cartella del worktree (non sulla root del repo)
opencode .
# oppure: code .

# 4. A task completato e PR mergeata, rimuovere
git worktree remove ../worktrees/ai-nome-task
git branch -d ai/nome-task
```

Il worktree impedisce per design git lo switch di branch: non è bypassabile con flag o configurazioni.

## Sessioni

- Una sessione = un task ben delimitato
- Nuovo obiettivo = nuova sessione
- Chiudere la sessione orientativamente al 70-80% della context window
- Ideale: non superare il 40-50% per performance ottimali

### Segnali di degrado da monitorare
- L'agente ignora vincoli espliciti nelle guidelines
- Produce file non richiesti o modifica file fuori scope
- Il codice prodotto non rispetta le convenzioni di naming o struttura
- Le risposte diventano più generiche e meno specifiche al progetto

## Summary obbligatorio

Al termine di ogni task creare `docs/summaries/ai/<nome-task>.md`.
Il path deve corrispondere esattamente al nome del branch (senza il prefisso `ai/` iniziale).

Esempio: branch `ai/fix-header-mobile` → file `docs/summaries/ai/fix-header-mobile.md`

La PR non passa la CI senza questo file.

```markdown
# <nome task>

## Cosa è stato modificato
- ...

## Cosa non è stato modificato
- ...

## Domande aperte e suggerimenti
- ...
```

## Test — sessioni separate

I test vengono scritti in una sessione separata **prima** dell'implementazione, committati, e l'agente che implementa non li modifica.

| Sessione   | Contenuto                                               |
| ---------- | ------------------------------------------------------- |
| Sessione 1 | analisi comportamento atteso, scrittura test, commit    |
| Sessione 2 | implementazione fino al verde dei test                  |

## Al termine di ogni sessione

Eseguire `/user:update-context` per aggiornare gli header dei file modificati e, se necessario, l'`AGENTS.md` del modulo.

## Azioni vietate agli agenti

- Switch di branch durante una sessione
- Amend su commit già pushati
- Push diretti su branch protetti (`main`, `develop`)
- Operazioni di merge o rebase
- Modifica di file protetti (lista in CORE.md)
