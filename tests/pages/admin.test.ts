import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import AdminPage from '~/pages/admin.vue'
import { 
  mockUser,
  mockOrganization,
  resetMocks
} from '../mocks/api'

vi.mock('~/services/auth', () => ({
  authService: {
    setUser: vi.fn(),
    setToken: vi.fn(),
    setOrganization: vi.fn(),
    getUser: vi.fn(),
    getToken: vi.fn(),
    getOrganization: vi.fn()
  }
}))

const mockApiFetch = vi.fn()

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({
    apiFetch: mockApiFetch
  })
}))

const mockNavigateTo = vi.fn()

globalThis.useNuxtApp = () => ({
  $i18n: { t: (key: string) => key }
})

globalThis.useRouter = () => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn()
})

globalThis.useApi = () => ({
  apiFetch: mockApiFetch
})

globalThis.navigateTo = mockNavigateTo
globalThis.onMounted = vi.fn((cb: Function) => cb())
globalThis.ref = (val: any) => ({ value: val })
globalThis.definePageMeta = vi.fn()

vi.mock('#imports', () => ({
  useNuxtApp: () => ({
    $i18n: { t: (key: string) => key }
  }),
  navigateTo: mockNavigateTo,
  onMounted: vi.fn((cb: Function) => cb()),
  ref: (val: any) => ({ value: val }),
  definePageMeta: vi.fn()
}))

vi.mock('~/components/ui/card', () => ({
  Card: { 
    name: 'Card',
    template: '<div class="card"><slot /></div>' 
  },
  CardContent: { 
    name: 'CardContent',
    template: '<div class="card-content"><slot /></div>' 
  },
  CardHeader: { 
    name: 'CardHeader',
    template: '<div class="card-header"><slot /></div>' 
  },
  CardTitle: { 
    name: 'CardTitle',
    template: '<h3 class="card-title"><slot /></h3>' 
  }
}))

vi.mock('~/components/ui/input', () => ({
  Input: { 
    name: 'Input',
    template: '<input v-bind="$attrs" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue'],
    emits: ['update:modelValue']
  }
}))

vi.mock('~/components/ui/label', () => ({
  Label: { 
    name: 'Label',
    template: '<label v-bind="$attrs"><slot /></label>' 
  }
}))

vi.mock('~/components/ui/button', () => ({
  Button: { 
    name: 'Button',
    template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
    props: ['disabled', 'type', 'variant', 'size']
  }
}))

vi.mock('~/components/ui/dialog', () => ({
  Dialog: { 
    name: 'Dialog',
    template: '<div v-if="modelValue" class="dialog" @click="$emit(\'update:modelValue\', false)"><slot /></div>',
    props: ['modelValue'],
    emits: ['update:modelValue', 'update:open']
  },
  DialogContent: { 
    name: 'DialogContent',
    template: '<div class="dialog-content" @click.stop><slot /></div>' 
  },
  DialogFooter: { 
    name: 'DialogFooter',
    template: '<div class="dialog-footer"><slot /></div>' 
  },
  DialogHeader: { 
    name: 'DialogHeader',
    template: '<div class="dialog-header"><slot /></div>' 
  },
  DialogTitle: { 
    name: 'DialogTitle',
    template: '<h2 class="dialog-title"><slot /></h2>' 
  }
}))

const mockUsers = [
  {
    id: 'user-1',
    email: 'admin@example.com',
    display_name: 'Admin User',
    is_organisation_admin: true
  },
  {
    id: 'user-2',
    email: 'user@example.com',
    display_name: 'Regular User',
    is_organisation_admin: false
  }
]

