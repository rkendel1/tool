# Dyad Backend Quick Reference

## Quick Start (Development)

```bash
# Terminal 1: Start Dyad test server
node dyad-test-server.js

# Terminal 2: Start Dyad backend adapter
DYAD_URL=http://localhost:3000 node dyad-backend.js

# Terminal 3: Test the integration
./test-dyad-integration.sh
```

## Files

- `dyad-backend.js` - Production Dyad backend adapter
- `dyad-test-server.js` - Test server for development
- `DYAD_INTEGRATION.md` - Complete integration guide
- `CONFIGURATION_EXAMPLES.md` - Example configurations
- `test-dyad-integration.sh` - Integration test script

## Configuration

### Environment Variables (Backend Adapter)
- `DYAD_URL` - Dyad endpoint (default: http://localhost:3000)
- `DYAD_API_KEY` - API key (default: empty)
- `DYAD_MODEL` - Model name (default: dyad-default)
- `PORT` - Server port (default: 8080)
- `REQUEST_TIMEOUT` - Timeout in ms (default: 10000)
- `MAX_RETRIES` - Max retries (default: 3)

### VS Code Settings
```json
{
  "aiCompletion.backendUrl": "http://localhost:8080/api/completions",
  "aiCompletion.dyadSessionId": "your-session-id",
  "aiCompletion.dyadUserId": "your-user-id",
  "aiCompletion.dyadModel": "dyad-default"
}
```

## API Endpoints

### Test Server
- `POST /completion` - Get completions
- `GET /health` - Health check

### Backend Adapter
- `POST /api/completions` - VS Code extension format
- `POST /completion` - Dyad native format
- `GET /health` - Health check

## Request Format

### To Backend Adapter (VS Code format)
```json
{
  "content": "const x = ",
  "cursorPosition": {"line": 0, "character": 10},
  "fileName": "test.js",
  "language": "javascript",
  "sessionId": "session-123",
  "userId": "user-456"
}
```

### To Test Server (Dyad format)
```json
{
  "sessionId": "session-123",
  "userId": "user-456",
  "code": "const x = ",
  "cursorPosition": {"line": 0, "character": 10},
  "language": "javascript",
  "fileName": "test.js"
}
```

## Response Format

```json
{
  "suggestions": [
    {
      "text": "console.log()",
      "description": "Log to console",
      "insertText": "console.log($1)"
    }
  ],
  "metadata": {
    "model": "dyad-default",
    "backend": "dyad",
    "timestamp": "2025-10-02T23:00:00.000Z"
  }
}
```

## Testing

```bash
# Health check
curl http://localhost:3000/health
curl http://localhost:8080/health

# Test completion
curl -X POST http://localhost:8080/api/completions \
  -H "Content-Type: application/json" \
  -d '{"content":"test","cursorPosition":{"line":0,"character":4},"fileName":"test.js","language":"javascript","sessionId":"s1","userId":"u1"}'

# Run full test suite
./test-dyad-integration.sh
```

## Deployment Scenarios

### Local Development
```bash
node dyad-test-server.js &
DYAD_URL=http://localhost:3000 node dyad-backend.js &
```

### Docker
```bash
docker run -p 3000:3000 -v $(pwd):/app -w /app node:18 node dyad-test-server.js
docker run -p 8080:8080 -e DYAD_URL=http://dyad-test-server:3000 -v $(pwd):/app -w /app node:18 node dyad-backend.js
```

### PM2
```bash
pm2 start dyad-test-server.js
pm2 start dyad-backend.js --name dyad-adapter -- DYAD_URL=http://localhost:3000
```

### SystemD
```bash
sudo systemctl start dyad-test-server
sudo systemctl start dyad-backend
```

## Troubleshooting

### Connection refused
- Ensure servers are running: `ps aux | grep node`
- Check ports: `netstat -tuln | grep -E '3000|8080'`

### No completions
- Check VS Code settings
- Test with curl
- Check server logs

### Timeout errors
- Increase `REQUEST_TIMEOUT`
- Check network connectivity
- Verify Dyad service is responding

## Documentation

- Full guide: [DYAD_INTEGRATION.md](DYAD_INTEGRATION.md)
- Configuration examples: [CONFIGURATION_EXAMPLES.md](CONFIGURATION_EXAMPLES.md)
- Main README: [README.md](README.md)
- Installation: [INSTALLATION.md](INSTALLATION.md)
