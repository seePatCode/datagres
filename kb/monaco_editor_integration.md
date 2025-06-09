# Monaco Editor Integration Plan for Datagres

## Overview

This document outlines the research and implementation plan for integrating Monaco Editor into Datagres to provide a rich SQL editing experience with schema-aware autocomplete in the search bar.

## What is Monaco Editor?

Monaco Editor is the code editor that powers VS Code, extracted as a standalone library for browser-based applications. It provides:
- Syntax highlighting
- IntelliSense/autocomplete
- Multi-cursor support
- Find/Replace with regex
- Code folding
- Themes (including VS Code themes)
- Extensive language support

## Why Monaco Editor for Datagres?

Currently, Datagres uses a simple input field for WHERE clauses. Monaco Editor would provide:

1. **SQL Syntax Highlighting**: Keywords, functions, strings, and numbers in different colors
2. **Schema-Aware Autocomplete**: Suggest table columns, data types, and SQL keywords based on context
3. **Error Detection**: Highlight SQL syntax errors before execution
4. **Multi-line Support**: Write complex WHERE clauses with proper formatting
5. **Familiar Experience**: Same editor as VS Code, which many developers already know

## Implementation Options

### Option 1: Basic Integration with @monaco-editor/react (Recommended for MVP)

**Pros:**
- Easy one-line integration
- No webpack configuration needed
- Works with Electron and Vite out of the box
- Maintained by Monaco team

**Cons:**
- Basic SQL support only (keywords, not schema-aware)
- Need custom work for schema integration

**Implementation:**
```bash
npm install @monaco-editor/react
```

```typescript
import Editor from '@monaco-editor/react';

<Editor
  height="40px"
  defaultLanguage="sql"
  defaultValue=""
  onChange={handleWhereClauseChange}
  options={{
    minimap: { enabled: false },
    lineNumbers: 'off',
    glyphMargin: false,
    folding: false,
    lineDecorationsWidth: 0,
    lineNumbersMinChars: 0,
    renderLineHighlight: 'none',
    scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    wordWrap: 'on',
    snippetSuggestions: 'none'
  }}
/>
```

### Option 2: Advanced Integration with monaco-sql-languages

**Pros:**
- Dedicated SQL language support
- Multiple SQL dialect support (PostgreSQL, MySQL, etc.)
- Schema-aware completion API
- Better SQL parsing

**Cons:**
- More complex setup
- May have version compatibility issues
- Additional bundle size

**Implementation:**
```bash
npm install monaco-sql-languages
```

## Schema-Aware Autocomplete Implementation

### Step 1: Extract Table Schema

```typescript
interface TableSchema {
  tableName: string;
  columns: {
    name: string;
    dataType: string;
    nullable: boolean;
  }[];
}

// Already available from existing table data fetch
const schema = await window.electronAPI.getTableSchema(connectionString, tableName);
```

### Step 2: Create Custom Completion Provider

```typescript
monaco.languages.registerCompletionItemProvider('sql', {
  provideCompletionItems: (model, position) => {
    const textUntilPosition = model.getValueInRange({
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column
    });

    // Context-aware suggestions
    const suggestions = [];

    // Add column suggestions
    if (shouldSuggestColumns(textUntilPosition)) {
      schema.columns.forEach(column => {
        suggestions.push({
          label: column.name,
          kind: monaco.languages.CompletionItemKind.Field,
          detail: column.dataType,
          insertText: column.name,
          documentation: `${column.dataType} ${column.nullable ? 'NULL' : 'NOT NULL'}`
        });
      });
    }

    // Add SQL keywords
    const keywords = ['AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN', 'IS NULL', 'IS NOT NULL'];
    keywords.forEach(keyword => {
      suggestions.push({
        label: keyword,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: keyword
      });
    });

    // Add operators
    const operators = ['=', '!=', '<>', '>', '<', '>=', '<='];
    operators.forEach(op => {
      suggestions.push({
        label: op,
        kind: monaco.languages.CompletionItemKind.Operator,
        insertText: op
      });
    });

    return { suggestions };
  }
});
```

