import type { Plugin } from 'vite'

/**
 * Vite plugin to transform Nuxt-specific macros in Vue files for testing
 * This allows us to test actual Vue components that use Nuxt features
 */
export function nuxtTransformPlugin(): Plugin {
  return {
    name: 'nuxt-transform',
    enforce: 'pre',
    transform(code: string, id: string) {
      // Only transform Vue files
      if (!id.endsWith('.vue')) {
        return null
      }

      // Transform definePageMeta to a no-op
      if (code.includes('definePageMeta')) {
        code = code.replace(
          /definePageMeta\s*\([^)]*\)/g,
          '(() => {})()'
        )
      }

      // Transform other Nuxt macros as needed
      // defineNuxtComponent -> defineComponent
      if (code.includes('defineNuxtComponent')) {
        code = code.replace(/defineNuxtComponent/g, 'defineComponent')
      }

      // Add imports for replaced functions if needed
      if (code.includes('defineComponent') && !code.includes("import { defineComponent")) {
        code = `import { defineComponent } from 'vue';\n${code}`
      }

      return {
        code,
        map: null
      }
    }
  }
}