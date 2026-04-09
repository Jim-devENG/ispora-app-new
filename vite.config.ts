import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // Performance optimizations
  build: {
    // Enable code splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code
          'react-vendor': ['react', 'react-dom', 'react-router'],
          'ui-vendor': ['lucide-react', 'recharts', 'sonner'],
          'supabase-vendor': ['@supabase/supabase-js'],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true,
      },
    },
  },

  // Optimize deps
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router',
      '@supabase/supabase-js',
      'lucide-react',
      'recharts',
      'sonner',
    ],
  },
})