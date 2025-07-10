export default defineNuxtRouteMiddleware((to, from) => {
  // Skip auth check for login page
  if (to.path === '/login') return;

  // Check if we're on the client side
  if (process.client) {
    const token = localStorage.getItem('auth-token');
    
    if (!token) {
      return navigateTo('/login');
    }
  }
});