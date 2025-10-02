# Installation Guide for AI Code Completion Extension

This guide provides step-by-step instructions for installing and using the AI Code Completion extension with code-server.

## Quick Start

### 1. Build the Extension

```bash
cd extensions/ai-completion
npm install
npm run build
```

### 2. Install in code-server

The extension can be installed in code-server using one of these methods:

#### Method A: Using Symlink (Development)

```bash
# From the repository root
ln -s "$(pwd)/extensions/ai-completion" ~/.local/share/code-server/extensions/ai-completion
```

#### Method B: Using code-server CLI

```bash
# From the repository root
code-server --install-extension extensions/ai-completion
```

#### Method C: Manual Installation

1. Copy the extension directory to your code-server extensions folder:

```bash
cp -r extensions/ai-completion ~/.local/share/code-server/extensions/
```

2. Restart code-server

### 3. Start a Test Backend (Optional)

For testing, you can use the included dummy backend:

```bash
cd extensions/ai-completion
node dummy-backend.js
```

This will start a mock API server on `http://localhost:8080`.

### 4. Configure the Extension

Open VS Code settings (File > Preferences > Settings or `Ctrl+,`) and search for "AI Completion".

Set the following:
- **Backend URL**: `http://localhost:8080/api/completions` (for dummy backend)
- **API Key**: Leave empty for dummy backend
- **Enabled**: Check to enable

Or edit your `settings.json`:

```json
{
  "aiCompletion.enabled": true,
  "aiCompletion.backendUrl": "http://localhost:8080/api/completions"
}
```

### 5. Test the Extension

1. Open any file in code-server
2. Start typing
3. You should see AI-powered completions appear
4. Press `Tab` or `Enter` to accept

## Verifying Installation

### Check if Extension is Loaded

1. Open Command Palette (`Ctrl+Shift+P`)
2. Type "AI Completion"
3. You should see commands like:
   - AI Completion: Enable
   - AI Completion: Disable
   - AI Completion: Test Backend Connection

### Check Status Bar

Look for the status bar item at the bottom right:
- "$(lightbulb) AI Completion" - Extension is active
- "$(lightbulb-off) AI Completion" - Extension is disabled

### Test Backend Connection

1. Open Command Palette (`Ctrl+Shift+P`)
2. Run: "AI Completion: Test Backend Connection"
3. You should see a success or error message

## Backend Setup

### Option 1: Dummy Backend (Development/Testing)

```bash
cd extensions/ai-completion
node dummy-backend.js
```

Configure in settings:
```json
{
  "aiCompletion.backendUrl": "http://localhost:8080/api/completions"
}
```

### Option 2: Local Dyad Instance

If you have a local Dyad instance running:

```json
{
  "aiCompletion.backendUrl": "http://localhost:3000/api/completions",
  "aiCompletion.apiKey": "your-local-api-key"
}
```

### Option 3: Dyad Cloud

For remote Dyad cloud service:

```json
{
  "aiCompletion.backendUrl": "https://api.dyad.example.com/v1/completions",
  "aiCompletion.apiKey": "your-dyad-cloud-api-key",
  "aiCompletion.dyadSessionId": "your-session-id",
  "aiCompletion.dyadUserId": "your-user-id"
}
```

### Option 4: Custom AI Service

For any custom AI completion API:

```json
{
  "aiCompletion.backendUrl": "https://your-ai-service.com/completions",
  "aiCompletion.apiKey": "your-api-key"
}
```

## Uninstallation

### Using code-server CLI

```bash
code-server --uninstall-extension code-server.ai-completion
```

### Manual Uninstallation

```bash
rm -rf ~/.local/share/code-server/extensions/ai-completion
```

## Troubleshooting

### Extension Not Loading

1. Check extension is installed:
   ```bash
   ls ~/.local/share/code-server/extensions/
   ```

2. Rebuild the extension:
   ```bash
   cd extensions/ai-completion
   npm run build
   ```

3. Restart code-server

### No Completions Appearing

1. Check status bar shows "$(lightbulb) AI Completion"
2. Run "AI Completion: Test Backend Connection"
3. Check backend is running and accessible
4. Verify settings are correct

### Connection Errors

1. Check backend URL is correct
2. Ensure backend service is running
3. Check firewall/network settings
4. Verify API key if required

### Build Errors

If you encounter build errors:

```bash
cd extensions/ai-completion
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Development Mode

For active development:

```bash
cd extensions/ai-completion
npm run watch
```

This will watch for changes and rebuild automatically.

## Production Deployment

### Using in Monorepo

The extension is designed to be committed with the code-server repository:

```
server/
├── extensions/
│   └── ai-completion/
│       ├── package.json
│       ├── extension.ts
│       ├── extension.js
│       └── README.md
├── src/
├── test/
└── package.json
```

### Environment Variables

For production, you can set defaults using environment variables:

```bash
export AI_COMPLETION_BACKEND_URL="https://api.production.example.com/completions"
export AI_COMPLETION_API_KEY="production-api-key"
```

Then configure code-server to use these.

### Security Considerations

1. **API Keys**: Store API keys securely, never commit them to git
2. **HTTPS**: Use HTTPS for production backends
3. **Authentication**: Enable authentication on production backends
4. **Rate Limiting**: Implement rate limiting on backend
5. **Input Validation**: Backend should validate all inputs

## Integration with CI/CD

Add to your build pipeline:

```bash
# Build extension
cd extensions/ai-completion
npm install
npm run build

# Verify build
ls -la extension.js

# Package for distribution (optional)
npm run package
```

## Support

For issues or questions:
1. Check this installation guide
2. Review the [README.md](README.md)
3. Check backend logs
4. File an issue in the repository

## Next Steps

- Read [README.md](README.md) for detailed feature documentation
- Review [CONFIGURATION_EXAMPLES.md](CONFIGURATION_EXAMPLES.md) for more configuration options
- Set up your preferred backend service
- Customize settings for your workflow
