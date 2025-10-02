/**
 * Dyad Backend Adapter for AI Code Completion Extension
 * 
 * This adapter integrates Dyad (local or cloud) as a backend for AI code completions.
 * It replaces the dummy backend with a production-ready Dyad integration.
 * 
 * Features:
 * - Supports both local Dyad instances and Dyad cloud services
 * - API key authentication for secure access
 * - Model selection via configuration
 * - Session ID and User ID tracking for collaborative features
 * - Full code context (file content + cursor position)
 * - Asynchronous request handling with cancellation support
 * - Robust error handling for network issues, invalid responses, and unavailable models
 * 
 * Configuration:
 * Set these environment variables or pass as command-line arguments:
 * - DYAD_URL: The Dyad API endpoint (default: http://localhost:3000)
 * - DYAD_API_KEY: API key for authentication (optional for local instances)
 * - DYAD_MODEL: Model to use for completions (default: dyad-default)
 * - PORT: Server port (default: 8080)
 * 
 * Usage:
 *   node dyad-backend.js
 *   # or with custom configuration:
 *   DYAD_URL=https://api.dyad.example.com DYAD_API_KEY=your-key PORT=8080 node dyad-backend.js
 * 
 * The server will expose:
 *   POST /api/completions - Main completion endpoint (compatible with VS Code extension)
 *   POST /completion - Dyad-native completion endpoint
 *   GET /health - Health check endpoint
 */

const http = require('http');
const https = require('https');
const url = require('url');

// Configuration from environment variables with defaults
const config = {
  port: process.env.PORT || 8080,
  dyadUrl: process.env.DYAD_URL || 'http://localhost:3000',
  dyadApiKey: process.env.DYAD_API_KEY || '',
  dyadModel: process.env.DYAD_MODEL || 'dyad-default',
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '10000', 10),
  maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
};

// Active request tracking for cancellation support
const activeRequests = new Map();

/**
 * Make a request to the Dyad backend
 * 
 * @param {Object} requestData - The request payload
 * @param {string} requestData.sessionId - Dyad session ID
 * @param {string} requestData.userId - Dyad user ID
 * @param {string} requestData.code - Full file content
 * @param {Object} requestData.cursorPosition - Cursor position {line, character}
 * @param {string} requestData.language - Programming language
 * @param {string} requestData.fileName - File name
 * @param {string} requestId - Unique request ID for cancellation
 * @returns {Promise<Object>} - Dyad response with completions
 */
async function fetchDyadCompletions(requestData, requestId) {
  return new Promise((resolve, reject) => {
    const dyadEndpoint = new URL('/completion', config.dyadUrl);
    const isHttps = dyadEndpoint.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    // Prepare the request payload for Dyad
    // Dyad expects: sessionId, userId, code, cursorPosition, and optional metadata
    const payload = JSON.stringify({
      sessionId: requestData.sessionId || '',
      userId: requestData.userId || '',
      code: requestData.code || '',
      cursorPosition: requestData.cursorPosition || { line: 0, character: 0 },
      language: requestData.language || 'plaintext',
      fileName: requestData.fileName || 'untitled',
      model: config.dyadModel,
      // Additional context for better completions
      context: {
        timestamp: new Date().toISOString(),
        requestId: requestId,
      }
    });

    const options = {
      hostname: dyadEndpoint.hostname,
      port: dyadEndpoint.port || (isHttps ? 443 : 80),
      path: dyadEndpoint.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: config.requestTimeout,
    };

    // Add authentication if API key is provided
    if (config.dyadApiKey) {
      options.headers['Authorization'] = `Bearer ${config.dyadApiKey}`;
    }

    const req = httpModule.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        // Remove from active requests
        activeRequests.delete(requestId);

        // Handle different status codes
        if (res.statusCode === 200) {
          try {
            const parsedResponse = JSON.parse(responseData);
            resolve(parsedResponse);
          } catch (error) {
            reject(new Error(`Invalid JSON response from Dyad: ${error.message}`));
          }
        } else if (res.statusCode === 401) {
          reject(new Error('Dyad authentication failed: Invalid API key'));
        } else if (res.statusCode === 404) {
          reject(new Error('Dyad endpoint not found: Check DYAD_URL configuration'));
        } else if (res.statusCode === 503) {
          reject(new Error('Dyad service unavailable: Model may be loading or overloaded'));
        } else {
          reject(new Error(`Dyad returned ${res.statusCode}: ${responseData}`));
        }
      });
    });

    // Error handling for network issues
    req.on('error', (error) => {
      activeRequests.delete(requestId);
      if (error.code === 'ECONNREFUSED') {
        reject(new Error('Cannot connect to Dyad: Ensure Dyad is running and DYAD_URL is correct'));
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
        reject(new Error('Dyad request timeout: Increase REQUEST_TIMEOUT or check network'));
      } else if (error.code === 'ENOTFOUND') {
        reject(new Error('Dyad host not found: Check DYAD_URL configuration'));
      } else {
        reject(new Error(`Network error communicating with Dyad: ${error.message}`));
      }
    });

    req.on('timeout', () => {
      req.destroy();
      activeRequests.delete(requestId);
      reject(new Error('Dyad request timeout'));
    });

    // Store request for potential cancellation
    activeRequests.set(requestId, req);

    req.write(payload);
    req.end();
  });
}

