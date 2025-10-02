/**
 * Dyad Test Server for AI Code Completion Extension
 * 
 * This is a minimal test server that simulates a Dyad backend for testing purposes.
 * It provides mock completions that can be used to validate the VS Code extension
 * and dyad-backend.js adapter without requiring a full Dyad instance.
 * 
 * Features:
 * - Accepts POST requests at /completion endpoint
 * - Returns mock completions based on language and context
 * - Simulates realistic Dyad response format
 * - Includes session ID and user ID tracking
 * - Can be easily swapped with a real Dyad instance
 * 
 * Usage:
 *   node dyad-test-server.js
 *   # or with custom port:
 *   PORT=3000 node dyad-test-server.js
 * 
 * Configuration:
 * - PORT: Server port (default: 3000)
 * - RESPONSE_DELAY: Artificial delay in ms to simulate processing (default: 100)
 * 
 * Testing with the extension:
 * 1. Start this server: node dyad-test-server.js
 * 2. Start the Dyad backend adapter: DYAD_URL=http://localhost:3000 node dyad-backend.js
 * 3. Configure VS Code extension to use http://localhost:8080/api/completions
 * 
 * OR directly without the adapter:
 * 1. Start this server: node dyad-test-server.js
 * 2. Configure VS Code extension to use http://localhost:3000/completion
 */

const http = require('http');

// Configuration
const config = {
  port: process.env.PORT || 3000,
  responseDelay: parseInt(process.env.RESPONSE_DELAY || '100', 10),
};

/**
 * Mock completion suggestions by programming language
 * These simulate what a real Dyad instance would return based on code context
 */
const mockCompletionsByLanguage = {
  javascript: [
    {
      text: 'console.log()',
      completion: 'console.log()',
      description: 'Log to console',
      insertText: 'console.log($1)',
      confidence: 0.95
    },
    {
      text: 'async function',
      completion: 'async function name(params) {\n  \n}',
      description: 'Async function declaration',
      insertText: 'async function ${1:name}(${2:params}) {\n  ${0}\n}',
      confidence: 0.88
    },
    {
      text: 'const',
      completion: 'const name = value',
      description: 'Constant declaration',
      insertText: 'const ${1:name} = ${0}',
      confidence: 0.92
    },
    {
      text: 'try...catch',
      completion: 'try {\n  \n} catch (error) {\n  \n}',
      description: 'Try-catch block',
      insertText: 'try {\n  ${1}\n} catch (${2:error}) {\n  ${0}\n}',
      confidence: 0.85
    },
  ],
  typescript: [
    {
      text: 'interface',
      completion: 'interface Name {\n  \n}',
      description: 'Interface declaration',
      insertText: 'interface ${1:Name} {\n  ${0}\n}',
      confidence: 0.93
    },
    {
      text: 'type',
      completion: 'type Name = ',
      description: 'Type alias',
      insertText: 'type ${1:Name} = ${0}',
      confidence: 0.90
    },
    {
      text: 'class',
      completion: 'class Name {\n  \n}',
      description: 'Class declaration',
      insertText: 'class ${1:Name} {\n  ${0}\n}',
      confidence: 0.87
    },
    {
      text: 'enum',
      completion: 'enum Name {\n  \n}',
      description: 'Enum declaration',
      insertText: 'enum ${1:Name} {\n  ${0}\n}',
      confidence: 0.84
    },
  ],
  python: [
    {
      text: 'def',
      completion: 'def name(params):\n    ',
      description: 'Function definition',
      insertText: 'def ${1:name}(${2:params}):\n    ${0}',
      confidence: 0.94
    },
    {
      text: 'class',
      completion: 'class Name:\n    ',
      description: 'Class definition',
      insertText: 'class ${1:Name}:\n    ${0}',
      confidence: 0.91
    },
    {
      text: 'if __name__ == "__main__":',
      completion: 'if __name__ == "__main__":\n    ',
      description: 'Main guard',
      insertText: 'if __name__ == "__main__":\n    ${0}',
      confidence: 0.89
    },
    {
      text: 'import',
      completion: 'import module',
      description: 'Import statement',
      insertText: 'import ${0}',
      confidence: 0.92
    },
  ],
  java: [
    {
      text: 'public class',
      completion: 'public class Name {\n    \n}',
      description: 'Public class declaration',
      insertText: 'public class ${1:Name} {\n    ${0}\n}',
      confidence: 0.93
    },
    {
      text: 'public static void main',
      completion: 'public static void main(String[] args) {\n    \n}',
      description: 'Main method',
      insertText: 'public static void main(String[] args) {\n    ${0}\n}',
      confidence: 0.96
    },
    {
      text: 'System.out.println',
      completion: 'System.out.println()',
      description: 'Print to console',
      insertText: 'System.out.println(${0})',
      confidence: 0.94
    },
  ],
  go: [
    {
      text: 'func',
      completion: 'func name() {\n    \n}',
      description: 'Function declaration',
      insertText: 'func ${1:name}() {\n    ${0}\n}',
      confidence: 0.92
    },
    {
      text: 'if err != nil',
      completion: 'if err != nil {\n    \n}',
      description: 'Error check',
      insertText: 'if err != nil {\n    ${0}\n}',
      confidence: 0.97
    },
    {
      text: 'type',
      completion: 'type Name struct {\n    \n}',
      description: 'Struct type',
      insertText: 'type ${1:Name} struct {\n    ${0}\n}',
      confidence: 0.89
    },
  ],
  default: [
    {
      text: 'TODO:',
      completion: 'TODO: ',
      description: 'TODO comment',
      insertText: 'TODO: ${0}',
      confidence: 0.75
    },
    {
      text: 'FIXME:',
      completion: 'FIXME: ',
      description: 'FIXME comment',
      insertText: 'FIXME: ${0}',
      confidence: 0.72
    },
    {
      text: 'NOTE:',
      completion: 'NOTE: ',
      description: 'NOTE comment',
      insertText: 'NOTE: ${0}',
      confidence: 0.70
    },
  ]
};

