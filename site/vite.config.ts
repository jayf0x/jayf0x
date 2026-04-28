import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', { target: '19' }]],
      },
    }),
  ],
  base: mode === 'production' ? '/JAYF0X/' : '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
}))