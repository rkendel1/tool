# Dyad Integration Guide

This guide explains how to use the Dyad backend with the AI Code Completion extension.

## Overview

The extension now includes full Dyad integration through two new components:

1. **dyad-backend.js** - Production-ready Dyad backend adapter
2. **dyad-test-server.js** - Test server that simulates a Dyad instance

## Quick Start

### Option 1: Using the Test Server (Recommended for Development)

This is the easiest way to get started and test the extension:

```bash
# Terminal 1: Start the Dyad test server
cd extensions/ai-completion
node dyad-test-server.js
# Server runs on http://localhost:3000

# Terminal 2: Start the Dyad backend adapter
DYAD_URL=http://localhost:3000 node dyad-backend.js
# Adapter runs on http://localhost:8080

# Configure VS Code extension
# Set: aiCompletion.backendUrl = http://localhost:8080/api/completions
```

### Option 2: Using a Local Dyad Instance

If you have a local Dyad instance running:

```bash
# Start the Dyad backend adapter pointing to your Dyad instance
DYAD_URL=http://localhost:3000 DYAD_API_KEY=your-key node dyad-backend.js

# Configure VS Code extension
# Set: aiCompletion.backendUrl = http://localhost:8080/api/completions
# Set: aiCompletion.apiKey = (leave empty, handled by adapter)
```

### Option 3: Using Dyad Cloud

For remote Dyad cloud services:

```bash
# Start the adapter pointing to Dyad cloud
DYAD_URL=https://api.dyad.example.com \
DYAD_API_KEY=your-cloud-api-key \
DYAD_MODEL=dyad-large \
node dyad-backend.js

# Configure VS Code extension
# Set: aiCompletion.backendUrl = http://localhost:8080/api/completions
# Set: aiCompletion.dyadSessionId = your-session-id
# Set: aiCompletion.dyadUserId = your-user-id
```

### Option 4: Direct Integration (Advanced)

You can also configure the VS Code extension to talk directly to the Dyad test server without the adapter:

```bash
# Start the test server
node dyad-test-server.js

# Configure VS Code extension
# Set: aiCompletion.backendUrl = http://localhost:3000/completion
```

## Configuration

### Dyad Backend Adapter Configuration

Configure the adapter using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DYAD_URL` | Dyad API endpoint | `http://localhost:3000` |
| `DYAD_API_KEY` | API key for authentication | `` (empty) |
| `DYAD_MODEL` | Model to use | `dyad-default` |
| `PORT` | Adapter server port | `8080` |
| `REQUEST_TIMEOUT` | Request timeout in ms | `10000` |
| `MAX_RETRIES` | Max retry attempts | `3` |

Example:

```bash
DYAD_URL=https://dyad.example.com \
DYAD_API_KEY=sk-... \
DYAD_MODEL=dyad-large \
PORT=8080 \
REQUEST_TIMEOUT=15000 \
MAX_RETRIES=5 \
node dyad-backend.js
```

### Dyad Test Server Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `RESPONSE_DELAY` | Artificial delay in ms | `100` |

Example:

```bash
PORT=3000 RESPONSE_DELAY=200 node dyad-test-server.js
```

### VS Code Extension Settings

Configure these in your VS Code `settings.json`:

```json
{
  "aiCompletion.enabled": true,
  "aiCompletion.backendUrl": "http://localhost:8080/api/completions",
  "aiCompletion.apiKey": "",
  "aiCompletion.requestTimeout": 5000,
  "aiCompletion.maxSuggestions": 5,
  "aiCompletion.dyadSessionId": "your-session-id",
  "aiCompletion.dyadUserId": "your-user-id",
  "aiCompletion.dyadModel": "dyad-default"
}
```

## API Documentation

### Dyad Test Server

#### Endpoints

**POST /completion**

Request format:
```json
{
  "sessionId": "string (required)",
  "userId": "string (required)",
  "code": "string (required)",
  "cursorPosition": {
    "line": "number (required)",
    "character": "number (required)"
  },
  "language": "string (optional)",
  "fileName": "string (optional)"
}
```

Response format:
```json
{
  "completions": [
    {
      "text": "string",
      "completion": "string",
      "description": "string",
      "insertText": "string",
      "confidence": "number"
    }
  ],
  "metadata": {
    "sessionId": "string",
    "userId": "string",
    "model": "string",
    "timestamp": "string"
  }
}
```

**GET /health**

Health check endpoint that returns server status.

### Dyad Backend Adapter

#### Endpoints

**POST /api/completions** (VS Code extension compatible)

Request format:
```json
{
  "content": "string (required)",
  "cursorPosition": {
    "line": "number (required)",
    "character": "number (required)"
  },
  "fileName": "string (optional)",
  "language": "string (optional)",
  "sessionId": "string (optional)",
  "userId": "string (optional)"
}
```

Response format:
```json
{
  "suggestions": [
    {
      "text": "string",
      "description": "string",
      "insertText": "string"
    }
  ],
  "metadata": {
    "model": "string",
    "backend": "string",
    "timestamp": "string"
  }
}
```

**POST /completion** (Dyad native format)

Same as the test server's /completion endpoint.

**GET /health**

Health check endpoint.

## Testing

### Manual Testing

1. Start the test server and adapter:
   ```bash
   # Terminal 1
   node dyad-test-server.js
   
   # Terminal 2
   DYAD_URL=http://localhost:3000 node dyad-backend.js
   ```

