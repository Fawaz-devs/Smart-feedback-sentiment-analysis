// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    postcss: './postcss.config.cjs', // ensures Tailwind + PostCSS are used correctly
  },
  server: {
    open: true, // automatically opens the browser on `vite dev`
  },
});
