// ============================================================
// ROLE: Distributes .agent-guidelines/ to all target agent files
// DEPENDS ON: .agent-guidelines/CORE.md, WORKFLOW.md, PATTERNS.md
// USED BY: npm run sync-agents (run manually after modifying guidelines)
// KEY DECISIONS: ESM only (package.json has "type": "module"); sections extracted
//   from PATTERNS.md via ## headings for scoped cursor rules
// GOTCHAS: Target files are generated - do not modify directly.
//   Section extraction depends on exact headings in PATTERNS.md.
// LAST UPDATED: 2026-09-29 - stores.mdc glob fixed to real path frontend/src/store/** (R3, L7-54)
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

// Extract section from markdown by ## heading
function extractSection(content, headingText) {
  const lines = content.split('\n')
  const startIdx = lines.findIndex(l => l.trim() === `## ${headingText}`)
  if (startIdx === -1) {
    console.warn(`  ⚠️  Section "## ${headingText}" not found in PATTERNS.md`)
    return `## ${headingText}\n\n(section not found)`
  }
  let endIdx = lines.length
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) { endIdx = i; break }
  }
  return lines.slice(startIdx, endIdx).join('\n').trim()
}

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

// ── .github/copilot-instructions.md ─────────────────────────────────────────
write('.github/copilot-instructions.md', BANNER + allContent + '\n')

// ── Cursor base.mdc (always active) ─────────────────────────────────────────
const baseMdc = `---
description: Regole base — architettura, naming, workflow
alwaysApply: true
---

${BANNER}${core}${SEPARATOR}${workflow}
`
write('.cursor/rules/base.mdc', baseMdc)

// ── Cursor components.mdc (scoped to frontend/src/components/**) ─────────────
const componentsSection = extractSection(patterns, 'Componenti SolidJS')
const componentsMdc = `---
description: Regole per i componenti SolidJS
globs: frontend/src/components/**/*.jsx
alwaysApply: true
---

${BANNER}${componentsSection}
`
write('.cursor/rules/components.mdc', componentsMdc)

// ── Cursor stores.mdc (scoped to frontend/src/store/**) ─────────────────────
const storesSection = extractSection(patterns, 'Store e Signals')
const storesMdc = `---
description: Regole per store e signals SolidJS
globs: frontend/src/store/**/*.jsx
alwaysApply: true
---

${BANNER}${storesSection}
`
write('.cursor/rules/stores.mdc', storesMdc)

console.log('\n✅  sync-agents completed\n')
