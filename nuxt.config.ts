// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },

  runtimeConfig: {
    // Server-only config (not exposed to client)
    apiKey: process.env.API_KEY || '',
    backendEndpoint: process.env.BACKEND_ENDPOINT || 'http://localhost:8000',
    
    // Public config (exposed to client)
    public: {
      viralNarrativesHours: process.env.VIRAL_NARRATIVES_HOURS ? parseInt(process.env.VIRAL_NARRATIVES_HOURS) : 168,
      viralNarrativesLimit: process.env.VIRAL_NARRATIVES_LIMIT ? parseInt(process.env.VIRAL_NARRATIVES_LIMIT) : 20,
      prevalentNarrativesHours: process.env.PREVALENT_NARRATIVES_HOURS ? parseInt(process.env.PREVALENT_NARRATIVES_HOURS) : 168,
      prevalentNarrativesLimit: process.env.PREVALENT_NARRATIVES_LIMIT ? parseInt(process.env.PREVALENT_NARRATIVES_LIMIT) : 10
    }
  },

  // Add this for debugging
  hooks: {
    'ready': () => {
      console.log('Environment variables at startup:')
      console.log('API_KEY:', process.env.API_KEY ? 'SET' : 'NOT SET')
      console.log('BACKEND_ENDPOINT:', process.env.BACKEND_ENDPOINT)
      console.log('VIRAL_NARRATIVES_HOURS:', process.env.VIRAL_NARRATIVES_HOURS)
      console.log('VIRAL_NARRATIVES_LIMIT:', process.env.VIRAL_NARRATIVES_LIMIT)
      console.log('PREVALENT_NARRATIVES_HOURS:', process.env.PREVALENT_NARRATIVES_HOURS)
      console.log('PREVALENT_NARRATIVES_LIMIT:', process.env.PREVALENT_NARRATIVES_LIMIT)
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
    langDir: 'locales/',
  },

  googleFonts: {
    families: {
      'Archivo': [100, 200, 300, 400, 500, 600, 700, 800, 900],
    },
  },

  fontawesome: {
    icons: {
      solid: true,
      regular: true,
      brands: true,
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
    '@nuxtjs/google-fonts',
    '@vesp/nuxt-fontawesome'
  ]
})