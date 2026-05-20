import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/handler.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  noExternal: [/@ffr\/.*/],
  clean: true,
});
