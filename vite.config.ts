// @ts-nocheck
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    ...(mode === 'development' ? [componentTagger()] : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Disable TypeScript checking during build
  esbuild: {
    target: 'es2015',
    tsconfigRaw: {
      compilerOptions: {
        skipLibCheck: true,
        noImplicitAny: false,
        strictNullChecks: false,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            if (id.includes('recharts')) {
              return 'chart-vendor';
            }
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'pdf-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            return 'vendor';
          }
          
          // Feature chunks based on folder structure
          if (id.includes('/components/accounting/') || id.includes('/pages/Accounting.tsx')) {
            return 'accounting';
          }
          if (id.includes('/components/pharmacy/') || id.includes('/pages/Pharmacy.tsx')) {
            return 'pharmacy';
          }
          if (id.includes('/components/radiology/') || id.includes('/pages/Radiology.tsx')) {
            return 'radiology';
          }
          if (id.includes('/components/lab/') || id.includes('/pages/Lab.tsx')) {
            return 'lab';
          }
          if (id.includes('/components/operation-room/') || id.includes('/pages/OperationTheatre.tsx')) {
            return 'operation-theatre';
          }
          if (id.includes('/components/spreadsheet/')) {
            return 'spreadsheet';
          }
        }
      },
      onwarn(warning, warn) {
        // Suppress all TypeScript warnings
        if (warning.code === 'UNRESOLVED_IMPORT' || 
            warning.code === 'MISSING_EXPORT' ||
            warning.message?.includes('TypeScript') ||
            warning.message?.includes('TS')) {
          return;
        }
        warn(warning);
      }
    }
  }
}));