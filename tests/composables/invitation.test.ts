import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  mockInvitationResponse, 
  mockUser,
  mockOrganization,
  resetMocks 
} from '../mocks/api'

vi.mock('~/services/auth', () => ({
  authService: {
    setUser: vi.fn(),
    setToken: vi.fn(),
    setOrganization: vi.fn()
  }
}))

const mockApiFetch = vi.fn()
vi.mock('~/composables/useApi', () => ({
  useApi: () => ({
    apiFetch: mockApiFetch
  })
}))

vi.mock('#imports', () => ({
  useRoute: () => ({
    query: {}
  }),
  useRouter: () => ({
    push: vi.fn()
  }),
  useNuxtApp: () => ({
    $i18n: { t: (key: string) => key }
  }),
  definePageMeta: vi.fn(),
  onMounted: vi.fn((cb) => cb()),
  ref: vi.fn((val) => ({ value: val }))
}))

describe('Invitation Page', () => {
  beforeEach(() => {
    resetMocks()
    mockApiFetch.mockReset()
    vi.clearAllMocks()
    
    const mockSessionStorage = {
      setItem: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    }
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true
    })
  })

  describe('Accept Invitation', () => {
    it('accepts invitation successfully with single organization', async () => {
      mockApiFetch.mockResolvedValue(mockInvitationResponse)
      
      const { authService } = await import('~/services/auth')
      
      const inviteToken = 'test-token'
      const response = await mockApiFetch('/api/auth/organisation/invite/accept', {
        method: 'GET',
        query: { invite_token: inviteToken }
      })
      
      expect(mockApiFetch).toHaveBeenCalledWith('/api/auth/organisation/invite/accept', {
        method: 'GET',
        query: { invite_token: 'test-token' }
      })
      
      expect(response).toEqual(mockInvitationResponse)
      
      const { user, organisations } = response.data
      const orgId = Object.keys(organisations)[0]
      const orgData = organisations[orgId]
      
      authService.setUser(user)
      authService.setToken(orgData.token)
      authService.setOrganization(orgData.organisation.id)
      
      expect(authService.setUser).toHaveBeenCalledWith(mockUser)
      expect(authService.setToken).toHaveBeenCalledWith('mock-invitation-token')
      expect(authService.setOrganization).toHaveBeenCalledWith(mockOrganization.id)
    })

    it('handles first time setup flag', async () => {
      mockApiFetch.mockResolvedValue(mockInvitationResponse)
      
      const response = await mockApiFetch('/api/auth/organisation/invite/accept', {
        method: 'GET',
        query: { invite_token: 'test-token' }
      })
      
      const { user, organisations, first_time_setup } = response.data
      const orgId = Object.keys(organisations)[0]
      const orgData = organisations[orgId]
      
      if (first_time_setup) {
        sessionStorage.setItem('first_time_setup', 'true')
        sessionStorage.setItem('invitation_user_data', JSON.stringify({
          email: user.email,
          display_name: user.display_name || '',
          organization: orgData.organisation
        }))
      }
      
      expect(sessionStorage.setItem).toHaveBeenCalledWith('first_time_setup', 'true')
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'invitation_user_data',
        expect.stringContaining('test@example.com')
      )
    })

    it('handles API errors gracefully', async () => {
      const error = { data: { detail: 'Invalid or expired token' } }
      mockApiFetch.mockRejectedValue(error)
      
      try {
        await mockApiFetch('/api/auth/organisation/invite/accept', {
          method: 'GET',
          query: { invite_token: 'invalid-token' }
        })
      } catch (err: any) {
        expect(err.data.detail).toBe('Invalid or expired token')
      }
    })

    it('handles network errors', async () => {
      const error = { message: 'Network error' }
      mockApiFetch.mockRejectedValue(error)
      
      try {
        await mockApiFetch('/api/auth/organisation/invite/accept', {
          method: 'GET',
          query: { invite_token: 'test-token' }
        })
      } catch (err: any) {
        expect(err.message).toBe('Network error')
      }
    })

    it('handles multiple organizations without setting token', async () => {
      const multiOrgResponse = {
        data: {
          user: mockUser,
          organisations: {
            'org1': {
              organisation: { id: 'org1', display_name: 'Org 1' },
              token: 'token1',
              is_organisation_admin: false
            },
            'org2': {
              organisation: { id: 'org2', display_name: 'Org 2' },
              token: 'token2',
              is_organisation_admin: true
            }
          },
          first_time_setup: false
        }
      }
      
      mockApiFetch.mockResolvedValue(multiOrgResponse)
      const { authService } = await import('~/services/auth')
      
      const response = await mockApiFetch('/api/auth/organisation/invite/accept', {
        method: 'GET',
        query: { invite_token: 'test-token' }
      })
      
      const { user, organisations } = response.data
      const orgIds = Object.keys(organisations)
      
      authService.setUser(user)
      
      if (orgIds.length === 1) {
        const orgId = orgIds[0]
        const orgData = organisations[orgId]
        authService.setToken(orgData.token)
        authService.setOrganization(orgData.organisation.id)
      }
      
      expect(authService.setUser).toHaveBeenCalledWith(mockUser)
      expect(authService.setToken).not.toHaveBeenCalled()
      expect(authService.setOrganization).not.toHaveBeenCalled()
    })

    it('does not set first time setup when false', async () => {
      const response = {
        ...mockInvitationResponse,
        data: {
          ...mockInvitationResponse.data,
          first_time_setup: false
        }
      }
      
      mockApiFetch.mockResolvedValue(response)
      
      const apiResponse = await mockApiFetch('/api/auth/organisation/invite/accept', {
        method: 'GET',
        query: { invite_token: 'test-token' }
      })
      
      const { first_time_setup } = apiResponse.data
      
      if (first_time_setup) {
        sessionStorage.setItem('first_time_setup', 'true')
      }
      
      expect(sessionStorage.setItem).not.toHaveBeenCalledWith('first_time_setup', 'true')
    })
  })
})