import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-redux',
      'react-router-dom',
      '@reduxjs/toolkit',
      'axios',
      'react-toastify',
      'chart.js',
      'primereact/card',
      'primereact/button',
      'primereact/inputtext',
      'primereact/password',
      'primereact/dropdown',
      'primereact/datatable',
      'primereact/column',
      'primereact/chart',
      'primereact/inputnumber',
      'primereact/menubar'
    ],
    force: true
  }
})
