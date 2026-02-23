import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

// ESS-specific Vite configuration
// This config is optimized for Employee Self Service portal builds
export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || import.meta.env.MODE || 'development'),
    'import.meta.env.VITE_APP_MODE': JSON.stringify('ess'),
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      { find: "@frontend", replacement: path.resolve(__dirname, "./src/frontend") },
      { find: "@mobile", replacement: path.resolve(__dirname, "./src/mobile") },
    ],
  },
  build: {
    outDir: 'dist-ess',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    port: 5174, // Different port for ESS dev server
    open: '/ESS',
  },
})
