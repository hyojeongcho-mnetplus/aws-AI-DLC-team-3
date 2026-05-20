import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/handler.ts'],
  format: ['cjs'],
  target: 'node22',
  outDir: 'dist',
  noExternal: [/@ffr\/.*/, 'zod'],
  clean: true,
});
