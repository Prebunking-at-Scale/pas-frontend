export default defineNuxtRouteMiddleware((to, from) => {
  // Skip auth check for login and magic-login pages
  if (to.path === '/login' || to.path === '/magic-login') return;

  const config = useRuntimeConfig();
  
  // ONLY allow test mode if explicitly enabled in runtime config (dev/test only)
  if (config.public.testModeEnabled && to.query._testMode === 'auth') {
    console.log('Test mode: bypassing auth middleware (dev/test environment only)');
    return;
  }

  // Check for auth token in cookies (works on both server and client)
  const token = useCookie('auth-token').value;
  
  if (!token) {
    return navigateTo('/login');
  }
});