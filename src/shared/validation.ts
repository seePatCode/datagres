/**
 * Validation utilities for the application
 */

/**
 * Validates a PostgreSQL connection string
 * @param connectionString - The connection string to validate
 * @returns true if valid, false otherwise
 */
export function validateConnectionString(connectionString: string): boolean {
  // PostgreSQL connection string validation (password optional)
  const pgRegex = /^postgresql:\/\/([^:@]+(:([^@]*))?@)?[^:\/]+:\d+\/[\w-]+$/
  return pgRegex.test(connectionString)
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

  // Parse components
  const urlPattern = /^postgres(?:ql)?:\/\/(?:([^:@]+)(?::([^@]*))?@)?([^:\/]+)(?::(\d+))?\/(.+)$/
  const match = connectionString.match(urlPattern)

  if (!match) {
    return { valid: false, error: 'Invalid connection string format' }
  }

  const [, username, password, host, port, database] = match

  // Validate components
  if (!host) {
    return { valid: false, error: 'Host is required' }
  }

  if (port && (isNaN(Number(port)) || Number(port) < 1 || Number(port) > 65535)) {
    return { valid: false, error: 'Port must be a number between 1 and 65535' }
  }

  if (!database) {
    return { valid: false, error: 'Database name is required' }
  }

  if (!/^[\w-]+$/.test(database)) {
    return { valid: false, error: 'Database name contains invalid characters' }
  }

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