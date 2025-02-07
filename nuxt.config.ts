// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  srcDir: 'src/',
  devtools: { enabled: true },
  ssr: false,
  compatibilityDate: "2025-02-06",
  telemetry: false,
  css: ['~/assets/css/main.css'],
  devServer: { host: process.env.TAURI_DEV_HOST || 'localhost' },
  modules: ['@pinia/nuxt', '@nuxtjs/i18n'],
  i18n: {
    locales: [
      { code: 'en', language: 'en-US' },
      { code: 'fr', language: 'fr-FR' }
    ],
    defaultLocale: 'en',
    vueI18n: './i18n.config.ts',
  },
  app: {
    rootId: 'app', 
    layoutTransition: { name: 'layout', mode: 'out-in' },
    pageTransition: { name: 'page', mode: 'out-in' }
  },
  vite: {
    // Better support for Tauri CLI output
    clearScreen: false,
    // Enable environment variables
    // Additional environment variables can be found at
    // https://v2.tauri.app/reference/environment-variables/
    envPrefix: ['VITE_', 'TAURI_'],
    server: {
      // Tauri requires a consistent port
      strictPort: true,
    },
    routeRules: {
      '/': { prerender: true }
    },
    plugins: [
        tailwindcss(),

    ],
  },
  plugins: ['~/plugins/chartjs.ts']
})