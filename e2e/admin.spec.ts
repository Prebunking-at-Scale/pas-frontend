import { test, expect, Page } from '@playwright/test'

// Helper function to login as admin
async function loginAsAdmin(page: Page) {
  // Go to login page
  await page.goto('/login')
  
  // Fill in login form
  await page.fill('input[type="email"]', 'admin@example.com')
  await page.fill('input[type="password"]', 'admin123')
  
  // Submit login form
  await page.click('button[type="submit"]')
  
  // Wait for navigation to complete
  await page.waitForURL('**/dashboard', { timeout: 10000 })
}

// Helper to mock API responses
async function mockAPIResponses(page: Page) {
  const identityResponse = {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      data: {
        user: {
          id: 'user-1',
          email: 'admin@example.com',
          display_name: 'Admin User'
        },
        organisation: {
          id: 'org-1',
          display_name: 'Test Organization',
          short_name: 'test-org',
          country_codes: ['US'],
          language: 'en'
        },
        is_organisation_admin: true
      }
    })
  }
  
  // Mock ALL identity endpoints with a single catch-all
  await page.route('**/api/auth/identity*', async route => {
    await route.fulfill(identityResponse)
  })

  // Mock users list on both endpoints
  const usersResponse = {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      data: [
        {
          id: 'user-1',
          email: 'admin@example.com',
          display_name: 'Admin User',
          is_organisation_admin: true
        },
        {
          id: 'user-2',
          email: 'user@example.com',
          display_name: 'Regular User',
          is_organisation_admin: false
        }
      ]
    })
  }
  
  // Mock all patterns for users endpoint
  await page.route('**/api/auth/organisation/users*', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill(usersResponse)
    } else if (route.request().method() === 'DELETE') {
      // Handle DELETE for remove user
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({})
      })
    } else {
      await route.continue()
    }
  })
}

