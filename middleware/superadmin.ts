export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip middleware on client-side navigation if we already checked
  if (process.client && from && from.path === to.path) {
    return;
  }

  const nuxtApp = useNuxtApp();
  const config = useRuntimeConfig();

  // ONLY allow test mode if explicitly enabled in runtime config (dev/test only)
  if (config.public.testModeEnabled && to.query._testMode === 'superadmin') {
    console.log('Test mode: bypassing superadmin middleware (dev/test environment only)');
    return; 
  }

  try {
    // Check if user is authenticated first
    const tokenCookie = useCookie('auth-token');
    if (!tokenCookie.value) {
      return navigateTo('/login');
    }

    // For client-side navigation, we can trust the existing state
    if (process.client && nuxtApp.payload.state.$sIsSuperAdmin !== undefined) {
      if (!nuxtApp.payload.state.$sIsSuperAdmin) {
        return navigateTo('/');
      }
      return;
    }

    // Make the API call to check superadmin status using $fetch directly
    const response = await $fetch('/api/auth/identity', {
      baseURL: config.public.backendEndpoint || '',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenCookie.value}`
      }
    });
    
    const identity = (response as any).data;
    
    // Store superadmin status in state for client-side navigation
    if (process.client) {
      nuxtApp.payload.state.$sIsSuperAdmin = identity.user.is_super_admin;
    }
    
    if (!identity.user.is_super_admin) {
      // Redirect non-superadmins to dashboard
      return navigateTo('/');
    }
  } catch (error: any) {
    console.error('Superadmin middleware error:', error);
    // Only redirect to login on 401 errors
    if (error.status === 401 || error.statusCode === 401) {
      return navigateTo('/login');
    }
    // For other errors, redirect to dashboard
    return navigateTo('/');
  }
});