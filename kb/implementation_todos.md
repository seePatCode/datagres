# Implementation TODO List

This document tracks the incremental development steps for building Datagres. Each step is designed to be as small as possible while still delivering testable value.

## Step Format
Each step follows strict Test-Driven Development (TDD):
- **Why**: The purpose and value of this change
- **Red Phase**: Update tests to expect new behavior (tests should FAIL)
- **Green Phase**: Implement code to make tests pass
- **Human Verification**: Manual verification of the working feature

## TDD Process
1. **Red**: Always start by updating tests to fail
2. **Green**: Write minimal code to make tests pass
3. **Refactor**: Clean up if needed (optional)
4. **Commit**: Save progress after each complete cycle

---

## ✅ Completed Steps

### Step 0: Basic Electron Setup with Testing
- **Why**: Foundation for the application
- **What**: Created basic Electron app following official tutorial
- **Test**: Playwright tests verify app launches
- **Human Verification**: Run `npm test` - all tests pass

---

## 🚧 Current Step

### Step 1: Update Window Title and App Name
- **Why**: Begin branding the app as "Datagres" instead of generic Electron app
- **Red Phase**: 
  - Update test in `tests/e2e/app.spec.js` to expect "Datagres - Database Explorer" 
  - Update heading test to expect "Datagres - Database Explorer"
  - Run `npm test` - should see 2 tests fail (RED)
- **Green Phase**: 
  - Update HTML title tag in index.html
  - Update h1 content in index.html
  - Run `npm test` - should see all tests pass (GREEN)
- **Human Verification**: 
  - Run `npm start` - window title bar shows "Datagres - Database Explorer"
  - Page content shows "Datagres - Database Explorer" heading

---

## 📋 Upcoming Steps

### Step 2: Create Basic Connection UI Structure
- **Why**: Users need a place to paste connection strings (core feature)
- **Red Phase**: 
  - Add test for input element with placeholder "Paste connection string here"
  - Add test that h1 no longer exists
  - Run `npm test` - should see 2 tests fail (RED)
- **Green Phase**: 
  - Replace h1 with input field in index.html
  - Add basic CSS for centered layout
  - Run `npm test` - should see all tests pass (GREEN)
- **Human Verification**: 
  - Run `npm start` - see centered input field
  - Click input field - cursor appears and it's focusable

### Step 3: Add Connect Button (Visual Only)
- **Why**: Users need a clear action to initiate connection
- **What**: 
  - Add button element next to input
  - Button text: "Connect"
  - Basic styling to match input height
- **Test**: 
  - Test button exists
  - Test button has correct text
  - Test button is visible
- **Human Verification**: 
  - Run `npm test` - all tests pass
  - Run `npm start` - see button next to input
  - Click button (nothing should happen yet)

### Step 4: Add Keyboard Shortcut Display
- **Why**: App is keyboard-driven, users need to know shortcuts
- **What**: 
  - Add small text below input: "Press Cmd+Shift+P to open connection dialog"
  - Gray, smaller font
- **Test**: 
  - Test help text exists
  - Test contains "Cmd+Shift+P"
- **Human Verification**: 
  - See help text displayed
  - Verify it's readable but not distracting

### Step 5: Basic Input Handling
- **Why**: Input needs to capture user text
- **What**: 
  - Add value state to input
  - Log value to console on change
- **Test**: 
  - Type in input and verify value updates
  - Test input can be cleared
- **Human Verification**: 
  - Type a connection string
  - Open DevTools and see console logs
  - Clear input and verify it empties

### Step 6: Button State Based on Input
- **Why**: Visual feedback for valid action
- **What**: 
  - Disable button when input is empty
  - Enable when input has content
- **Test**: 
  - Test button disabled when empty
  - Test button enabled when input has text
- **Human Verification**: 
  - Start with empty input - button disabled
  - Type something - button enables
  - Clear input - button disables again

### Step 7: Connection String Validation Regex
- **Why**: Help users identify valid connection strings
- **What**: 
  - Add regex patterns for postgres/mysql/sqlite/mongodb
  - Change input border color: green if valid, default otherwise
- **Test**: 
  - Test various connection string formats
  - Test border color changes
- **Human Verification**: 
  - Paste valid postgres URL - green border
  - Type invalid text - default border
  - Try each database type

### Step 8: Add Connection Status Area
- **Why**: Users need feedback on connection attempts
- **What**: 
  - Add status div below connection area
  - Initially hidden
  - Prepare for future status messages
- **Test**: 
  - Test status area exists but is hidden
- **Human Verification**: 
  - Verify no visual change (area is hidden)
  - Inspect element to confirm it exists

### Step 9: Detect Database Type from URL
- **Why**: Auto-detection improves user experience
- **What**: 
  - Function to parse URL and identify database type
  - Display detected type below input
- **Test**: 
  - Test detection for each database type
  - Test "Unknown" for invalid URLs
- **Human Verification**: 
  - Paste different connection strings
  - See correct database type displayed

### Step 10: Create Main Layout Structure
- **Why**: Prepare for split view (connection + data grid)
- **What**: 
  - Create sidebar for connection area
  - Create main area for future grid
  - Basic flexbox layout
- **Test**: 
  - Test both areas exist
  - Test responsive behavior
- **Human Verification**: 
  - See sidebar on left
  - Main area takes remaining space
  - Resize window to verify layout adjusts

---

## 🔮 Future Steps (High Level)

- Install database drivers (start with SQLite as it's simplest)
- Implement actual connection logic
- Show connection success/error
- Create basic data grid component
- Load and display data from connected database
- Add keyboard shortcuts
- Implement Cmd+K navigation
- Add filtering
- Add editing capabilities

---

## Notes

- Each step should take 5-15 minutes to implement
- Always write/update tests first (TDD)
- Commit after each successful step
- If a step feels too big, break it down further
- Focus on user-visible progress