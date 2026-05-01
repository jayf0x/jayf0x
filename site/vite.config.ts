import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "production" ? "/jayf0x" : "/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
}));
