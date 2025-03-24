import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { writeFileSync } from 'fs';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd());
  
  // Create .nojekyll file to prevent GitHub Pages from using Jekyll
  const createNoJekyllFile = () => {
    writeFileSync('./dist/.nojekyll', '');
  };
  
  return {
    plugins: [
      react(),
      {
        name: 'create-nojekyll',
        closeBundle: createNoJekyllFile,
      }
    ],
    base: '/typeform-survey/',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
    },
    define: {
      // Make env variables available in your client code
      'process.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(env.VITE_GOOGLE_CLIENT_ID),
      'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
    },
    server: {
      port: 5173,
      strictPort: true,
      cors: true,
    },
  };
});