import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: ["c16c3d7e-d345-466b-ad13-1ccb13df0584.lovableproject.com"],
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
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
        manualChunks: (id) => {
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') || 
              id.includes('node_modules/react-router-dom/')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/@radix-ui/') || 
              id.includes('node_modules/class-variance-authority/') ||
              id.includes('node_modules/clsx/') ||
              id.includes('node_modules/tailwind-merge/')) {
            return 'vendor-ui';
          }
          if (id.includes('node_modules/lucide-react/')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/pdfjs-dist/')) {
            return 'vendor-pdf';
          }
        }
      },
      external: [
        /pdf\.worker\.min\.mjs$/
      ]
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
    exclude: ['pdfjs-dist/build/pdf.worker.min.mjs']
  },
  worker: {
    format: 'es',
    plugins: () => [react()],
  },
  assetsInclude: ['**/*.worker.js', '**/*.worker.mjs']
}));
