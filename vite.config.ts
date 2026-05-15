// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@':           resolve(__dirname, 'src'),
      '@crypto':     resolve(__dirname, 'src/crypto'),
      '@hooks':      resolve(__dirname, 'src/hooks'),
      '@components': resolve(__dirname, 'src/components'),
    },
  },

  build: {
    target: 'es2022',
    sourcemap: false,      // Não expõe source em produção
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // Zero console.log em produção
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        // Code splitting manual — carrega apenas o necessário
        manualChunks: {
          'vendor-react':  ['react', 'react-dom'],
          'vendor-crypto': ['@noble/hashes', '@noble/curves'],
        },
      },
    },
  },

  // Headers de segurança para dev server
  server: {
    hmr: {
      protocol: 'ws',
      host: 'localhost',
    },
    headers: {
      'Cross-Origin-Opener-Policy':   'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      // Necessário para SharedArrayBuffer (WASM threads)
    },
  },
});
