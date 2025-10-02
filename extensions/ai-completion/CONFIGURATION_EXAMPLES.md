# AI Code Completion - Example Backend Configurations

## Local Development (Dummy Backend)

```json
{
  "aiCompletion.enabled": true,
  "aiCompletion.backendUrl": "http://localhost:8080/api/completions",
  "aiCompletion.apiKey": "",
  "aiCompletion.requestTimeout": 5000
}
```

## Local Dyad Instance

```json
{
  "aiCompletion.enabled": true,
  "aiCompletion.backendUrl": "http://localhost:8080/api/completions",
  "aiCompletion.apiKey": "",
  "aiCompletion.dyadSessionId": "session-123",
  "aiCompletion.dyadUserId": "user-456"
}
```

## Dyad Cloud (Remote)

```json
{
  "aiCompletion.enabled": true,
  "aiCompletion.backendUrl": "https://api.dyad.example.com/v1/completions",
  "aiCompletion.apiKey": "YOUR_DYAD_API_KEY_HERE",
  "aiCompletion.dyadSessionId": "session-123",
  "aiCompletion.dyadUserId": "user-456"
}
```

## Custom AI Service (e.g., OpenAI-compatible)

```json
{
  "aiCompletion.enabled": true,
  "aiCompletion.backendUrl": "https://api.custom-ai.com/v1/completions",
  "aiCompletion.apiKey": "YOUR_API_KEY_HERE",
  "aiCompletion.requestTimeout": 10000,
  "aiCompletion.maxSuggestions": 3
}
```

## Disable Extension

```json
{
  "aiCompletion.enabled": false
}
```
