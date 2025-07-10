// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },

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
    'shadcn-nuxt'
  ]
})
