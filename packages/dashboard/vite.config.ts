import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/api/",
  build: { outDir: "dist/client" },
  server: {
    proxy: {
      "^/api/(issues|health|actions|ingest)(/.*)?$": "http://localhost:3001",
    },
  },
});
