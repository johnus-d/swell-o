import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icons/*.png'],
      manifest: {
        name: 'Swell-o - Joint & Flare Tracker',
        short_name: 'Swell-o',
        description: 'Frictionless arthritis and joint swelling diary and tracker',
        theme_color: '#070c18',
        background_color: '#070c18',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/xlsx')) return 'vendor-xlsx';
          if (id.includes('node_modules/chart.js') || id.includes('node_modules/react-chartjs-2')) return 'vendor-charts';
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'vendor-react';
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true
  }
});
