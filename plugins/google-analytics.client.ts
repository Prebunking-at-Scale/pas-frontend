export default defineNuxtPlugin(() => {
  const { $script } = useNuxtApp()
  
  // Function to set organization custom dimension
  const setOrganizationDimension = async () => {
    try {
      // Check if gtag is available
      if (typeof window !== 'undefined' && window.gtag) {
        // Get the identity info which includes organization details
        const identity = await authService.getIdentity().catch(() => null)
        
        if (identity?.organisation) {
          // Set custom dimension for organization
          window.gtag('set', {
            'user_properties': {
              'organization_name': identity.organisation.display_name,
              'organization_id': identity.organisation.id
            }
          })
          
          // Also send an event to track the organization session
          window.gtag('event', 'organization_session', {
            'organization_name': identity.organisation.display_name,
            'organization_id': identity.organisation.id,
            'is_admin': identity.is_organisation_admin
          })
        }
      }
    } catch (error) {
      console.error('Failed to set GA organization dimension:', error)
    }
  }
  
  // Set organization dimension on initial load if user is authenticated
  const token = authService.getToken()
  if (token) {
    // Wait for GA to load, then set custom dimension
    if ($script && $script.googleAnalytics) {
      $script.googleAnalytics.ready().then(() => {
        setOrganizationDimension()
      })
    }
  }
  
  // Also listen for route changes to update when user logs in
  const router = useRouter()
  router.afterEach(() => {
    const token = authService.getToken()
    if (token && typeof window !== 'undefined' && window.gtag) {
      setOrganizationDimension()
    }
  })
})

// Import auth service
import { authService } from '~/services/auth'

// Declare gtag on window
declare global {
  interface Window {
    gtag: (...args: any[]) => void
  }
}