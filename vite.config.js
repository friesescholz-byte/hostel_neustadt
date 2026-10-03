import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { localStorePlugin } from './scripts/localDevPlugin.js';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localStorePlugin()],
  server: {
    host: true,
    port: 5173
  }
});
