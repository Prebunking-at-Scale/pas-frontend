// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      backendEndpoint: process.env.BACKEND_ENDPOINT || 'http://localhost:8000',
      apiKey: process.env.API_KEY || ''
    }
  },

  vite: {
    server: {
      allowedHosts: true,
    },
    plugins: [
        tailwindcss()
    ]
  },

  i18n: {
    locales: [
      { code: 'en', name: 'English', file: 'en.json'},
      { code: 'es', name: 'Español', file: 'es.json'},
      { code: 'de', name: 'Deutsch', file: 'de.json'},
      { code: 'fr', name: 'Français', file: 'fr.json'},
    ],
    defaultLocale: 'en',
  },

  googleFonts: {
    families: {
      'Archivo': [100, 200, 300, 400, 500, 600, 700, 800, 900],
    },
  },

  shadcn: {
    /**
     * Prefix for all the imported component
     */
    prefix: '',
    /**
     * Directory that the component lives in.
     * @default "./components/ui"
     */
    componentDir: './components/ui'
  },

  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/test-utils',
    '@nuxt/ui',
    '@nuxtjs/i18n',
    'shadcn-nuxt',
    '@pinia/nuxt',
    '@nuxtjs/google-fonts'
  ]
})