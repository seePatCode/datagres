/**
 * Utility functions for handling PostgreSQL connection strings
 * Supports various formats and handles special characters properly
 */

/**
 * Encode special characters in connection string components
 * @param {string} component - The component to encode (e.g., password, username)
 * @returns {string} - URL-encoded component
 */
function encodeConnectionComponent(component) {
  if (!component) return ''
  
  // URL encode but preserve some PostgreSQL-specific characters
  return encodeURIComponent(component)
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
}

/**
 * Decode special characters from connection string components
 * @param {string} component - The component to decode
 * @returns {string} - Decoded component
 */
function decodeConnectionComponent(component) {
  if (!component) return ''
  
  try {
    return decodeURIComponent(component)
  } catch (error) {
    // If decoding fails, return original
    return component
  }
}

/**
 * Parse various PostgreSQL connection string formats
 * Supports URL format, key-value pairs, and PostgreSQL-specific formats
 * @param {string} connectionString - The connection string to parse
 * @returns {object} - Parsed connection details
 */
function parseConnectionString(connectionString) {
  if (!connectionString || typeof connectionString !== 'string') {
    throw new Error('Connection string is required')
  }

  const trimmed = connectionString.trim()

  // Try URL format first (postgresql:// or postgres://)
  if (trimmed.startsWith('postgresql://') || trimmed.startsWith('postgres://')) {
    return parseUrlFormat(trimmed)
  }

  // Try key-value format (e.g., "host=localhost dbname=mydb")
  if (trimmed.includes('=') && !trimmed.includes('://')) {
    return parseKeyValueFormat(trimmed)
  }

  // If neither format matches, try URL parsing anyway
  // (some tools omit the protocol)
  if (trimmed.includes('@') || trimmed.includes(':')) {
    return parseUrlFormat('postgresql://' + trimmed)
  }

  throw new Error('Unrecognized connection string format')
}

/**
 * Parse URL-style connection string
 * @param {string} connectionString - URL-formatted connection string
 * @returns {object} - Parsed connection details
 */
function parseUrlFormat(connectionString) {
  try {
    const url = new URL(connectionString)
    
    // Extract query parameters
    const params = {}
    url.searchParams.forEach((value, key) => {
      params[key] = value
    })

    // Remove brackets from IPv6 addresses if present
    let host = url.hostname
    if (host.startsWith('[') && host.endsWith(']')) {
      host = host.slice(1, -1)
    }

    return {
      protocol: url.protocol.replace(':', ''),
      username: decodeConnectionComponent(url.username),
      password: decodeConnectionComponent(url.password),
      host: host,
      port: url.port ? parseInt(url.port) : 5432,
      database: url.pathname.substring(1),
      params,
      originalFormat: 'url'
    }
  } catch (error) {
    throw new Error(`Invalid URL format: ${error.message}`)
  }
}

/**
 * Parse key-value style connection string
 * @param {string} connectionString - Key-value formatted connection string
 * @returns {object} - Parsed connection details
 */
function parseKeyValueFormat(connectionString) {
  const params = {}
  const mainKeys = ['host', 'hostaddr', 'port', 'dbname', 'user', 'password']
  
  // Parse key=value pairs, handling quoted values
  const regex = /(\w+)=(?:"([^"]*)"|'([^']*)'|([^\s]*))/g
  let match
  
  while ((match = regex.exec(connectionString)) !== null) {
    const key = match[1]
    const value = match[2] || match[3] || match[4]
    params[key] = value
  }

  // Map common variations
  const result = {
    protocol: 'postgresql',
    username: params.user || params.username || null,
    password: params.password || null,
    host: params.host || params.hostaddr || 'localhost',
    port: params.port ? parseInt(params.port) : 5432,
    database: params.dbname || params.database || null,
    params: {},
    originalFormat: 'keyvalue'
  }

  // Add remaining params that aren't main connection keys
  Object.keys(params).forEach(key => {
    if (!mainKeys.includes(key) && key !== 'user' && key !== 'username' && key !== 'database') {
      result.params[key] = params[key]
    }
  })

  return result
}

