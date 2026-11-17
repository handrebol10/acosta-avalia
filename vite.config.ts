import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base relativa: funciona tanto localmente quanto no GitHub Pages.
// Porta fixa (strictPort): os dados ficam salvos por endereço, então o app abre sempre em localhost:5180.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5180, strictPort: true, open: true },
  preview: { port: 5180, strictPort: true, open: true },
  // a biblioteca de PDF (~1,2 MB) só é baixada quando um relatório é aberto
  build: { chunkSizeWarningLimit: 1400 },
})
