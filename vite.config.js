import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// Plugin to format manifest after build
const formatManifestPlugin = () => {
  return {
    name: 'format-manifest',
    closeBundle() {
      const manifestPath = join(process.cwd(), 'dist', 'manifest.webmanifest')
      try {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
        writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8')
      } catch (e) {
        console.warn('Could not format manifest:', e)
      }
    }
  }
}

export default defineConfig({

  plugins: [

    vue(),

    VitePWA({

      registerType: 'autoUpdate',

      injectRegister: 'script',

      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo.svg'],

      manifestFilename: 'manifest.webmanifest',

      manifest: {

        id: '/',

        name: 'Digiget',

        short_name: 'Digiget',

        description: 'Keys. Meds. ID. Handover.',

        theme_color: '#09090b',

        background_color: '#09090b',

        display: 'standalone',

        start_url: '/',

        scope: '/',

        orientation: 'portrait',

        icons: [

          {

            src: 'icon-192x192.png',

            sizes: '192x192',

            type: 'image/png',

            purpose: 'any'

          },

          {

            src: 'icon-192x192.png',

            sizes: '192x192',

            type: 'image/png',

            purpose: 'maskable'

          },

          {

            src: 'icon-512x512.png',

            sizes: '512x512',

            type: 'image/png',

            purpose: 'any'

          },

          {

            src: 'icon-512x512.png',

            sizes: '512x512',

            type: 'image/png',

            purpose: 'maskable'

          }

        ]

      },

      workbox: {
        // ✅ Auto-update settings: Activate immediately and clean up old caches
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,

        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        runtimeCaching: [

          {

            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,

            handler: 'CacheFirst',

            options: {

              cacheName: 'google-fonts-cache',

              expiration: {

                maxEntries: 10,

                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year

              },

              cacheableResponse: {

                statuses: [0, 200]

              }

            }

          }

        ]

      }

    }),

    formatManifestPlugin()

  ],

})
