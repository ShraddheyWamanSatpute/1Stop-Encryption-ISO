import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    // Map process.env.NODE_ENV for backward compatibility
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || import.meta.env.MODE || 'development'),
  },
  plugins: [
    react(),
    // Plugin to handle @/ imports from yourstop frontend
    {
      name: 'yourstop-alias-resolver',
      resolveId(id, importer) {
        // If importing from yourstop frontend and using @/ alias
        if (id.startsWith('@/') && importer?.includes('yourstop/frontend/src')) {
          const actualPath = id.replace('@/', '')
          const resolved = path.resolve(__dirname, './src/yourstop/frontend/src', actualPath)
          return resolved
        }
        return null
      }
    },
    // Plugin to transform process.env.NEXT_PUBLIC_* to import.meta.env.VITE_*
    {
      name: 'transform-process-env',
      transform(code, id) {
        // Only transform files from yourstop frontend
        if (id.includes('yourstop/frontend/src')) {
          // Transform process.env.NEXT_PUBLIC_* to import.meta.env.VITE_* or import.meta.env.NEXT_PUBLIC_*
          code = code.replace(
            /process\.env\.NEXT_PUBLIC_(\w+)/g,
            '(import.meta.env.VITE_$1 || import.meta.env.NEXT_PUBLIC_$1)'
          )
          // Transform process.env.NODE_ENV to import.meta.env.MODE
          code = code.replace(
            /process\.env\.NODE_ENV/g,
            'import.meta.env.MODE'
          )
          return { code, map: null }
        }
        return null
      }
    }
  ],
  resolve: {
    alias: [
      // More specific aliases first - for yourstop frontend @/ imports
      { 
        find: /^@\/(lib|components|hooks|app|types)\/(.*)$/, 
        replacement: path.resolve(__dirname, "./src/yourstop/frontend/src/$1/$2")
      },
      // General @/ alias for main project
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      { find: "@frontend", replacement: path.resolve(__dirname, "./src/frontend") },
      { find: "@yourstop", replacement: path.resolve(__dirname, "./src/yourstop/frontend/src") },
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
      external: (id) => {
        // Exclude yourstop frontend files from build - they're a separate Next.js project
        if (id.includes('yourstop/frontend/src') && !id.includes('node_modules')) {
          return false; // Don't externalize, but we'll handle it differently
        }
        return false;
      },
    },
  },
  optimizeDeps: {
    // Exclude patterns that match yourstop frontend files
    // Using a function to check if the id should be excluded
    exclude: [],
  },
  server: {
    // YourStop proxy removed - now integrated into main Vite app
  },
})
