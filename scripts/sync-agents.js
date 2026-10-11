// ============================================================
// ROLE: Distributes .agent-guidelines/ to all target agent files
// DEPENDS ON: .agent-guidelines/CORE.md, WORKFLOW.md, PATTERNS.md
// USED BY: npm run sync-agents (run manually after modifying guidelines)
// KEY DECISIONS: ESM only (package.json has "type": "module"); 
// GOTCHAS: Target files are generated - do not modify directly.
//   Section extraction depends on exact headings in PATTERNS.md.
// LAST UPDATED: 2026-10-11 - Removed foundation references and dead code
// ============================================================

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SRC = join(ROOT, '.agent-guidelines')

// Read sources
const core = readFileSync(join(SRC, 'CORE.md'), 'utf8').trim()
const workflow = readFileSync(join(SRC, 'WORKFLOW.md'), 'utf8').trim()
const patterns = readFileSync(join(SRC, 'PATTERNS.md'), 'utf8').trim()

const BANNER = '<!-- GENERATED — non modificare direttamente. Fonte: .agent-guidelines/ → npm run sync-agents -->\n\n'
const SEPARATOR = '\n\n---\n\n'

// All content concatenated
const allContent = [core, workflow, patterns].join(SEPARATOR)

// Write file creating directories as needed
function write(relPath, content) {
  const fullPath = join(ROOT, relPath)
  mkdirSync(dirname(fullPath), { recursive: true })
  writeFileSync(fullPath, content, 'utf8')
  console.log(`  ✓  ${relPath}`)
}

console.log('\n🔄  sync-agents — distributing guidelines\n')

// ── AGENTS.md (OpenCode + Codex) ─────────────────────────────────────────────
write('AGENTS.md', BANNER + allContent + '\n')

// ── CLAUDE.md (Claude Code) ──────────────────────────────────────────────────
write('CLAUDE.md', BANNER + allContent + '\n')

// ── Cursor base.mdc (always active) ─────────────────────────────────────────
const baseMdc = `---
description: Regole base — architettura, naming, workflow
alwaysApply: true
---

${BANNER}${core}${SEPARATOR}${workflow}
`
write('.cursor/rules/base.mdc', baseMdc)

console.log('\n✅  sync-agents completed\n')
