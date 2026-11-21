import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Pre-builds the React pages into plain browser JavaScript in react-dist/.
// The HTML pages load these files directly, so the site works on GitHub Pages
// ("Deploy from a branch"), with VS Code Live Server, and with `npm run dev` - no build step needed to view it.
//
// After changing anything in src/, run:  npm run build:react   (or keep `npm run watch:react` running)
// and commit the updated react-dist/ folder.
export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: 'react-dist',
    emptyOutDir: true,
    copyPublicDir: false,
    minify: true,
    rollupOptions: {
      input: {
        login: resolve(__dirname, 'src/login/main.jsx'),
        forum: resolve(__dirname, 'src/forum/main.jsx'),
        rewards: resolve(__dirname, 'src/rewards/main.jsx'),
        events: resolve(__dirname, 'src/events/main.jsx')
      },
      // Stable file names so the HTML can point at them.
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        chunkFileNames: 'shared-[name].js',
        assetFileNames: '[name][extname]'
      },
      preserveEntrySignatures: false
    }
  }
})
