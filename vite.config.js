import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { writeFileSync } from 'fs';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd());
  
  console.log('Building with environment mode:', mode);
  console.log('API URL is set:', !!env.VITE_API_URL);
  console.log('Google Client ID is set:', !!env.VITE_GOOGLE_CLIENT_ID);
  
  // Create .nojekyll file to prevent GitHub Pages from using Jekyll
  const createNoJekyllFile = () => {
    writeFileSync('./dist/.nojekyll', '');
    
    // Also add a simple debug.json file to check env vars in production
    writeFileSync('./dist/debug.json', JSON.stringify({
      api_url_set: !!env.VITE_API_URL,
      google_client_id_set: !!env.VITE_GOOGLE_CLIENT_ID,
      build_time: new Date().toISOString(),
      build_mode: mode
    }, null, 2));
  };
  
  return {
    plugins: [
      react(),
      {
        name: 'create-nojekyll',
        closeBundle: createNoJekyllFile,
      },
      // Plugin to inject environment variables as global window properties for debug page
      {
        name: 'inject-env-for-debug',
        transformIndexHtml(html) {
          return html.replace(
            '</head>',
            `<script>
              window.VITE_GOOGLE_CLIENT_ID = ${JSON.stringify(env.VITE_GOOGLE_CLIENT_ID || '')};
              window.VITE_API_URL = ${JSON.stringify(env.VITE_API_URL || '')};
            </script>
            </head>`
          );
        }
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
      // Use a more direct approach to ensure variables are properly replaced
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(env.VITE_GOOGLE_CLIENT_ID || ''),
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || ''),
    },
    server: {
      port: 5173,
      strictPort: true,
      cors: true,
    },
  };
});