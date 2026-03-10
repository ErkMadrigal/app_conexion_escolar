/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/app/',
  plugins: [
    vue(),
    legacy(),
    VitePWA({
      strategies: 'injectManifest',

      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Conexión Escolar',
        short_name: 'Conexión',
        description: 'Conexión Escolar',
        display: 'standalone',
        start_url: '/app/',
        scope: '/app/',
        theme_color: '#0ea5e9',
        background_color: '#ffffff',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      devOptions: { enabled: false }
    })
  ],

  // ✅ AGREGAR ESTO
  server: {
    host: true,
    allowedHosts: [
      'aubrianna-matripotestal-leonard.ngrok-free.dev'
    ]
    // (Opcional) si te cambia el subdominio cada rato, usa esto:
    // allowedHosts: 'all'
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom'
  }
})