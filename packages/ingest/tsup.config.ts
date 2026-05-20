import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/handler.ts'],
  format: ['cjs'],
  target: 'node22',
  outDir: 'dist',
  noExternal: [/@ffr\/.*/, 'google-play-scraper'],
  external: ['@sparticuz/chromium'],
  clean: true,
});
