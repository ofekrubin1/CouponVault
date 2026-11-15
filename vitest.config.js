import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.js', 'tests/rules/**/*.test.js'],
    environment: 'node',
    testTimeout: 20_000,
  },
});
