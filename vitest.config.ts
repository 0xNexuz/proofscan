import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@proofscan/contracts': fileURLToPath(
        new URL('./packages/contracts/src/index.ts', import.meta.url),
      ),
      '@proofscan/core': fileURLToPath(
        new URL('./packages/proofscan/src/index.ts', import.meta.url),
      ),
      '@proofscan/claimbench': fileURLToPath(
        new URL('./packages/claimbench/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    include: ['apps/**/*.test.ts', 'packages/**/*.test.ts'],
    coverage: { reporter: ['text', 'json-summary'] },
  },
});