/**
 * Transform Dyad response to VS Code extension format
 * 
 * Dyad may return various formats. This function normalizes them to the format
 * expected by the VS Code extension.
 * 
 * @param {Object} dyadResponse - Raw response from Dyad
 * @returns {Object} - Normalized response with suggestions array
 */
function transformDyadResponse(dyadResponse) {
  // Handle different Dyad response formats
  let suggestions = [];

  if (dyadResponse.completions && Array.isArray(dyadResponse.completions)) {
    // Dyad format: { completions: [...] }
    suggestions = dyadResponse.completions.map(item => ({
      text: item.text || item.completion || '',
      description: item.description || item.label || 'Dyad suggestion',
      insertText: item.insertText || item.text || item.completion || '',
    }));
  } else if (dyadResponse.suggestions && Array.isArray(dyadResponse.suggestions)) {
    // Already in expected format
    suggestions = dyadResponse.suggestions;
  } else if (Array.isArray(dyadResponse)) {
    // Array of completions
    suggestions = dyadResponse.map(item => ({
      text: typeof item === 'string' ? item : (item.text || item.completion || ''),
      description: typeof item === 'object' ? (item.description || 'Dyad suggestion') : 'Dyad suggestion',
      insertText: typeof item === 'string' ? item : (item.insertText || item.text || item.completion || ''),
    }));
  } else if (dyadResponse.completion) {
    // Single completion
    suggestions = [{
      text: dyadResponse.completion,
      description: dyadResponse.description || 'Dyad suggestion',
      insertText: dyadResponse.insertText || dyadResponse.completion,
    }];
  }

  return {
    suggestions: suggestions,
    metadata: {
      model: config.dyadModel,
      backend: 'dyad',
      timestamp: new Date().toISOString(),
    }
  };
}

/**
 * Main HTTP server handler
 */
