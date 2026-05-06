import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from 'path'


export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "production" ? "/jayf0x" : "/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
    resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
}));
