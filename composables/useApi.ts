export const useApi = () => {
  const apiFetch = $fetch.create({
    onRequest({ request, options }) {
      // Add authentication header if token exists
      const token = useCookie('auth-token').value;
      if (token) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${token}`
        };
      }
    },
    onResponseError({ request, response, options }) {
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