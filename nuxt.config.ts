// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },

  css: [
    'vanilla-cookieconsent/dist/cookieconsent.css'
  ],

  scripts: {
    registry: {
      googleAnalytics: {
        id: 'G-2GCXK1BQTV',
      }
    }
  },

  runtimeConfig: {
    // Server-only config (not exposed to client)
    backendEndpoint: process.env.BACKEND_ENDPOINT || 'http://localhost:8000',
    apiKey: process.env.API_KEY || '',
    
    // Public config (exposed to client)
    public: {
      viralNarrativesLimit: process.env.VIRAL_NARRATIVES_LIMIT ? parseInt(process.env.VIRAL_NARRATIVES_LIMIT) : 9,
      prevalentNarrativesLimit: process.env.PREVALENT_NARRATIVES_LIMIT ? parseInt(process.env.PREVALENT_NARRATIVES_LIMIT) : 10,
      // Same env var names (and defaults) as core-api's core/config.py, so the engagement
      // we plot is the engagement the Composite Virality Index scores.
      viralityScoreLikesWeight: process.env.VIRALITY_SCORE_LIKES_WEIGHT ? parseInt(process.env.VIRALITY_SCORE_LIKES_WEIGHT) : 1,
      viralityScoreCommentsWeight: process.env.VIRALITY_SCORE_COMMENTS_WEIGHT ? parseInt(process.env.VIRALITY_SCORE_COMMENTS_WEIGHT) : 5,
      testModeEnabled: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
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