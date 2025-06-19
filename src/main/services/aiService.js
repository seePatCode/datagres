// AI Service for natural language to SQL conversion using Ollama

async function tryOllama(prompt, tableInfo) {
  try {
    console.log('Trying Ollama with prompt:', prompt);
    
    // Check if Ollama is running
    let testResponse;
    try {
      testResponse = await fetch('http://localhost:11434/api/tags');
    } catch (error) {
      // Network error - Ollama not running
      throw new Error('Ollama is not running. Please start Ollama first.');
    }
    
    if (!testResponse.ok) {
      throw new Error('Ollama is not running. Please start Ollama first.');
    }
    
    // Build schema context with full column details
    const schemaContext = tableInfo.allSchemas?.map(schema => {
      const columnDetails = schema.columns.map(col => {
        let colStr = `${col.name} ${col.dataType}`;
        if (!col.nullable) colStr += ' NOT NULL';
        if (col.isPrimaryKey) colStr += ' PRIMARY KEY';
        if (col.defaultValue) colStr += ` DEFAULT ${col.defaultValue}`;
        return colStr;
      }).join(',\n  ');
      
      return `CREATE TABLE ${schema.tableName} (\n  ${columnDetails}\n);`;
    }).join('\n\n') || '';
    
    // Create prompt using official SQLCoder template format
    const systemPrompt = `### Task
Generate a SQL query to answer [QUESTION]${prompt}[/QUESTION]

### Instructions
- If you cannot answer the question with the available database schema, return 'I do not know'
- Deliberately go through the question and database schema word by word to appropriately answer the question
- Use Table Aliases to prevent ambiguity. For example, \`SELECT t1.col1, t2.col1 FROM table1 t1 JOIN table2 t2 ON t1.id = t2.id\`
- When creating a ratio, always cast the numerator as float

### Database Schema
The query will run on a PostgreSQL database with the following schema:
${schemaContext || `CREATE TABLE ${tableInfo.tableName} (/* schema not available */);`}

### Answer
Given the database schema, here is the SQL query that answers [QUESTION]${prompt}[/QUESTION]
[SQL]`;
    
    console.log('Sending to Ollama:', systemPrompt.substring(0, 200) + '...');
    
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5-coder:latest',  // Use qwen2.5-coder for code generation
        prompt: systemPrompt,
        stream: false,
        options: {
          temperature: 0.1,  // Low temperature for deterministic SQL
          top_p: 0.9
        }
      })
    });
    
    console.log('Ollama response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      
      // Parse specific error types
      if (errorText.includes('model') && errorText.includes('not found')) {
        throw new Error('AI model not installed. Run: ollama pull qwen2.5-coder:latest');
      }
      
      throw new Error(`Ollama API error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    let sql = data.response?.trim();
    
    // Extract SQL from [SQL] tags if present
    const sqlMatch = sql?.match(/\[SQL\]([\s\S]*?)(?:\[\/SQL\]|$)/);
    if (sqlMatch) {
      sql = sqlMatch[1].trim();
    }
    
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
    
    // Basic validation
    if (sql && (sql.toLowerCase().includes('select') || sql.toLowerCase().includes('insert') || 
                sql.toLowerCase().includes('update') || sql.toLowerCase().includes('delete') ||
                sql.toLowerCase() === 'i do not know')) {
      console.log('Ollama generated SQL:', sql);
      return { success: true, sql, method: 'ollama' };
    }
    
    throw new Error('Ollama did not return a valid SQL query');
  } catch (error) {
    console.error('Ollama error:', error.message);
    
    // Handle network errors (fetch failed)
    if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
      throw new Error('Ollama is not running. Please start Ollama first.');
    }
    
    throw error;
  }
}

async function generateSQL(prompt, tableInfo) {
  try {
    // Only use Ollama - no fallbacks
    const result = await tryOllama(prompt, tableInfo);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  generateSQL
};