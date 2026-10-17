// eslint.config.mjs
// Using typescript-eslint directly for ESLint 9 flat config compatibility
// Next.js 16 ESLint integration (next/core-web-vitals) is legacy-format only;
// for now we use typescript-eslint + a minimal rule set to unblock typecheck+lint.

import tseslint from 'typescript-eslint';

export default tseslint.config(
  tseslint.configs.recommended,
  {
    ignores: ['.next/**', 'node_modules/**', 'drizzle/**'],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      // dangerouslySetInnerHTML is used in NailPreview for our own SVG templates only
      'no-restricted-syntax': 'off',
    },
  },
);