### Step 3: Integrate with TableView Component

```typescript
// In TableView component
const [whereClause, setWhereClause] = useState('');
const [isEditorReady, setIsEditorReady] = useState(false);
const editorRef = useRef(null);

const handleEditorDidMount = (editor, monaco) => {
  editorRef.current = editor;
  
  // Register custom theme
  monaco.editor.defineTheme('datagres', {
    base: 'vs-dark',
    inherit: true,
    colors: {
      'editor.background': '#0a0a0a',
      'editor.lineHighlightBackground': '#1a1a1a'
    }
  });
  
  // Set up schema-aware completions
  setupCompletions(monaco, currentTableSchema);
  setIsEditorReady(true);
};

return (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
    <div className="pl-9 border rounded-md overflow-hidden">
      <Editor
        height="40px"
        defaultLanguage="sql"
        value={whereClause}
        onChange={setWhereClause}
        onMount={handleEditorDidMount}
        theme="datagres"
        options={{
          // Single-line editor options
          minimap: { enabled: false },
          lineNumbers: 'off',
          glyphMargin: false,
          folding: false,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 0,
          renderLineHighlight: 'none',
          scrollbar: { 
            vertical: 'hidden', 
            horizontal: 'auto',
            horizontalScrollbarSize: 4
          },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          wordWrap: 'off',
          snippetSuggestions: 'inline',
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          tabCompletion: 'on',
          // Match Datagres styling
          fontSize: 14,
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
          padding: { top: 8, bottom: 8 }
        }}
      />
    </div>
  </div>
);
```

## Implementation Steps

### Phase 1: Basic Monaco Integration (2-3 hours)
1. Install @monaco-editor/react
2. Replace current Input with Monaco Editor
3. Configure for single-line WHERE clause editing
4. Maintain existing Enter key behavior
5. Style to match current UI

### Phase 2: Schema Integration (3-4 hours)
1. Add IPC handler to fetch table schema with column types
2. Create type definitions for schema
3. Implement basic completion provider with column names
4. Add SQL keywords and operators

### Phase 3: Advanced Features (4-6 hours)
1. Context-aware suggestions (e.g., suggest operators after column names)
2. Value suggestions based on column types (e.g., 'true'/'false' for boolean)
3. Syntax validation before query execution
4. Multi-line support with Shift+Enter
5. Query history with up/down arrows

### Phase 4: Performance Optimization (2-3 hours)
1. Lazy load Monaco Editor (it's ~2MB)
2. Cache schemas per table
3. Debounce completion requests
4. Bundle size optimization

## Technical Considerations

### Electron/Vite Compatibility
- Monaco Editor works well with Vite out of the box
- No special webpack configuration needed with @monaco-editor/react
- Monaco workers load automatically from CDN (can be self-hosted if needed)

### Bundle Size Impact
- Monaco Editor adds ~2MB to bundle size
- Can use dynamic imports to load only when needed
- Consider using Monaco Editor loader for code splitting

### Styling Integration
- Monaco Editor is highly customizable via themes
- Can match Datagres dark theme exactly
- CSS variables can be used for consistent theming

### TypeScript Support
- Full TypeScript definitions available
- Can generate types from PostgreSQL schema
- Type-safe completion items

## Alternative: CodeMirror 6

If Monaco Editor proves too heavy, CodeMirror 6 is a lighter alternative:
- Smaller bundle size (~300KB vs 2MB)
- SQL language support available
- Less feature-rich but sufficient for WHERE clauses
- Better mobile support

## Conclusion

Monaco Editor integration would significantly enhance the SQL editing experience in Datagres. The recommended approach is to start with basic integration using @monaco-editor/react, then progressively add schema-aware features. This provides immediate value while allowing for incremental improvements.

The main trade-off is bundle size vs functionality. For a desktop Electron app focused on developer productivity, the 2MB addition is justified by the superior editing experience Monaco provides.