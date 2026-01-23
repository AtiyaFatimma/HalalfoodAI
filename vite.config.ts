import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/', // required for Cloudflare Pages
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
