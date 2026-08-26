import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/target/**',
      '**/public/benchmark.json',
      'outputs/**',
      'work/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  { rules: { '@typescript-eslint/no-explicit-any': 'off' } },
  { files: ['scripts/**/*.mjs'], rules: { 'no-undef': 'off' } },
);
