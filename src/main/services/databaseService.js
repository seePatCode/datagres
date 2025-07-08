const { Client } = require('pg')

/**
 * Create a PostgreSQL client with SSL configuration if needed
 * @param {string} connectionString - PostgreSQL connection string
 * @returns {Client} Configured PostgreSQL client
 */
function createClient(connectionString) {
  let clientConfig;
  
  if (typeof connectionString === 'string') {
    // Check if SSL is needed (common for Heroku and other cloud providers)
    const needsSSL = connectionString.includes('amazonaws.com') || 
                     connectionString.includes('heroku') ||
                     connectionString.includes('azure') ||
                     connectionString.includes('googlecloud');
    
    if (needsSSL) {
      // For cloud providers, use SSL with rejectUnauthorized: false to handle self-signed certificates
      clientConfig = {
        connectionString: connectionString,
        ssl: {
          rejectUnauthorized: false
        }
      };
    } else if (connectionString.includes('sslmode=require')) {
      // If sslmode is explicitly set, honor it
      clientConfig = {
        connectionString: connectionString,
        ssl: {
          rejectUnauthorized: false
        }
      };
    } else {
      clientConfig = connectionString;
    }
  } else {
    clientConfig = connectionString;
  }
  
  return new Client(clientConfig);
}

// Test mode mock data
const mockData = {
  testdb: {
    tables: ['users', 'products', 'orders', 'categories'],
    tableSchemas: {
      users: {
        tableName: 'users',
        columns: [
          { name: 'id', dataType: 'integer', nullable: false, isPrimaryKey: true },
          { name: 'name', dataType: 'text', nullable: false },
          { name: 'email', dataType: 'text', nullable: false },
          { name: 'created_at', dataType: 'date', nullable: false }
        ]
      },
      products: {
        tableName: 'products',
        columns: [
          { name: 'id', dataType: 'integer', nullable: false, isPrimaryKey: true },
          { name: 'name', dataType: 'text', nullable: false },
          { name: 'price', dataType: 'numeric', nullable: false },
          { name: 'category', dataType: 'text', nullable: true }
        ]
      },
      orders: {
        tableName: 'orders',
        columns: [
          { name: 'id', dataType: 'integer', nullable: false, isPrimaryKey: true },
          { name: 'user_id', dataType: 'integer', nullable: false },
          { name: 'total', dataType: 'numeric', nullable: false },
          { name: 'status', dataType: 'text', nullable: false }
        ]
      },
      categories: {
        tableName: 'categories',
        columns: [
          { name: 'id', dataType: 'integer', nullable: false, isPrimaryKey: true },
          { name: 'name', dataType: 'text', nullable: false },
          { name: 'description', dataType: 'text', nullable: true }
        ]
      }
    },
    tableData: {
      users: {
        columns: ['id', 'name', 'email', 'created_at'],
        rows: [
          [1, 'John Doe', 'john@example.com', '2024-01-01'],
          [2, 'Jane Smith', 'jane@example.com', '2024-01-02'],
          [3, 'Bob Johnson', 'bob@example.com', '2024-01-03']
        ]
      },
      products: {
        columns: ['id', 'name', 'price', 'category'],
        rows: [
          [1, 'Laptop', 999.99, 'Electronics'],
          [2, 'Mouse', 29.99, 'Electronics'],
          [3, 'Desk', 199.99, 'Furniture']
        ]
      },
      orders: {
        columns: ['id', 'user_id', 'total', 'status'],
        rows: [
          [1, 1, 1029.98, 'completed'],
          [2, 2, 29.99, 'pending'],
          [3, 1, 199.99, 'shipped']
        ]
      },
      categories: {
        columns: ['id', 'name', 'description'],
        rows: [
          [1, 'Electronics', 'Electronic devices and accessories'],
          [2, 'Furniture', 'Home and office furniture']
        ]
      }
    }
  }
}

/**
 * Connect to a PostgreSQL database and retrieve table list
 * @param {string} connectionString - PostgreSQL connection string
 * @returns {Promise<{success: boolean, database?: string, tables?: string[], error?: string}>}
 */
