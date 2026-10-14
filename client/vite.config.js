import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  root: import.meta.dirname,
  envDir: path.resolve(import.meta.dirname, ".."), // single .env.local at the repo root
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@shared": path.resolve(import.meta.dirname, "../shared"),
    },
  },
  server: { port: 5173, proxy: { "/api": "http://localhost:3001" } },
  build: { outDir: "dist", emptyOutDir: true, sourcemap: false },
});
