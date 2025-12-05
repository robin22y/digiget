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

      // Force immediate updates - skip waiting for service worker
      devOptions: {
        enabled: true,
        type: 'module'
      },

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

        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // Force immediate activation of new service worker
        skipWaiting: true,
        clientsClaim: true,

        // Use NetworkFirst for HTML to always get latest version
        navigationPreload: true,

        runtimeCaching: [
          
          // HTML files - always check network first for updates
          {
            urlPattern: /\.html$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },

          // JS and CSS files - NetworkFirst to get updates
          {
            urlPattern: /\.(js|css)$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },

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
