import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages: https://buyanwz.github.io/video-canvas-workbench/
  base: '/video-canvas-workbench/',
  plugins: [react()],
})
