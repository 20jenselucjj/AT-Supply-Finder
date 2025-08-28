import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment from .env file
  process.env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
  
  return {
    server: {
      host: "::",
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': [
              '@radix-ui/react-accordion',
              '@radix-ui/react-alert-dialog',
              '@radix-ui/react-aspect-ratio',
              '@radix-ui/react-avatar',
              '@radix-ui/react-checkbox',
              '@radix-ui/react-collapsible',
              '@radix-ui/react-context-menu',
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-hover-card',
              '@radix-ui/react-label',
              '@radix-ui/react-menubar',
              '@radix-ui/react-navigation-menu',
              '@radix-ui/react-popover',
              '@radix-ui/react-progress',
              '@radix-ui/react-radio-group',
              '@radix-ui/react-scroll-area',
              '@radix-ui/react-select',
              '@radix-ui/react-separator',
              '@radix-ui/react-slider',
              '@radix-ui/react-slot',
              '@radix-ui/react-switch',
              '@radix-ui/react-tabs',
              '@radix-ui/react-toast',
              '@radix-ui/react-toggle',
              '@radix-ui/react-toggle-group',
              '@radix-ui/react-tooltip'
            ],
            'chart-vendor': ['recharts'],
            'animation-vendor': ['framer-motion'],
            'data-vendor': ['@tanstack/react-query'],
            'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
            'utils-vendor': ['clsx', 'tailwind-merge', 'class-variance-authority', 'date-fns'],
            'icon-vendor': ['lucide-react'],
            // Appwrite and auth related
            'auth-vendor': ['appwrite'],
            // Amazon and external APIs
            'amazon-vendor': ['amazon-sp-api', 'axios', 'crypto-js'],
            // UI components
            'ui-components': [
              '@/components/ui/accordion',
              '@/components/ui/alert-dialog',
              '@/components/ui/alert',
              '@/components/ui/aspect-ratio',
              '@/components/ui/avatar',
              '@/components/ui/badge',
              '@/components/ui/breadcrumb',
              '@/components/ui/button',
              '@/components/ui/calendar',
              '@/components/ui/card',
              '@/components/ui/carousel',
              '@/components/ui/chart',
              '@/components/ui/checkbox',
              '@/components/ui/collapsible',
              '@/components/ui/command',
              '@/components/ui/context-menu',
              '@/components/ui/dialog',
              '@/components/ui/drawer',
              '@/components/ui/dropdown-menu',
              '@/components/ui/form',
              '@/components/ui/hover-card',
              '@/components/ui/input-otp',
              '@/components/ui/input',
              '@/components/ui/label',
              '@/components/ui/menubar',
              '@/components/ui/navigation-menu',
              '@/components/ui/pagination',
              '@/components/ui/popover',
              '@/components/ui/progress',
              '@/components/ui/radio-group',
              '@/components/ui/resizable',
              '@/components/ui/scroll-area',
              '@/components/ui/select',
              '@/components/ui/separator',
              '@/components/ui/sheet',
              '@/components/ui/sidebar',
              '@/components/ui/skeleton',
              '@/components/ui/slider',
              '@/components/ui/sonner',
              '@/components/ui/switch',
              '@/components/ui/table',
              '@/components/ui/tabs',
              '@/components/ui/textarea',
              '@/components/ui/toast',
              '@/components/ui/toaster',
              '@/components/ui/toggle-group',
              '@/components/ui/toggle',
              '@/components/ui/tooltip'
            ]
          }
        }
      },
      chunkSizeWarningLimit: 1000 // Increase the limit to reduce warnings
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
  };
});