2. Test with curl:
   ```bash
   # Test the test server directly
   curl -X POST http://localhost:3000/completion \
     -H "Content-Type: application/json" \
     -d '{
       "sessionId": "test-123",
       "userId": "user-456",
       "code": "const x = ",
       "cursorPosition": {"line": 0, "character": 10},
       "language": "javascript",
       "fileName": "test.js"
     }'
   
   # Test the adapter
   curl -X POST http://localhost:8080/api/completions \
     -H "Content-Type: application/json" \
     -d '{
       "content": "const x = ",
       "cursorPosition": {"line": 0, "character": 10},
       "fileName": "test.js",
       "language": "javascript",
       "sessionId": "session-123",
       "userId": "user-456"
     }'
   ```

3. Test the extension in VS Code:
   - Open any file
   - Start typing
   - Completions should appear automatically
   - Check the status bar for "AI Completion" indicator

### Integration Testing

Use the provided test script:

```bash
cd extensions/ai-completion
./test-integration.sh
```

## Features

### Dyad Backend Adapter Features

- ✅ Support for local and cloud Dyad instances
- ✅ API key authentication
- ✅ Model selection via environment variables
- ✅ Session ID and User ID tracking
- ✅ Full code context (file content + cursor position)
- ✅ Asynchronous request handling
- ✅ Request cancellation support
- ✅ Retry logic with exponential backoff
- ✅ Comprehensive error handling
- ✅ CORS support for browser clients
- ✅ Health check endpoint
- ✅ Graceful shutdown
- ✅ Detailed logging

### Dyad Test Server Features

- ✅ Simulates Dyad backend behavior
- ✅ Context-aware mock completions
- ✅ Multiple language support
- ✅ Session and user tracking
- ✅ Configurable response delay
- ✅ Health check endpoint
- ✅ Easy to swap with real Dyad instance

## Error Handling

### Common Errors and Solutions

**Error: Cannot connect to Dyad**
- Solution: Ensure Dyad is running and DYAD_URL is correct

**Error: Dyad authentication failed**
- Solution: Check your DYAD_API_KEY

**Error: Dyad service unavailable**
- Solution: Model may be loading or overloaded. Wait and retry.

**Error: Request timeout**
- Solution: Increase REQUEST_TIMEOUT or check network connection

**Error: Dyad endpoint not found**
- Solution: Verify DYAD_URL configuration

### Error Recovery

The adapter includes automatic retry logic with exponential backoff. If a request fails, it will:

1. Retry up to MAX_RETRIES times (default: 3)
2. Wait increasing amounts of time between retries
3. Return empty suggestions on final failure for graceful degradation

## Production Deployment

### Using Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY extensions/ai-completion/dyad-backend.js .

ENV DYAD_URL=http://dyad-service:3000
ENV DYAD_API_KEY=
ENV DYAD_MODEL=dyad-default
ENV PORT=8080

EXPOSE 8080

CMD ["node", "dyad-backend.js"]
```

### Using PM2

```bash
pm2 start dyad-backend.js \
  --name dyad-adapter \
  -e DYAD_URL=https://api.dyad.example.com \
  -e DYAD_API_KEY=your-key \
  -e DYAD_MODEL=dyad-large
```

### Using systemd

```ini
[Unit]
Description=Dyad Backend Adapter
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/ai-completion
ExecStart=/usr/bin/node dyad-backend.js
Restart=on-failure
Environment="DYAD_URL=http://localhost:3000"
Environment="DYAD_API_KEY="
Environment="DYAD_MODEL=dyad-default"
Environment="PORT=8080"

[Install]
WantedBy=multi-user.target
```

## Monorepo Compatibility

The Dyad integration is designed to work seamlessly with the code-server monorepo structure:

```
server/
├── extensions/
│   └── ai-completion/
│       ├── dyad-backend.js       # Dyad adapter
│       ├── dyad-test-server.js   # Test server
│       ├── dummy-backend.js      # Original dummy backend
│       ├── extension.ts          # VS Code extension
│       └── package.json
├── src/
└── package.json
```

All components are standalone Node.js files with no external dependencies, making them easy to deploy alongside code-server.

## Migration from Dummy Backend

If you're currently using the dummy backend:

1. Stop the dummy backend
2. Start the Dyad test server (drop-in replacement)
3. Optionally start the adapter for production features
4. No changes needed to the VS Code extension

The test server is designed as a drop-in replacement for the dummy backend with the same API contract.

## Troubleshooting

### Enable Debug Logging

The servers log all requests and errors to the console. Check the console output for detailed information.

### Check Health Endpoints

```bash
# Check test server
curl http://localhost:3000/health

# Check adapter
curl http://localhost:8080/health
```

### Verify Configuration

Double-check all environment variables and VS Code settings.

### Test Connectivity

Use curl to test each component independently:
1. Test server alone
2. Adapter → Test server
3. Extension → Adapter

## Performance Optimization

### Caching (Future Enhancement)

Consider implementing response caching in the adapter for frequently requested completions.

### Connection Pooling (Future Enhancement)

For high-traffic scenarios, implement HTTP connection pooling to Dyad.

### Load Balancing (Future Enhancement)

Deploy multiple Dyad instances behind a load balancer and configure the adapter to use the load balancer URL.

## Security Considerations

- API keys are never logged
- Use HTTPS for production Dyad cloud deployments
- Keep API keys in environment variables, not in code
- Use restrictive CORS policies in production
- Implement rate limiting if exposed to the internet

## Support

For issues or questions:

1. Check this guide
2. Review server logs for errors
3. Test with the test server to isolate issues
4. File an issue in the repository

## License

MIT
