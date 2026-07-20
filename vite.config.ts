import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base is './' so the built site works when served from any subpath
// (e.g. GitHub Pages project sites).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
});
