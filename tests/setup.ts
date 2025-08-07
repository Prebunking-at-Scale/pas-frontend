import { config } from '@vue/test-utils'
import { vi } from 'vitest'

export const mockApiFetch = vi.fn()
export const mockNavigateTo = vi.fn()
export const mockRouterPush = vi.fn()
export const mockRouterReplace = vi.fn()

vi.mock('#imports', () => ({
  useNuxtApp: () => ({
    $i18n: { t: (key: string) => key }
  }),
  useRoute: () => ({
    query: {},
    params: {}
  }),
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
    back: vi.fn()
  }),
  navigateTo: mockNavigateTo,
  definePageMeta: vi.fn(),
  useHead: vi.fn(),
  useCookie: vi.fn(() => ({
    value: null
  })),
  useRuntimeConfig: () => ({
    public: {
      apiBase: 'http://localhost:3000'
    }
  }),
  onMounted: vi.fn((cb) => cb()),
  ref: (val: any) => ({ value: val }),
  $fetch: {
    create: vi.fn(() => vi.fn())
  }
}))

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({
    apiFetch: mockApiFetch
  })
}))

global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), 
    removeListener: vi.fn(), 
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

config.global.mocks = {
  $t: (key: string) => key,
  $i18n: {
    t: (key: string) => key,
    locale: 'en'
  }
}