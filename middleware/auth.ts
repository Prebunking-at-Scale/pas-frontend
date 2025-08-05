export default defineNuxtRouteMiddleware((to, from) => {
  // Skip auth check for login page
  if (to.path === '/login') return;

  // Check for auth token in cookies (works on both server and client)
  const token = useCookie('auth-token').value;
  
  if (!token) {
    return navigateTo('/login');
  }
});