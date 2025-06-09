/**
 * Validation utilities for the application
 */

/**
 * Validates a PostgreSQL connection string
 * @param connectionString - The connection string to validate
 * @returns true if valid, false otherwise
 */
export function validateConnectionString(connectionString: string): boolean {
  // Just check if it starts with postgres:// or postgresql://
  // Let the PostgreSQL driver handle the actual validation
  return connectionString.startsWith('postgres://') || connectionString.startsWith('postgresql://')
}

/**
 * Validates a PostgreSQL connection string and returns detailed error
 * @param connectionString - The connection string to validate
 * @returns Validation result with error message if invalid
 */
export function validateConnectionStringWithError(connectionString: string): {
  valid: boolean
  error?: string
} {
  if (!connectionString) {
    return { valid: false, error: 'Connection string is required' }
  }

  if (!connectionString.startsWith('postgresql://') && !connectionString.startsWith('postgres://')) {
    return { valid: false, error: 'Connection string must start with postgresql:// or postgres://' }
  }

  // Basic URL validation to ensure it's parseable
  try {
    new URL(connectionString)
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' }
  }

  // Let PostgreSQL handle the rest of the validation
  return { valid: true }
}

/**
 * Validates a connection name
 * @param name - The connection name to validate
 * @returns Validation result with error message if invalid
 */
export function validateConnectionName(name: string): {
  valid: boolean
  error?: string
} {
  if (!name || !name.trim()) {
    return { valid: false, error: 'Connection name is required' }
  }

  if (name.length > 50) {
    return { valid: false, error: 'Connection name must be 50 characters or less' }
  }

  if (!/^[\w\s-]+$/.test(name)) {
    return { valid: false, error: 'Connection name can only contain letters, numbers, spaces, and hyphens' }
  }

  return { valid: true }
}

/**
 * Normalizes a connection string by adding default port if missing
 * @param connectionString - The connection string to normalize
 * @returns Normalized connection string with port
 */
export function normalizeConnectionString(connectionString: string): string {
  // Check if it already has a port - handle query params
  const urlPattern = /^(postgres(?:ql)?:\/\/(?:([^:@]+)(?::([^@]*))?@)?([^:\/]+))(?::(\d+))?(\/[^?]+)(\?.*)?$/
  const match = connectionString.match(urlPattern)

  if (!match) {
    return connectionString
  }

  const [, baseUrl, username, password, host, port, pathAndDb, queryParams] = match

  // If no port specified, add default PostgreSQL port
  if (!port) {
    return `${baseUrl}:5432${pathAndDb}${queryParams || ''}`
  }

  return connectionString
}

/**
 * Sanitizes a connection string for display (removes password)
 * @param connectionString - The connection string to sanitize
 * @returns Sanitized connection string
 */
export function sanitizeConnectionString(connectionString: string): string {
  const urlPattern = /^(postgres(?:ql)?:\/\/)(?:([^:@]+)(?::([^@]*))?@)?(.+)$/
  const match = connectionString.match(urlPattern)

  if (!match) {
    return connectionString
  }

  const [, protocol, username, password, rest] = match

  if (password) {
    return `${protocol}${username}:****@${rest}`
  }

  return connectionString
}

/**
 * Validates table name
 * @param tableName - The table name to validate
 * @returns true if valid, false otherwise
 */
export function validateTableName(tableName: string): boolean {
  // PostgreSQL table names can contain letters, numbers, and underscores
  // They can also be quoted identifiers with more characters
  return /^[\w\s".-]+$/.test(tableName)
}