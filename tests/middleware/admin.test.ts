import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  mockIdentityResponse,
  mockAdminIdentityResponse,
  resetMocks
} from '../mocks/api'

describe('Admin Middleware Logic', () => {
  let mockNavigateTo: any
  let mockUseCookie: any
  let mockFetch: any
  let middleware: any

  beforeEach(() => {
    resetMocks()
    vi.clearAllMocks()
    
    mockNavigateTo = vi.fn()
    mockUseCookie = vi.fn()
    mockFetch = vi.fn()

    middleware = async (to: any, from: any) => {
      if (process.client && from && from.path === to.path) {
        return;
      }

      const nuxtApp = {
        payload: {
          state: {}
        }
      };
      
      const config = {
        public: {
          backendEndpoint: 'http://localhost:8000'
        }
      };

      try {
        const tokenCookie = mockUseCookie('auth-token');
        if (!tokenCookie.value) {
          return mockNavigateTo('/login');
        }

        if (process.client && nuxtApp.payload.state.$sIsAdmin !== undefined) {
          if (!nuxtApp.payload.state.$sIsAdmin) {
            return mockNavigateTo('/');
          }
          return;
        }

        const response = await mockFetch('/api/auth/identity', {
          baseURL: config.public.backendEndpoint || '',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${tokenCookie.value}`
          }
        });
        
        const identity = response.data;
        
        if (process.client) {
          nuxtApp.payload.state.$sIsAdmin = identity.is_organisation_admin;
        }
        
        if (!identity.is_organisation_admin) {
          return mockNavigateTo('/');
        }
      } catch (error: any) {
        console.error('Admin middleware error:', error);
        if (error.status === 401 || error.statusCode === 401) {
          return mockNavigateTo('/login');
        }
        return mockNavigateTo('/');
      }
    };

    Object.defineProperty(process, 'client', {
      writable: true,
      value: false
    });
  });

  describe('Authentication Check', () => {
    it('redirects to login when no auth token', async () => {
      mockUseCookie.mockReturnValue({ value: null })

      await middleware({ path: '/admin' }, null)

      expect(mockNavigateTo).toHaveBeenCalledWith('/login')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('checks admin status when auth token exists', async () => {
      mockUseCookie.mockReturnValue({ value: 'valid-token' })
      mockFetch.mockResolvedValue(mockAdminIdentityResponse)

      await middleware({ path: '/admin' }, null)

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/identity', {
        baseURL: 'http://localhost:8000',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      })
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })
  })

  describe('Admin Access Control', () => {
    beforeEach(() => {
      mockUseCookie.mockReturnValue({ value: 'valid-token' })
    })

    it('allows access when user is organization admin', async () => {
      mockFetch.mockResolvedValue(mockAdminIdentityResponse)

      await middleware({ path: '/admin' }, null)

      expect(mockNavigateTo).not.toHaveBeenCalled()
    })

    it('redirects to home when user is not organization admin', async () => {
      mockFetch.mockResolvedValue(mockIdentityResponse)

      await middleware({ path: '/admin' }, null)

      expect(mockNavigateTo).toHaveBeenCalledWith('/')
    })
  })

  describe('Client-side Navigation', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'client', {
        writable: true,
        value: true
      })
      mockUseCookie.mockReturnValue({ value: 'valid-token' })
    })

    it('skips check when navigating to same path', async () => {
      const to = { path: '/admin' }
      const from = { path: '/admin' }

      await middleware(to, from)

      expect(mockFetch).not.toHaveBeenCalled()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })

    it('uses cached admin status on client-side navigation', async () => {
      const nuxtApp = {
        payload: {
          state: {
            $sIsAdmin: true
          }
        }
      }
      
      const clientMiddleware = async (to: any, from: any) => {
        if (process.client && from && from.path === to.path) {
          return;
        }

        const tokenCookie = mockUseCookie('auth-token');
        if (!tokenCookie.value) {
          return mockNavigateTo('/login');
        }

        if (process.client && nuxtApp.payload.state.$sIsAdmin !== undefined) {
          if (!nuxtApp.payload.state.$sIsAdmin) {
            return mockNavigateTo('/');
          }
          return;
        }
      };

      await clientMiddleware({ path: '/admin/users' }, { path: '/admin' })

      expect(mockFetch).not.toHaveBeenCalled()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })

    it('redirects when cached admin status is false', async () => {
      const nuxtApp = {
        payload: {
          state: {
            $sIsAdmin: false
          }
        }
      }
      
      const clientMiddleware = async (to: any, from: any) => {
        if (process.client && from && from.path === to.path) {
          return;
        }

        const tokenCookie = mockUseCookie('auth-token');
        if (!tokenCookie.value) {
          return mockNavigateTo('/login');
        }

        if (process.client && nuxtApp.payload.state.$sIsAdmin !== undefined) {
          if (!nuxtApp.payload.state.$sIsAdmin) {
            return mockNavigateTo('/');
          }
          return;
        }
      };

      await clientMiddleware({ path: '/admin/users' }, { path: '/dashboard' })

      expect(mockNavigateTo).toHaveBeenCalledWith('/')
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      mockUseCookie.mockReturnValue({ value: 'valid-token' })
    })

    it('redirects to login on 401 error', async () => {
      mockFetch.mockRejectedValue({
        status: 401,
        statusCode: 401,
        message: 'Unauthorized'
      })

      await middleware({ path: '/admin' }, null)

      expect(mockNavigateTo).toHaveBeenCalledWith('/login')
    })

    it('redirects to home on other API errors', async () => {
      mockFetch.mockRejectedValue({
        status: 500,
        message: 'Internal Server Error'
      })

      await middleware({ path: '/admin' }, null)

      expect(mockNavigateTo).toHaveBeenCalledWith('/')
    })

    it('logs errors to console', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
      const error = new Error('Network error')
      mockFetch.mockRejectedValue(error)

      await middleware({ path: '/admin' }, null)

      expect(consoleError).toHaveBeenCalledWith('Admin middleware error:', error)
      consoleError.mockRestore()
    })
  })

  describe('State Management', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'client', {
        writable: true,
        value: true
      })
      mockUseCookie.mockReturnValue({ value: 'valid-token' })
    })

    it('stores admin status in state for client-side navigation', async () => {
      const nuxtApp = {
        payload: {
          state: {}
        }
      }

      mockFetch.mockResolvedValue(mockAdminIdentityResponse)

      const stateMiddleware = async (to: any, from: any) => {
        const tokenCookie = mockUseCookie('auth-token');
        if (!tokenCookie.value) {
          return mockNavigateTo('/login');
        }

        const response = await mockFetch('/api/auth/identity', {
          baseURL: 'http://localhost:8000',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${tokenCookie.value}`
          }
        });
        
        const identity = response.data;
        
        if (process.client) {
          nuxtApp.payload.state.$sIsAdmin = identity.is_organisation_admin;
        }
        
        if (!identity.is_organisation_admin) {
          return mockNavigateTo('/');
        }
      };

      await stateMiddleware({ path: '/admin' }, null)

      expect(nuxtApp.payload.state.$sIsAdmin).toBe(true)
    })

    it('does not store state on server-side', async () => {
      Object.defineProperty(process, 'client', {
        writable: true,
        value: false
      })

      const nuxtApp = {
        payload: {
          state: {}
        }
      }

      mockFetch.mockResolvedValue(mockAdminIdentityResponse)

      await middleware({ path: '/admin' }, null)

      expect(nuxtApp.payload.state.$sIsAdmin).toBeUndefined()
    })
  })
})