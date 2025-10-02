# AI Completion Extension

This directory contains the AI Code Completion extension with Dyad integration.

## Contents

The extension files are mounted from the main repository at:
```
/home/coder/project/extensions/ai-completion/
```

This includes:
- `dyad-backend.js` - Production Dyad adapter
- `dyad-test-server.js` - Test server (running in separate container)
- `extension.ts` - VS Code extension source
- `extension.js` - Compiled extension
- `package.json` - Extension configuration
- Documentation files

## Configuration

The extension is pre-configured to work with the Dyad test server in the Docker environment.

### Environment Variables

Set in docker-compose.yml:
- `DYAD_BACKEND_URL` - URL to Dyad backend (default: http://dyad-server:5000/completion)
- `API_KEY` - API key for production Dyad instances
- `AI_MODEL` - AI model to use (default: dyad-default)
- `SESSION_ID` - Session identifier
- `USER_ID` - User identifier

### VS Code Settings

If you need to customize the extension settings, create or edit:
```
/home/coder/.local/share/code-server/User/settings.json
```

Example:
```json
{
  "aiCompletion.backendUrl": "http://dyad-server:5000/completion",
  "aiCompletion.enabled": true,
  "aiCompletion.model": "dyad-default"
}
```

## Using the Extension

1. Open any code file in Code Server
2. Start typing
3. AI suggestions will appear inline
4. Press `Tab` to accept, `Esc` to dismiss

## Dyad Test Server

The Dyad test server is running in a separate Docker container and provides mock completions for testing.

**Health Check:**
```bash
curl http://dyad-server:5000/health
```

**Test Completion:**
```bash
curl -X POST http://dyad-server:5000/completion \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test",
    "userId": "user",
    "code": "const x = ",
    "cursorPosition": {"line": 0, "character": 10},
    "language": "javascript",
    "fileName": "test.js"
  }'
```

## Documentation

For detailed documentation, see:
- `DYAD_INTEGRATION.md` - Complete integration guide
- `DYAD_QUICKSTART.md` - Quick start guide
- `README.md` - Extension README
- `CONFIGURATION_EXAMPLES.md` - Configuration examples

## Development

This directory is mounted read-only for reference. To modify the extension:

1. Edit files in the host repository at `extensions/ai-completion/`
2. Rebuild containers if needed:
   ```bash
   docker-compose build
   docker-compose up
   ```

## Switching to Production Dyad

To use a production Dyad instance:

1. Update `docker-compose.yml`:
   ```yaml
   environment:
     - DYAD_BACKEND_URL=https://your-dyad-instance.com/api
     - API_KEY=your-api-key
   ```

2. Restart the services:
   ```bash
   docker-compose down
   docker-compose up
   ```

## Troubleshooting

### No AI Suggestions

1. Check Dyad server is running:
   ```bash
   docker-compose ps dyad-server
   ```

2. Check health:
   ```bash
   curl http://localhost:5000/health
   ```

3. Check Code Server logs:
   ```bash
   docker-compose logs code-server
   ```

### Extension Not Loading

1. Check extension is in the correct location
2. Restart Code Server:
   ```bash
   docker-compose restart code-server
   ```

3. Check VS Code extension is enabled in settings

### Connection Issues

Check the backend URL is correctly set:
```bash
docker-compose exec code-server env | grep DYAD
```

## Support

For issues with the extension:
- Check the documentation files in this directory
- Review Docker logs: `docker-compose logs`
- Test the Dyad server separately
- Check VS Code extension settings
