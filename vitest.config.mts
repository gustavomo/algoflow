import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: [
        'apps/{api,web}/**/*.ts',
        'packages/{contracts,learning-engine}/src/**/*.ts',
      ],
      exclude: ['**/__tests__/**', '**/.next/**', '**/*.d.ts'],
    },
  },
});
