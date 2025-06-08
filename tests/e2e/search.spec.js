const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');
const path = require('path');

let electronApp;
let window;

test.beforeEach(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Launch Electron app
  electronApp = await electron.launch({
    args: [path.join(__dirname, '../../')],
    env: {
      ...process.env,
      NODE_ENV: 'test'
    }
  });
  
  // Get the first window
  window = await electronApp.firstWindow();
  
  // Wait for window to be ready
  await window.waitForLoadState('domcontentloaded');
  await window.waitForTimeout(1000); // Give app time to initialize
});

test.afterEach(async () => {
  if (electronApp) {
    await electronApp.close();
  }
});

test.describe('Table Search Functionality', () => {
  test('should search with Enter key only, not on typing', async () => {
    // Wait for auto-connection to complete
    await expect(window.locator('text=Connected to testdb')).toBeVisible({ timeout: 5000 });
    
    // Navigate to users table
    const allTablesButton = window.locator('button:has-text("All Tables")');
    await allTablesButton.click();
    const usersTable = window.locator('button:has-text("users")');
    await usersTable.click();
    
    // Wait for data to load
    await expect(window.locator('text=John Doe')).toBeVisible({ timeout: 10000 });
    await expect(window.locator('text=Jane Smith')).toBeVisible();
    await expect(window.locator('text=Bob Johnson')).toBeVisible();
    
    // Find the search input
    const searchInput = window.locator('input[placeholder*="Press Enter"]');
    await expect(searchInput).toBeVisible();
    
    // Type in search but don't press Enter
    await searchInput.fill('john');
    await window.waitForTimeout(500); // Wait to ensure no auto-search
    
    // All users should still be visible (no auto-search)
    await expect(window.locator('text=John Doe')).toBeVisible();
    await expect(window.locator('text=Jane Smith')).toBeVisible();
    await expect(window.locator('text=Bob Johnson')).toBeVisible();
    
    // Status bar should not show search term yet
    await expect(window.locator('text=/matching "john"/')).toBeHidden();
    
    // Press Enter to trigger search
    await searchInput.press('Enter');
    await window.waitForTimeout(500); // Wait for search to complete
    
    // Now should show only matching results
    await expect(window.locator('text=John Doe')).toBeVisible();
    await expect(window.locator('text=Bob Johnson')).toBeVisible();
    await expect(window.locator('text=Jane Smith')).toBeHidden();
    
    // Status bar should show search term
    await expect(window.locator('text=/2 of 2 rows matching "john"/')).toBeVisible();
  });

  test('should clear search when Enter pressed with empty input', async () => {
    // Wait for auto-connection to complete
    await expect(window.locator('text=Connected to testdb')).toBeVisible({ timeout: 5000 });
    
    // Navigate to users table
    const allTablesButton = window.locator('button:has-text("All Tables")');
    await allTablesButton.click();
    const usersTable = window.locator('button:has-text("users")');
    await usersTable.click();
    
    // Wait for data to load
    await expect(window.locator('text=John Doe')).toBeVisible({ timeout: 10000 });
    
    // Search for jane
    const searchInput = window.locator('input[placeholder*="Press Enter"]');
    await searchInput.fill('jane');
    await searchInput.press('Enter');
    await window.waitForTimeout(500);
    
    // Should show only Jane
    await expect(window.locator('text=Jane Smith')).toBeVisible();
    await expect(window.locator('text=John Doe')).toBeHidden();
    
    // Clear search and press Enter
    await searchInput.clear();
    await searchInput.press('Enter');
    await window.waitForTimeout(500);
    
    // Should show all results again
    await expect(window.locator('text=John Doe')).toBeVisible();
    await expect(window.locator('text=Jane Smith')).toBeVisible();
    await expect(window.locator('text=Bob Johnson')).toBeVisible();
    
    // Status bar should not show search term
    await expect(window.locator('text=/matching/')).toBeHidden();
  });

  test('should search across all columns', async () => {
    // Wait for auto-connection
    await expect(window.locator('text=Connected to testdb')).toBeVisible({ timeout: 5000 });
    
    // Navigate to users table
    const allTablesButton = window.locator('button:has-text("All Tables")');
    await allTablesButton.click();
    const usersTable = window.locator('button:has-text("users")');
    await usersTable.click();
    
    // Wait for data to load
    await expect(window.locator('text=John Doe')).toBeVisible({ timeout: 10000 });
    
    // Search for email domain
    const searchInput = window.locator('input[placeholder*="Press Enter"]');
    await searchInput.fill('example.com');
    await searchInput.press('Enter');
    await window.waitForTimeout(500);
    
    // Should show all users (all have example.com emails)
    await expect(window.locator('text=John Doe')).toBeVisible();
    await expect(window.locator('text=Jane Smith')).toBeVisible();
    await expect(window.locator('text=Bob Johnson')).toBeVisible();
    
    // Search for specific email
    await searchInput.clear();
    await searchInput.fill('jane@example.com');
    await searchInput.press('Enter');
    await window.waitForTimeout(500);
    
    // Should show only Jane
    await expect(window.locator('text=Jane Smith')).toBeVisible();
    await expect(window.locator('text=John Doe')).toBeHidden();
  });

  test('should persist search when refreshing table', async () => {
    // Wait for auto-connection
    await expect(window.locator('text=Connected to testdb')).toBeVisible({ timeout: 5000 });
    
    // Navigate to users table
    const allTablesButton = window.locator('button:has-text("All Tables")');
    await allTablesButton.click();
    const usersTable = window.locator('button:has-text("users")');
    await usersTable.click();
    
    // Wait for data to load
    await expect(window.locator('text=John Doe')).toBeVisible({ timeout: 10000 });
    
    // Search for john
    const searchInput = window.locator('input[placeholder*="Press Enter"]');
    await searchInput.fill('john');
    await searchInput.press('Enter');
    await window.waitForTimeout(500);
    
    // Verify search results
    await expect(window.locator('text=John Doe')).toBeVisible();
    await expect(window.locator('text=Jane Smith')).toBeHidden();
    
    // Click refresh button
    const refreshButton = window.locator('button:has-text("Refresh")');
    await refreshButton.click();
    await window.waitForTimeout(500);
    
    // Search should still be active
    await expect(window.locator('text=John Doe')).toBeVisible();
    await expect(window.locator('text=Jane Smith')).toBeHidden();
    await expect(searchInput).toHaveValue('john');
  });

  test('should handle pagination with search', async () => {
    // Wait for auto-connection
    await expect(window.locator('text=Connected to testdb')).toBeVisible({ timeout: 5000 });
    
    // Navigate to products table (for testing pagination if we have enough data)
    const allTablesButton = window.locator('button:has-text("All Tables")');
    await allTablesButton.click();
    const productsTable = window.locator('button:has-text("products")');
    await productsTable.click();
    
    // Wait for data to load
    await expect(window.locator('text=Laptop')).toBeVisible({ timeout: 10000 });
    
    // Search for a term
    const searchInput = window.locator('input[placeholder*="Press Enter"]');
    await searchInput.fill('Electronics');
    await searchInput.press('Enter');
    await window.waitForTimeout(500);
    
    // Should show filtered results
    await expect(window.locator('text=Laptop')).toBeVisible();
    await expect(window.locator('text=Mouse')).toBeVisible();
    await expect(window.locator('text=Desk')).toBeHidden(); // Furniture category
  });
});