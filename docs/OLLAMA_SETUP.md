# Setting up AI-Powered SQL Generation in Datagres

Datagres includes AI-powered SQL generation that lets you write queries in plain English. Press `CMD+K` in the SQL editor and type what you want, like "show me the 5 newest users" or "count orders by status".

## Prerequisites

You'll need to install Ollama and download the AI model that powers this feature.

## Installation Steps

### 1. Install Ollama

Choose one of these methods:

#### Option A: Using Homebrew (Recommended)
```bash
brew install ollama
```

#### Option B: Direct Download
Download the Ollama app from [https://ollama.com/download](https://ollama.com/download) and install it like any other macOS application.

### 2. Start Ollama

After installation, Ollama runs as a background service. If you installed via Homebrew, start it with:

```bash
brew services start ollama
```

For the direct download version, just launch the Ollama app from your Applications folder.

### 3. Download the AI Model

Pull the model that Datagres uses for SQL generation:

```bash
ollama pull qwen2.5-coder:latest
```

This downloads a 4.7GB model optimized for code generation. The download may take a few minutes depending on your internet connection.

### 4. Verify Installation

Check that everything is working:

```bash
# List installed models
ollama list

# You should see:
# NAME                    ID              SIZE      MODIFIED
# qwen2.5-coder:latest   dae161e27b0e    4.7 GB    ...
```

## Using AI SQL Generation

1. Open Datagres and connect to your database
2. Click "New Query" to open the SQL editor
3. Press `CMD+K` to open the AI prompt
4. Type your request in plain English, for example:
   - "show the 10 most recent activities"
   - "count users by status"
   - "find all orders from last month"
   - "users who signed up today"
5. Press Enter and the SQL will be inserted at your cursor position

## Troubleshooting

### "Ollama is not running" Error

If you see this error, make sure Ollama is running:

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If you get a connection error, start Ollama:
brew services start ollama
# or launch the Ollama app manually
```

### "Model not found" Error

This means the qwen2.5-coder model isn't installed. Pull it again:

```bash
ollama pull qwen2.5-coder:latest
```

### Performance Issues

The AI model runs entirely on your Mac. For best performance:
- Close other heavy applications
- The first query may be slower as the model loads into memory
- Subsequent queries will be much faster

### Uninstalling

To remove Ollama and free up disk space:

```bash
# If installed via Homebrew
brew services stop ollama
brew uninstall ollama

# Remove all models and data
rm -rf ~/.ollama
```

## Privacy & Security

- All AI processing happens locally on your Mac
- Your database queries and schema never leave your computer
- No internet connection required after downloading the model
- Your data remains completely private

## Alternative Models

While Datagres is configured to use `qwen2.5-coder`, you can experiment with other models by modifying the code. Some alternatives:

- `codellama:7b-instruct` - Specialized for code generation (3.8GB)
- `mistral:7b-instruct` - General purpose with good SQL understanding (4.1GB)
- `llama2:7b` - General purpose model (3.8GB)

Note: You'll need to modify `src/main/services/aiService.js` to use a different model.