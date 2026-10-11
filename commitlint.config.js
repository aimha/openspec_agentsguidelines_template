// ============================================================
// ROLE: Regole commitlint basate su Conventional Commits con type-enum ristretto
// DEPENDS ON: @commitlint/config-conventional
// USED BY: hook commit-msg di Husky
// KEY DECISIONS: type-enum senza perf/build/revert rispetto al default conventional
// GOTCHAS: subject-case lower-case blocca messaggi con soggetto maiuscolo
// LAST UPDATED: 2026-09-20 — aggiunta header standard
// ============================================================

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'style', 'test', 'docs', 'chore', 'ci'],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
  },
};
