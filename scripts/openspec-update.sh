#!/usr/bin/env bash
# ============================================================
# ROLE: Rigenera comandi e skill OpenSpec in .opencode/ dal profilo pinnato nel repo
# DEPENDS ON: config/openspec-profile.json, @fission-ai/openspec (devDependency)
# USED BY: npm run openspec-update, CI (--check)
# KEY DECISIONS: il profilo dei workflow vive nel repo, non nel config globale di chi
#   lancia il comando; --check rigenera in una cartella temporanea e confronta
# GOTCHAS: imposta il profilo globale di OpenSpec (~/.config/openspec) ai valori pinnati.
#   Usa sempre la CLI locale di node_modules, mai una versione globale.
# LAST UPDATED: 2026-10-12 - prima versione
# ============================================================
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
CLI="$ROOT/node_modules/.bin/openspec"
PROFILE="$ROOT/config/openspec-profile.json"
export OPENSPEC_TELEMETRY=0

[ -x "$CLI" ] || { echo "❌  CLI OpenSpec non trovata: eseguire npm ci"; exit 1; }

WORKFLOWS=$(node -e "console.log(JSON.stringify(require('$PROFILE').workflows))")

# Apply the pinned profile to the global OpenSpec config
"$CLI" config set telemetry.enabled false >/dev/null
"$CLI" config set profile custom >/dev/null
"$CLI" config set workflows "$WORKFLOWS" >/dev/null

if [ "${1:-}" = "--check" ]; then
  TMP=$(mktemp -d)
  trap 'rm -rf "$TMP"' EXIT
  cp -R "$ROOT/openspec" "$ROOT/.opencode" "$TMP/"
  (cd "$TMP" && "$CLI" update >/dev/null 2>&1)
  if ! diff -r "$ROOT/.opencode" "$TMP/.opencode" >/dev/null; then
    echo "❌  .opencode/ non corrisponde al profilo pinnato in config/openspec-profile.json"
    diff -rq "$ROOT/.opencode" "$TMP/.opencode" | sed 's|'"$TMP"'|<atteso>|; s|'"$ROOT"'/||' || true
    echo "    Eseguire: npm run openspec-update"
    exit 1
  fi
  echo "✅  Comandi e skill OpenSpec allineati al profilo $WORKFLOWS"
  exit 0
fi

(cd "$ROOT" && "$CLI" update)
