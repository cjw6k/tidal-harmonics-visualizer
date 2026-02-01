import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
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
