import * as CookieConsent from 'vanilla-cookieconsent'

export default defineNuxtPlugin(() => {
  // Only run on client side - plugin already marked as .client.ts

  // Create script for Google Analytics
  const createGtagScript = () => {
    // Create gtag.js script element
    const gtagScript = document.createElement('script')
    gtagScript.async = true
    gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-2GCXK1BQTV'
    
    // Create inline gtag configuration script
    const gtagConfigScript = document.createElement('script')
    gtagConfigScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-2GCXK1BQTV', {
        'anonymize_ip': true,
        'cookie_flags': 'SameSite=None;Secure'
      });
    `
    
    return { gtagScript, gtagConfigScript }
  }

  // Run cookie consent plugin
  CookieConsent.run({
    categories: {
      necessary: {
        enabled: true,
        readOnly: true
      },
      analytics: {
        enabled: false,
        
        // Autoblocking configuration
        autoClear: {
          cookies: [
            {
              name: /^_ga/,   // regex: match all cookies starting with '_ga'
            },
            {
              name: '_gid',   // string: exact cookie name
            }
          ],
          reloadPage: false,
        }
      }
    },

    language: {
      default: 'en',
      translations: {
        en: {
          consentModal: {
            title: 'We use cookies',
            description: 'We use cookies on our site to enhance your user experience and improve our services.',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Reject all',
            showPreferencesBtn: 'Manage individual preferences',
            footer: `
              <a href="/privacy">Privacy Policy</a>
              <a href="/terms-of-service">Terms of Service</a>
            `,
          },
          preferencesModal: {
            title: 'Cookie Preferences',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Reject all',
            savePreferencesBtn: 'Accept current selection',
            closeIconLabel: 'Close modal',
            serviceCounterLabel: 'Service|Services',
            sections: [
              {
                title: 'Your Privacy Choices',
                description: `We respect your right to privacy. You can choose not to allow some types of cookies. However, blocking some types of cookies may impact your experience of the site and the services we are able to offer.`,
              },
              {
                title: 'Strictly Necessary',
                description: 'These cookies are necessary for the website to function properly and cannot be switched off. They help with things like logging in and setting your privacy preferences.',
                linkedCategory: 'necessary',
                cookieTable: {
                  headers: {
                    name: 'Cookie',
                    domain: 'Domain',
                    desc: 'Description',
                    exp: 'Expiration',
                  },
                  body: [
                    {
                      name: 'cc_cookie',
                      domain: location.hostname,
                      desc: 'This cookie stores your cookie preferences.',
                      exp: '1 year',
                    }
                  ]
                }
              },
              {
                title: 'Analytics & Performance',
                description: 'These cookies help us improve the site by tracking which pages are most popular and how visitors move around the site.',
                linkedCategory: 'analytics',
                cookieTable: {
                  headers: {
                    name: 'Cookie',
                    domain: 'Domain',
                    desc: 'Description',
                    exp: 'Expiration',
                  },
                  body: [
                    {
                      name: '_ga',
                      domain: location.hostname,
                      desc: 'Google Analytics: Used to distinguish users.',
                      exp: '2 years',
                    },
                    {
                      name: '_ga_*',
                      domain: location.hostname,
                      desc: 'Google Analytics: Used to persist session state.',
                      exp: '2 years',
                    },
                    {
                      name: '_gid',
                      domain: location.hostname,
                      desc: 'Google Analytics: Used to distinguish users.',
                      exp: '24 hours',
                    }
                  ]
                }
              }
            ],
          },
        },
      },
    },

    // Cookie consent modal configuration
    guiOptions: {
      consentModal: {
        layout: 'box inline',
        position: 'bottom right',
        equalWeightButtons: false,
        flipButtons: false
      },
      preferencesModal: {
        layout: 'box',
        equalWeightButtons: true,
        flipButtons: false,
      }
    },

    onFirstConsent: () => {
      console.log('Cookie consent given for the first time')
    },

    onConsent: () => {
      console.log('Cookie consent updated')
    },

    onChange: ({ cookie, changedCategories, changedServices }) => {
      // If analytics category is accepted, load Google Analytics
      if (changedCategories.includes('analytics')) {
        if (CookieConsent.acceptedCategory('analytics')) {
          // Analytics accepted - load GA
          const { gtagScript, gtagConfigScript } = createGtagScript()
          document.head.appendChild(gtagScript)
          document.head.appendChild(gtagConfigScript)
          
          // Update consent mode
          if (window.gtag) {
            window.gtag('consent', 'update', {
              'analytics_storage': 'granted'
            })
          }
        } else {
          // Analytics rejected - update consent mode
          if (window.gtag) {
            window.gtag('consent', 'update', {
              'analytics_storage': 'denied'
            })
          }
        }
      }
    }
  })

  // Set default consent state (denied until user accepts)
  const defaultConsentScript = document.createElement('script')
  defaultConsentScript.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    
    // Default consent mode
    gtag('consent', 'default', {
      'analytics_storage': 'denied',
      'ad_storage': 'denied',
      'functionality_storage': 'granted',
      'personalization_storage': 'denied',
      'security_storage': 'granted'
    });
  `
  document.head.appendChild(defaultConsentScript)
  
  // Check if analytics was previously accepted
  if (CookieConsent.acceptedCategory('analytics')) {
    const { gtagScript, gtagConfigScript } = createGtagScript()
    document.head.appendChild(gtagScript)
    document.head.appendChild(gtagConfigScript)
  }
})

// Extend window interface for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    dataLayer?: any[]
    CookieConsent?: typeof CookieConsent
  }
}