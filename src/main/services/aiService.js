// AI Service for natural language to SQL conversion using Ollama

const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG_OLLAMA;
const logLevel = process.env.OLLAMA_LOG_LEVEL || (isDev ? 'info' : 'error'); // 'debug', 'info', 'error'

// Development logging helper
function devLog(message, data = null, level = 'info') {
  // Only log if we're in dev mode and the log level matches
  if (isDev && (level === 'error' || (level === 'info' && logLevel !== 'error') || logLevel === 'debug')) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [Ollama] ${message}`);
    if (data) {
      // Filter out overly verbose fields
      const filteredData = { ...data };
      
      // Truncate any strings longer than 500 chars
      Object.keys(filteredData).forEach(key => {
        if (typeof filteredData[key] === 'string' && filteredData[key].length > 500) {
          filteredData[key] = filteredData[key].substring(0, 500) + '... (truncated)';
        }
      });
      
      console.log(JSON.stringify(filteredData, null, 2));
    }
  }
}

// Log memory usage in development
function logMemoryUsage(phase) {
  if (isDev && logLevel === 'debug') {
    const used = process.memoryUsage();
    devLog(`Memory usage at ${phase}:`, {
      rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(used.external / 1024 / 1024)}MB`
    }, 'debug');
  }
}

async function tryOllama(prompt, tableInfo) {
  const startTime = Date.now();
  devLog('Starting Ollama request', { 
    promptLength: prompt.length,
    promptPreview: prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt 
  });
  logMemoryUsage('request start');
  
  try {
    console.log('Trying Ollama with prompt:', prompt);
    
    // Check if Ollama is running - test the actual generate endpoint
    let testResponse;
    try {
      // First try a simple ping to see if service is up
      const pingStart = Date.now();
      testResponse = await fetch('http://localhost:11434/api/tags', {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      devLog(`Health check: ${Date.now() - pingStart}ms, status ${testResponse.status}`);
      
      if (!testResponse.ok) {
        const errorBody = await testResponse.text();
        devLog('Health check failed', { status: testResponse.status, body: errorBody }, 'error');
        throw new Error('Ollama service not responding properly');
      }
      
      // Also check if the model is loaded
      const modelsResponse = await fetch('http://localhost:11434/api/tags');
      if (modelsResponse.ok) {
        const models = await modelsResponse.json();
        const modelList = models.models?.map(m => m.name) || [];
        console.log('Available Ollama models:', modelList.join(', ') || 'none');
        devLog(`Found ${modelList.length} models: ${modelList.join(', ') || 'none'}`);
      }
    } catch (error) {
      // Network error - Ollama not running
      console.error('Ollama connection test failed:', error);
      throw new Error('Ollama is not running. Please start Ollama first.');
    }
    
    // Build schema context with column details and helpful comments
    const schemaContext = tableInfo.allSchemas?.map(schema => {
      const columnDetails = schema.columns.map(col => {
        let colStr = `${col.name} ${col.dataType}`;
        if (!col.nullable) colStr += ' NOT NULL';
        if (col.isPrimaryKey) colStr += ' PRIMARY KEY';
        if (col.defaultValue) colStr += ` DEFAULT ${col.defaultValue}`;
        
        // Add helpful comments for text columns that might contain categories/types
        if ((col.dataType.toLowerCase().includes('varchar') || col.dataType.toLowerCase().includes('text')) &&
            (col.name.toLowerCase().includes('type') || 
             col.name.toLowerCase().includes('category') || 
             col.name.toLowerCase().includes('status') ||
             col.name.toLowerCase().includes('kind'))) {
          colStr += ` -- Contains values like 'recovery', 'maintenance', etc.`;
        }
        
        return colStr;
      }).join(',\n  ');
      
      // Include schema name if not 'public'
      const tableName = schema.schemaName && schema.schemaName !== 'public' 
        ? `${schema.schemaName}.${schema.tableName}` 
        : schema.tableName;
      
      // Add table comment if it has potential category/type columns
      const hasTypeColumns = schema.columns.some(col => 
        col.name.toLowerCase().includes('type') || 
        col.name.toLowerCase().includes('category') ||
        col.name.toLowerCase().includes('status')
      );
      
      let tableSQL = `CREATE TABLE ${tableName} (\n  ${columnDetails}\n);`;
      
      if (hasTypeColumns) {
        const typeColumns = schema.columns
          .filter(col => col.name.toLowerCase().includes('type') || 
                        col.name.toLowerCase().includes('category') ||
                        col.name.toLowerCase().includes('status'))
          .map(col => col.name);
        tableSQL += `\n-- Note: ${typeColumns.join(', ')} columns may contain classification data`;
      }
      
      return tableSQL;
    }).join('\n\n') || '';
    
    // Check if this is a SQL error fix request
    const isErrorFix = prompt.toLowerCase().includes('fix this sql') && 
                      prompt.toLowerCase().includes('error');
    
    // Enhanced prompt with best practices from research
    let systemPrompt;
    
    if (isErrorFix) {
      // Special prompt for fixing SQL errors
      systemPrompt = `### Task
Fix the PostgreSQL query error. The error message indicates which column doesn't exist - find the correct column name from the schema.

### Instructions
- Return ONLY the fixed SQL query, no explanations
- IMPORTANT: When error says "column X does not exist", look in the schema for the correct column name
- Common column name mappings to check:
  * user_id → author_id, committer_id, created_by_id, user_fk
  * created_at → created, timestamp, date_created, created_date
  * updated_at → updated, modified, date_updated, last_modified
  * name → title, label, display_name
  * email → email_address, user_email
- For the commits table specifically, look for:
  * author_id or committer_id instead of user_id
  * author_email or committer_email for user info
  * If joining commits with users, the foreign key in commits might be named differently
- IMPORTANT: If you see "column c.user_id does not exist" and c is the commits table alias:
  * Look in the commits table schema for columns like: author_id, committer_id, user_fk, created_by
  * Do NOT return the same query - you MUST change the column name
- Ensure you're using the exact column names from the schema below

### Database Schema
${schemaContext || `CREATE TABLE ${tableInfo.tableName} (/* schema not available */);`}

### Error Details
${prompt}

### Corrected SQL
`;
    } else {
      // Regular SQL generation prompt
      systemPrompt = `### Task
Generate a PostgreSQL query to answer the natural language question.

### Instructions
- Return ONLY the SQL query, no explanations
- If you cannot answer with the available schema, return exactly: 'I do not know'
- Use table aliases to prevent ambiguity (e.g., a.column_name)
- For text searches, use ILIKE for case-insensitive matching
- Look for columns that might contain the requested data:
  * For "recovery", "type", "category" → look for columns like activity_type, type, category
  * For user names → look for email, name, username columns
  * For dates → look for created_at, updated_at, date columns
- When filtering text, use LIKE '%keyword%' unless exact match is clearly needed

### Database Schema
PostgreSQL database with these tables:
${schemaContext || `CREATE TABLE ${tableInfo.tableName} (/* schema not available */);`}

### Examples
Question: show recovery activities
SQL: SELECT * FROM activities WHERE activity_type ILIKE '%recovery%';

Question: find users named pat
SQL: SELECT * FROM users WHERE email ILIKE '%pat%' OR name ILIKE '%pat%';

### Question
${prompt}

### SQL Query
`;
    }
    
    console.log('Sending to Ollama:', systemPrompt.substring(0, 200) + '...');
    
    if (isDev) {
      devLog(`Sending prompt: ${systemPrompt.length} chars, ${tableInfo.allSchemas?.length || 0} tables`);
    }
    
    const generateStart = Date.now();
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5-coder:latest',  // Use qwen2.5-coder for code generation
        prompt: systemPrompt,
        stream: false,
        options: {
          temperature: 0.1,  // Low temperature for deterministic SQL
          top_p: 0.9,
          num_ctx: 4096,     // Limit context to prevent memory issues
          num_predict: 1024  // Limit response length
        }
      })
    });
    
    const responseTime = Date.now() - generateStart;
    console.log('Ollama response status:', response.status);
    devLog(`Generate response time: ${responseTime}ms`);
    
    if (!response.ok) {
      const errorText = await response.text();
      devLog('Generate request failed', {
        status: response.status,
        responseTime,
        errorBody: errorText
      }, 'error');
      
      // Parse specific error types
      if (errorText.includes('model') && errorText.includes('not found')) {
        throw new Error('AI model not installed. Run: ollama pull qwen2.5-coder:latest');
      }
      
      throw new Error(`Ollama API error (${response.status}): ${errorText}`);
    }
    
    const responseText = await response.text();
    if (logLevel === 'debug') {
      devLog('Raw response body', { 
        bodyLength: responseText.length,
        preview: responseText.length > 200 ? responseText.substring(0, 200) + '...' : responseText
      }, 'debug');
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      devLog('Failed to parse response as JSON', { 
        error: parseError.message,
        responsePreview: responseText.substring(0, 200) + '...'
      }, 'error');
      throw new Error('Invalid JSON response from Ollama');
    }
    
    // Log response structure in dev mode (excluding verbose fields)
    if (isDev) {
      const logData = {
        hasResponse: !!data.response,
        hasError: !!data.error,
        responseLength: data.response?.length || 0,
        done: data.done,
        model: data.model,
        totalDuration: data.total_duration ? `${Math.round(data.total_duration / 1e9)}s` : 'N/A',
        loadDuration: data.load_duration ? `${Math.round(data.load_duration / 1e9)}s` : 'N/A'
      };
      
      // Don't log the context array as it's extremely verbose
      if (data.context && Array.isArray(data.context)) {
        logData.contextTokens = data.context.length;
      }
      
      devLog('Parsed response structure', logData, 'debug');
    }
    
    // Check if Ollama returned an error in the response body
    if (data.error) {
      console.error('Ollama API returned error in body:', data.error);
      
      // Common Ollama errors
      if (data.error.includes('model') && data.error.includes('not found')) {
        throw new Error('AI model not installed. Run: ollama pull qwen2.5-coder:latest');
      }
      if (data.error.includes('Ollama is not running') || data.error.includes('connection refused')) {
        throw new Error('Ollama is not running. Please start Ollama first.');
      }
      
      throw new Error(`Ollama error: ${data.error}`);
    }
    
    let sql = data.response?.trim();
    
    // The new prompt doesn't use [SQL] tags, so skip this extraction
    // sql is already the response text
    
    // Remove any markdown code blocks
    sql = sql?.replace(/```sql\n?/gi, '').replace(/```\n?/g, '').trim();
    
    // Extract only SQL from the response
    // Look for SQL statements and remove any explanatory text
    const lines = sql.split('\n');
    const sqlLines = [];
    let inSqlBlock = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if line starts with SQL keywords or is a continuation
      if (trimmedLine.match(/^(SELECT|INSERT|UPDATE|DELETE|WITH|FROM|WHERE|JOIN|ORDER|GROUP|HAVING|LIMIT|UNION|CREATE|ALTER|DROP|--)/i) ||
          (inSqlBlock && trimmedLine.match(/^(AND|OR|ON|AS|BY|DESC|ASC|INTO|VALUES|SET|,|\(|\)|;)/i)) ||
          (inSqlBlock && trimmedLine !== '' && !trimmedLine.match(/^[A-Z].*[.!?]$/))) {
        sqlLines.push(line);
        inSqlBlock = true;
      } else if (trimmedLine === '' && inSqlBlock) {
        // Empty line might be part of SQL formatting
        sqlLines.push(line);
      } else if (trimmedLine.endsWith(';')) {
        // SQL statement ended
        sqlLines.push(line);
        inSqlBlock = false;
      } else {
        // Not SQL, skip this line
        inSqlBlock = false;
      }
    }
    
    sql = sqlLines.join('\n').trim();
    
    // If no SQL found, check if the entire response might be SQL
    if (!sql && lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.match(/^(SELECT|INSERT|UPDATE|DELETE|WITH|CREATE|ALTER|DROP)/i)) {
        sql = lines.join('\n').trim();
      }
    }
    
    // Check for "I do not know" response first
    if (data.response && data.response.trim().toLowerCase() === 'i do not know') {
      console.log('Ollama cannot generate SQL for this request');
      const totalTime = Date.now() - startTime;
      devLog(`Request completed with "I do not know" in ${totalTime}ms`);
      return { 
        success: false, 
        error: 'The AI model cannot generate SQL for this request. Please try rephrasing your question or provide more context.',
        method: 'ollama' 
      };
    }
    
    // Basic validation for actual SQL
    if (sql && (sql.toLowerCase().includes('select') || sql.toLowerCase().includes('insert') || 
                sql.toLowerCase().includes('update') || sql.toLowerCase().includes('delete'))) {
      console.log('Ollama generated SQL:', sql);
      
      // Clean up any trailing semicolons if multiple
      sql = sql.replace(/;+$/, ';');
      
      const totalTime = Date.now() - startTime;
      devLog(`Request completed successfully in ${totalTime}ms`, {
        sqlLength: sql.length,
        sqlPreview: sql.length > 100 ? sql.substring(0, 100) + '...' : sql
      });
      logMemoryUsage('request complete');
      
      return { success: true, sql, method: 'ollama' };
    }
    
    devLog('No valid SQL found in response', { 
      sql: sql || 'null',
      responseText: data.response ? (data.response.substring(0, 100) + '...') : 'no response'
    });
    
    // Check if it's a different type of "I don't know" response
    if (data.response && data.response.toLowerCase().includes('cannot') || 
        data.response && data.response.toLowerCase().includes('unable')) {
      throw new Error('The AI model cannot generate SQL for this request. Please provide more context.');
    }
    
    throw new Error('Ollama did not return a valid SQL query');
  } catch (error) {
    const errorTime = Date.now() - startTime;
    console.error('Ollama error:', error.message);
    
    devLog(`Request failed after ${errorTime}ms`, {
      error: error.message,
      stack: isDev && logLevel === 'debug' ? error.stack : undefined,
      code: error.code
    }, 'error');
    logMemoryUsage('request error');
    
    // Handle network errors (fetch failed)
    if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
      throw new Error('Ollama is not running. Please start Ollama first.');
    }
    
    throw error;
  }
}

async function generateSQL(prompt, tableInfo) {
  devLog('=== Starting new SQL generation request ===');
  
  try {
    // Try Ollama first time
    const result = await tryOllama(prompt, tableInfo);
    return result;
  } catch (error) {
    console.log('First Ollama attempt failed, retrying once:', error.message);
    devLog('First attempt failed, will retry', { error: error.message }, 'info');
    
    // Retry once as Ollama can have transient errors
    try {
      // Wait a brief moment before retry
      devLog('Waiting 500ms before retry...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      devLog('Starting retry attempt');
      const result = await tryOllama(prompt, tableInfo);
      console.log('Retry successful');
      devLog('Retry succeeded');
      return result;
    } catch (retryError) {
      console.error('Retry also failed:', retryError.message);
      devLog('Retry failed', { error: retryError.message }, 'error');
      
      return {
        success: false,
        error: retryError.message
      };
    }
  } finally {
    devLog('=== SQL generation request complete ===\n');
  }
}

module.exports = {
  generateSQL
};