/**
 * Build a connection string from components
 * @param {object} components - Connection components
 * @param {string} format - Output format ('url' or 'keyvalue')
 * @returns {string} - Formatted connection string
 */
function buildConnectionString(components, format = 'url') {
  if (format === 'url') {
    return buildUrlFormat(components)
  } else if (format === 'keyvalue') {
    return buildKeyValueFormat(components)
  }
  throw new Error('Invalid format specified')
}

/**
 * Build URL-style connection string
 * @param {object} components - Connection components
 * @returns {string} - URL-formatted connection string
 */
function buildUrlFormat(components) {
  const protocol = components.protocol || 'postgresql'
  const username = components.username ? encodeConnectionComponent(components.username) : ''
  const password = components.password ? `:${encodeConnectionComponent(components.password)}` : ''
  const auth = username ? `${username}${password}@` : ''
  const host = components.host || 'localhost'
  const port = components.port || 5432
  const database = components.database || ''
  
  let url = `${protocol}://${auth}${host}:${port}/${database}`
  
  // Add query parameters
  if (components.params && Object.keys(components.params).length > 0) {
    const queryParams = new URLSearchParams(components.params).toString()
    url += `?${queryParams}`
  }
  
  return url
}

/**
 * Build key-value style connection string
 * @param {object} components - Connection components
 * @returns {string} - Key-value formatted connection string
 */
function buildKeyValueFormat(components) {
  const parts = []
  
  if (components.host) parts.push(`host=${components.host}`)
  if (components.port && components.port !== 5432) parts.push(`port=${components.port}`)
  if (components.database) parts.push(`dbname=${components.database}`)
  if (components.username) parts.push(`user=${components.username}`)
  if (components.password) {
    // Quote password if it contains spaces or special characters
    const needsQuoting = /[\s'"]/.test(components.password)
    if (needsQuoting) {
      parts.push(`password='${components.password.replace(/'/g, "\\'")}'`)
    } else {
      parts.push(`password=${components.password}`)
    }
  }
  
  // Add additional parameters
  if (components.params) {
    Object.entries(components.params).forEach(([key, value]) => {
      parts.push(`${key}=${value}`)
    })
  }
  
  return parts.join(' ')
}

/**
 * Sanitize connection string for display (hide password)
 * @param {string} connectionString - The connection string to sanitize
 * @returns {string} - Sanitized connection string
 */
function sanitizeConnectionString(connectionString) {
  try {
    const parsed = parseConnectionString(connectionString)
    
    if (parsed.password) {
      parsed.password = '********'
    }
    
    return buildConnectionString(parsed, parsed.originalFormat)
  } catch (error) {
    // If parsing fails, try simple regex replacement
    return connectionString
      .replace(/(:\/\/[^:]+:)[^@]+(@)/, '$1********$2')
      .replace(/(password=)[^\s]+/, '$1********')
  }
}

/**
 * Validate connection string format without parsing
 * @param {string} connectionString - The connection string to validate
 * @returns {object} - Validation result with success and error message
 */
function validateConnectionString(connectionString) {
  if (!connectionString || typeof connectionString !== 'string') {
    return { valid: false, error: 'Connection string is required' }
  }

  if (connectionString.trim().length === 0) {
    return { valid: false, error: 'Connection string cannot be empty' }
  }

  try {
    parseConnectionString(connectionString)
    return { valid: true }
  } catch (error) {
    return { valid: false, error: error.message }
  }
}

/**
 * Extract connection info for display purposes
 * @param {string} connectionString - The connection string
 * @returns {object} - Display-friendly connection info
 */
function getConnectionDisplayInfo(connectionString) {
  try {
    const parsed = parseConnectionString(connectionString)
    return {
      host: parsed.host || 'localhost',
      port: parsed.port || 5432,
      database: parsed.database || '',
      username: parsed.username || 'postgres',
      hasPassword: !!parsed.password,
      ssl: parsed.params?.sslmode === 'require' || parsed.params?.ssl === 'true'
    }
  } catch (error) {
    return null
  }
}

module.exports = {
  encodeConnectionComponent,
  decodeConnectionComponent,
  parseConnectionString,
  buildConnectionString,
  sanitizeConnectionString,
  validateConnectionString,
  getConnectionDisplayInfo
}