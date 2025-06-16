# Chrome Built-in AI Implementation Plan for Datagres

## Overview
Add natural language to SQL conversion using Chrome's built-in Prompt API (available in Chrome 127+).

## Implementation Plan

### 1. Feature Detection

```javascript
// src/renderer/utils/ai.js
export const hasChomeAI = () => {
  return 'ai' in window && 'languageModel' in window.ai;
};

export const canUseAI = async () => {
  if (!hasChomeAI()) return false;
  
  try {
    const capabilities = await window.ai.languageModel.capabilities();
    return capabilities.available === 'readily';
  } catch {
    return false;
  }
};
```

### 2. AI SQL Generator

```javascript
// src/renderer/utils/sqlGenerator.js
export class SQLGenerator {
  constructor() {
    this.session = null;
  }

  async initialize() {
    if (!await canUseAI()) {
      throw new Error('Chrome AI not available');
    }

    this.session = await window.ai.languageModel.create({
      systemPrompt: `You are a PostgreSQL expert. Convert natural language queries to SQL.
Rules:
- Return ONLY valid PostgreSQL SQL
- Use standard SQL syntax
- Include semicolon at the end
- For ambiguous requests, make reasonable assumptions
- If tables/columns are mentioned, use them exactly as written`
    });
  }

  async generateSQL(naturalLanguage, schema = '') {
    if (!this.session) {
      await this.initialize();
    }

    const prompt = schema 
      ? `Given this schema:\n${schema}\n\nConvert to SQL: ${naturalLanguage}`
      : `Convert to SQL: ${naturalLanguage}`;

    const response = await this.session.prompt(prompt);
    return response.trim();
  }

  destroy() {
    if (this.session) {
      this.session.destroy();
      this.session = null;
    }
  }
}
```

### 3. UI Integration

```jsx
// src/renderer/components/QueryEditor.jsx
import { useState, useEffect } from 'react';
import { SQLGenerator, canUseAI } from '@/utils/sqlGenerator';

export function QueryEditor({ onExecute, currentSchema }) {
  const [query, setQuery] = useState('');
  const [aiAvailable, setAiAvailable] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const sqlGenerator = useRef(null);

  useEffect(() => {
    canUseAI().then(setAiAvailable);
    
    return () => {
      sqlGenerator.current?.destroy();
    };
  }, []);

  const handleGenerateSQL = async () => {
    if (!aiInput.trim()) return;
    
    setGenerating(true);
    try {
      if (!sqlGenerator.current) {
        sqlGenerator.current = new SQLGenerator();
      }
      
      const sql = await sqlGenerator.current.generateSQL(
        aiInput, 
        currentSchema
      );
      setQuery(sql);
      setAiInput('');
    } catch (error) {
      console.error('SQL generation failed:', error);
      // Fallback to manual input
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {aiAvailable && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Describe your query in plain English..."
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerateSQL()}
            className="flex-1 px-3 py-2 border rounded"
            disabled={generating}
          />
          <button
            onClick={handleGenerateSQL}
            disabled={generating || !aiInput.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate SQL'}
          </button>
        </div>
      )}
      
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter SQL query..."
        className="w-full h-32 p-3 font-mono text-sm border rounded"
      />
      
      <button
        onClick={() => onExecute(query)}
        disabled={!query.trim()}
        className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
      >
        Execute Query
      </button>
    </div>
  );
}
```

### 4. Schema Context (Optional Enhancement)

```javascript
// Provide table/column context for better SQL generation
const getSchemaContext = (tables) => {
  return tables.map(table => 
    `Table: ${table.name}\nColumns: ${table.columns.join(', ')}`
  ).join('\n\n');
};

// Usage in component
const schemaContext = getSchemaContext(availableTables);
const sql = await sqlGenerator.generateSQL(userInput, schemaContext);
```

### 5. Fallback Strategy

For non-Chrome browsers or when AI is unavailable:
- Hide the AI input field
- Show only the traditional SQL textarea
- Consider adding a tooltip explaining Chrome AI requirement

```jsx
{!aiAvailable && (
  <p className="text-sm text-gray-500">
    💡 Use Chrome 127+ to enable AI-powered SQL generation
  </p>
)}
```

## Testing

1. **Chrome with AI**: Test in Chrome 127+ with `chrome://flags/#prompt-api-for-gemini-nano` enabled
2. **Chrome without AI**: Test with flag disabled
3. **Other browsers**: Test in Firefox/Safari to ensure graceful degradation

## Example Queries

Natural language → SQL examples:
- "show all users" → `SELECT * FROM users;`
- "count orders by status" → `SELECT status, COUNT(*) FROM orders GROUP BY status;`
- "top 10 customers by total spent" → `SELECT customer_id, SUM(amount) as total FROM orders GROUP BY customer_id ORDER BY total DESC LIMIT 10;`

## Security Notes

- Chrome's built-in AI runs locally - no data sent to servers
- SQL injection prevention still needed before execution
- Consider adding query validation before running generated SQL

## Future Enhancements

1. **Query explanation**: Use AI to explain complex SQL
2. **Query optimization**: Suggest query improvements
3. **Error fixing**: Help fix SQL syntax errors
4. **Multi-turn conversations**: Remember context for follow-up queries