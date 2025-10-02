/**
 * Dummy Backend Server for AI Code Completion Extension
 * 
 * This is a simple mock server for testing the AI completion extension.
 * It returns hardcoded suggestions based on the programming language.
 * 
 * Usage:
 *   node dummy-backend.js
 * 
 * The server will run on http://localhost:8080
 */

const http = require('http');

const port = process.env.PORT || 8080;

// Mock completions by language
const completionsByLanguage = {
  javascript: [
    { text: 'console.log()', description: 'Log to console', insertText: 'console.log($1)' },
    { text: 'function', description: 'Function declaration', insertText: 'function ${1:name}($2) {\n\t$0\n}' },
    { text: 'const', description: 'Constant declaration', insertText: 'const ${1:name} = $0' },
    { text: 'async function', description: 'Async function', insertText: 'async function ${1:name}($2) {\n\t$0\n}' },
  ],
  typescript: [
    { text: 'interface', description: 'Interface declaration', insertText: 'interface ${1:Name} {\n\t$0\n}' },
    { text: 'type', description: 'Type alias', insertText: 'type ${1:Name} = $0' },
    { text: 'class', description: 'Class declaration', insertText: 'class ${1:Name} {\n\t$0\n}' },
    { text: 'const', description: 'Constant declaration', insertText: 'const ${1:name}: ${2:type} = $0' },
  ],
  python: [
    { text: 'def', description: 'Function definition', insertText: 'def ${1:name}($2):\n\t$0' },
    { text: 'class', description: 'Class definition', insertText: 'class ${1:Name}:\n\t$0' },
    { text: 'if __name__ == "__main__":', description: 'Main guard', insertText: 'if __name__ == "__main__":\n\t$0' },
    { text: 'import', description: 'Import statement', insertText: 'import $0' },
  ],
  default: [
    { text: 'TODO:', description: 'TODO comment', insertText: 'TODO: $0' },
    { text: 'FIXME:', description: 'FIXME comment', insertText: 'FIXME: $0' },
    { text: 'NOTE:', description: 'NOTE comment', insertText: 'NOTE: $0' },
  ]
};

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Only accept POST to /api/completions
  if (req.method !== 'POST' || req.url !== '/api/completions') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const request = JSON.parse(body);
      console.log('Received completion request:', {
        language: request.language,
        fileName: request.fileName,
        cursorLine: request.cursorPosition?.line,
      });

      // Get suggestions based on language
      const language = request.language || 'default';
      const suggestions = completionsByLanguage[language] || completionsByLanguage.default;

      const response = {
        suggestions: suggestions,
        metadata: {
          sessionId: request.sessionId || null,
          userId: request.userId || null,
          timestamp: new Date().toISOString(),
        }
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));

      console.log(`Returned ${suggestions.length} suggestions for ${language}`);
    } catch (error) {
      console.error('Error processing request:', error);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Invalid request',
        message: error.message 
      }));
    }
  });
});

server.listen(port, () => {
  console.log(`Dummy backend server running at http://localhost:${port}`);
  console.log('API endpoint: POST /api/completions');
  console.log('\nExample request:');
  console.log(JSON.stringify({
    content: 'const x = ',
    cursorPosition: { line: 0, character: 10 },
    fileName: 'test.js',
    language: 'javascript'
  }, null, 2));
});
