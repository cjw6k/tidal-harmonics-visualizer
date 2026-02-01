import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/tidal-harmonics-visualizer/',
  plugins: [
    react(),
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'vite.svg'],
      manifest: {
        name: 'Tidal Harmonics',
        short_name: 'Tides',
        description: 'Interactive tidal harmonic visualization and prediction',
        theme_color: '#1e3a5f',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'any',
        categories: ['education', 'utilities'],
        icons: [
          {
            src: 'icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          // Split React into its own chunk (cached separately)
          'vendor-react': ['react', 'react-dom', 'scheduler'],
          // Split Three.js ecosystem (largest dependency)
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
          // Split Recharts (large charting library)
          'vendor-recharts': ['recharts', 'd3-scale', 'd3-shape', 'd3-path', 'd3-array', 'd3-color', 'd3-interpolate', 'd3-format', 'd3-time', 'd3-time-format'],
        },
      },
    },
  },
})
