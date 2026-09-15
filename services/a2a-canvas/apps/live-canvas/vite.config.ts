// Vite build for the live canvas. Uses the repository root's Vite install;
// output is a normal multi-asset build in dist/ which scripts/inline.mjs then
// folds into one self-contained HTML file for publishing as an artifact.
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root: here,
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: false,
    cssCodeSplit: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
})
