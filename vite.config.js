import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
export default defineConfig({
  base: "/awesome-paper-research-skills/",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: { main: resolve("index.html"), en: resolve("en/index.html") },
    },
  },
});
