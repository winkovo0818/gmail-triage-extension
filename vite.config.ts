import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: false,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        options: path.resolve(__dirname, 'src/options/options.html'),
        background: path.resolve(__dirname, 'src/background/index.ts'),
        content: path.resolve(__dirname, 'src/content/index.ts'),
        sidebar: path.resolve(__dirname, 'src/sidebar/index.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => `${chunkInfo.name}.js`,
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: 'assets/[name][extname]'
      }
    }
  },
  publicDir: 'public'
})
