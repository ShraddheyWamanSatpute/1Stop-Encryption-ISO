module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'Downloads/**', '**/node_modules/**'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // Allow unused args/vars prefixed with _; ignore rest siblings in destructuring
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    // Downgrade to warn so we can fix incrementally; prefer unknown or proper types when editing
    '@typescript-eslint/no-explicit-any': 'warn',
    // Wrap case blocks in {} when declaring variables; fix incrementally
    'no-case-declarations': 'warn',
    // Allow empty catch blocks (intentional swallow); fix other empty blocks
    'no-empty': ['error', { allowEmptyCatch: true }],
    // Empty destructuring (e.g. [, b]) — fix incrementally
    'no-empty-pattern': 'warn',
    // Conditional hooks break React; fix by moving hooks to top level
    'react-hooks/rules-of-hooks': 'warn',
    // Remove unnecessary escape characters in regexes; fix incrementally
    'no-useless-escape': 'warn',
  },
}
