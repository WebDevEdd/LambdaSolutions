import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  base: "/LambdaSolutions/",  // GitHub Pages Base Path

  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        createJob: resolve(__dirname, "createJob.html"),
        jobWorkView: resolve(__dirname, "src/jobWorkView/jobWorkView.html"),
        upload3DFile: resolve(__dirname, "upload3DFile.html"),
      },
    },
    assetsInlineLimit: 0, // Ensures images & assets aren't inlined
    outDir: "dist",
    emptyOutDir: true, // Clears previous builds
  },

  server: {
    port: 4173,
    open: true,
  },
});