test.describe('Admin Page', () => {
  test.beforeEach(async ({ page, context }) => {
    // FIRST: Set up API mocks before any navigation
    await mockAPIResponses(page)
    
    // THEN: Set cookies to bypass authentication and admin check
    await context.addCookies([
      {
        name: 'auth-token',
        value: 'mock-jwt-token',
        domain: 'localhost',
        path: '/'
      },
      {
        name: 'test-mode-admin',
        value: 'true',
        domain: 'localhost',
        path: '/'
      }
    ])
  })

  test('should show admin page for admin users', async ({ page }) => {
    // Navigate directly to admin page with test mode flag
    await page.goto('/admin?_testMode=admin')
    
    // Wait for any redirects to complete
    await page.waitForLoadState('networkidle')
    
    // Check URL - we should be on admin page, not redirected
    await expect(page).toHaveURL(/\/admin/)
    
    // Wait for the page to load and render
    await page.waitForSelector('div[class*="card"], div[class*="Card"]', { timeout: 10000 })
    
    // Check that admin page loads - look for card-like structures
    const cards = page.locator('div[class*="card"], div[class*="Card"]')
    await expect(cards.first()).toBeVisible()
  })

  test('should display organization name in form', async ({ page }) => {
    await page.goto('/admin?_testMode=admin')
    
    // Wait for the organization form to load
    const orgNameInput = page.locator('input[type="text"]').first()
    await expect(orgNameInput).toBeVisible()
    
    // Check that it contains the organization name
    await expect(orgNameInput).toHaveValue('Test Organization')
  })

  test('should update organization name', async ({ page }) => {
    // Mock the PATCH request
    await page.route('**/api/auth/organisation', async route => {
      if (route.request().method() === 'PATCH') {
        const body = route.request().postDataJSON()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              id: 'org-1',
              display_name: body.display_name,
              short_name: 'test-org',
              country_codes: ['US'],
              language: 'en'
            }
          })
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/admin?_testMode=admin')
    
    // Find and update the organization name input
    const orgNameInput = page.locator('input[type="text"]').first()
    await orgNameInput.clear()
    await orgNameInput.fill('New Organization Name')
    
    // Submit the form
    const saveButton = page.locator('button').filter({ hasText: 'Save' }).first()
    await saveButton.click()
    
    // Check for success message (any success message in green box)
    await expect(page.locator('.bg-green-50')).toBeVisible()
  })

  test('should display list of users', async ({ page }) => {
    await page.goto('/admin?_testMode=admin')
    
    // Wait for users table to load
    await expect(page.locator('table')).toBeVisible()
    
    // Check that users are displayed
    await expect(page.locator('text=admin@example.com')).toBeVisible()
    await expect(page.locator('text=user@example.com')).toBeVisible()
    await expect(page.locator('text=Admin User')).toBeVisible()
    await expect(page.locator('text=Regular User')).toBeVisible()
  })

  test('should show remove button only for non-current users', async ({ page }) => {
    await page.goto('/admin?_testMode=admin')
    
    // Wait for table to load
    await page.waitForSelector('table')
    
    // Find the row with admin@example.com
    const adminRow = page.locator('tr').filter({ hasText: 'admin@example.com' })
    
    // Admin user (current user) should NOT have a remove button
    const adminRemoveButton = adminRow.locator('button').filter({ hasText: 'Remove' })
    await expect(adminRemoveButton).toHaveCount(0)
    
    // Find the row with user@example.com
    const userRow = page.locator('tr').filter({ hasText: 'user@example.com' })
    
    // Regular user should have a remove button
    const userRemoveButton = userRow.locator('button').filter({ hasText: 'Remove' })
    await expect(userRemoveButton).toBeVisible()
  })

  test('should open invite user modal', async ({ page }) => {
    await page.goto('/admin?_testMode=admin')
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Wait for full render
    
    // Find and click the Create User button by its text
    const createUserButton = page.locator('button:has-text("Create User"), button:has-text("admin.createUser")')
    await createUserButton.first().click()
    
    // Check that modal appears with email input
    await page.waitForSelector('input[type="email"]', { timeout: 5000 })
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('should send user invitation', async ({ page }) => {
    // Mock the invite request
    let inviteRequested = false
    let inviteEmail = ''
    await page.route('**/api/auth/organisation/invite', async route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON()
        inviteRequested = true
        inviteEmail = body.user_email
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({})
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/admin?_testMode=admin')
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Open invite modal
    const createUserButton = page.locator('button:has-text("Create User"), button:has-text("admin.createUser")')
    await createUserButton.first().click()
    
    // Wait for modal to appear
    await page.waitForSelector('input[type="email"]', { timeout: 5000 })
    
    // Fill in email
    const emailInput = page.locator('input[type="email"]')
    await emailInput.fill('newuser@example.com')
    
    // Send invitation
    const sendButton = page.locator('button').filter({ hasText: 'Send Invitation' })
    await sendButton.click()
    
    // Check for success message
    await expect(page.locator('.bg-green-50')).toBeVisible()
    
    // Verify the invite request was made with correct email
    expect(inviteRequested).toBe(true)
    expect(inviteEmail).toBe('newuser@example.com')
  })

  test('should handle organization update error', async ({ page }) => {
    // Mock error response
    await page.route('**/api/auth/organisation', async route => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            detail: 'Organization name already exists'
          })
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/admin?_testMode=admin')
    
    // Try to update organization name
    const orgNameInput = page.locator('input[type="text"]').first()
    await orgNameInput.clear()
    await orgNameInput.fill('Duplicate Name')
    
    const saveButton = page.locator('button').filter({ hasText: 'Save' }).first()
    await saveButton.click()
    
    // Check for error message
    await expect(page.locator('.bg-red-50')).toBeVisible()
  })

  test('should verify page structure matches expectations', async ({ page }) => {
    await page.goto('/admin?_testMode=admin')
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Wait for all components to render
    
    // Verify we have card structures (may use different class names)
    const cards = page.locator('div[class*="card"], div[class*="Card"], div[class*="border"]')
    const cardsCount = await cards.count()
    expect(cardsCount).toBeGreaterThanOrEqual(2)
    
    // Check for forms (organization settings)
    await expect(page.locator('form').first()).toBeVisible()
    
    // Check for input fields
    await expect(page.locator('input[type="text"]').first()).toBeVisible()
    
    // Check for table (users list)
    await expect(page.locator('table')).toBeVisible()
    
    // Check for headers in table
    const headers = page.locator('th')
    await expect(headers).toHaveCount(3)
  })
})