import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: process.cwd(),
    include: [ 'test/acceptance/specs/**/*.spec.ts', ],
    globalSetup: [ 'test/acceptance/setup/global-setup.ts', ],
    testTimeout: 15000,
    hookTimeout: 20000,
    // The suite runs against one shared database. Plant, plot and category
    // names are UNIQUE KEY, so specs are serialised rather than raced against
    // each other.
    fileParallelism: false,
    reporters: [ 'verbose', ],
  },
});