async function connectDatabase(connectionString) {
  console.log(`[${new Date().toISOString()}] [MAIN] connect-database called`)
  
  // In test mode, return mock data for valid connection strings
  if (process.env.NODE_ENV === 'test') {
    console.log(`[${new Date().toISOString()}] [MAIN] Test mode - mocking database connection`)
    // Mock successful connection for valid test connection strings to testdb
    if (connectionString.includes('testdb')) {
      return {
        success: true,
        database: 'testdb',
        tables: mockData.testdb.tables,
        schemas: [
          {
            name: 'public',
            tables: mockData.testdb.tables.map(name => ({ name, schema: 'public' }))
          }
        ]
      }
    }
    // Mock failure for invalid connection strings in tests
    return {
      success: false,
      error: 'Connection failed'
    }
  }

  console.log(`[${new Date().toISOString()}] [MAIN] Creating PostgreSQL client`)
  const client = createClient(connectionString)
  
  try {
    console.log(`[${new Date().toISOString()}] [MAIN] Connecting to PostgreSQL...`)
    await client.connect()
    console.log(`[${new Date().toISOString()}] [MAIN] Connected! Querying database info...`)
    
    // Test the connection by querying the database name
    const result = await client.query('SELECT current_database()')
    const database = result.rows[0].current_database
    console.log(`[${new Date().toISOString()}] [MAIN] Connected to database: ${database}`)
    
    // Fetch all schemas and their tables
    console.log(`[${new Date().toISOString()}] [MAIN] Fetching schemas and tables...`)
    const schemasResult = await client.query(`
      SELECT 
        n.nspname as schema_name,
        COALESCE(
          json_agg(
            c.relname ORDER BY c.relname
          ) FILTER (WHERE c.relname IS NOT NULL), 
          '[]'::json
        ) as tables
      FROM pg_namespace n
      LEFT JOIN pg_class c ON n.oid = c.relnamespace 
        AND c.relkind = 'r'  -- 'r' = ordinary table
      WHERE n.nspname NOT IN ('pg_toast', 'pg_temp_1', 'pg_toast_temp_1')
        AND n.nspname NOT LIKE 'pg_temp_%'
        AND n.nspname NOT LIKE 'pg_toast_temp_%'
      GROUP BY n.nspname
      ORDER BY 
        CASE WHEN n.nspname = 'public' THEN 0 ELSE 1 END,
        n.nspname
    `)
    
    // Convert to our schema structure
    const schemas = schemasResult.rows.map(row => ({
      name: row.schema_name,
      tables: (Array.isArray(row.tables) ? row.tables : []).map(tableName => ({
        name: tableName,
        schema: row.schema_name
      }))
    }))
    
    // For backward compatibility, also include flat table list (public schema only)
    const publicSchema = schemas.find(s => s.name === 'public')
    const tables = publicSchema ? publicSchema.tables.map(t => t.name) : []
    
    console.log(`[${new Date().toISOString()}] [MAIN] Found ${schemas.length} schemas with tables`)
    
    await client.end()
    console.log(`[${new Date().toISOString()}] [MAIN] Database connection completed successfully`)
    
    return {
      success: true,
      database: database,
      tables: tables,  // backward compatibility
      schemas: schemas
    }
  } catch (error) {
    console.log(`[${new Date().toISOString()}] [MAIN] Database connection failed:`, error.message)
    try {
      await client.end()
    } catch (endError) {
      // Ignore end errors
    }
    
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Build WHERE clause from search options
 * @param {Object} searchOptions - Search options
 * @returns {{whereClause: string}}
 */
function buildWhereClause(searchOptions = {}) {
  // If searchTerm exists, use it directly as a WHERE clause
  if (searchOptions.searchTerm && searchOptions.searchTerm.trim()) {
    return { whereClause: `WHERE ${searchOptions.searchTerm}` }
  }
  
  // No search term = no WHERE clause
  return { whereClause: '' }

}

/**
 * Fetch data from a specific table with optional search/filter options
 * @param {string} connectionString - PostgreSQL connection string
 * @param {string} tableName - Name of the table to fetch data from (can be schema.table or just table)
 * @param {Object} searchOptions - Optional search and filter options
 * @returns {Promise<{success: boolean, tableName?: string, data?: {columns: string[], rows: any[][]}, totalRows?: number, page?: number, pageSize?: number, error?: string}>}
 */
async function fetchTableData(connectionString, tableName, searchOptions = {}) {
  // Parse schema and table name
  let schemaName = 'public'
  let actualTableName = tableName
  
  if (tableName.includes('.')) {
    const parts = tableName.split('.')
    schemaName = parts[0]
    actualTableName = parts[1]
  }
  // In test mode, return mock data
  if (process.env.NODE_ENV === 'test') {
    if (connectionString.includes('testdb')) {
      // Mock table data based on table name
      const tableData = mockData.testdb.tableData[tableName]
      
      if (tableData) {
        // Apply mock search filtering
        let filteredRows = tableData.rows
        if (searchOptions.searchTerm) {
          // Simple mock filtering for test mode
          // Just filter rows that contain the search term in any column
          const searchLower = searchOptions.searchTerm.toLowerCase()
          filteredRows = tableData.rows.filter(row => 
            row.some(cell => cell?.toString().toLowerCase().includes(searchLower))
          )
        }
        
        // Apply pagination
        const page = searchOptions.page || 1
        const pageSize = searchOptions.pageSize || 100
        const startIndex = (page - 1) * pageSize
        const paginatedRows = filteredRows.slice(startIndex, startIndex + pageSize)
        
        return {
          success: true,
          tableName: tableName,
          data: {
            columns: tableData.columns,
            rows: paginatedRows
          },
          totalRows: filteredRows.length,
          page: page,
          pageSize: pageSize
        }
      }
    }
    
    return {
      success: false,
      error: 'Table not found'
    }
  }

  const client = createClient(connectionString)
  
  try {
    await client.connect()
    
    // First, get column information
    const columnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1 
      AND table_schema = $2
      ORDER BY ordinal_position
    `, [actualTableName, schemaName])
    
    const columns = columnsResult.rows.map(row => row.column_name)
    
    // Build WHERE clause
    const { whereClause } = buildWhereClause(searchOptions)
    
    // Get total count with filters
    const countQuery = `SELECT COUNT(*) FROM "${schemaName}"."${actualTableName}" ${whereClause}`
    const countResult = await client.query(countQuery)
    const totalRows = parseInt(countResult.rows[0].count, 10)
    
    // Build ORDER BY clause
    let orderByClause = ''
    if (searchOptions.orderBy && searchOptions.orderBy.length > 0) {
      const orderParts = searchOptions.orderBy.map(order => 
        `"${order.column}" ${order.direction.toUpperCase()}`
      )
      orderByClause = `ORDER BY ${orderParts.join(', ')}`
    } else {
      // Default to ordering by first column to ensure stable sort order
      // This prevents rows from jumping around after updates
      if (columns.length > 0) {
        orderByClause = `ORDER BY 1`
      }
    }
    
    // Pagination
    const page = searchOptions.page || 1
    const pageSize = searchOptions.pageSize || 100
    const offset = (page - 1) * pageSize
    const limitClause = `LIMIT ${pageSize} OFFSET ${offset}`
    
    // Build and execute the data query
    const dataQuery = `SELECT * FROM "${schemaName}"."${actualTableName}" ${whereClause} ${orderByClause} ${limitClause}`
    const dataResult = await client.query(dataQuery)
    const rows = dataResult.rows.map(row => columns.map(col => row[col]))
    
    await client.end()
    
    return {
      success: true,
      tableName: tableName,
      data: {
        columns: columns,
        rows: rows
      },
      totalRows: totalRows,
      page: page,
      pageSize: pageSize
    }
  } catch (error) {
    try {
      await client.end()
    } catch (endError) {
      // Ignore end errors
    }
    
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Fetch schema information for a specific table
 * @param {string} connectionString - PostgreSQL connection string
 * @param {string} tableName - Name of the table (can be schema.table or just table)
 * @param {string} schemaName - Optional schema name (defaults to 'public')
 * @returns {Promise<{success: boolean, schema?: {tableName: string, columns: Array}, error?: string}>}
 */
async function fetchTableSchema(connectionString, tableName, schemaName = 'public') {
  // Parse schema and table name if provided as schema.table
  let actualSchemaName = schemaName
  let actualTableName = tableName
  
  if (tableName.includes('.')) {
    const parts = tableName.split('.')
    actualSchemaName = parts[0]
    actualTableName = parts[1]
  }
  // In test mode, return mock schema
  if (process.env.NODE_ENV === 'test') {
    if (connectionString.includes('testdb')) {
      const schema = mockData.testdb.tableSchemas[tableName]
      if (schema) {
        return {
          success: true,
          schema: schema
        }
      }
    }
    
    return {
      success: false,
      error: 'Table not found'
    }
  }

  const client = createClient(connectionString)
  
  try {
    await client.connect()
    
    // Query to get column information with data types and constraints
    const schemaQuery = `
      SELECT 
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default,
        CASE 
          WHEN pk.column_name IS NOT NULL THEN true 
          ELSE false 
        END as is_primary_key
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
          AND tc.table_name = kcu.table_name
        WHERE tc.table_schema = $2
          AND tc.table_name = $1
          AND tc.constraint_type = 'PRIMARY KEY'
      ) pk ON c.column_name = pk.column_name
      WHERE c.table_schema = $2
        AND c.table_name = $1
      ORDER BY c.ordinal_position
    `
    
    const result = await client.query(schemaQuery, [actualTableName, actualSchemaName])
    
    const columns = result.rows.map(row => ({
      name: row.column_name,
      dataType: row.data_type,
      nullable: row.is_nullable === 'YES',
      isPrimaryKey: row.is_primary_key,
      defaultValue: row.column_default
    }))
    
    await client.end()
    
    return {
      success: true,
      schema: {
        tableName: actualTableName,
        schemaName: actualSchemaName,
        columns: columns
      }
    }
  } catch (error) {
    try {
      await client.end()
    } catch (endError) {
      // Ignore end errors
    }
    
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Update table data with the provided changes
 * @param {string} connectionString - PostgreSQL connection string
 * @param {Object} request - Update request containing tableName and updates array
 * @returns {Promise<{success: boolean, updatedCount?: number, error?: string}>}
 */
async function updateTableData(connectionString, request) {
  const { tableName, schemaName = 'public', updates } = request
  
  // Parse schema and table name if provided as schema.table
  let actualSchemaName = schemaName
  let actualTableName = tableName
  
  if (tableName.includes('.')) {
    const parts = tableName.split('.')
    actualSchemaName = parts[0]
    actualTableName = parts[1]
  }
  
  // In test mode, just return success
  if (process.env.NODE_ENV === 'test') {
    return {
      success: true,
      updatedCount: updates.length
    }
  }

  const client = createClient(connectionString)
  let updatedCount = 0
  
  try {
    await client.connect()
    
    // Start a transaction
    await client.query('BEGIN')
    
    // Process each update
    for (const update of updates) {
      const { columnName, value, primaryKeyColumns } = update
      
      // Check if we have primary key columns
      if (!primaryKeyColumns || Object.keys(primaryKeyColumns).length === 0) {
        throw new Error(`Cannot update table without primary key. Table "${actualSchemaName}"."${actualTableName}" may not have a primary key defined.`)
      }
      
      // Build WHERE clause from primary key columns
      const whereConditions = []
      const whereValues = []
      let paramIndex = 2 // Start at 2 since $1 is the value
      
      for (const [pkColumn, pkValue] of Object.entries(primaryKeyColumns)) {
        whereConditions.push(`${pkColumn} = $${paramIndex}`)
        whereValues.push(pkValue)
        paramIndex++
      }
      
      const whereClause = whereConditions.join(' AND ')
      
      // Build and execute UPDATE query
      const updateQuery = `UPDATE "${actualSchemaName}"."${actualTableName}" SET ${columnName} = $1 WHERE ${whereClause}`
      const queryValues = [value, ...whereValues]
      
      console.log('[MAIN] Executing update query:', updateQuery, 'with values:', queryValues)
      
      const result = await client.query(updateQuery, queryValues)
      updatedCount += result.rowCount || 0
      
      if (result.rowCount === 0) {
        console.warn(`[MAIN] No rows updated for query: ${updateQuery}`)
      }
    }
    
    // Commit the transaction
    await client.query('COMMIT')
    await client.end()
    
    console.log(`[MAIN] Successfully updated ${updatedCount} rows in table ${tableName}`)
    
    return {
      success: true,
      updatedCount: updatedCount
    }
  } catch (error) {
    console.error('[MAIN] Error updating table data:', error.message)
    try {
      // Rollback on error
      await client.query('ROLLBACK')
      await client.end()
    } catch (endError) {
      // Ignore end errors
    }
    
    return {
      success: false,
      error: error.message
    }
  }
}


/**
 * Execute arbitrary SQL query with optional pagination
 * @param {string} connectionString 
 * @param {{query: string, skipAutoLimit?: boolean, page?: number, pageSize?: number}} request 
 * @returns {Promise<{success: boolean, data?: {columns: string[], rows: any[][], rowCount: number}, queryTime?: number, autoLimitApplied?: boolean, limitValue?: number, totalRows?: number, page?: number, pageSize?: number, error?: string}>}
 */
async function executeSQL(connectionString, request) {
  const { query, skipAutoLimit = false, page = 1, pageSize = 100 } = request
  
  // In test mode, return mock results
  if (process.env.NODE_ENV === 'test') {
    return {
      success: true,
      data: {
        columns: ['result'],
        rows: [['Query executed in test mode']],
        rowCount: 1
      },
      queryTime: 10
    }
  }

  const client = createClient(connectionString)
  
  try {
    await client.connect()
    
    const queryUpper = query.trim().toUpperCase()
    const isSelectQuery = queryUpper.startsWith('SELECT')
    const hasExistingLimit = queryUpper.includes('LIMIT')
    const hasAggregation = /COUNT\s*\(|SUM\s*\(|AVG\s*\(|MIN\s*\(|MAX\s*\(/i.test(query)
    
    // For SELECT queries without LIMIT and without aggregation, we'll paginate
    const shouldPaginate = isSelectQuery && !hasExistingLimit && !hasAggregation && !skipAutoLimit
    
    let totalRows = 0
    let result
    let queryTime = 0
    
    if (shouldPaginate) {
      // First, get the total count by wrapping the query
      const countQuery = `SELECT COUNT(*) as count FROM (${query}) as subquery`
      const startCountTime = Date.now()
      
      try {
        const countResult = await client.query(countQuery)
        totalRows = parseInt(countResult.rows[0].count, 10)
        queryTime += Date.now() - startCountTime
      } catch (countError) {
        // If count query fails (e.g., due to ORDER BY in subquery), fall back to regular execution
        console.warn('Count query failed, falling back to non-paginated query:', countError.message)
        const startTime = Date.now()
        result = await client.query(query)
        queryTime = Date.now() - startTime
        totalRows = result.rowCount || 0
      }
      
      // Only apply pagination if we successfully got the count
      if (totalRows > 0 && !result) {
        // Now get the paginated data
        const offset = (page - 1) * pageSize
        const paginatedQuery = `${query} LIMIT ${pageSize} OFFSET ${offset}`
        const startDataTime = Date.now()
        result = await client.query(paginatedQuery)
        queryTime += Date.now() - startDataTime
      } else if (!result) {
        // If totalRows is 0, we still need to execute the query to get column info
        const startTime = Date.now()
        result = await client.query(`${query} LIMIT 0`)
        queryTime += Date.now() - startTime
      }
    } else {
      // Non-paginated query (has LIMIT, has aggregation, or not SELECT)
      const startTime = Date.now()
      result = await client.query(query)
      queryTime = Date.now() - startTime
      totalRows = result.rowCount || 0
    }
    
    // Handle different types of queries
    if (result.command === 'SELECT' || result.rows) {
      // SELECT query - return rows
      const columns = result.fields ? result.fields.map(field => field.name) : []
      const rows = result.rows.map(row => columns.map(col => row[col]))
      
      await client.end()
      
      return {
        success: true,
        data: {
          columns,
          rows,
          rowCount: result.rowCount || rows.length
        },
        queryTime,
        totalRows: shouldPaginate ? totalRows : undefined,
        page: shouldPaginate ? page : undefined,
        pageSize: shouldPaginate ? pageSize : undefined,
        autoLimitApplied: shouldPaginate && totalRows > pageSize,
        limitValue: shouldPaginate ? pageSize : null
      }
    } else {
      // Non-SELECT query (INSERT, UPDATE, DELETE, etc.)
      await client.end()
      
      return {
        success: true,
        data: {
          columns: ['result'],
          rows: [[`Query OK, ${result.rowCount || 0} rows affected`]],
          rowCount: 1
        },
        queryTime,
        autoLimitApplied: false
      }
    }
  } catch (error) {
    try {
      await client.end()
    } catch (endError) {
      // Ignore end errors
    }
    
    return {
      success: false,
      error: error.message
    }
  }
}

module.exports = {
  connectDatabase,
  fetchTableData,
  fetchTableSchema,
  updateTableData,
  executeSQL
}