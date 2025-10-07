import type { User, LoginRequest, LoginResponse, IdentityResponse, PasswordUpdateRequest, UserUpdateRequest } from '~/types/api';

export const authService = {
  // Login endpoint
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email,
        password
      }
    });
    
    return response as LoginResponse;
  },
  // Login with magic link
  async requestMagicLink(email: string): Promise<boolean> {
    try {
      const response = await $fetch('/api/auth/request-magic-link', {
        method: 'POST',
        body: {
          email
        }
      });
      return true;
    } catch (error) {
      console.error('Error requesting magic link:', error);
      return false;
    }
  },

  // Validate magic link token and complete login
  async validateMagicLink(token: string): Promise<LoginResponse> {
    const response = await $fetch('/api/auth/magic-login', {
      method: 'GET',
      params: {
        token
      }
    });
    
    return response as LoginResponse;
  },

  // Get current user
  async getCurrentUser(): Promise<User> {
    const { apiFetch } = useApi();
    const response = await apiFetch('/api/auth/user', {
      method: 'GET'
    });
    
    // Check if response is wrapped in 'data' object
    return (response as any).data || response as User;
  },

  // Update user profile
  async updateUser(updates: UserUpdateRequest): Promise<User> {
    const { apiFetch } = useApi();
    const response = await apiFetch('/api/auth/user', {
      method: 'PATCH',
      body: updates
    });
    
    // Check if response is wrapped in 'data' object
    return (response as any).data || response as User;
  },

  // Change password
  async changePassword(newPassword: string): Promise<void> {
    const { apiFetch } = useApi();
    await apiFetch('/api/auth/user/password', {
      method: 'PATCH',
      body: {
        new_password: newPassword
      }
    });
  },

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await $fetch('/api/auth/user/password', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: {
        new_password: newPassword
      }
    });
  },

  // Get user identity (user + organization + role)
  async getIdentity(): Promise<IdentityResponse> {
    const { apiFetch } = useApi();
    const response = await apiFetch('/api/auth/identity', {
      method: 'GET'
    });
    
    // The API returns the data wrapped in a 'data' object
    return (response as any).data as IdentityResponse;
  },

  // Request password reset
  async requestPasswordReset(email: string): Promise<void> {
    const { apiFetch } = useApi();
    await apiFetch('/api/auth/request-password-reset', {
      method: 'POST',
      query: {
        email
      }
    });
  },

  // Token management helpers
  getToken(): string | null {
    const cookie = useCookie('auth-token');
    return cookie.value || null;
  },

  setToken(token: string): void {
    const isDev = process.env.NODE_ENV === 'development';
    const cookie = useCookie('auth-token', {
      httpOnly: false,
      secure: !isDev,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30
    });
    cookie.value = token;
  },

  clearToken(): void {
    const cookie = useCookie('auth-token');
    cookie.value = null;
  },

  // Organization management
  setOrganization(organizationId: string): void {
    const isDev = process.env.NODE_ENV === 'development';
    const cookie = useCookie('organization-id', {
      httpOnly: false,
      secure: !isDev,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30
    });
    cookie.value = organizationId;
  },

  getOrganization(): string | null {
    const cookie = useCookie('organization-id');
    return cookie.value || null;
  },

  // User management
  setUser(user: User): void {
    const isDev = process.env.NODE_ENV === 'development';
    const cookie = useCookie('user', {
      httpOnly: false,
      secure: !isDev,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30
    });
    cookie.value = JSON.stringify(user);
  },

  getUser(): User | null {
    const cookie = useCookie('user');
    if (cookie.value) {
      try {
        return typeof cookie.value === 'string' ? JSON.parse(cookie.value) : cookie.value;
      } catch {
        return null;
      }
    }
    return null;
  },

  // Logout
  logout(): void {
    const tokenCookie = useCookie('auth-token');
    const orgCookie = useCookie('organization-id');
    const userCookie = useCookie('user');
    
    tokenCookie.value = null;
    orgCookie.value = null;
    userCookie.value = null;
  },
  // Select organization
  selectOrganization (_orgId: string, orgData: any, firstTimeSetup: boolean) {
    authService.setToken(orgData.token);
    authService.setOrganization(orgData.organisation.id);
    
    // Track organization selection in Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('set', {
        'user_properties': {
          'organization_name': orgData.organisation.display_name,
          'organization_id': orgData.organisation.id
        }
      });
      
      window.gtag('event', 'login', {
        'organization_name': orgData.organisation.display_name,
        'organization_id': orgData.organisation.id,
        'is_admin': orgData.is_organisation_admin
      });
    }
    
    // Check if first time setup
    if (firstTimeSetup) {
      // Store flag for first time setup
      sessionStorage.setItem('first_time_setup', 'true');
    }
  }
};