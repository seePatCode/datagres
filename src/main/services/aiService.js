// AI Service for natural language to SQL conversion
// Uses Transformers.js for local, offline AI capabilities

let aiInitialized = false;
let pipeline = null;
let sqlGenerator = null;

// Common SQL patterns for fallback
const sqlPatterns = [
  { regex: /show all (.+)/i, sql: 'SELECT * FROM $1' },
  { regex: /count (.+)/i, sql: 'SELECT COUNT(*) FROM $1' },
  { regex: /find (.+) where (.+) = (.+)/i, sql: "SELECT * FROM $1 WHERE $2 = '$3'" },
  { regex: /show (.+) from (.+)/i, sql: 'SELECT $1 FROM $2' },
  { regex: /unique (.+) from (.+)/i, sql: 'SELECT DISTINCT $1 FROM $2' },
  { regex: /top (\d+) (.+)/i, sql: 'SELECT * FROM $2 LIMIT $1' },
  { regex: /(.+) containing (.+)/i, sql: "SELECT * FROM $1 WHERE $1::text LIKE '%$2%'" }
];

async function initializeAI() {
  if (aiInitialized) return true;
  
  try {
    // Dynamic import for ESM module
    const transformers = await import('@xenova/transformers');
    pipeline = transformers.pipeline;
    
    console.log('Initializing AI model...');
    sqlGenerator = await pipeline(
      'text2text-generation',
      'Xenova/flan-t5-small',
      { 
        quantized: true,
        progress_callback: (progress) => {
          if (progress.status === 'downloading') {
            console.log(`Downloading AI model: ${Math.round(progress.progress)}%`);
          }
        }
      }
    );
    
    aiInitialized = true;
    console.log('AI model initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize AI:', error);
    return false;
  }
}

async function generateSQL(prompt, tableInfo) {
  // Try AI first if available
  if (await initializeAI() && sqlGenerator) {
    try {
      const input = `Convert to PostgreSQL SQL: "${prompt}". Table: ${tableInfo.tableName}, Columns: ${tableInfo.columns.join(', ')}`;
      
      const [result] = await sqlGenerator(input, {
        max_new_tokens: 150,
        temperature: 0.1,
        do_sample: false
      });
      
      // Extract SQL from response
      let sql = result.generated_text;
      
      // Clean up common issues
      sql = sql.replace(/^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)/i, '$1');
      sql = sql.trim();
      
      // Validate it looks like SQL
      if (sql.match(/^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)/i)) {
        return { success: true, sql, method: 'ai' };
      }
    } catch (error) {
      console.error('AI generation failed:', error);
    }
  }
  
  // Fallback to pattern matching
  const lowerPrompt = prompt.toLowerCase();
  const tableName = tableInfo.tableName;
  
  for (const pattern of sqlPatterns) {
    const match = lowerPrompt.match(pattern.regex);
    if (match) {
      let sql = pattern.sql;
      // Replace placeholders
      for (let i = 1; i < match.length; i++) {
        sql = sql.replace(`$${i}`, match[i]);
      }
      // Replace table references
      sql = sql.replace(/\$1/g, tableName);
      return { success: true, sql, method: 'pattern' };
    }
  }
  
  // Default fallback
  return { 
    success: true, 
    sql: `SELECT * FROM ${tableName} LIMIT 100`, 
    method: 'fallback',
    message: 'Could not understand query, showing first 100 rows' 
  };
}

module.exports = {
  initializeAI,
  generateSQL
};