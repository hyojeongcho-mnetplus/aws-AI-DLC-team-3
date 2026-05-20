import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/api/",
  build: { outDir: "dist/client" },
  server: {
    proxy: {
      "^/api/api/(issues|health|actions|ingest)(/.*)?$": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/api/, "/api"),
      },
      "^/api/(issues|health|actions|ingest)(/.*)?$": "http://localhost:3001",
    },
  },
});