const server = http.createServer(async (req, res) => {
  // CORS headers for browser-based clients
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy',
      dyadUrl: config.dyadUrl,
      model: config.dyadModel,
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  // Completion endpoints (both /api/completions for VS Code extension compatibility and /completion for Dyad native)
  if (req.method === 'POST' && (req.url === '/api/completions' || req.url === '/completion')) {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const request = JSON.parse(body);
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        console.log('Received completion request:', {
          requestId,
          language: request.language,
          fileName: request.fileName,
          cursorLine: request.cursorPosition?.line,
          sessionId: request.sessionId,
          userId: request.userId,
        });

        // Transform VS Code extension format to Dyad format
        const dyadRequest = {
          sessionId: request.sessionId || '',
          userId: request.userId || '',
          code: request.content || request.code || '',
          cursorPosition: request.cursorPosition || { line: 0, character: 0 },
          language: request.language || 'plaintext',
          fileName: request.fileName || 'untitled',
        };

        // Fetch completions from Dyad with retry logic
        let lastError;
        let attempts = 0;

        while (attempts < config.maxRetries) {
          attempts++;
          try {
            const dyadResponse = await fetchDyadCompletions(dyadRequest, requestId);
            const transformedResponse = transformDyadResponse(dyadResponse);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(transformedResponse));

            console.log(`✓ Returned ${transformedResponse.suggestions.length} suggestions from Dyad (attempt ${attempts}/${config.maxRetries})`);
            return;
          } catch (error) {
            lastError = error;
            console.error(`✗ Attempt ${attempts}/${config.maxRetries} failed:`, error.message);

            // Don't retry on authentication or client errors
            if (error.message.includes('authentication') || error.message.includes('404')) {
              break;
            }

            // Wait before retry (exponential backoff)
            if (attempts < config.maxRetries) {
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 100));
            }
          }
        }

        // All retries failed
        throw lastError;

      } catch (error) {
        console.error('Error processing request:', error);
        
        // Determine appropriate status code based on error
        let statusCode = 500;
        if (error.message.includes('authentication') || error.message.includes('Invalid API key')) {
          statusCode = 401;
        } else if (error.message.includes('not found') || error.message.includes('404')) {
          statusCode = 404;
        } else if (error.message.includes('unavailable') || error.message.includes('503')) {
          statusCode = 503;
        } else if (error.message.includes('timeout')) {
          statusCode = 504;
        }

        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Dyad backend error',
          message: error.message,
          suggestions: [], // Return empty suggestions on error for graceful degradation
        }));
      }
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Invalid request',
        message: error.message 
      }));
    });

    return;
  }

  // Unknown endpoint
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    error: 'Not found',
    message: 'Supported endpoints: POST /api/completions, POST /completion, GET /health'
  }));
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  
  // Cancel all active requests
  for (const [requestId, req] of activeRequests.entries()) {
    console.log(`Cancelling request: ${requestId}`);
    req.destroy();
  }
  activeRequests.clear();

  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  
  // Cancel all active requests
  for (const [requestId, req] of activeRequests.entries()) {
    console.log(`Cancelling request: ${requestId}`);
    req.destroy();
  }
  activeRequests.clear();

  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Start the server
server.listen(config.port, () => {
  console.log('='.repeat(60));
  console.log('Dyad Backend Adapter for AI Code Completion');
  console.log('='.repeat(60));
  console.log(`Server running at http://localhost:${config.port}`);
  console.log(`Dyad Backend: ${config.dyadUrl}`);
  console.log(`Dyad Model: ${config.dyadModel}`);
  console.log(`API Key: ${config.dyadApiKey ? '***configured***' : 'not set'}`);
  console.log(`Request Timeout: ${config.requestTimeout}ms`);
  console.log(`Max Retries: ${config.maxRetries}`);
  console.log('='.repeat(60));
  console.log('\nEndpoints:');
  console.log(`  POST /api/completions - VS Code extension compatible`);
  console.log(`  POST /completion      - Dyad native format`);
  console.log(`  GET  /health          - Health check`);
  console.log('\nExample VS Code extension request:');
  console.log(JSON.stringify({
    content: 'const x = ',
    cursorPosition: { line: 0, character: 10 },
    fileName: 'test.js',
    language: 'javascript',
    sessionId: 'session-123',
    userId: 'user-456'
  }, null, 2));
  console.log('\nExample Dyad native request:');
  console.log(JSON.stringify({
    sessionId: 'session-123',
    userId: 'user-456',
    code: 'const x = ',
    cursorPosition: { line: 0, character: 10 },
    language: 'javascript',
    fileName: 'test.js'
  }, null, 2));
  console.log('='.repeat(60));
});
