export default defineNuxtPlugin(async () => {
  // Only run on client side
  if (process.server) return

  // Wait for DOM to be ready
  await new Promise<void>((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => resolve(), { once: true })
    } else {
      resolve()
    }
  })

  // Load the Silktide consent manager script
  const script = document.createElement('script')
  script.src = '/assets/js/silktide-consent-manager.js'
  script.onload = () => {
    // Initialize the cookie banner with configuration
    if (window.silktideCookieBannerManager) {
      window.silktideCookieBannerManager.updateCookieBannerConfig({
        background: {
          showBackground: false
        },
        cookieIcon: {
          position: "bottomRight"
        },
        cookieTypes: [
          {
            id: "necessary",
            name: "Necessary",
            description: "<p>These cookies are necessary for the website to function properly and cannot be switched off. They help with things like logging in and setting your privacy preferences.</p>",
            required: false,
            onAccept: function() {
              console.log('Add accept logic for Necessary');
            },
            onReject: function() {
              console.log('Add reject logic for Necessary');
            }
          },
          {
            id: "analytical",
            name: "Analytical",
            description: "<p>These cookies help us improve the site by tracking which pages are most popular and how visitors move around the site.</p>",
            required: false,
            onAccept: function() {
              // Google Analytics consent
              if (typeof window.gtag !== 'undefined') {
                window.gtag('consent', 'update', {
                  analytics_storage: 'granted',
                });
                if (window.dataLayer) {
                  window.dataLayer.push({
                    'event': 'consent_accepted_analytical',
                  });
                }
              }
            },
            onReject: function() {
              if (typeof window.gtag !== 'undefined') {
                window.gtag('consent', 'update', {
                  analytics_storage: 'denied',
                });
              }
            }
          }
        ],
        text: {
          banner: {
            description: "<p>We use cookies on our site to enhance your user experience.</p>",
            acceptAllButtonText: "Accept all",
            acceptAllButtonAccessibleLabel: "Accept all cookies",
            rejectNonEssentialButtonText: "Reject non-essential",
            rejectNonEssentialButtonAccessibleLabel: "Reject non-essential",
            preferencesButtonText: "Preferences",
            preferencesButtonAccessibleLabel: "Toggle preferences"
          },
          preferences: {
            title: "Customize your cookie preferences",
            description: "<p>We respect your right to privacy. You can choose not to allow some types of cookies. Your cookie preferences will apply across our website.</p>",
            creditLinkText: "Get this banner for free",
            creditLinkAccessibleLabel: "Get this banner for free"
          }
        }
      });
    }
  }
  
  document.head.appendChild(script)

  // Load the CSS
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = '/assets/css/silktide-consent-manager.css'
  document.head.appendChild(link)
})

// Extend the window object to include silktideCookieBannerManager
declare global {
  interface Window {
    silktideCookieBannerManager?: {
      updateCookieBannerConfig: (config: any) => void;
      initCookieBanner: () => void;
      injectScript: (url: string, loadOption?: string) => void;
    }
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}