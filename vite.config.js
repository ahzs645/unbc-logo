import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Builds the standalone generator site (src/site/). The package itself is consumed from source —
// as a git submodule or a workspace dependency — so there is no library build step here.
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves a project site from /<repo>/, so assets need that prefix in production.
  base: process.env.NODE_ENV === 'production' ? '/unbc-logo/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
