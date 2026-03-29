import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
      'zod': path.resolve(__dirname, 'node_modules/zod'),
    },
  },
  server: {
    fs: {
      allow: [
        '..', // parent (for /shared)
        '/app', // frontend root
        '/shared', // shared root
      ],
    },
  },
})