describe('Admin Page (Real Component)', () => {
  beforeEach(() => {
    resetMocks()
    mockApiFetch.mockReset()
    mockNavigateTo.mockReset()
    vi.clearAllMocks()
    
    global.confirm = vi.fn(() => true)
  })

  const createWrapper = async () => {
    const wrapper = mount(AdminPage, {
      global: {
        stubs: {
          ClientOnly: {
            template: '<div><slot /></div>'
          }
        }
      }
    })
    
    await flushPromises()
    return wrapper
  }

  describe('Access Control', () => {
    it('shows admin content when user is organization admin', async () => {
      mockApiFetch
        .mockResolvedValueOnce({ // identity check
          data: {
            is_organisation_admin: true,
            user: { ...mockUser, id: 'user-1' },
            organisation: mockOrganization
          }
        })
        .mockResolvedValueOnce({ // users data
          data: mockUsers
        })

      const wrapper = await createWrapper()
      
      expect(wrapper.find('.card').exists()).toBe(true)
      expect(wrapper.text()).toContain('admin.organizationSettings')
      expect(wrapper.text()).toContain('admin.organizationUsers')
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })

    it('redirects when user is not organization admin', async () => {
      mockApiFetch.mockResolvedValueOnce({
        data: {
          is_organisation_admin: false,
          user: { ...mockUser, id: 'user-2' },
          organisation: mockOrganization
        }
      })

      await createWrapper()
      await flushPromises()
      
      expect(mockNavigateTo).toHaveBeenCalledWith('/')
    })
  })

  describe('Organization Management', () => {
    beforeEach(() => {
      mockApiFetch
        .mockResolvedValueOnce({ // identity check
          data: {
            is_organisation_admin: true,
            user: { ...mockUser, id: 'user-1' },
            organisation: mockOrganization
          }
        })
        .mockResolvedValueOnce({ // users data
          data: mockUsers
        })
    })

    it('updates organization name', async () => {
      mockApiFetch.mockResolvedValueOnce({ // PATCH response
        data: {
          ...mockOrganization,
          display_name: 'New Organization Name'
        }
      })

      const wrapper = await createWrapper()
      
      const forms = wrapper.findAll('form')
      const orgForm = forms[0]
      
      const input = orgForm.find('input[type="text"]')
      await input.setValue('New Organization Name')
      
      await orgForm.trigger('submit')
      await flushPromises()

      expect(mockApiFetch).toHaveBeenCalledWith('/api/auth/organisation', {
        method: 'PATCH',
        body: {
          display_name: 'New Organization Name'
        }
      })
    })
  })

  describe('User Management', () => {
    beforeEach(() => {
      mockApiFetch
        .mockResolvedValueOnce({ // identity check
          data: {
            is_organisation_admin: true,
            user: { ...mockUser, id: 'user-1' },
            organisation: mockOrganization
          }
        })
        .mockResolvedValueOnce({ // users data
          data: mockUsers
        })
    })

    it('displays list of users from actual component structure', async () => {
      const wrapper = await createWrapper()
      
      const table = wrapper.find('table')
      expect(table.exists()).toBe(true)
      
      const rows = wrapper.findAll('tbody tr')
      expect(rows.length).toBe(2)
      
      expect(wrapper.text()).toContain('Admin User')
      expect(wrapper.text()).toContain('admin@example.com')
      expect(wrapper.text()).toContain('Regular User')
      expect(wrapper.text()).toContain('user@example.com')
    })
  })

  describe('Component Structure Verification', () => {
    it('verifies the actual component has the expected structure', async () => {
      mockApiFetch
        .mockResolvedValueOnce({ // identity check
          data: {
            is_organisation_admin: true,
            user: { ...mockUser, id: 'user-1' },
            organisation: mockOrganization
          }
        })
        .mockResolvedValueOnce({ // users data
          data: mockUsers
        })

      const wrapper = await createWrapper()
      
      const cards = wrapper.findAll('.card')
      expect(cards.length).toBe(2)
      
      // First card should be organization settings
      expect(cards[0].find('.card-title').text()).toContain('admin.organizationSettings')
      expect(cards[0].find('form').exists()).toBe(true)
      expect(cards[0].find('input[type="text"]').exists()).toBe(true)
      
      // Second card should be users management
      expect(cards[1].find('.card-title').text()).toContain('admin.organizationUsers')
      expect(cards[1].find('button').text()).toContain('admin.createUser')
      
      // Should have a table with correct structure
      const table = cards[1].find('table')
      expect(table.exists()).toBe(true)
      
      const headers = table.findAll('th')
      expect(headers.length).toBe(3) // Display Name, Email, Actions
      expect(headers[0].text()).toContain('admin.displayName')
      expect(headers[1].text()).toContain('admin.email')
      expect(headers[2].text()).toContain('admin.actions')
    })
  })
})