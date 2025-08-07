import { mount } from '@vue/test-utils'
import { vi } from 'vitest'
import { defineComponent, h } from 'vue'

// Mock implementations
const mockRoute = {
  query: {},
  params: {},
  path: '/',
  name: ''
}

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn()
}

const mockNavigateTo = vi.fn()
const mockApiFetch = vi.fn()

// Create a wrapper component that provides all necessary context
export const createNuxtTestWrapper = (component: any, options: any = {}) => {
  const TestWrapper = defineComponent({
    setup() {
      // Provide all the necessary context
      return () => h('div', [h(component)])
    }
  })

  // Merge default mocks with custom ones
  const defaultMocks = {
    $t: (key: string) => key,
    $i18n: { t: (key: string) => key },
    $route: { ...mockRoute, ...(options.route || {}) },
    $router: mockRouter
  }

  // Create global provides
  const provides = {
    ...options.provides
  }

  return mount(TestWrapper, {
    global: {
      mocks: { ...defaultMocks, ...(options.mocks || {}) },
      provide: provides,
      stubs: {
        NuxtLink: {
          template: '<a><slot /></a>'
        },
        ...options.stubs
      },
      plugins: options.plugins || []
    }
  })
}

// Export mocks for test assertions
export { mockRouter, mockNavigateTo, mockApiFetch }

// Helper to reset all mocks
export const resetNuxtMocks = () => {
  mockRouter.push.mockClear()
  mockRouter.replace.mockClear()
  mockRouter.back.mockClear()
  mockNavigateTo.mockClear()
  mockApiFetch.mockClear()
}