/**
 * Generate context-aware completions
 * This function simulates how a real Dyad instance would analyze code context
 * to provide relevant suggestions
 * 
 * @param {Object} request - The completion request
 * @returns {Array} - Array of completion suggestions
 */
function generateCompletions(request) {
  const { code, language, cursorPosition } = request;
  
  // Get base completions for the language
  const baseCompletions = mockCompletionsByLanguage[language] || mockCompletionsByLanguage.default;
  
  // Simulate context-aware filtering
  // In a real Dyad instance, this would use ML models to analyze the code
  let completions = [...baseCompletions];
  
  // Simple context analysis: check what's before the cursor
  if (code && cursorPosition) {
    const lines = code.split('\n');
    const currentLine = lines[cursorPosition.line] || '';
    const textBeforeCursor = currentLine.substring(0, cursorPosition.character);
    
    // Filter and rank completions based on context
    if (textBeforeCursor.trim().length > 0) {
      // If there's text before cursor, filter relevant completions
      const lastWord = textBeforeCursor.trim().split(/\s+/).pop() || '';
      
      completions = completions.map(comp => {
        // Boost score if completion matches the partial text
        let contextScore = comp.confidence;
        if (comp.text.toLowerCase().startsWith(lastWord.toLowerCase())) {
          contextScore += 0.05;
        }
        return { ...comp, confidence: Math.min(contextScore, 0.99) };
      });
      
      // Sort by confidence
      completions.sort((a, b) => b.confidence - a.confidence);
    }
  }
  
  // Return top 5 completions
  return completions.slice(0, 5);
}

/**
 * Main HTTP server
 */
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'dyad-test-server',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  // Completion endpoint
  if (req.method === 'POST' && req.url === '/completion') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const request = JSON.parse(body);

        console.log('Received completion request:', {
          sessionId: request.sessionId || 'none',
          userId: request.userId || 'none',
          language: request.language || 'unknown',
          fileName: request.fileName || 'unknown',
          cursorPosition: request.cursorPosition,
          codeLength: request.code?.length || 0,
        });

        // Validate required fields
        if (!request.code && request.code !== '') {
          throw new Error('Missing required field: code');
        }
        if (!request.cursorPosition) {
          throw new Error('Missing required field: cursorPosition');
        }

        // Simulate processing delay (optional)
        if (config.responseDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, config.responseDelay));
        }

        // Generate completions based on context
        const completions = generateCompletions(request);

        // Format response in Dyad format
        const response = {
          completions: completions,
          metadata: {
            sessionId: request.sessionId || null,
            userId: request.userId || null,
            model: 'dyad-test-model',
            timestamp: new Date().toISOString(),
            requestContext: {
              language: request.language,
              fileName: request.fileName,
            }
          }
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));

        console.log(`✓ Returned ${completions.length} completions for ${request.language || 'unknown'}`);

      } catch (error) {
        console.error('Error processing request:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Invalid request',
          message: error.message,
          completions: []
        }));
      }
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Request error',
        message: error.message
      }));
    });

    return;
  }

  // Unknown endpoint
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: 'Not found',
    message: 'Supported endpoints: POST /completion, GET /health'
  }));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Start server
server.listen(config.port, () => {
  console.log('='.repeat(60));
  console.log('Dyad Test Server');
  console.log('='.repeat(60));
  console.log(`Server running at http://localhost:${config.port}`);
  console.log(`Response Delay: ${config.responseDelay}ms`);
  console.log('='.repeat(60));
  console.log('\nThis is a TEST server that simulates a Dyad backend.');
  console.log('It provides mock completions for development and testing.');
  console.log('\nTo use with the Dyad backend adapter:');
  console.log(`  DYAD_URL=http://localhost:${config.port} node dyad-backend.js`);
  console.log('\nTo use directly with the VS Code extension:');
  console.log('  Configure: aiCompletion.backendUrl = http://localhost:3000/completion');
  console.log('\nEndpoints:');
  console.log('  POST /completion - Main completion endpoint');
  console.log('  GET  /health     - Health check');
  console.log('\nExample request:');
  console.log(JSON.stringify({
    sessionId: 'test-session-123',
    userId: 'test-user-456',
    code: 'const x = ',
    cursorPosition: { line: 0, character: 10 },
    language: 'javascript',
    fileName: 'test.js'
  }, null, 2));
  console.log('='.repeat(60));
});
