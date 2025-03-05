import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/typeform-survey/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    // Avoid using symlinks
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})