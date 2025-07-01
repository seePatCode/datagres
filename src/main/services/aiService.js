// AI Service for natural language to SQL conversion using Ollama or Claude Code CLI

const settingsStore = require('./settingsStore')
const { exec, spawn } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)

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
    
    // Check if this is a WHERE clause generation request
    const isWhereClause = prompt.toLowerCase().includes('[where-clause-only]');
    
    // Enhanced prompt with best practices from research
    let systemPrompt;
    
    if (isWhereClause) {
      // Special prompt for generating WHERE clauses only
      const userPrompt = prompt.replace('[where-clause-only]', '').trim();
      
      // Create a very focused prompt
      const tableColumns = tableInfo.allSchemas?.[0]?.columns?.map(c => `${c.name} (${c.dataType})`).join(', ') || 'unknown columns';
      
      systemPrompt = `Convert this natural language filter into a PostgreSQL WHERE condition.

RULES:
1. Return ONLY the condition (e.g., "status = 'active'")
2. NO SELECT, FROM, WHERE keywords
3. Use exact column names from the table
4. Use = for exact match, ILIKE for contains
5. "is" means exact match (=), "contains" means partial match (ILIKE '%...%')

Table columns: ${tableColumns}

Examples:
"status is active" → status = 'active'
"title is recovery" → title = 'recovery'
"title contains recovery" → title ILIKE '%recovery%'
"created today" → created_at >= CURRENT_DATE

Convert: "${userPrompt}"
Condition:`;
    } else if (isErrorFix) {
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
      if (isWhereClause) {
        devLog('WHERE clause mode active - expecting only condition');
      }
    }
    
    const generateStart = Date.now();
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5-coder:latest',  // Use qwen2.5-coder for code generation
        prompt: systemPrompt,
        stream: false,
        system: isWhereClause ? "You are a WHERE clause generator. Return ONLY the condition without any SQL keywords." : undefined,
        options: {
          temperature: isWhereClause ? 0.0 : 0.1,  // Zero temperature for WHERE clauses
          top_p: isWhereClause ? 0.8 : 0.9,
          num_ctx: 4096,     // Limit context to prevent memory issues
          num_predict: isWhereClause ? 200 : 1024  // Shorter response for WHERE clauses
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
    
    // For WHERE clause requests, the response should be just the condition
    if (isWhereClause) {
      // Clean up common issues with WHERE clause responses
      sql = sql.replace(/^WHERE\s+/i, ''); // Remove WHERE if included
      sql = sql.replace(/;\s*$/, ''); // Remove trailing semicolon
      
      // Basic validation - should not contain SELECT, FROM, etc.
      if (sql.match(/\b(SELECT|FROM|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i)) {
        console.warn('AI returned full SQL query instead of WHERE clause:', sql);
        devLog('AI did not follow WHERE-only instructions, extracting...', { 
          originalResponse: sql 
        }, 'warn');
        // Try to extract just the WHERE clause
        const whereMatch = sql.match(/WHERE\s+(.+?)(?:ORDER BY|GROUP BY|LIMIT|;|$)/i);
        if (whereMatch && whereMatch[1]) {
          sql = whereMatch[1].trim();
          devLog('Extracted WHERE clause', { extracted: sql });
        }
      }
      
      // Return immediately for WHERE clauses
      if (sql && sql.length > 0) {
        console.log('Ollama generated WHERE clause:', sql);
        const totalTime = Date.now() - startTime;
        devLog(`WHERE clause generated successfully in ${totalTime}ms`, {
          clauseLength: sql.length,
          clause: sql
        });
        return { success: true, sql, method: 'ollama' };
      }
    }
    
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
    
    // Basic validation for actual SQL (skip for WHERE clauses as they're already handled)
    if (!isWhereClause && sql && (sql.toLowerCase().includes('select') || sql.toLowerCase().includes('insert') || 
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

async function tryClaudeCode(prompt, tableInfo) {
  devLog('Starting Claude Code CLI request');
  
  let claudePath = '';
  
  try {
    // First check if Claude CLI is available
    try {
      // First check the standard Claude Code installation location
      if (process.platform === 'darwin') {
        try {
          await execAsync('test -x /usr/local/bin/claude');
          claudePath = '/usr/local/bin/claude';
          devLog('Found Claude Code CLI at standard location:', { path: claudePath });
        } catch (e) {
          // Not at standard location, check PATH
          const whichResult = await execAsync('which claude || command -v claude', {
            shell: true
          });
          claudePath = whichResult.stdout.trim();
          devLog('Found claude in PATH:', { path: claudePath });
          
          // Warn if it's the npm version
          if (claudePath.includes('node_modules') || claudePath.includes('.nvm')) {
            devLog('WARNING: Found npm/node version of claude, not the official Claude Code CLI');
            throw new Error('Found npm claude package, not Claude Code CLI');
          }
        }
      } else {
        // Non-macOS, just check PATH
        const whichResult = await execAsync('which claude || command -v claude || where claude', {
          shell: true
        });
        claudePath = whichResult.stdout.trim();
        devLog('Claude CLI found at:', { path: claudePath });
      }
      
      // Verify it's executable and get version
      try {
        const versionResult = await execAsync(`"${claudePath}" --version`, {
          timeout: 5000,
          encoding: 'utf8'
        });
        devLog('Claude CLI version:', { 
          version: versionResult.stdout.trim(),
          stderr: versionResult.stderr
        });
      } catch (versionError) {
        devLog('Claude CLI version check failed', {
          error: versionError.message,
          stdout: versionError.stdout,
          stderr: versionError.stderr
        });
        // Continue anyway - some versions might not support --version
      }
      
    } catch (error) {
      devLog('Claude CLI check failed', { 
        error: error.message,
        code: error.code,
        stderr: error.stderr,
        stdout: error.stdout
      });
      
      // Try to provide more helpful error message
      let errorMessage = 'Claude CLI not found. ';
      if (process.platform === 'darwin') {
        errorMessage += 'On macOS, after installing Claude Code, you may need to:\n';
        errorMessage += '1. Open Claude Code app at least once\n';
        errorMessage += '2. Add /usr/local/bin to your PATH\n';
        errorMessage += '3. Restart your terminal or run: source ~/.zshrc';
      } else {
        errorMessage += 'Please install Claude Code from claude.ai/code and ensure the "claude" command is in your PATH.';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
    
    // Build schema context similar to Ollama
    const schemaContext = tableInfo.allSchemas?.map(schema => {
      const columnDetails = schema.columns.map(col => {
        let colStr = `${col.name} ${col.dataType}`;
        if (!col.nullable) colStr += ' NOT NULL';
        if (col.isPrimaryKey) colStr += ' PRIMARY KEY';
        if (col.defaultValue) colStr += ` DEFAULT ${col.defaultValue}`;
        return colStr;
      }).join(',\n  ');
      
      const tableName = schema.schemaName && schema.schemaName !== 'public' 
        ? `${schema.schemaName}.${schema.tableName}` 
        : schema.tableName;
      
      return `CREATE TABLE ${tableName} (\n  ${columnDetails}\n);`;
    }).join('\n\n') || '';
    
    // Check if this is a WHERE clause request
    const isWhereClause = prompt.toLowerCase().includes('[where-clause-only]');
    
    // Check if this is a SQL error fix request
    const isErrorFix = prompt.toLowerCase().includes('fix this sql') && 
                      prompt.toLowerCase().includes('error');
    
    // Create a prompt for Claude Code CLI
    let fullPrompt;
    if (isErrorFix) {
      fullPrompt = `Fix this PostgreSQL query error. Return ONLY the corrected SQL query, no explanations.

Database Schema:
${schemaContext}

${prompt}`;
    } else if (isWhereClause) {
      const userPrompt = prompt.replace('[where-clause-only]', '').trim();
      const tableColumns = tableInfo.allSchemas?.[0]?.columns?.map(c => `${c.name} (${c.dataType})`).join(', ') || 'unknown columns';
      
      fullPrompt = `Convert this natural language filter into a PostgreSQL WHERE condition.
Return ONLY the condition (e.g., "status = 'active'"), no SQL keywords, no explanations.

Table columns: ${tableColumns}

Examples:
"status is active" → status = 'active'
"title contains recovery" → title ILIKE '%recovery%'

Convert: "${userPrompt}"`;
    } else {
      fullPrompt = `Generate a PostgreSQL query for the following request. Return ONLY the SQL query, no explanations, no markdown formatting.

Database Schema:
${schemaContext}

Request: ${prompt}`;
    }
    
    devLog('Executing Claude CLI command', { promptLength: fullPrompt.length });
    
    const startTime = Date.now();
    devLog('Starting command execution using stdin approach...');
    
    // Use spawn with stdin to avoid command line length limits and escaping issues
    let stdout = '';
    let stderr = '';
    
    try {
      const output = await new Promise((resolve, reject) => {
        // Try with just -p flag, as --max-turns might not be supported
        const args = ['-p'];
        
        // Use the verified claude path
        const claudeCommand = claudePath || 'claude';
        devLog('Spawning claude process', { command: claudeCommand, args });
        
        const claudeProcess = spawn(claudeCommand, args, {
          encoding: 'utf8',
          timeout: 60000,
          env: { ...process.env, NO_COLOR: '1' } // Disable color output
        });
        
        let stdoutData = '';
        let stderrData = '';
        let processExited = false;
        
        claudeProcess.stdout.on('data', (data) => {
          stdoutData += data.toString();
          devLog('Received stdout chunk', { length: data.length });
        });
        
        claudeProcess.stderr.on('data', (data) => {
          stderrData += data.toString();
          devLog('Received stderr chunk', { length: data.length });
        });
        
        claudeProcess.on('error', (error) => {
          devLog('Claude process error', { error: error.message });
          reject(error);
        });
        
        claudeProcess.on('close', (code) => {
          processExited = true;
          devLog('Claude process closed', { code, stdoutLength: stdoutData.length, stderrLength: stderrData.length });
          if (code === 0) {
            resolve({ stdout: stdoutData, stderr: stderrData });
          } else {
            reject(new Error(`Claude process exited with code ${code}: ${stderrData || 'Unknown error'}`));
          }
        });
        
        // Write prompt to stdin
        devLog('Writing prompt to stdin...');
        claudeProcess.stdin.write(fullPrompt);
        claudeProcess.stdin.end();
        
        // Timeout fallback
        setTimeout(() => {
          if (!processExited) {
            devLog('Claude process timeout - killing process');
            claudeProcess.kill();
            reject(new Error('Claude CLI process timed out'));
          }
        }, 60000);
      });
      
      stdout = output.stdout;
      stderr = output.stderr;
      devLog('Spawn completed successfully');
    } catch (spawnError) {
      devLog('Spawn failed', { 
        error: spawnError.message,
        stack: spawnError.stack
      });
      throw spawnError;
    }
    
    const executionTime = Date.now() - startTime;
    devLog('Command execution completed', { 
      executionTime: `${executionTime}ms`,
      stdoutLength: stdout?.length || 0,
      stderrLength: stderr?.length || 0
    });
    
    if (stderr) {
      devLog('Claude CLI stderr output', { stderr });
    }
    
    if (!stdout && !stderr) {
      devLog('Claude CLI returned no output at all');
      throw new Error('Claude CLI returned no output');
    }
    
    // Some CLI tools output to stderr instead of stdout
    const output = stdout || stderr || '';
    
    devLog('Raw output from Claude', { 
      output: output.length > 500 ? output.substring(0, 500) + '...' : output,
      fromStderr: !stdout && !!stderr
    });
    
    let sql = output.trim();
    
    // Remove any markdown code blocks if present
    sql = sql.replace(/```sql\n?/gi, '').replace(/```\n?/g, '').trim();
    
    // For WHERE clauses, clean up the response
    if (isWhereClause) {
      sql = sql.replace(/^WHERE\s+/i, ''); // Remove WHERE if included
      sql = sql.replace(/;\s*$/, ''); // Remove trailing semicolon
      
      // Validate it's just a condition
      if (sql.match(/\b(SELECT|FROM|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i)) {
        devLog('Claude returned full SQL instead of WHERE clause', { sql });
        // Try to extract WHERE clause
        const whereMatch = sql.match(/WHERE\s+(.+?)(?:ORDER BY|GROUP BY|LIMIT|;|$)/i);
        if (whereMatch && whereMatch[1]) {
          sql = whereMatch[1].trim();
        }
      }
    }
    
    if (!sql) {
      throw new Error('Claude returned empty response');
    }
    
    devLog('Claude CLI generated SQL', { sqlLength: sql.length });
    
    return {
      success: true,
      sql,
      method: 'claude-code'
    };
    
  } catch (error) {
    devLog('Claude Code CLI error', { 
      error: error.message,
      code: error.code,
      stack: error.stack
    }, 'error');
    
    // Provide more specific error messages
    if (error.code === 'ENOENT' || error.message.includes('command not found')) {
      return {
        success: false,
        error: 'Claude CLI not found. Please install Claude Code from claude.ai/code'
      };
    } else if (error.message.includes('not authenticated')) {
      return {
        success: false,
        error: 'Claude CLI not authenticated. Please run "claude login" in your terminal'
      };
    } else if (error.code === 'ETIMEDOUT' || error.message.includes('timed out')) {
      return {
        success: false,
        error: 'Claude CLI request timed out after 60 seconds. Please try again.'
      };
    } else if (error.message.includes('maxBuffer')) {
      return {
        success: false,
        error: 'Claude CLI response too large. Please try a simpler query.'
      };
    }
    
    return {
      success: false,
      error: `Claude CLI error: ${error.message}`
    };
  }
}

async function generateSQL(prompt, tableInfo) {
  devLog('=== Starting new SQL generation request ===');
  
  // Get AI settings
  const aiSettings = await settingsStore.getAISettings();
  devLog('Using AI provider:', { provider: aiSettings.provider });
  
  try {
    if (aiSettings.provider === 'claude-code') {
      // Use Claude Code CLI
      const result = await tryClaudeCode(prompt, tableInfo);
      return result;
    } else {
      // Default to Ollama
      // Try Ollama first time
      const result = await tryOllama(prompt, tableInfo);
      return result;
    }
  } catch (error) {
    console.log('First attempt failed, retrying once:', error.message);
    devLog('First attempt failed, will retry', { error: error.message }, 'info');
    
    // Only retry for Ollama
    if (aiSettings.provider === 'ollama') {
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
    } else {
      return {
        success: false,
        error: error.message
      };
    }
  } finally {
    devLog('=== SQL generation request complete ===\n');
  }
}

module.exports = {
  generateSQL
};