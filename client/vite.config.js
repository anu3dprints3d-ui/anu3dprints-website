import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  root: import.meta.dirname,
  envDir: path.resolve(import.meta.dirname, ".."), // single .env.local at the repo root
  plugins: [react(), tailwindcss()],
  // Same limit the server enforces: serverless hosts (Vercel ~4.5 MB, Netlify ~6 MB bodies) vs a Node server (24 MB).
  define: { __MAX_UPLOAD_MB__: JSON.stringify(process.env.VERCEL || process.env.NETLIFY ? 4 : 24) },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@shared": path.resolve(import.meta.dirname, "../shared"),
    },
  },
  server: { port: 5173, proxy: { "/api": "http://localhost:3001" } },
  build: { outDir: "dist", emptyOutDir: true, sourcemap: false },
});
