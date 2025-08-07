import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { nuxtTransformPlugin } from './tests/utils/nuxt-transform-plugin'

export default defineConfig({
  plugins: [
    nuxtTransformPlugin(),
    vue()
  ],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts']
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, '.'),
      '@': path.resolve(__dirname, '.'),
      '#imports': path.resolve(__dirname, '.nuxt/imports.d.ts')
    }
  }
})