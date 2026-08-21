import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'

// Test-only config. Does not affect the Next.js build/dev/lint pipeline.
// No live network calls are made by the routine test suite — provider
// adapters are exercised only against mocks/fixtures (see
// src/lib/candidateEvidence/__tests__).
const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
