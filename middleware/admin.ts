export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip middleware on client-side navigation if we already checked
  if (process.client && from && from.path === to.path) {
    return;
  }

  const nuxtApp = useNuxtApp();
  const config = useRuntimeConfig();

  try {
    // Check if user is authenticated first
    const tokenCookie = useCookie('auth-token');
    if (!tokenCookie.value) {
      return navigateTo('/login');
    }

    // For client-side navigation, we can trust the existing state
    if (process.client && nuxtApp.payload.state.$sIsAdmin !== undefined) {
      if (!nuxtApp.payload.state.$sIsAdmin) {
        return navigateTo('/');
      }
      return;
    }

    // Make the API call to check admin status using $fetch directly
    const response = await $fetch('/api/auth/identity', {
      baseURL: config.public.backendEndpoint || '',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenCookie.value}`
      }
    });
    
    const identity = (response as any).data;
    
    // Store admin status in state for client-side navigation
    if (process.client) {
      nuxtApp.payload.state.$sIsAdmin = identity.is_organisation_admin;
    }
    
    if (!identity.is_organisation_admin) {
      // Redirect non-admins to dashboard
      return navigateTo('/');
    }
  } catch (error: any) {
    console.error('Admin middleware error:', error);
    // Only redirect to login on 401 errors
    if (error.status === 401 || error.statusCode === 401) {
      return navigateTo('/login');
    }
    // For other errors, redirect to dashboard
    return navigateTo('/');
  }
});