import { defineConfig } from 'vite';

export default defineConfig({
  base: '/mini_generals/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  }
}); 