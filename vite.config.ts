import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative asset paths, so the build also works under the GitHub Pages subpath.
  base: './',
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
