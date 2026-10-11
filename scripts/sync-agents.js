// ============================================================
// ROLE: Distributes .agent-guidelines/ to all target agent files
// DEPENDS ON: .agent-guidelines/CORE.md, WORKFLOW.md, PATTERNS.md
// USED BY: npm run sync-agents (after modifying guidelines), pre-commit hook (--check)
// KEY DECISIONS: ESM only (package.json has "type": "module");
//   --check compares instead of writing and exits 1 on drift, so the hook
//   blocks commits whose generated files are stale
// GOTCHAS: Target files are generated - do not modify directly.
//   --check reads the working tree, not the staged index: run sync-agents
//   and stage the generated files together with the guideline changes.
// LAST UPDATED: 2026-10-11 - Added --check mode for the pre-commit gate
// ============================================================

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SRC = join(ROOT, '.agent-guidelines')

// --check: compare instead of writing, exit 1 if any generated file is stale
const CHECK = process.argv.includes('--check')
let stale = false

// Read sources
const core = readFileSync(join(SRC, 'CORE.md'), 'utf8').trim()
const workflow = readFileSync(join(SRC, 'WORKFLOW.md'), 'utf8').trim()
const patterns = readFileSync(join(SRC, 'PATTERNS.md'), 'utf8').trim()

const BANNER = '<!-- GENERATED — non modificare direttamente. Fonte: .agent-guidelines/ → npm run sync-agents -->\n\n'
const SEPARATOR = '\n\n---\n\n'

// All content concatenated
const allContent = [core, workflow, patterns].join(SEPARATOR)

// Write file creating directories as needed, or compare it in --check mode
function write(relPath, content) {
  const fullPath = join(ROOT, relPath)
  if (CHECK) {
    const current = existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : null
    if (current !== content) {
      console.log(`  ✗  ${relPath} non allineato`)
      stale = true
    }
    return
  }
  mkdirSync(dirname(fullPath), { recursive: true })
  writeFileSync(fullPath, content, 'utf8')
  console.log(`  ✓  ${relPath}`)
}

console.log(CHECK ? '\n🔍  sync-agents --check\n' : '\n🔄  sync-agents — distributing guidelines\n')

// ── AGENTS.md (OpenCode + Codex) ─────────────────────────────────────────────
write('AGENTS.md', BANNER + allContent + '\n')

// ── CLAUDE.md (Claude Code) ──────────────────────────────────────────────────
write('CLAUDE.md', BANNER + allContent + '\n')

// ── Cursor base.mdc (always active) ─────────────────────────────────────────
const baseMdc = `---
description: Regole base — architettura, naming, workflow, pattern
alwaysApply: true
---

${BANNER}${allContent}
`
write('.cursor/rules/base.mdc', baseMdc)

if (CHECK && stale) {
  console.error('\n❌  File generati non allineati: esegui npm run sync-agents e committa\n')
  process.exit(1)
}

console.log(CHECK ? '\n✅  file generati allineati\n' : '\n✅  sync-agents completed\n')
