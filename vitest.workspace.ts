import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      name: 'node',
      globals: true,
      environment: 'node',
      include: ['packages/{shared,api,ingest}/**/*.test.{ts,tsx}'],
    },
  },
  {
    test: {
      name: 'dashboard',
      globals: true,
      environment: 'jsdom',
      include: ['packages/dashboard/**/*.test.{ts,tsx}'],
      setupFiles: ['packages/dashboard/src/test-setup.ts'],
    },
  },
]);
