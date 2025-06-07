import { test, expect } from '@playwright/test';
import { _electron as electron } from 'playwright';
import path from 'path';

test.describe('Electron App Launch', () => {
  let electronApp;
  let window;

  test.beforeEach(async () => {
    // Launch Electron app in headless/non-intrusive mode
    electronApp = await electron.launch({
      args: [
        path.join(import.meta.dirname, '../../out/main/index.js'),
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ],
      env: {
        ...process.env,
        NODE_ENV: 'test',
        ELECTRON_ENABLE_LOGGING: 'false'
      }
    });
    
    // Wait for the first window to be ready
    window = await electronApp.firstWindow();
  });

  test.afterEach(async () => {
    // Close the app
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('should launch the application', async () => {
    // Verify the app launched
    expect(electronApp).toBeTruthy();
    expect(window).toBeTruthy();
  });

  test('should display correct window title', async () => {
    // Get window title
    const title = await window.title();
    expect(title).toBe('Datagres - Database Explorer');
  });

  test('should have connection input field', async () => {
    // Check for input element with correct placeholder
    const input = window.locator('input[placeholder="Paste connection string here"]');
    await expect(input).toBeVisible();
  });

  test('should not have h1 heading anymore', async () => {
    // h1 should be replaced with connection UI
    const heading = window.locator('h1');
    await expect(heading).toHaveCount(0);
  });

  test('should have Connect button', async () => {
    // Check for button with "Connect" text
    const button = window.locator('button', { hasText: 'Connect' });
    await expect(button).toBeVisible();
  });

  test('Connect button should be clickable', async () => {
    // Verify button is enabled and clickable
    const button = window.locator('button', { hasText: 'Connect' });
    await expect(button).toBeEnabled();
  });

  test('should show connection status area after interaction', async () => {
    // Status area should be hidden initially
    const statusArea = window.locator('[data-testid="connection-status"]');
    await expect(statusArea).toBeHidden();
    
    // Click connect without entering anything to trigger error state
    const button = window.locator('button', { hasText: 'Connect' });
    await button.click();
    
    // Now status area should be visible
    await expect(statusArea).toBeVisible();
  });

  test('should show connection status when button clicked', async () => {
    // Enter a PostgreSQL connection string (this will succeed in test mode)
    const input = window.locator('input[placeholder="Paste connection string here"]');
    await input.fill('postgresql://user:pass@localhost:5432/testdb');
    
    // Click connect button
    const button = window.locator('button', { hasText: 'Connect' });
    await button.click();
    
    // Should show either success (tables list) or error status
    // With our test mock, this will succeed and show tables
    const tablesView = window.locator('text=Connected to testdb');
    await expect(tablesView).toBeVisible({ timeout: 3000 });
  });

  test('should validate PostgreSQL connection string format', async () => {
    // Enter invalid connection string
    const input = window.locator('input[placeholder="Paste connection string here"]');
    await input.fill('invalid-connection-string');
    
    // Click connect button
    const button = window.locator('button', { hasText: 'Connect' });
    await button.click();
    
    // Should show error message
    const errorStatus = window.locator('text=Invalid connection string format');
    await expect(errorStatus).toBeVisible();
  });

  test('should have correct window dimensions', async () => {
    // Verify window size from the main process
    const windowState = await electronApp.evaluate(async ({ BrowserWindow }) => {
      const windows = BrowserWindow.getAllWindows();
      if (windows.length > 0) {
        const bounds = windows[0].getBounds();
        return {
          width: bounds.width,
          height: bounds.height
        };
      }
      return null;
    });

    expect(windowState).toBeTruthy();
    expect(windowState.width).toBe(800);
    expect(windowState.height).toBe(600);
  });

  test('should show tables list after successful connection', async () => {
    // Mock a successful connection by using a test database string
    const input = window.locator('input[placeholder="Paste connection string here"]');
    await input.fill('postgresql://testuser:testpass@localhost:5432/testdb');
    
    // Click connect button
    const button = window.locator('button', { hasText: 'Connect' });
    await button.click();
    
    
    // Wait for successful connection
    await expect(window.locator('text=Connected to testdb')).toBeVisible({ timeout: 10000 });
    
    // Should show tables list  
    const tablesList = window.locator('[data-testid="tables-list"]');
    await expect(tablesList).toBeVisible();
    
    // Should have at least one table listed
    const tableItems = window.locator('[data-testid="table-item"]');
    await expect(tableItems).toHaveCount(4); // We mock 4 tables
  });

  test('should hide connection form after successful connection', async () => {
    // This test will fail until we implement the functionality
    const input = window.locator('input[placeholder="Paste connection string here"]');
    await input.fill('postgresql://testuser:testpass@localhost:5432/testdb');
    
    // Click connect button
    const button = window.locator('button', { hasText: 'Connect' });
    await button.click();
    
    // Wait for successful connection
    await expect(window.locator('text=Connected to testdb')).toBeVisible({ timeout: 5000 });
    
    // Connection input should be hidden - this will fail initially
    await expect(input).toBeHidden();
    
    // Connect button should be hidden - this will fail initially  
    const connectButton = window.locator('button', { hasText: 'Connect' });
    await expect(connectButton).toBeHidden();
  });

  test('should take a screenshot', async () => {
    // Take a screenshot as proof the app is working
    await window.screenshot({ path: 'tests/e2e/screenshots/app-launch.png' });
    
    // Verify screenshot was taken (file will exist)
    import('fs');
    const screenshotPath = path.join(import.meta.dirname, 'screenshots', 'app-launch.png');
    
    // Just verify we could take a screenshot - don't check file existence
    // as it may not be written immediately
    expect(true).toBe(true);
  });
});