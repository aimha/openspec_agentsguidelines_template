#!/usr/bin/env bash
# ============================================================
# ROLE: Gate del flusso OpenSpec per le PR, in base al prefisso del branch
# DEPENDS ON: git, struttura openspec/ e docs/summaries/
# USED BY: .github/workflows/ci.yml (job checks, solo su pull_request)
# KEY DECISIONS: spec/<nome> contiene solo il change omonimo (+ GLOSSARY.md e docs/adr/) e deve
#   avere tasks.md e solo commit docs; ai/<nome> deve arrivare al merge con il change
#   archiviato e il summary
# GOTCHAS: <nome> deve coincidere con il nome del change OpenSpec.
#   feature/ e fix/ controllano solo il nome del branch.
# LAST UPDATED: 2026-10-12 - solo commit docs sui branch spec/
# ============================================================
set -euo pipefail

BRANCH="$1"
BASE_SHA="$2"
HEAD_SHA="$3"

# Fail with a readable message
fail() {
  printf '❌  %b\n' "$1"
  exit 1
}

[[ "$BRANCH" =~ ^(ai|spec|feature|fix)/[a-z0-9][a-z0-9-]*$ ]] \
  || fail "Nome branch non conforme: $BRANCH\n    Atteso: ai|spec|feature|fix/<kebab-case>"

PREFIX="${BRANCH%%/*}"
NAME="${BRANCH#*/}"
CHANGED=$(git diff --name-only "$BASE_SHA"..."$HEAD_SHA")

case "$PREFIX" in
  spec)
    [ -d "openspec/changes/$NAME" ] \
      || fail "Manca openspec/changes/$NAME: il branch spec/ contiene il change con lo stesso nome"
    [ -f "openspec/changes/$NAME/tasks.md" ] \
      || fail "Manca openspec/changes/$NAME/tasks.md: la PR della spec si mergia dopo il piano (passo 5)"
    OUTSIDE=$(printf '%s\n' "$CHANGED" | grep -vE "^(openspec/changes/$NAME/|GLOSSARY\.md$|docs/adr/)" || true)
    [ -z "$OUTSIDE" ] \
      || fail "La PR della spec modifica file fuori dal change:\n$OUTSIDE"
    NOT_DOCS=$(git log --no-merges --format='%h %s' "$BASE_SHA".."$HEAD_SHA" | grep -vE '^[0-9a-f]+ docs(\([a-z0-9-]+\))?!?: ' || true)
    [ -z "$NOT_DOCS" ] \
      || fail "Sui branch spec/ sono ammessi solo commit di tipo docs:\n$NOT_DOCS"
    ;;
  ai)
    [ ! -d "openspec/changes/$NAME" ] \
      || fail "Change $NAME non archiviato: eseguire /opsx-archive prima del merge (passo 8)"
    ls openspec/changes/archive 2>/dev/null | grep -qE "^[0-9]{4}-[0-9]{2}-[0-9]{2}-$NAME$" \
      || fail "Nessun change archiviato con nome $NAME in openspec/changes/archive/"
    [ -f "docs/summaries/$NAME.md" ] \
      || fail "Manca il summary docs/summaries/$NAME.md"
    ;;
esac

echo "✅  Flusso rispettato per $BRANCH"
