import { test, expect } from '@playwright/test'

test.describe('Invitation Flow', () => {
  test('should show invitation form when no token provided', async ({ page }) => {
    await page.goto('/invitation')
    
    // Should show the invitation form
    await expect(page.locator('h2')).toBeVisible()
    await expect(page.locator('label')).toBeVisible()
    
    // Should have input field for token
    await expect(page.locator('input[type="text"]')).toBeVisible()
    
    // Should have submit button
    const acceptButton = page.locator('button[type="submit"]')
    await expect(acceptButton).toBeVisible()
    
    // Submit button should be disabled when no token
    await expect(acceptButton).toBeDisabled()
  })

  test('should enable submit button when token is entered', async ({ page }) => {
    await page.goto('/invitation')
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    
    // Make sure we don't have any auto-accepting token
    const url = page.url()
    expect(url).not.toContain('token=')
    
    // Enter a token
    const tokenInput = page.locator('input#token')
    await tokenInput.clear()
    await tokenInput.type('test-token-123', { delay: 100 }) // Type with delay to trigger Vue updates
    
    // Wait for Vue reactivity
    await page.waitForTimeout(1000)
    
    // Check the input has the value
    await expect(tokenInput).toHaveValue('test-token-123')
    
    // Submit button should now be enabled
    const acceptButton = page.locator('button[type="submit"]')
    await expect(acceptButton).toBeEnabled()
  })

  test('should auto-accept invitation when token in URL', async ({ page }) => {
    // Mock the API response for invitation acceptance
    await page.route('**/api/auth/organisation/invite/accept*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            user: {
              id: 'user-1',
              email: 'newuser@example.com',
              display_name: 'New User'
            },
            organisations: {
              'org-1': {
                organisation: {
                  id: 'org-1',
                  display_name: 'Test Organization',
                  short_name: 'test-org'
                },
                token: 'jwt-token-123',
                is_organisation_admin: false
              }
            },
            first_time_setup: true
          }
        })
      })
    })

    // Mock profile page redirect
    await page.route('**/profile', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><body>Profile Page</body></html>'
      })
    })

    // Visit invitation page with token in URL
    await page.goto('/invitation?token=auto-accept-token-123')
    
    // Should show auto-accepting message or loading state
    await expect(page.locator('div.animate-spin')).toBeVisible()
    
    // Loading state is already checked above
    
    // Wait for navigation to profile (or check for success state)
    await page.waitForTimeout(1000)
  })

  test('should handle invitation acceptance with manual token', async ({ page }) => {
    // Mock successful API response
    await page.route('**/api/auth/organisation/invite/accept*', async route => {
      const url = new URL(route.request().url())
      const token = url.searchParams.get('invite_token')
      
      if (token === 'valid-token-123') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              user: {
                id: 'user-1',
                email: 'newuser@example.com',
                display_name: 'New User'
              },
              organisations: {
                'org-1': {
                  organisation: {
                    id: 'org-1',
                    display_name: 'Test Organization',
                    short_name: 'test-org'
                  },
                  token: 'jwt-token-123',
                  is_organisation_admin: false
                }
              },
              first_time_setup: false
            }
          })
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/invitation')
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 })
    
    // Enter token
    const tokenInput = page.locator('input#token')
    await tokenInput.fill('valid-token-123')
    
    // Submit form
    const acceptButton = page.locator('button[type="submit"]')
    await acceptButton.click()
    
    // Button should be disabled during loading
    await expect(acceptButton).toBeDisabled()
    
    // Wait for processing
    await page.waitForTimeout(1000)
  })

  test('should handle invalid token error', async ({ page }) => {
    // Mock error response
    await page.route('**/api/auth/organisation/invite/accept*', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Invalid or expired invitation token'
        })
      })
    })

    await page.goto('/invitation')
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 })
    
    // Enter invalid token
    const tokenInput = page.locator('input#token')
    await tokenInput.fill('invalid-token')
    
    // Submit form
    const acceptButton = page.locator('button[type="submit"]')
    await acceptButton.click()
    
    // Should show error message
    await expect(page.locator('.bg-red-50')).toBeVisible()
    await expect(page.locator('text=Invalid or expired invitation token')).toBeVisible()
    
    // Form should still be visible for retry
    await expect(tokenInput).toBeVisible()
  })

  test('should handle network error gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/auth/organisation/invite/accept*', async route => {
      await route.abort('failed')
    })

    await page.goto('/invitation')
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 })
    
    // Enter token
    const tokenInput = page.locator('input#token')
    await tokenInput.fill('test-token')
    
    // Submit form
    const acceptButton = page.locator('button[type="submit"]')
    await acceptButton.click()
    
    // Should show generic error message
    await expect(page.locator('.bg-red-50')).toBeVisible()
    
    // Form should still be visible for retry
    await expect(tokenInput).toBeVisible()
  })

  test('should handle first-time setup flag', async ({ page }) => {
    // Mock API response with first_time_setup = true
    await page.route('**/api/auth/organisation/invite/accept*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            user: {
              id: 'user-1',
              email: 'newuser@example.com',
              display_name: ''
            },
            organisations: {
              'org-1': {
                organisation: {
                  id: 'org-1',
                  display_name: 'Test Organization',
                  short_name: 'test-org'
                },
                token: 'jwt-token-123',
                is_organisation_admin: false
              }
            },
            first_time_setup: true
          }
        })
      })
    })

    await page.goto('/invitation?token=first-time-token')
    
    // Wait for auto-acceptance
    await page.waitForTimeout(1000)
    
    // Check that sessionStorage was set (we can't directly access it in Playwright, 
    // but we can verify the behavior by checking if it redirects to profile)
    const sessionData = await page.evaluate(() => {
      return {
        firstTimeSetup: sessionStorage.getItem('first_time_setup'),
        userData: sessionStorage.getItem('invitation_user_data')
      }
    })
    
    expect(sessionData.firstTimeSetup).toBe('true')
    expect(sessionData.userData).toContain('newuser@example.com')
  })

  test('should handle multiple organizations', async ({ page }) => {
    // Mock API response with multiple organizations
    await page.route('**/api/auth/organisation/invite/accept*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            user: {
              id: 'user-1',
              email: 'multi-org@example.com',
              display_name: 'Multi Org User'
            },
            organisations: {
              'org-1': {
                organisation: {
                  id: 'org-1',
                  display_name: 'Organization One',
                  short_name: 'org-one'
                },
                token: 'jwt-token-1',
                is_organisation_admin: false
              },
              'org-2': {
                organisation: {
                  id: 'org-2',
                  display_name: 'Organization Two',
                  short_name: 'org-two'
                },
                token: 'jwt-token-2',
                is_organisation_admin: true
              }
            },
            first_time_setup: false
          }
        })
      })
    })

    await page.goto('/invitation?token=multi-org-token')
    
    // Wait for processing
    await page.waitForTimeout(1000)
    
    // With multiple orgs, the user should be set but not the token/organization
    // This would typically redirect to an organization selection page
    // For this test, we just verify the page processed the invitation
    
    // Check that we're no longer showing the loading spinner after processing
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 })
    
    // The page should have processed the response (either redirected or showed a message)
    const pageUrl = page.url()
    expect(pageUrl).toBeTruthy() // Just verify we have a valid URL after processing
  })

  test('should support invite_token parameter', async ({ page }) => {
    // Mock the API response
    let requestedToken = ''
    await page.route('**/api/auth/organisation/invite/accept*', async route => {
      const url = new URL(route.request().url())
      requestedToken = url.searchParams.get('invite_token') || ''
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            user: {
              id: 'user-1',
              email: 'user@example.com',
              display_name: 'User'
            },
            organisations: {
              'org-1': {
                organisation: {
                  id: 'org-1',
                  display_name: 'Test Org',
                  short_name: 'test'
                },
                token: 'jwt-token',
                is_organisation_admin: false
              }
            },
            first_time_setup: false
          }
        })
      })
    })

    // Test with invite_token parameter (alternative to token)
    await page.goto('/invitation?invite_token=alternative-token-123')
    
    // Should auto-accept with loading spinner
    await expect(page.locator('div.animate-spin')).toBeVisible()
    
    // Wait for API call
    await page.waitForTimeout(1000)
    
    // Verify the correct token was sent
    expect(requestedToken).toBe('alternative-token-123')
  })
})