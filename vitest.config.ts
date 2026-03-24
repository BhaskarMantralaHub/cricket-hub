import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.{ts,tsx}'],
    reporters: ['default', 'junit'],
    outputFile: 'test-results.xml',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
