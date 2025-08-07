import { mount } from '@vue/test-utils'
import { vi } from 'vitest'
import type { Component } from 'vue'

// Helper to create a wrapper with common Nuxt mocks
export const createWrapper = (component: Component, options: any = {}) => {
  const defaultOptions = {
    global: {
      mocks: {
        $t: (key: string) => key, // Simple i18n mock
        $i18n: {
          t: (key: string) => key
        },
        $nuxt: {},
        $route: {
          path: '/',
          query: {},
          params: {}
        },
        $router: {
          push: vi.fn(),
          replace: vi.fn(),
          go: vi.fn(),
          back: vi.fn(),
          forward: vi.fn()
        }
      },
      stubs: {
        NuxtLink: true,
        ClientOnly: {
          template: '<div><slot /></div>'
        }
      }
    }
  }

  return mount(component, {
    ...defaultOptions,
    ...options,
    global: {
      ...defaultOptions.global,
      ...options.global,
      mocks: {
        ...defaultOptions.global.mocks,
        ...options.global?.mocks
      }
    }
  })
}

export const mockNuxtComposables = () => {
  vi.mock('#app/nuxt', () => ({
    useNuxtApp: () => ({
      $i18n: {
        t: (key: string) => key
      }
    })
  }))

  vi.mock('#app/composables/router', () => ({
    useRoute: () => ({
      path: '/',
      query: {},
      params: {}
    }),
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      go: vi.fn(),
      back: vi.fn(),
      forward: vi.fn()
    })
  }))

  vi.mock('#app/composables/router', () => ({
    navigateTo: vi.fn()
  }))

  vi.mock('#app/composables/cookie', () => ({
    useCookie: vi.fn(() => ({
      value: null
    }))
  }))
}

export const flushPromises = () => {
  return new Promise(resolve => setTimeout(resolve, 0))
}

export const fillForm = async (wrapper: any, fields: Record<string, string>) => {
  for (const [selector, value] of Object.entries(fields)) {
    const input = wrapper.find(selector)
    await input.setValue(value)
    await input.trigger('input')
  }
}

export const clickButton = async (wrapper: any, selector: string) => {
  const button = wrapper.find(selector)
  await button.trigger('click')
  await flushPromises()
}