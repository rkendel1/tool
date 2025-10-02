# AI Code Completion - Quick Reference

## Installation (One-Time Setup)

```bash
cd extensions/ai-completion
npm install
npm run build
ln -s "$(pwd)" ~/.local/share/code-server/extensions/ai-completion
```

## Start Dummy Backend (For Testing)

```bash
cd extensions/ai-completion
node dummy-backend.js
# Server runs on http://localhost:8080
```

## Basic Configuration

Add to VS Code `settings.json`:

```json
{
  "aiCompletion.enabled": true,
  "aiCompletion.backendUrl": "http://localhost:8080/api/completions"
}
```

## Commands (Ctrl+Shift+P)

- `AI Completion: Enable`
- `AI Completion: Disable`
- `AI Completion: Test Backend Connection`

## Status Bar

- `$(lightbulb) AI Completion` - Active
- `$(lightbulb-off) AI Completion` - Disabled

## Quick Test

```bash
# Start backend
node dummy-backend.js &

# Test API
curl -X POST http://localhost:8080/api/completions \
  -H "Content-Type: application/json" \
  -d '{"content":"const x = ","cursorPosition":{"line":0,"character":10},"fileName":"test.js","language":"javascript"}'
```

## Configuration Presets

### Dummy Backend (Testing)
```json
{"aiCompletion.backendUrl": "http://localhost:8080/api/completions"}
```

### Local Dyad
```json
{
  "aiCompletion.backendUrl": "http://localhost:3000/api/completions",
  "aiCompletion.apiKey": "your-key"
}
```

### Dyad Cloud
```json
{
  "aiCompletion.backendUrl": "https://api.dyad.example.com/v1/completions",
  "aiCompletion.apiKey": "your-key",
  "aiCompletion.dyadSessionId": "session-id",
  "aiCompletion.dyadUserId": "user-id"
}
```

## Troubleshooting

### No completions?
1. Check status bar shows lightbulb icon
2. Run "Test Backend Connection" command
3. Verify backend URL in settings

### Backend errors?
1. Check backend is running: `curl http://localhost:8080/api/completions`
2. Check API key is correct
3. Check firewall settings

### Build errors?
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## File Locations

- Extension: `extensions/ai-completion/`
- VS Code Settings: `~/.local/share/code-server/User/settings.json`
- Installed Extensions: `~/.local/share/code-server/extensions/`

## API Format

**Request:**
```json
{
  "content": "document text",
  "cursorPosition": {"line": 0, "character": 0},
  "fileName": "file.js",
  "language": "javascript"
}
```

**Response:**
```json
{
  "suggestions": [
    {"text": "suggestion", "description": "desc"}
  ]
}
```

## Development

```bash
# Watch mode (auto-rebuild)
npm run watch

# Run integration test
bash test-integration.sh
```

## Full Documentation

- [README.md](README.md) - Complete features and usage
- [INSTALLATION.md](INSTALLATION.md) - Detailed installation
- [CONFIGURATION_EXAMPLES.md](CONFIGURATION_EXAMPLES.md) - More configs
- [/docs/ai-completion.md](../../docs/ai-completion.md) - User guide
