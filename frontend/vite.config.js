import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_URL;

  const proxyEntry = (target) => ({ target, changeOrigin: true });

  return {
    // Use relative base so built assets are referenced correctly on Netlify
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    server: {
      proxy: {
        '/api':      proxyEntry(apiTarget),
        '/register': proxyEntry(apiTarget),
        '/login':    proxyEntry(apiTarget),
        '/profile':  proxyEntry(apiTarget),
        '/crypto':   proxyEntry(apiTarget),
      },
    },
  };
})
