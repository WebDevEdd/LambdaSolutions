import { defineConfig } from "vite";

export default defineConfig({
  base: "/",

  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        jobWorkView: "jobWorkView.html",
        upload3DFile: "upload3DFile.html",
        createJob: "createJob.html",
      },
      output: {
        manualChunks(id) {
          // Force `viewAllJobs.js` into its own chunk
          if (id.includes("viewAllJobs.js")) {
            return "viewAllJobs";
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    outDir: "dist",
  },

  server: {
    port: 4173,
    open: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
