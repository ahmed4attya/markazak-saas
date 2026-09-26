import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    alias: {
      '@': path.resolve(__dirname, './'),
    },
    env: {
      AUTH_SECRET: 'test-only-auth-secret-32-chars-minimum-xxxxxxxx',
    },
  },
});
