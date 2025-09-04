export const useApi = () => {
  const apiFetch = $fetch.create({
    onRequest({ options }) {
      // Add authentication header if token exists
      const token = useCookie('auth-token').value;
      if (token) {
        // Convert headers to unknown first to avoid TypeScript errors
        const headers = options.headers as unknown as Record<string, string> | undefined;
        options.headers = {
          ...headers,
          'Authorization': `Bearer ${token}`
        } as any;
      }
    },
    onResponseError({ response }) {
      // Handle 401 Unauthorized errors
      if (response.status === 401) {
        // Clear auth cookies
        const tokenCookie = useCookie('auth-token');
        const orgCookie = useCookie('organization-id');
        const userCookie = useCookie('user');
        
        tokenCookie.value = null;
        orgCookie.value = null;
        userCookie.value = null;
        
        // Redirect to login
        navigateTo('/login');
      }
    }
  });

  return {
    apiFetch
  };
};