const { test, expect } = require('@playwright/test')

test.describe('Fix SQL Error with AI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    
    // Connect to test database
    await page.fill('#connection-string', 'postgresql://test:test@localhost/testdb')
    await page.click('button:has-text("Connect")')
    
    // Wait for tables to load
    await page.waitForSelector('[data-testid="table-list"]')
  })
  
  test('shows Fix with AI button on SQL error', async ({ page }) => {
    // Navigate to SQL editor
    await page.click('button:has-text("SQL Editor")')
    await page.waitForSelector('[data-testid="sql-editor"]')
    
    // Enter a query with an error
    const errorQuery = 'SELECT * FROM commits c JOIN users u ON c.user_id = u.id'
    await page.fill('[data-testid="sql-editor"] textarea', errorQuery)
    
    // Execute the query
    await page.click('button:has-text("Execute")')
    
    // Wait for error to appear
    await page.waitForSelector('[data-testid="sql-error"]')
    
    // Verify error message
    const errorText = await page.textContent('[data-testid="sql-error"]')
    expect(errorText).toContain('column c.user_id does not exist')
    
    // Verify Fix with AI button appears
    const fixButton = page.locator('button:has-text("Fix with AI")')
    await expect(fixButton).toBeVisible()
  })
  
  test('fixes SQL error when Fix with AI is clicked', async ({ page }) => {
    // Navigate to SQL editor
    await page.click('button:has-text("SQL Editor")')
    await page.waitForSelector('[data-testid="sql-editor"]')
    
    // Enter a query with an error
    const errorQuery = 'SELECT * FROM commits c JOIN users u ON c.user_id = u.id'
    await page.fill('[data-testid="sql-editor"] textarea', errorQuery)
    
    // Execute the query
    await page.click('button:has-text("Execute")')
    
    // Wait for error to appear
    await page.waitForSelector('[data-testid="sql-error"]')
    
    // Click Fix with AI
    await page.click('button:has-text("Fix with AI")')
    
    // Wait for the button to show loading state
    await expect(page.locator('button:has-text("Fixing...")')).toBeVisible()
    
    // Wait for the query to be fixed (in test mode, it should be instant)
    await page.waitForFunction(() => {
      const editor = document.querySelector('[data-testid="sql-editor"] textarea')
      return editor && editor.value.includes('c.author_id')
    }, { timeout: 5000 })
    
    // Verify the query was updated
    const updatedQuery = await page.inputValue('[data-testid="sql-editor"] textarea')
    expect(updatedQuery).toContain('c.author_id')
    expect(updatedQuery).not.toContain('c.user_id')
    
    // Verify the error is cleared
    await expect(page.locator('[data-testid="sql-error"]')).not.toBeVisible()
    
    // Verify results are shown (auto-execution)
    await page.waitForSelector('[data-testid="query-results"]', { timeout: 5000 })
  })
  
  test('handles AI service errors gracefully', async ({ page }) => {
    // Simulate AI service being unavailable by modifying test mode
    await page.evaluate(() => {
      // Override the generateSQL function to simulate failure
      window.electronAPI.generateSQL = async () => ({
        success: false,
        error: 'Ollama is not running. Please start Ollama first.'
      })
    })
    
    // Navigate to SQL editor
    await page.click('button:has-text("SQL Editor")')
    await page.waitForSelector('[data-testid="sql-editor"]')
    
    // Enter a query with an error
    const errorQuery = 'SELECT * FROM nonexistent_table'
    await page.fill('[data-testid="sql-editor"] textarea', errorQuery)
    
    // Execute the query
    await page.click('button:has-text("Execute")')
    
    // Wait for error to appear
    await page.waitForSelector('[data-testid="sql-error"]')
    
    // Click Fix with AI
    await page.click('button:has-text("Fix with AI")')
    
    // Wait for alert dialog
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Ollama is not running')
      await dialog.accept()
    })
    
    // Verify the button returns to normal state
    await expect(page.locator('button:has-text("Fix with AI")')).toBeVisible()
    
    // Verify the original error is still shown
    await expect(page.locator('[data-testid="sql-error"]')).toBeVisible()
  })
  
  test('preserves query history when fixing errors', async ({ page }) => {
    // Navigate to SQL editor
    await page.click('button:has-text("SQL Editor")')
    await page.waitForSelector('[data-testid="sql-editor"]')
    
    // Enter first query
    const firstQuery = 'SELECT * FROM users'
    await page.fill('[data-testid="sql-editor"] textarea', firstQuery)
    await page.click('button:has-text("Execute")')
    await page.waitForSelector('[data-testid="query-results"]')
    
    // Enter second query with error
    const errorQuery = 'SELECT * FROM commits c WHERE c.invalid_column = 1'
    await page.fill('[data-testid="sql-editor"] textarea', errorQuery)
    await page.click('button:has-text("Execute")')
    await page.waitForSelector('[data-testid="sql-error"]')
    
    // Fix the error
    await page.click('button:has-text("Fix with AI")')
    await page.waitForFunction(() => {
      const editor = document.querySelector('[data-testid="sql-editor"] textarea')
      return editor && !editor.value.includes('invalid_column')
    })
    
    // Verify we can still undo to see previous queries
    await page.keyboard.press('Control+Z')
    const undoneQuery = await page.inputValue('[data-testid="sql-editor"] textarea')
    expect(undoneQuery).toBe(errorQuery)
    
    await page.keyboard.press('Control+Z')
    const firstQueryAgain = await page.inputValue('[data-testid="sql-editor"] textarea')
    expect(firstQueryAgain).toBe(firstQuery)
  })
})