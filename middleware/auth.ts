export default defineNuxtRouteMiddleware((to, from) => {
  // Skip auth check for login page
  if (to.path === '/login') return;

  // Check if we're on the client side
  if (process.client) {
    const token = localStorage.getItem('auth-token');
    
    if (!token) {
      // Use client-side navigation to avoid hydration mismatch
      return navigateTo('/login', { replace: true });
    }
  }
  
  // For SSR, we can't check localStorage, so we'll let the page render
  // and handle auth check on client side mount
});