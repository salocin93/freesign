import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { PluginOption } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: ["c16c3d7e-d345-466b-ad13-1ccb13df0584.lovableproject.com"],
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    },
    proxy: {
      '/api/send-signature-request': {
        target: process.env.SUPABASE_URL,
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api\/send-signature-request/, '/functions/v1/send-signature-request'),
      },
    },
  },
  plugins: [
    react(),
    process.env.NODE_ENV === 'development' && componentTagger(),
  ].filter(Boolean) as PluginOption[],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    modulePreload: {
      polyfill: false
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': [
            'react',
            'react-dom',
            'react-router-dom'
          ],
          'vendor-ui': [
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-dialog',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
            'class-variance-authority',
            'clsx',
            'tailwind-merge'
          ],
          'vendor-icons': ['lucide-react'],
          'pdfjs': ['pdfjs-dist', 'react-pdf']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: [
      'pdfjs-dist',
      'react-pdf'
    ]
  },
  worker: {
    format: 'es',
    plugins: () => [] as PluginOption[]
  },
  assetsInclude: ['**/*.worker.js', '**/*.worker.mjs']
});
