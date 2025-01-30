import { defineConfig } from "vite";

export default defineConfig({
  base: "/LambdaSolutions/",

  build: {
    rollupOptions: {
      input: {
        main: "./index.html",
        createJob: "./createJob.html", // Create Job page // Main entry point
        jobWorkView: "./src/jobWorkView/jobWorkView.html", // Job Work View page
        upload3DFile: "./upload3DFile.html", // Upload 3D File page
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
  },
});
