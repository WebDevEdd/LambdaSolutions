import { defineConfig } from "vite";

export default defineConfig({
  base: "/LambdaSolutions/", // GitHub Pages base path
  build: {
    rollupOptions: {
      input: "./index.html", // Entry point
    },
  },
});
