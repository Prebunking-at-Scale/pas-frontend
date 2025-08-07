import { vi } from 'vitest'

export const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  display_name: 'Test User',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
}

export const mockOrganization = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  display_name: 'Test Organization',
  short_name: 'test-org',
  country_codes: ['USA'],
  language: 'en',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
}

export const mockLoginResponse = {
  data: {
    user: mockUser,
    organisations: {
      [mockOrganization.id]: {
        organisation: mockOrganization,
        token: 'mock-jwt-token',
        is_organisation_admin: false
      }
    },
    first_time_setup: false
  }
}

export const mockMultiOrgLoginResponse = {
  data: {
    user: mockUser,
    organisations: {
      [mockOrganization.id]: {
        organisation: mockOrganization,
        token: 'mock-jwt-token-1',
        is_organisation_admin: false
      },
      '123e4567-e89b-12d3-a456-426614174002': {
        organisation: {
          ...mockOrganization,
          id: '123e4567-e89b-12d3-a456-426614174002',
          display_name: 'Second Organization',
          short_name: 'second-org'
        },
        token: 'mock-jwt-token-2',
        is_organisation_admin: true
      }
    },
    first_time_setup: false
  }
}

export const mockIdentityResponse = {
  data: {
    user: mockUser,
    organisation: mockOrganization,
    is_organisation_admin: false
  }
}

export const mockAdminIdentityResponse = {
  data: {
    user: mockUser,
    organisation: mockOrganization,
    is_organisation_admin: true
  }
}

export const mockInvitationResponse = {
  data: {
    user: mockUser,
    organisations: {
      [mockOrganization.id]: {
        organisation: mockOrganization,
        token: 'mock-invitation-token',
        is_organisation_admin: false
      }
    },
    first_time_setup: true
  }
}

export const mockApiFetch = vi.fn()

export const mockUseApi = () => ({
  apiFetch: mockApiFetch
})

export const mockAuthService = {
  login: vi.fn(),
  getCurrentUser: vi.fn(),
  getIdentity: vi.fn(),
  updateUser: vi.fn(),
  updatePassword: vi.fn(),
  requestPasswordReset: vi.fn(),
  getToken: vi.fn(),
  setToken: vi.fn(),
  clearToken: vi.fn(),
  setOrganization: vi.fn(),
  getOrganization: vi.fn(),
  setUser: vi.fn(),
  getUser: vi.fn(),
  logout: vi.fn()
}

export const resetMocks = () => {
  vi.clearAllMocks()
  mockApiFetch.mockReset()
  Object.values(mockAuthService).forEach(mock => {
    if (typeof mock === 'function') {
      mock.mockReset()
    }
  })
}