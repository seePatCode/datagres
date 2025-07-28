// Claude Code CLI Provider for AI SQL generation

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs');
const os = require('os');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG_OLLAMA;

// Development logging helper
function devLog(message, data = null, level = 'info') {
  if (isDev) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [Claude] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

async function findClaudeCLI() {
  const userShell = process.env.SHELL || '/bin/bash';
  const currentPath = process.env.PATH || 'PATH not available';
  let npmPrefix = '';
  
  devLog('Environment info:', { 
    shell: userShell,
    currentPath: currentPath.split(':').join('\n  '),
    platform: process.platform,
    isPackaged: process.mas || process.windowsStore || !process.defaultApp
  });
  
  // First, let's log what PATH the shell sees
  try {
    const pathResult = await execAsync(`${userShell} -l -c "echo $PATH"`, {
      timeout: 5000,
      encoding: 'utf8'
    });
    const shellPath = pathResult.stdout.trim();
    
    // Always log PATH info for Claude CLI debugging
    console.log('[Claude CLI PATH Discovery]', {
      currentProcessPATH: process.env.PATH?.split(':').length + ' directories',
      shellLoginPATH: shellPath.split(':').length + ' directories',
      shell: userShell
    });
    
    devLog('Shell login PATH:', { 
      shell: userShell,
      paths: shellPath.split(':').join('\n  ')
    });
    
    // Also check common npm global locations
    const npmGlobalResult = await execAsync(`${userShell} -l -c "npm config get prefix 2>/dev/null || echo 'npm not found'"`, {
      timeout: 5000,
      encoding: 'utf8'
    });
    npmPrefix = npmGlobalResult.stdout.trim();
    devLog('npm global prefix:', { prefix: npmPrefix });
    
    // Always log npm prefix for debugging
    if (npmPrefix && npmPrefix !== 'npm not found') {
      console.log('[Claude CLI npm prefix]', npmPrefix);
    }
  } catch (pathError) {
    console.error('[Claude CLI PATH Discovery Error]', pathError.message);
    devLog('Failed to get shell PATH', { error: pathError.message });
  }
  
  // Use the user's login shell to find claude with their full PATH
  let claudePath = '';
  
  try {
    // For zsh, explicitly source .zshrc to get aliases
    let shellCommand;
    if (userShell.includes('zsh')) {
      // Simplified approach - just try which and command -v
      // We'll rely on the direct path checking for aliases
      shellCommand = `${userShell} -l -c "which claude 2>/dev/null || command -v claude 2>/dev/null || echo 'NOT_FOUND'"`;
    } else {
      shellCommand = `${userShell} -l -c "which claude || command -v claude || type -p claude || echo 'NOT_FOUND'"`;
    }
    
    devLog('Shell command:', { command: shellCommand });
    
    const whichResult = await execAsync(shellCommand, {
      timeout: 5000,
      encoding: 'utf8'
    });
    claudePath = whichResult.stdout.trim();
    
    // Clean up alias output if it wasn't parsed by sed
    if (claudePath.includes('aliased to')) {
      // Extract path from "claude: aliased to /path/to/claude" format
      const match = claudePath.match(/aliased to (.+)$/);
      if (match && match[1]) {
        claudePath = match[1].trim();
      }
    }
    
    // Clean up any remaining quotes
    if (claudePath.startsWith('"') || claudePath.startsWith("'")) {
      claudePath = claudePath.replace(/^["']|["']$/g, '');
    }
    
    // If "claude not found" or "NOT_FOUND" in output, clear claudePath
    if (claudePath.includes('not found') || claudePath === 'NOT_FOUND' || claudePath === '') {
      claudePath = '';
    }
    
    devLog('Shell lookup result:', { path: claudePath, shell: userShell });
    
    // If not found via shell, try common locations directly
    if (!claudePath) {
      console.log('[Claude CLI] Shell lookup failed, checking common paths...');
      
      const commonPaths = [
        // Claude official installation path
        `${os.homedir()}/.claude/local/claude`,
        // Check current working directory's node_modules first
        `${process.cwd()}/node_modules/.bin/claude`,
        `${process.cwd()}/node_modules/.bin/claude-code`,
        // Then user's home node_modules
        `${os.homedir()}/node_modules/.bin/claude`,
        `${os.homedir()}/node_modules/.bin/claude-code`,
        '/usr/local/bin/claude',
        '/usr/local/bin/claude-code',
        '/opt/homebrew/bin/claude',
        '/opt/homebrew/bin/claude-code',
        `${os.homedir()}/.npm/bin/claude`,
        `${os.homedir()}/.npm/bin/claude-code`,
        `${os.homedir()}/.npm-global/bin/claude`,
        `${os.homedir()}/.npm-global/bin/claude-code`,
        `${os.homedir()}/.nvm/versions/node/*/bin/claude`, // NVM paths
        `${os.homedir()}/.nvm/versions/node/*/bin/claude-code`,
        '/usr/bin/claude',
        '/usr/bin/claude-code',
        // Add npm prefix path if we found it
        ...(npmPrefix && npmPrefix !== 'npm not found' ? [
          `${npmPrefix}/bin/claude`,
          `${npmPrefix}/bin/claude-code`
        ] : [])
      ];
      
      // Expand glob patterns
      const expandedPaths = [];
      for (const checkPath of commonPaths) {
        if (checkPath.includes('*')) {
          // Handle NVM-style paths
          try {
            const baseDir = path.dirname(checkPath.split('*')[0]);
            if (fs.existsSync(baseDir)) {
              const dirs = fs.readdirSync(baseDir);
              for (const dir of dirs) {
                expandedPaths.push(checkPath.replace('*', dir));
              }
            }
          } catch (e) {
            // Ignore glob expansion errors
          }
        } else {
          expandedPaths.push(checkPath);
        }
      }
      
      for (const checkPath of expandedPaths) {
        try {
          // Use lstatSync to check the symlink itself, not what it points to
          const stats = fs.lstatSync(checkPath);
          // Check if it's a file or symlink (symlinks to executables are common in node_modules/.bin)
          if (stats.isFile() || stats.isSymbolicLink()) {
            // For symlinks, verify the target exists
            if (stats.isSymbolicLink()) {
              try {
                fs.accessSync(checkPath, fs.constants.F_OK);
              } catch (e) {
                continue; // Symlink target doesn't exist
              }
            }
            console.log(`[Claude CLI] Found at: ${checkPath}`);
            claudePath = checkPath;
            break;
          }
        } catch (e) {
          // Path doesn't exist or not accessible
        }
      }
    }
    
    if (claudePath) {
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
      
      return claudePath;
    } else {
      throw new Error('Claude CLI not found in any common locations');
    }
    
  } catch (error) {
    // Always log Claude CLI errors, even in production, for debugging
    console.error('[Claude CLI Check Failed]', { 
      error: error.message,
      code: error.code,
      stderr: error.stderr,
      stdout: error.stdout,
      currentPath: process.env.PATH,
      isPackaged: process.mas || process.windowsStore || !process.defaultApp
    });
    
    devLog('Claude CLI check failed', { 
      error: error.message,
      code: error.code,
      stderr: error.stderr,
      stdout: error.stdout
    });
    
    // Get diagnostic information for the error message
    const currentPath = process.env.PATH || 'not available';
    const pathDirs = currentPath.split(':').filter(p => p.includes('npm') || p.includes('node') || p.includes('local'));
    
    let diagnosticInfo = `\n\nDiagnostic info:\n`;
    diagnosticInfo += `- Current shell: ${userShell}\n`;
    diagnosticInfo += `- Current PATH includes: ${pathDirs.length > 0 ? pathDirs.join(', ') : 'no npm/node paths found'}\n`;
    diagnosticInfo += `- Platform: ${process.platform}\n`;
    diagnosticInfo += `- Running from: ${process.mas || process.windowsStore || !process.defaultApp ? 'packaged app' : 'development'}\n`;
    
    // Try to check common locations manually
    const commonPaths = [
      '/usr/local/bin/claude',
      '/opt/homebrew/bin/claude',
      `${os.homedir()}/.npm-global/bin/claude`,
      `${os.homedir()}/node_modules/.bin/claude`,
      '/usr/bin/claude'
    ];
    
    for (const checkPath of commonPaths) {
      try {
        if (fs.existsSync(checkPath)) {
          diagnosticInfo += `\nFound claude at ${checkPath} but couldn't access it via shell`;
          break;
        }
      } catch (e) {
        // Ignore
      }
    }
    
    throw new Error(`Claude Code CLI not found. Please install it via npm: npm install -g @anthropic-ai/claude-code, or download from https://claude.ai/code${diagnosticInfo}`);
  }
}

async function generateSQL(prompt, tableInfo) {
  devLog('Starting Claude Code CLI request');
  
  // First, check if user has configured a custom path
  const settingsStore = require('./settingsStore');
  const aiSettings = await settingsStore.getAISettings();
  
  let claudePath;
  
  if (aiSettings.claudeCodeConfig?.cliPath) {
    devLog('Using user-configured Claude CLI path:', { path: aiSettings.claudeCodeConfig.cliPath });
    
    // Verify the configured path exists and is executable
    try {
      const fs = require('fs');
      fs.accessSync(aiSettings.claudeCodeConfig.cliPath, fs.constants.F_OK | fs.constants.X_OK);
      claudePath = aiSettings.claudeCodeConfig.cliPath;
      devLog('User-configured path is valid');
    } catch (error) {
      devLog('User-configured path is invalid:', { error: error.message });
      throw new Error(`Claude CLI not found at configured path: ${aiSettings.claudeCodeConfig.cliPath}. Please check your settings.`);
    }
  } else {
    // Fall back to auto-discovery
    devLog('No user-configured path, attempting auto-discovery');
    claudePath = await findClaudeCLI();
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
    // Write prompt to a file and pass the filename to claude
    const tmpFile = path.join(os.tmpdir(), `claude-prompt-${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, fullPrompt, 'utf8');
    devLog('Created temp prompt file:', { tmpFile, length: fullPrompt.length });
    
    // Try different approaches based on what works
    let command;
    
    // Use printf to properly handle newlines and pass to claude
    // The -p flag might be for "prompt" mode
    const escapedPrompt = fullPrompt
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\$/g, '\\$')
      .replace(/`/g, '\\`')
      .replace(/%/g, '%%'); // Escape % for printf
    
    command = `printf "${escapedPrompt}" | "${claudePath}" -p`;
    
    devLog('Running command:', { command: command.substring(0, 200) + '...' });
    
    // Use login shell to ensure full environment is loaded
    const userShell = process.env.SHELL || '/bin/bash';
    const loginShellCommand = `${userShell} -l -c '${command}'`;
    
    const result = await execAsync(loginShellCommand, {
      maxBuffer: 1024 * 1024 * 10, // 10MB
      timeout: 60000, // 1 minute
      encoding: 'utf8',
      shell: false // We're already using a shell in the command
    });
    
    stdout = result.stdout;
    stderr = result.stderr;
    
    // Clean up temp file
    try {
      fs.unlinkSync(tmpFile);
    } catch (e) {
      // Ignore cleanup errors
    }
    
    devLog('Command completed', { 
      stdoutLength: stdout?.length || 0,
      stderrLength: stderr?.length || 0
    });
  } catch (execError) {
    devLog('Command failed', { 
      error: execError.message,
      code: execError.code,
      stdout: execError.stdout?.substring(0, 500),
      stderr: execError.stderr?.substring(0, 500)
    });
    throw execError;
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
}

module.exports = {
  generateSQL,
  name: 'claude-code'
};