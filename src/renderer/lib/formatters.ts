/**
 * Format a value for display in table cells
 * Handles special cases like JSON objects, arrays, null values, etc.
 */
export function formatCellValue(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL'
  }

  // Handle objects and arrays (including JSON columns)
  if (typeof value === 'object') {
    try {
      // Always use compact format for table cells (single line)
      return JSON.stringify(value)
    } catch (error) {
      // Fallback if JSON.stringify fails
      return String(value)
    }
  }

  // Handle other types
  return String(value)
}

/**
 * Format a value for display in table cell tooltips
 * Similar to formatCellValue but without pretty printing for tooltips
 */
export function formatCellTooltip(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL'
  }

  // Handle objects and arrays (including JSON columns)
  if (typeof value === 'object') {
    try {
      // Compact JSON for tooltips
      return JSON.stringify(value)
    } catch (error) {
      // Fallback if JSON.stringify fails
      return String(value)
    }
  }

  // Handle other types
  return String(value)
}

/**
 * Check if a value is likely JSON data
 */
export function isJsonValue(value: any): boolean {
  return value !== null && 
         value !== undefined && 
         typeof value === 'object' &&
         (Array.isArray(value) || Object.keys(value).length > 0)
}

/**
 * Format a value for display in an editor (pretty-printed for JSON)
 */
export function formatForEditor(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL'
  }

  // Handle objects and arrays with pretty printing
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2)
    } catch (error) {
      return String(value)
    }
  }

  // Handle other types
  return String(value)
}