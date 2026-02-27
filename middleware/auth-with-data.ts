export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client after hydration
  if (process.server) return;

  const config = useRuntimeConfig();
  const appStore = useAppDataStore();

  // Routes that do not require authentication
  const publicRoutes = ['/login', '/magic-login', '/password-reset', '/terms-of-service'];
  const isPublicRoute = publicRoutes.some(route => to.path.startsWith(route));

  // If it's a public route, don't verify auth but keep data if it exists
  if (isPublicRoute) {
    if (appStore.hasData) {
      console.log('📍 Navigating to public route, keeping data but not requiring auth');
    }
    return;
  }

  // ONLY allow test mode if explicitly enabled in runtime config (dev/test only)
  if (config.public.testModeEnabled && to.query._testMode === 'auth') {
    console.log('🧪 Test mode: bypassing auth middleware (dev/test environment only)');
    // In test mode, simulate authenticated user
    appStore.isAuthenticated = true;
    if (!appStore.hasData) {
      await appStore.loadAppData();
    }
    return;
  }

  // Check authentication token
  const token = useCookie('auth-token').value;
  
  if (!token) {
    console.log('🔐 No authentication token, redirecting to login');
    // Clear data before redirecting
    appStore.clearAppData();
    return navigateTo('/login');
  }

  // If there's a token, update authentication state
  appStore.updateAuthState();

  // If authenticated but no data loaded, load them
  if (appStore.isAuthenticated && !appStore.hasData && !appStore.isLoading) {
    console.log('🔄 Authenticated user without data, loading...');
    
    try {
      await appStore.loadAppData();
    } catch (error) {
      console.error('❌ Error loading data in middleware:', error);
      
      // If authentication error, clear and redirect
      if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
        console.log('🔐 401 error, invalid token');
        appStore.clearAppData();
        return navigateTo('/login');
      }
      
      // For other errors, allow to continue (components will handle the error)
      console.warn('⚠️ Continuing with data loading error');
    }
  }

  // Log for debugging
  console.log('🛣️ auth-with-data middleware completed:', {
    path: to.path,
    isAuthenticated: appStore.isAuthenticated,
    hasData: appStore.hasData,
    isLoading: appStore.isLoading
  });
});