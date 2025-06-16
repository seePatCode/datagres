# AI-Powered SQL Generation in Datagres

## Overview
Datagres now includes AI-powered natural language to SQL conversion, allowing users to type queries in plain English and have them automatically converted to SQL WHERE clauses.

## How It Works

### Zero Installation
- The AI feature requires no additional installation from users
- On first use, it automatically downloads a small AI model (~60MB)
- After the initial download, it works completely offline
- Uses Transformers.js with the Flan-T5-small model

### Usage
1. Open any table in Datagres
2. Click the "AI" button (with sparkles icon) in the toolbar
3. Type a natural language query like:
   - "show all active users"
   - "count by status"
   - "find orders from last month"
   - "customers in California"
4. Click "Generate" or press Enter
5. The AI converts your query to a SQL WHERE clause
6. The table automatically filters based on the generated SQL

### Examples

**Natural Language** → **Generated SQL**
- "show active users" → `status = 'active'`
- "count orders by status" → `SELECT COUNT(*), status FROM orders GROUP BY status`
- "customers from California" → `state = 'California'`
- "orders over 100 dollars" → `amount > 100`
- "users created this month" → `created_at >= date_trunc('month', CURRENT_DATE)`

### Fallback Pattern Matching
If the AI model isn't available or fails, the system falls back to pattern matching for common queries:
- "show all [table]" → `SELECT * FROM [table]`
- "count [table]" → `SELECT COUNT(*) FROM [table]`
- "find [table] where [column] = [value]" → `SELECT * FROM [table] WHERE [column] = '[value]'`

### Technical Details
- **Model**: Xenova/flan-t5-small (quantized to ~60MB)
- **Framework**: Transformers.js (runs in JavaScript/WASM)
- **Performance**: First query takes ~2-3 seconds (model loading), subsequent queries are instant
- **Privacy**: All processing happens locally on the user's machine

### Implementation
The feature is implemented across several files:
- `src/main/services/aiService.js` - AI model loading and SQL generation
- `src/renderer/components/ui/ai-sql-input.tsx` - UI component for AI input
- `src/renderer/components/ui/table-toolbar.tsx` - Integration into table toolbar

### Future Improvements
- Support for more complex queries (JOINs, aggregations)
- Query history and suggestions
- Custom fine-tuning for PostgreSQL-specific syntax
- Support for other SQL dialects