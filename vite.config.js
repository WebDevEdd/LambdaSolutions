import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Use this if deploying to a subdirectory like /LambdaSolutions/
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        jobWorkView: './src/jobWorkView/jobWorkView.html',
        upload3DFile: './src/upload3DFiles/upload3DFile.html',
      },
    },
    outDir: 'dist',
  },
  server: {
    port: 4173,
    open: true,
  },
});
