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
    // For now, we'll skip the actual AI initialization in the main process
    // The transformers library is better suited for the renderer process
    console.log('AI service initialized (pattern matching mode)');
    aiInitialized = true;
    return true;
  } catch (error) {
    console.error('Failed to initialize AI:', error);
    return false;
  }
}

async function generateSQL(prompt, tableInfo) {
  await initializeAI();
  
  // Use pattern matching for now
  const lowerPrompt = prompt.toLowerCase();
  const tableName = tableInfo.tableName;
  
  // Enhanced patterns for common queries
  const enhancedPatterns = [
    // Active/inactive patterns
    { regex: /show (?:all )?active (.+)/i, sql: "SELECT * FROM $1 WHERE status = 'active'" },
    { regex: /show (?:all )?inactive (.+)/i, sql: "SELECT * FROM $1 WHERE status = 'inactive'" },
    { regex: /active (.+)/i, sql: "SELECT * FROM $1 WHERE status = 'active'" },
    
    // Date-based patterns
    { regex: /(.+) from last month/i, sql: "SELECT * FROM $1 WHERE created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')" },
    { regex: /(.+) from this month/i, sql: "SELECT * FROM $1 WHERE created_at >= date_trunc('month', CURRENT_DATE)" },
    { regex: /(.+) from today/i, sql: "SELECT * FROM $1 WHERE created_at >= CURRENT_DATE" },
    { regex: /(.+) from yesterday/i, sql: "SELECT * FROM $1 WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' AND created_at < CURRENT_DATE" },
    
    // Comparison patterns
    { regex: /(.+) (?:greater than|over|above|>) (\d+)/i, sql: 'SELECT * FROM $1 WHERE amount > $2' },
    { regex: /(.+) (?:less than|under|below|<) (\d+)/i, sql: 'SELECT * FROM $1 WHERE amount < $2' },
    
    // Count patterns
    { regex: /count (.+) by (.+)/i, sql: 'SELECT $2, COUNT(*) FROM $1 GROUP BY $2' },
    
    // Basic patterns (existing)
    ...sqlPatterns
  ];
  
  // First try table-specific patterns
  if (tableName) {
    const tableSpecificPrompt = lowerPrompt.replace(new RegExp(tableName, 'gi'), '').trim();
    
    for (const pattern of enhancedPatterns) {
      const match = tableSpecificPrompt.match(pattern.regex);
      if (match) {
        let sql = pattern.sql;
        // Replace $1 with actual table name
        sql = sql.replace(/\$1/g, tableName);
        // Replace other placeholders
        for (let i = 2; i <= match.length; i++) {
          sql = sql.replace(`$${i}`, match[i-1]);
        }
        return { success: true, sql, method: 'pattern' };
      }
    }
  }
  
  // Then try general patterns
  for (const pattern of enhancedPatterns) {
    const match = lowerPrompt.match(pattern.regex);
    if (match) {
      let sql = pattern.sql;
      // Replace placeholders
      for (let i = 1; i < match.length; i++) {
        sql = sql.replace(`$${i}`, match[i]);
      }
      // Replace table references with current table
      sql = sql.replace(/\$1/g, tableName);
      return { success: true, sql, method: 'pattern' };
    }
  }
  
  // Smart WHERE clause generation for simple queries
  if (lowerPrompt.includes('where') || lowerPrompt.includes('=')) {
    const whereMatch = lowerPrompt.match(/where\s+(.+?)\s*=\s*(.+)/i);
    if (whereMatch) {
      const column = whereMatch[1].trim();
      const value = whereMatch[2].trim().replace(/["']/g, '');
      return { 
        success: true, 
        sql: `SELECT * FROM ${tableName} WHERE ${column} = '${value}'`, 
        method: 'pattern' 
      };
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