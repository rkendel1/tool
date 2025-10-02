# AI Code Completion Extension

This guide explains how to use the AI Code Completion extension bundled with code-server.

## Overview

The AI Code Completion extension provides intelligent code suggestions powered by AI backends. It supports:

- **Local Dyad instances** for on-premise AI models
- **Remote Dyad cloud** for hosted AI services
- **Custom AI services** with REST API compatibility
- **Dummy backend** for testing and development

## Quick Start

### 1. Install the Extension

The extension is located in `extensions/ai-completion/` directory. To install:

```bash
# Navigate to extension directory
cd extensions/ai-completion

# Install dependencies
npm install

# Build the extension
npm run build

# Install in code-server (choose one method):

# Method A: Symlink (for development)
ln -s "$(pwd)" ~/.local/share/code-server/extensions/ai-completion

# Method B: Copy to extensions directory
cp -r . ~/.local/share/code-server/extensions/ai-completion
```

### 2. Start a Test Backend (Optional)

For quick testing, use the included dummy backend:

```bash
cd extensions/ai-completion
node dummy-backend.js
```

This starts a mock API server on `http://localhost:8080`.

### 3. Configure Settings

Open code-server settings (`Ctrl+,`) and search for "AI Completion", or edit `settings.json`:

```json
{
  "aiCompletion.enabled": true,
  "aiCompletion.backendUrl": "http://localhost:8080/api/completions",
  "aiCompletion.apiKey": ""
}
```

### 4. Use Completions

1. Open any file
2. Start typing
3. AI suggestions will appear automatically
4. Press `Tab` or `Enter` to accept

## Configuration

### Settings

All settings are under the `aiCompletion` namespace:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable extension |
| `backendUrl` | string | `http://localhost:8080/api/completions` | Backend API endpoint |
| `apiKey` | string | `""` | API authentication key |
| `requestTimeout` | number | `5000` | Request timeout (ms) |
| `maxSuggestions` | number | `5` | Max suggestions to show |
| `showInlinePrompt` | boolean | `true` | Show inline prompt |
| `dyadSessionId` | string | `""` | Dyad session ID (future use) |
| `dyadUserId` | string | `""` | Dyad user ID (future use) |

### Backend Configuration Examples

#### Local Development (Dummy Backend)

```json
{
  "aiCompletion.backendUrl": "http://localhost:8080/api/completions"
}
```

#### Local Dyad Instance

```json
{
  "aiCompletion.backendUrl": "http://localhost:3000/api/completions",
  "aiCompletion.apiKey": "your-local-key"
}
```

#### Remote Dyad Cloud

```json
{
  "aiCompletion.backendUrl": "https://api.dyad.example.com/v1/completions",
  "aiCompletion.apiKey": "your-dyad-api-key",
  "aiCompletion.dyadSessionId": "session-id",
  "aiCompletion.dyadUserId": "user-id"
}
```

#### Custom AI Service

```json
{
  "aiCompletion.backendUrl": "https://your-ai.com/completions",
  "aiCompletion.apiKey": "your-api-key"
}
```

## Commands

Access via Command Palette (`Ctrl+Shift+P`):

- **AI Completion: Enable** - Enable the extension
- **AI Completion: Disable** - Disable the extension
- **AI Completion: Test Backend Connection** - Test backend connectivity

## Backend API Specification

### Request Format

```json
POST /api/completions
Content-Type: application/json

{
  "content": "string - full document content",
  "cursorPosition": {
    "line": 0,
    "character": 0
  },
  "fileName": "string",
  "language": "string",
  "sessionId": "string (optional)",
  "userId": "string (optional)"
}
```

### Response Format

```json
{
  "suggestions": [
    {
      "text": "suggestion text",
      "insertText": "text to insert (optional)",
      "description": "description (optional)"
    }
  ]
}
```

## Troubleshooting

### No Completions

1. Check status bar shows "$(lightbulb) AI Completion"
2. Run "AI Completion: Test Backend Connection"
3. Verify backend is running and accessible
4. Check console for errors (Developer > Toggle Developer Tools)

### Connection Errors

- Verify backend URL is correct
- Ensure backend service is running
- Check firewall/network settings
- Verify API key if required

### Build Issues

```bash
cd extensions/ai-completion
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Development

### File Structure

```
extensions/ai-completion/
├── package.json           # Extension manifest
├── tsconfig.json          # TypeScript config
├── extension.ts           # Source code
├── extension.js           # Compiled output
├── dummy-backend.js       # Test backend
├── README.md              # Full documentation
├── INSTALLATION.md        # Install guide
└── CONFIGURATION_EXAMPLES.md
```

### Building

```bash
# Build once
npm run build

# Watch mode (auto-rebuild)
npm run watch
```

### Testing

```bash
# Start dummy backend
node dummy-backend.js

# In another terminal, test with curl
curl -X POST http://localhost:8080/api/completions \
  -H "Content-Type: application/json" \
  -d '{"content":"test","cursorPosition":{"line":0,"character":4},"fileName":"test.js","language":"javascript"}'
```

## Integration Features

### Dyad Integration Hooks

The extension includes hooks for Dyad collaborative features:

- **Session ID**: Tracks collaborative editing sessions
- **User ID**: Identifies users for team-based completions
- Both are sent in API requests when configured

### Future Enhancements

- Real-time collaborative suggestions
- Team-based model fine-tuning
- Session-aware context
- Multi-user completion sharing

## Security Considerations

1. **API Keys**: Store securely, never commit to git
2. **HTTPS**: Use HTTPS for production backends
3. **Authentication**: Enable on production backends
4. **Rate Limiting**: Implement on backend
5. **Input Validation**: Validate all inputs on backend

## Resources

- Extension README: `extensions/ai-completion/README.md`
- Installation Guide: `extensions/ai-completion/INSTALLATION.md`
- Config Examples: `extensions/ai-completion/CONFIGURATION_EXAMPLES.md`
- [VS Code Extension API](https://code.visualstudio.com/api)

## Support

For issues or questions:

1. Check troubleshooting section
2. Review documentation in `extensions/ai-completion/`
3. Test with dummy backend
4. Check backend logs
5. File an issue in the repository

## License

MIT - Same as code-server
