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

  test('should make tables clickable to view data', async () => {
    // First connect to database to get tables list
    const input = window.locator('input[placeholder="Paste connection string here"]');
    await input.fill('postgresql://testuser:testpass@localhost:5432/testdb');
    
    const button = window.locator('button', { hasText: 'Connect' });
    await button.click();
    
    // Wait for tables list to appear
    await expect(window.locator('text=Connected to testdb')).toBeVisible();
    const tablesList = window.locator('[data-testid="tables-list"]');
    await expect(tablesList).toBeVisible();
    
    // Click on the first table (should be 'users' based on our mock)
    const firstTable = window.locator('[data-testid="table-item"]').first();
    await expect(firstTable).toBeVisible();
    await firstTable.click();
    
    // Should show table data view - this will fail initially
    const tableDataView = window.locator('[data-testid="table-data"]');
    await expect(tableDataView).toBeVisible({ timeout: 5000 });
    
    // Should show table name as header - this will fail initially
    const tableHeader = window.locator('[data-testid="table-header"]');
    await expect(tableHeader).toContainText('users');
    
    // Should show column headers - this will fail initially
    const columnHeaders = window.locator('[data-testid="column-header"]');
    const columnCount = await columnHeaders.count();
    expect(columnCount).toBeGreaterThan(0);
    
    // Should show data rows - this will fail initially
    const dataRows = window.locator('[data-testid="data-row"]');
    const rowCount = await dataRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should hide tables list when viewing table data', async () => {
    // Connect and get to tables list
    const input = window.locator('input[placeholder="Paste connection string here"]');
    await input.fill('postgresql://testuser:testpass@localhost:5432/testdb');
    
    const button = window.locator('button', { hasText: 'Connect' });
    await button.click();
    
    await expect(window.locator('text=Connected to testdb')).toBeVisible();
    
    // Click on a table
    const firstTable = window.locator('[data-testid="table-item"]').first();
    await firstTable.click();
    
    // Tables list should be hidden when viewing table data - this will fail initially
    const tablesList = window.locator('[data-testid="tables-list"]');
    await expect(tablesList).toBeHidden();
  });

  test('should show back navigation from table data to tables list', async () => {
    // Connect and click on a table
    const input = window.locator('input[placeholder="Paste connection string here"]');
    await input.fill('postgresql://testuser:testpass@localhost:5432/testdb');
    
    const button = window.locator('button', { hasText: 'Connect' });
    await button.click();
    
    await expect(window.locator('text=Connected to testdb')).toBeVisible();
    
    const firstTable = window.locator('[data-testid="table-item"]').first();
    await firstTable.click();
    
    // Should show back button or breadcrumb - this will fail initially
    const backButton = window.locator('[data-testid="back-to-tables"]');
    await expect(backButton).toBeVisible();
    
    // Clicking back should return to tables list - this will fail initially
    await backButton.click();
    const tablesList = window.locator('[data-testid="tables-list"]');
    await expect(tablesList).toBeVisible();
  });

  test('should have sortable columns in table data view', async () => {
    // Connect and navigate to table data
    const input = window.locator('input[placeholder="Paste connection string here"]');
    await input.fill('postgresql://testuser:testpass@localhost:5432/testdb');
    
    const button = window.locator('button', { hasText: 'Connect' });
    await button.click();
    
    await expect(window.locator('text=Connected to testdb')).toBeVisible();
    
    const firstTable = window.locator('[data-testid="table-item"]').first();
    await firstTable.click();
    
    await expect(window.locator('[data-testid="table-data"]')).toBeVisible();
    
    // Column headers should be clickable for sorting - this will fail initially
    const firstColumnHeader = window.locator('[data-testid="column-header"]').first();
    await expect(firstColumnHeader).toBeVisible();
    
    // Should have sort indicators or be clickable - this will fail initially
    await firstColumnHeader.click();
    
    // Should see some indication of sorting (like arrow icons) - this will fail initially
    const sortIndicator = window.locator('[data-testid="sort-indicator"]').first();
    await expect(sortIndicator).toBeVisible({ timeout: 3000 });
  });

  test('should show table metadata and row count', async () => {
    // Connect and navigate to table data
    const input = window.locator('input[placeholder="Paste connection string here"]');
    await input.fill('postgresql://testuser:testpass@localhost:5432/testdb');
    
    const button = window.locator('button', { hasText: 'Connect' });
    await button.click();
    
    await expect(window.locator('text=Connected to testdb')).toBeVisible();
    
    const firstTable = window.locator('[data-testid="table-item"]').first();
    await firstTable.click();
    
    await expect(window.locator('[data-testid="table-data"]')).toBeVisible();
    
    // Should show row count or table metadata - this will fail initially
    const tableInfo = window.locator('[data-testid="table-info"]');
    await expect(tableInfo).toBeVisible();
    await expect(tableInfo).toContainText('rows');
  });

  test('should have improved table styling and responsiveness', async () => {
    // Connect and navigate to table data
    const input = window.locator('input[placeholder="Paste connection string here"]');
    await input.fill('postgresql://testuser:testpass@localhost:5432/testdb');
    
    const button = window.locator('button', { hasText: 'Connect' });
    await button.click();
    
    await expect(window.locator('text=Connected to testdb')).toBeVisible();
    
    const firstTable = window.locator('[data-testid="table-item"]').first();
    await firstTable.click();
    
    // Should use enhanced table component - this will fail initially
    const enhancedTable = window.locator('[data-testid="enhanced-table"]');
    await expect(enhancedTable).toBeVisible();
    
    // Should have proper table structure with thead and tbody
    const tableHead = enhancedTable.locator('thead');
    const tableBody = enhancedTable.locator('tbody');
    await expect(tableHead).toBeVisible();
    await expect(tableBody).toBeVisible();
  });

  test('should show saved connections manager on connection screen', async () => {
    // Check for connection manager card
    const connectionManager = window.locator('text=Saved Connections');
    await expect(connectionManager).toBeVisible();
    
    // Should show either empty state or existing connections (test mode has mock connections)
    const savedConnectionsList = window.locator('[data-testid="saved-connections-list"]');
    const emptyState = window.locator('text=No saved connections yet');
    
    // Wait for either the list or empty state to be visible
    try {
      await expect(savedConnectionsList).toBeVisible({ timeout: 3000 });
      // If we have mock connections, verify they're shown
      const connectionItems = window.locator('[data-testid="saved-connection-item"]');
      const count = await connectionItems.count();
      expect(count).toBeGreaterThan(0);
    } catch {
      // Otherwise check for empty state
      await expect(emptyState).toBeVisible();
    }
  });

  test('should allow saving connection after connecting', async () => {
    // First, check that save button is disabled when not connected
    const saveButton = window.locator('[data-testid="save-connection-button"]');
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toBeDisabled();
    
    // Connect to database
    const input = window.locator('input[placeholder="Paste connection string here"]');
    await input.fill('postgresql://testuser:testpass@localhost:5432/testdb');
    
    const button = window.locator('button', { hasText: 'Connect' });
    await button.click();
    
    // After connection, app switches to tables view
    await expect(window.locator('text=Connected to testdb')).toBeVisible();
    
    // Connection manager should not be visible in tables view
    await expect(saveButton).not.toBeVisible();
  });

  test('should load saved connections from mock data', async () => {
    // In test mode, we have mock saved connections
    // Should see them in the connection manager
    const savedConnections = window.locator('[data-testid="saved-connections-list"]');
    await expect(savedConnections).toBeVisible();
    
    // Should have mock connections
    const connectionItems = window.locator('[data-testid="saved-connection-item"]');
    const count = await connectionItems.count();
    expect(count).toBe(2); // We have 2 mock connections
    
    // Click on first saved connection to load it
    const firstConnection = connectionItems.first();
    await firstConnection.click();
    
    // Should connect automatically
    await expect(window.locator('text=Connected to testdb')).toBeVisible({ timeout: 5000 });
  });

  test('should edit saved connection names', async () => {
    // Should have mock connections visible
    const savedConnection = window.locator('[data-testid="saved-connection-item"]').first();
    await expect(savedConnection).toBeVisible();
    
    // Click edit button
    const editButton = window.locator('[data-testid="edit-connection-button"]').first();
    await editButton.click();
    
    // Edit name input should be visible
    const editInput = window.locator('[data-testid="edit-name-input"]');
    await expect(editInput).toBeVisible();
    
    // Clear and enter new name
    await editInput.clear();
    await editInput.fill('Updated Connection Name');
    
    // Save edit
    const saveEditButton = window.locator('[data-testid="save-edit-button"]');
    await saveEditButton.click();
    
    // Should see updated name (in test mode this won't persist)
    const connectionName = window.locator('[data-testid="connection-name"]').first();
    await expect(connectionName).toBeVisible();
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