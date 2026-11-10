import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: process.cwd(),
    include: [ 'test/unit/**/*.spec.ts', ],
    reporters: [ 'verbose', ],
  },
});
