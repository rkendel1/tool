# AI Code Completion Extension

A VS Code extension for code-server that provides AI-powered code completions with support for local Dyad instances, remote Dyad cloud, or custom AI services.

## Features

- **Universal Completion Provider**: Works with all file types
- **Configurable Backend**: Support for multiple AI backends including Dyad models and custom AI services
- **Real-time Suggestions**: Get code completions as you type
- **Error Handling**: Graceful handling of network errors and invalid responses
- **Status Bar Integration**: Visual indicator of extension status
- **Dyad Integration Hooks**: Built-in support for session ID and user ID for collaborative features

## Installation

### From Source

1. Navigate to the extension directory:
   ```bash
   cd extensions/ai-completion
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Install the extension in code-server:
   ```bash
   code-server --install-extension extensions/ai-completion
   ```

## Configuration

All settings can be configured in VS Code settings (File > Preferences > Settings, or `Ctrl+,`):

### Basic Settings

- **`aiCompletion.enabled`** (boolean, default: `true`)
  - Enable or disable the AI code completion extension

- **`aiCompletion.backendUrl`** (string, default: `http://localhost:8080/api/completions`)
  - The REST API endpoint for code completions
  - Examples:
    - Local Dyad: `http://localhost:8080/api/completions`
    - Remote Dyad Cloud: `https://dyad.example.com/api/completions`
    - Custom AI Service: `https://your-ai-service.com/completions`

- **`aiCompletion.apiKey`** (string, default: `""`)
  - API key for authenticating with the backend service
  - Leave empty if authentication is not required

- **`aiCompletion.requestTimeout`** (number, default: `5000`)
  - Request timeout in milliseconds

- **`aiCompletion.maxSuggestions`** (number, default: `5`)
  - Maximum number of suggestions to display

- **`aiCompletion.showInlinePrompt`** (boolean, default: `true`)
  - Show inline prompt for AI completions

### Dyad Integration Settings

These settings provide hooks for future Dyad integration features:

- **`aiCompletion.dyadSessionId`** (string, default: `""`)
  - Dyad session ID for collaborative editing features
  - Will be included in API requests when set

- **`aiCompletion.dyadUserId`** (string, default: `""`)
  - Dyad user ID for collaborative features
  - Will be included in API requests when set

### Example Configuration

Add the following to your VS Code `settings.json`:

```json
{
  "aiCompletion.enabled": true,
  "aiCompletion.backendUrl": "http://localhost:8080/api/completions",
  "aiCompletion.apiKey": "your-api-key-here",
  "aiCompletion.requestTimeout": 5000,
  "aiCompletion.maxSuggestions": 5,
  "aiCompletion.dyadSessionId": "",
  "aiCompletion.dyadUserId": ""
}
```

## Backend Configuration

### Using Dyad Backend (Recommended)

The extension includes full Dyad integration. See [DYAD_INTEGRATION.md](DYAD_INTEGRATION.md) for detailed setup instructions.

Quick start:
```bash
# Start the Dyad test server
node dyad-test-server.js

# Start the Dyad backend adapter
DYAD_URL=http://localhost:3000 node dyad-backend.js

# Configure VS Code to use http://localhost:8080/api/completions
```

### Using Dummy Backend (Development)

For testing purposes, you can use a simple mock server:

```javascript
// dummy-backend.js
const express = require('express');
const app = express();
app.use(express.json());

app.post('/api/completions', (req, res) => {
  res.json({
    suggestions: [
      { text: 'console.log("Hello, World!");', description: 'Log to console' },
      { text: 'function example() {}', description: 'Function declaration' }
    ]
  });
});

app.listen(8080, () => console.log('Dummy backend running on port 8080'));
```

Run with: `node dummy-backend.js`

### Using Dyad Local Instance

Configure for a local Dyad instance:

```json
{
  "aiCompletion.backendUrl": "http://localhost:8080/api/completions",
  "aiCompletion.apiKey": ""
}
```

### Using Dyad Cloud

Configure for remote Dyad cloud service:

```json
{
  "aiCompletion.backendUrl": "https://dyad.example.com/api/completions",
  "aiCompletion.apiKey": "your-dyad-api-key"
}
```

### Using Custom AI Service

Configure for any custom AI completion service:

```json
{
  "aiCompletion.backendUrl": "https://your-ai-service.com/completions",
  "aiCompletion.apiKey": "your-service-api-key"
}
```

## API Request Format

The extension sends POST requests to the configured backend URL with the following JSON structure:

```json
{
  "content": "string - full document content",
  "cursorPosition": {
    "line": 0,
    "character": 0
  },
  "fileName": "string - file name",
  "language": "string - language ID (e.g., 'javascript', 'python')",
  "sessionId": "string - optional Dyad session ID",
  "userId": "string - optional Dyad user ID"
}
```

## API Response Format

The backend should respond with JSON in the following format:

```json
{
  "suggestions": [
    {
      "text": "string - display text",
      "insertText": "string - optional, text to insert (defaults to text)",
      "description": "string - optional, description"
    }
  ]
}
```

## Commands

The extension provides the following commands (accessible via Command Palette `Ctrl+Shift+P`):

- **AI Completion: Enable** - Enable the AI code completion
- **AI Completion: Disable** - Disable the AI code completion
- **AI Completion: Test Backend Connection** - Test the connection to the configured backend

## Usage

1. Configure the backend URL and API key in settings
2. Start typing in any file
3. AI-powered completion suggestions will appear automatically
4. Press `Tab` or `Enter` to accept a suggestion
5. Press `Esc` to dismiss suggestions

## Troubleshooting

### No completions appearing

1. Check that the extension is enabled:
   - Look for "$(lightbulb) AI Completion" in the status bar
   - Run command "AI Completion: Enable" if needed

2. Test the backend connection:
   - Run command "AI Completion: Test Backend Connection"
   - Check the error message if connection fails

3. Verify configuration:
   - Ensure `aiCompletion.backendUrl` is set correctly
   - Verify API key if required

### Backend connection errors

- Check that the backend service is running and accessible
- Verify the URL is correct (include protocol: `http://` or `https://`)
- Check firewall settings if using a remote backend
- Verify API key is correct if authentication is required

### Timeout errors

- Increase `aiCompletion.requestTimeout` if the backend is slow
- Check network latency to the backend

## Development

### Building from Source

```bash
cd extensions/ai-completion
npm install
npm run build
```

### Running in Development Mode

```bash
npm run watch
```

This will watch for changes and automatically rebuild.

## Integration with Monorepo

This extension is designed to be versioned alongside code-server in a monorepo structure:

```
server/
├── extensions/
│   └── ai-completion/
│       ├── package.json
│       ├── extension.ts
│       ├── extension.js (built)
│       └── README.md
├── src/
├── test/
└── package.json
```

## Future Enhancements

The extension includes hooks for future Dyad integration features:

- Real-time collaborative suggestions
- Session-aware completions
- Multi-user context sharing
- Team-based model fine-tuning

## License

MIT

## Contributing

Contributions are welcome! Please ensure:

1. Code follows the existing style
2. All features are documented
3. Error handling is comprehensive
4. Changes are backwards compatible

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the backend API documentation
3. File an issue in the repository
