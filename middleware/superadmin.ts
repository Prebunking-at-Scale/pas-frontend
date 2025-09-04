import { authService } from '~/services/auth';

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Check if we're on the client side
  if (process.client) {
    try {
      // Get the current user identity
      const identity = await authService.getIdentity();
      
      // Check if user is super admin
      if (!identity?.user?.is_super_admin) {
        // Redirect non-super admins to dashboard
        return navigateTo('/dashboard');
      }
    } catch (error) {
      console.error('Failed to check super admin status:', error);
      // On error, redirect to dashboard
      return navigateTo('/dashboard');
    }
  }
});