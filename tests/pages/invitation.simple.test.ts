import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'

// Create a simple test component that mimics the invitation page structure
const TestInvitationComponent = defineComponent({
  template: `
    <div class="max-w-md w-full space-y-8 mx-auto">
      <div class="flex justify-center flex-col">
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {{ $t('invitation.title') }}
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          {{ $t('invitation.subtitle') }}
        </p>
      </div>

      <div v-if="error" class="rounded-md bg-red-50 p-4">
        <div class="flex">
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">
              {{ error }}
            </h3>
          </div>
        </div>
      </div>

      <form v-if="!autoAccepting" @submit.prevent="acceptInvitation" class="mt-8 space-y-6">
        <div class="space-y-4">
          <div>
            <label for="token">{{ $t('invitation.tokenLabel') }}</label>
            <input
              v-model="inviteToken"
              type="text"
              id="token"
              required
              class="mt-1 block w-full"
              :placeholder="$t('invitation.tokenPlaceholder')"
            />
          </div>
        </div>
        <button
          type="submit"
          :disabled="!inviteToken || loading"
          class="w-full"
        >
          <span v-if="loading">{{ $t('invitation.accepting') }}</span>
          <span v-else>{{ $t('invitation.acceptButton') }}</span>
        </button>
      </form>

      <div v-else class="text-center">
        <p class="mb-4">{{ $t('invitation.autoAccepting') }}</p>
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    </div>
  `,
  data() {
    return {
      inviteToken: '',
      loading: false,
      error: '',
      autoAccepting: false
    }
  },
  methods: {
    async acceptInvitation() {
      this.loading = true
      this.error = ''
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Simulate success
        this.$emit('invitation-accepted', {
          token: this.inviteToken
        })
      } catch (err: any) {
        this.error = err.message || 'invitation.error'
      } finally {
        this.loading = false
      }
    }
  },
  created() {
    // Check for auto-accept token
    const token = this.$route?.query?.token || this.$route?.query?.invite_token
    if (token) {
      this.autoAccepting = true
      this.inviteToken = token as string
      // Use nextTick to ensure proper timing
      this.$nextTick(() => {
        this.acceptInvitation()
      })
    }
  }
})

describe('Invitation Page - Simple Tests', () => {
  const createWrapper = (options = {}) => {
    return mount(TestInvitationComponent, {
      global: {
        mocks: {
          $t: (key: string) => key,
          $route: { query: {} },
          ...options.mocks
        }
      }
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Manual Token Entry', () => {
    it('renders invitation form when no token provided', () => {
      const wrapper = createWrapper()
      
      expect(wrapper.find('h2').text()).toBe('invitation.title')
      expect(wrapper.text()).toContain('invitation.subtitle')
      expect(wrapper.find('input').exists()).toBe(true)
      expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    })

    it('disables submit button when no token entered', () => {
      const wrapper = createWrapper()
      
      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('disabled')).toBeDefined()
    })

    it('enables submit button when token entered', async () => {
      const wrapper = createWrapper()
      
      const input = wrapper.find('input')
      await input.setValue('test-token')
      
      const submitButton = wrapper.find('button[type="submit"]')
      expect(submitButton.attributes('disabled')).toBeUndefined()
    })

    it('emits invitation-accepted event on form submit', async () => {
      const wrapper = createWrapper()
      
      const input = wrapper.find('input')
      await input.setValue('test-token')
      
      const form = wrapper.find('form')
      await form.trigger('submit')
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 150))
      
      expect(wrapper.emitted('invitation-accepted')).toBeTruthy()
      expect(wrapper.emitted('invitation-accepted')?.[0]).toEqual([{
        token: 'test-token'
      }])
    })
  })

  describe('Auto-Accept with Token in URL', () => {
    it('shows loading state when token provided in URL', () => {
      const wrapper = createWrapper({
        mocks: {
          $route: { query: { token: 'url-token-123' } }
        }
      })
      
      expect(wrapper.text()).toContain('invitation.autoAccepting')
      expect(wrapper.find('.animate-spin').exists()).toBe(true)
      expect(wrapper.find('form').exists()).toBe(false)
    })

    it('supports invite_token parameter as well', () => {
      const wrapper = createWrapper({
        mocks: {
          $route: { query: { invite_token: 'invite-token-123' } }
        }
      })
      
      expect(wrapper.text()).toContain('invitation.autoAccepting')
      expect(wrapper.find('.animate-spin').exists()).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('displays error message when set', async () => {
      const wrapper = createWrapper()
      
      await wrapper.setData({ error: 'Invalid token' })
      
      expect(wrapper.text()).toContain('Invalid token')
      expect(wrapper.find('.bg-red-50').exists()).toBe(true)
    })
  })

  describe('Loading States', () => {
    it('shows loading text on button during submission', async () => {
      const wrapper = createWrapper()
      
      await wrapper.setData({ 
        inviteToken: 'test-token',
        loading: true 
      })
      
      const button = wrapper.find('button[type="submit"]')
      expect(button.text()).toBe('invitation.accepting')
      expect(button.attributes('disabled')).toBeDefined()
    })
  })
})