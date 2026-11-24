import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import { mount, flushPromises } from '@vue/test-utils'
import SuperadminPage from '~/pages/superadmin.vue'

const mockApiFetch = vi.fn()

// Nuxt auto-imports aren't resolved in unit tests: give the page what it uses
vi.hoisted(async () => {
  const vue = await import('vue')
  Object.assign(globalThis, {
    ref: vue.ref,
    onMounted: vue.onMounted,
    useI18n: () => ({ t: (key: string) => key }),
  })
})

vi.mock('~/components/CreateOrganizationDialog.vue', () => ({
  default: { name: 'CreateOrganizationDialog', template: '<div />' }
}))

// A native select stands in for the real one, so a test can pick a language
vi.mock('~/components/OrganizationLanguageSelect.vue', () => ({
  default: {
    name: 'OrganizationLanguageSelect',
    props: ['modelValue', 'id', 'disabled'],
    emits: ['update:modelValue'],
    template: `
      <select :id="id" :value="modelValue" :disabled="disabled" @change="$emit('update:modelValue', $event.target.value)">
        <option value="en">en</option>
        <option value="es">es</option>
      </select>
    `
  }
}))

const passthrough = (tag: string) => ({ template: `<${tag}><slot /></${tag}>` })

const organizations = [
  { id: 'org-1', display_name: 'First Org', short_name: 'first', language: 'en', country_codes: ['GBR'] },
  { id: 'org-2', display_name: 'Second Org', short_name: 'second', language: 'en', country_codes: ['ESP'] },
]

let wrapper: VueWrapper | undefined
afterEach(() => wrapper?.unmount())

// Mount the page and expand the second organisation
const mountExpanded = async () => {
  wrapper = mount(SuperadminPage, {
    global: {
      components: {
        Button: {
          props: ['type', 'disabled'],
          template: '<button :type="type" :disabled="disabled"><slot /></button>'
        },
        Card: passthrough('div'),
        CardHeader: passthrough('div'),
        CardTitle: passthrough('h3'),
        CardContent: passthrough('div'),
        Label: passthrough('label'),
        FontAwesome: { template: '<i />' },
      }
    }
  })
  await flushPromises()

  const header = wrapper.findAll('h3').find(h => h.text() === 'Second Org')
  await header!.trigger('click')
  await flushPromises()

  return wrapper
}

const patchCalls = () => mockApiFetch.mock.calls.filter(([, options]) => options?.method === 'PATCH')

describe('Superadmin page: organisation language', () => {
  beforeEach(() => {
    mockApiFetch.mockReset()
    mockApiFetch.mockImplementation(async (url: string) => {
      if (url === '/api/auth/organisations') return { data: organizations.map(org => ({ ...org })) }
      if (url === '/api/auth/organisation/users') return { data: [] }
      throw new Error(`unexpected request to ${url}`)
    })
    Object.assign(globalThis, { useApi: () => ({ apiFetch: mockApiFetch }) })
  })

  it('shows the organisation’s language and nothing to save until it changes', async () => {
    const page = await mountExpanded()

    expect((page.get('#language-org-2').element as HTMLSelectElement).value).toBe('en')
    expect(page.get('form button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('saves the language of the organisation it was picked for', async () => {
    const page = await mountExpanded()
    mockApiFetch.mockResolvedValueOnce({ data: { ...organizations[1], language: 'es' } })

    await page.get('#language-org-2').setValue('es')
    await page.get('form').trigger('submit')
    await flushPromises()

    expect(patchCalls()).toEqual([
      ['/api/auth/organisation', {
        method: 'PATCH',
        query: { organisation_id: 'org-2' },
        body: { language: 'es' }
      }]
    ])
    expect(page.get('[role="status"]').text()).toBe('superadmin.languageUpdated')
    // The list shows the saved language, and there is nothing left to save
    expect(page.text()).toContain('es')
    expect(page.get('form button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('shows the API’s error and keeps the saved language when the update fails', async () => {
    const page = await mountExpanded()
    mockApiFetch.mockRejectedValueOnce({ data: { detail: 'not allowed' } })

    await page.get('#language-org-2').setValue('es')
    await page.get('form').trigger('submit')
    await flushPromises()

    expect(page.get('[role="status"]').text()).toBe('not allowed')
    // Still differs from what is saved, so it can be retried
    expect(page.get('form button[type="submit"]').attributes('disabled')).toBeUndefined()
  })
})
