# AI Code Completion - Configuration Examples

This file provides example configurations for different deployment scenarios.

## Quick Start Configurations

### Configuration 1: Dyad Test Server + Backend Adapter (Recommended for Development)

**Steps:**
1. Start the test server: `node dyad-test-server.js`
2. Start the adapter: `DYAD_URL=http://localhost:3000 node dyad-backend.js`
3. Configure VS Code:

```json
{
  "aiCompletion.enabled": true,
  "aiCompletion.backendUrl": "http://localhost:8080/api/completions",
  "aiCompletion.apiKey": "",
  "aiCompletion.requestTimeout": 5000,
  "aiCompletion.maxSuggestions": 5,
  "aiCompletion.dyadSessionId": "dev-session-001",
  "aiCompletion.dyadUserId": "dev-user-001",
  "aiCompletion.dyadModel": "dyad-default"
}
```

### Configuration 2: Dyad Test Server Directly (Simple Testing)

**Steps:**
1. Start the test server: `node dyad-test-server.js`
2. Configure VS Code:

```json
{
  "aiCompletion.enabled": true,
  "aiCompletion.backendUrl": "http://localhost:3000/completion",
  "aiCompletion.apiKey": "",
  "aiCompletion.requestTimeout": 5000,
  "aiCompletion.maxSuggestions": 5,
  "aiCompletion.dyadSessionId": "test-session-001",
  "aiCompletion.dyadUserId": "test-user-001"
}
```

### Configuration 3: Local Dyad Instance

**Steps:**
1. Start your local Dyad instance (assumed on port 3000)
2. Start the adapter: `DYAD_URL=http://localhost:3000 DYAD_API_KEY=your-key node dyad-backend.js`
3. Configure VS Code:

```json
{
  "aiCompletion.enabled": true,
  "aiCompletion.backendUrl": "http://localhost:8080/api/completions",
  "aiCompletion.apiKey": "",
  "aiCompletion.requestTimeout": 10000,
  "aiCompletion.maxSuggestions": 5,
  "aiCompletion.dyadSessionId": "local-session-001",
  "aiCompletion.dyadUserId": "user-001",
  "aiCompletion.dyadModel": "dyad-default"
}
```

### Configuration 4: Dyad Cloud (Production)

**Steps:**
1. Obtain your Dyad cloud API key
2. Start the adapter:
   ```bash
   DYAD_URL=https://api.dyad.example.com \
   DYAD_API_KEY=sk-your-api-key-here \
   DYAD_MODEL=dyad-large \
   node dyad-backend.js
   ```
3. Configure VS Code:

```json
{
  "aiCompletion.enabled": true,
  "aiCompletion.backendUrl": "http://localhost:8080/api/completions",
  "aiCompletion.apiKey": "",
  "aiCompletion.requestTimeout": 15000,
  "aiCompletion.maxSuggestions": 5,
  "aiCompletion.dyadSessionId": "prod-session-abc123",
  "aiCompletion.dyadUserId": "user-xyz789",
  "aiCompletion.dyadModel": "dyad-large"
}
```

### Configuration 5: Dummy Backend (Original)

**Steps:**
1. Start the dummy backend: `node dummy-backend.js`
2. Configure VS Code:

```json
{
  "aiCompletion.enabled": true,
  "aiCompletion.backendUrl": "http://localhost:8080/api/completions",
  "aiCompletion.apiKey": "",
  "aiCompletion.requestTimeout": 5000
}
```

### Configuration 6: Custom AI Service

For any custom AI completion service:

```json
{
  "aiCompletion.enabled": true,
  "aiCompletion.backendUrl": "https://api.custom-ai.com/v1/completions",
  "aiCompletion.apiKey": "YOUR_API_KEY_HERE",
  "aiCompletion.requestTimeout": 10000,
  "aiCompletion.maxSuggestions": 3
}
```

### Configuration 7: Disable Extension

```json
{
  "aiCompletion.enabled": false
}
```

## Environment Variables for Dyad Backend Adapter

### Development
```bash
DYAD_URL=http://localhost:3000
DYAD_API_KEY=
DYAD_MODEL=dyad-default
PORT=8080
REQUEST_TIMEOUT=10000
MAX_RETRIES=3
```

### Production
```bash
DYAD_URL=https://api.dyad.example.com
DYAD_API_KEY=sk-prod-api-key-here
DYAD_MODEL=dyad-large
PORT=8080
REQUEST_TIMEOUT=15000
MAX_RETRIES=5
```

## Testing Configuration

To verify your configuration:

1. Check health endpoints:
   ```bash
   curl http://localhost:3000/health  # Test server
   curl http://localhost:8080/health  # Backend adapter
   ```

2. Test completion request:
   ```bash
   curl -X POST http://localhost:8080/api/completions \
     -H "Content-Type: application/json" \
     -d '{"content":"const x = ","cursorPosition":{"line":0,"character":10},"fileName":"test.js","language":"javascript","sessionId":"test","userId":"user"}'
   ```

3. Use the extension command "AI Completion: Test Backend Connection"

For detailed configuration options, see [DYAD_INTEGRATION.md](DYAD_INTEGRATION.md).
