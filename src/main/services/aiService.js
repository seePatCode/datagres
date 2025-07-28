// AI Service for natural language to SQL conversion using pluggable providers

const settingsStore = require('./settingsStore');
const claudeProvider = require('./claudeProvider');
const ollamaProvider = require('./ollamaProvider');

const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG_OLLAMA;

// Development logging helper
function devLog(message, data = null) {
  if (isDev) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [AI Service] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

// Map of available providers
const providers = {
  'claude-code': claudeProvider,
  'ollama': ollamaProvider
};

async function generateSQL(prompt, tableInfo) {
  devLog('=== Starting new SQL generation request ===');
  
  // Get AI settings
  const aiSettings = await settingsStore.getAISettings();
  const providerName = aiSettings.provider || 'ollama';
  devLog('Using AI provider:', { provider: providerName });
  
  const provider = providers[providerName];
  if (!provider) {
    devLog(`Provider ${providerName} not found, falling back to Ollama`);
    return ollamaProvider.generateSQL(prompt, tableInfo);
  }
  
  try {
    const result = await provider.generateSQL(prompt, tableInfo);
    devLog('=== SQL generation request complete ===\n');
    return result;
  } catch (error) {
    console.log('First attempt failed, retrying once:', error.message);
    devLog('First attempt failed, will retry', { error: error.message });
    
    // Only retry for Ollama
    if (providerName === 'ollama') {
      try {
        // Wait a brief moment before retry
        devLog('Waiting 500ms before retry...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        devLog('Starting retry attempt');
        const result = await provider.generateSQL(prompt, tableInfo);
        console.log('Retry successful');
        devLog('Retry succeeded');
        return result;
      } catch (retryError) {
        console.error('Retry also failed:', retryError.message);
        devLog('Retry failed', { error: retryError.message });
        
        return {
          success: false,
          error: retryError.message
        };
      }
    } else {
      devLog('=== SQL generation request complete ===\n');
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = {
  generateSQL
};