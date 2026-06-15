import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Em dev (vite :5173) encaminha chamadas /api, /version e /healthz
  // para o Express (apps/api em :3010). Sem isso a SPA chama o proprio
  // Vite, recebe HTML/404 e os componentes caem no fallback estatico.
  server: {
    port: 5173,
    proxy: {
      '/api':     { target: 'http://localhost:3010', changeOrigin: true },
      '/version': { target: 'http://localhost:3010', changeOrigin: true },
      '/healthz': { target: 'http://localhost:3010', changeOrigin: true },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // D5/RNF02 — manualChunks separa as libs pesadas (graficos/radix) em chunks
  // proprios, melhorando o cache do navegador entre deploys. As paginas internas
  // ja sao code-split via React.lazy (routes.tsx). React permanece no entry para
  // evitar problemas de ordem de inicializacao.
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3-')) return 'charts'
            if (id.includes('@radix-ui')) return 'radix'
          }
        },
      },
    },
  },
})
