// ============================================================
// ROLE: Commitlint rules based on Conventional Commits with a restricted type-enum
// DEPENDS ON: @commitlint/config-conventional
// USED BY: Husky commit-msg hook, CI commit message step
// KEY DECISIONS: type-enum drops perf/build/revert from the conventional default
// GOTCHAS: subject-case lower-case rejects subjects with capitals, library names included
// LAST UPDATED: 2026-10-21 - USED BY includes the CI step
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
