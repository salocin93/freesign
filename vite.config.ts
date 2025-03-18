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
    }
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
    target: 'esnext',
    sourcemap: true
  },
  optimizeDeps: {
    include: [
      'pdfjs-dist',
      'react-pdf'
    ],
    exclude: [
      'pdfjs-dist/build/pdf.worker.min.mjs'
    ]
  },
  define: {
    'process.env.NODE_DEBUG': 'false',
    'process.platform': JSON.stringify(process.platform)
  }
});
