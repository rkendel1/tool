#!/bin/bash
# Integration test for AI Completion Extension
# This script verifies the extension builds and basic structure is correct

set -e

echo "=== AI Completion Extension Integration Test ==="
echo ""

# Navigate to extension directory
cd "$(dirname "$0")"

echo "✓ Extension directory found"

# Check required files exist
echo "Checking required files..."
required_files=(
  "package.json"
  "tsconfig.json"
  "extension.ts"
  "README.md"
  "INSTALLATION.md"
  "dummy-backend.js"
)

for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "✗ Missing required file: $file"
    exit 1
  fi
  echo "  ✓ $file"
done

# Check package.json structure
echo ""
echo "Validating package.json..."
if ! jq -e '.name == "ai-completion"' package.json > /dev/null; then
  echo "✗ Invalid package name"
  exit 1
fi
echo "  ✓ Package name correct"

if ! jq -e '.main == "./extension.js"' package.json > /dev/null; then
  echo "✗ Invalid main entry point"
  exit 1
fi
echo "  ✓ Main entry point correct"

if ! jq -e '.contributes.configuration' package.json > /dev/null; then
  echo "✗ Missing configuration contribution"
  exit 1
fi
echo "  ✓ Configuration contribution present"

# Install dependencies if needed
echo ""
echo "Installing dependencies..."
npm install --quiet
echo "  ✓ Dependencies installed"

# Build extension
echo ""
echo "Building extension..."
npm run build > /dev/null 2>&1
echo "  ✓ Build successful"

# Check compiled output exists
if [ ! -f "extension.js" ]; then
  echo "✗ Compiled extension.js not found"
  exit 1
fi
echo "  ✓ Compiled extension.js exists"

# Check extension.js is valid JavaScript
if ! node -c extension.js 2>/dev/null; then
  echo "✗ extension.js is not valid JavaScript"
  exit 1
fi
echo "  ✓ extension.js is valid JavaScript"

# Check dummy backend is valid
echo ""
echo "Validating dummy backend..."
if ! node -c dummy-backend.js 2>/dev/null; then
  echo "✗ dummy-backend.js is not valid JavaScript"
  exit 1
fi
echo "  ✓ dummy-backend.js is valid JavaScript"

# Test dummy backend functionality
echo ""
echo "Testing dummy backend..."
PORT=9191 node dummy-backend.js > /tmp/backend-test.log 2>&1 &
BACKEND_PID=$!
sleep 2

# Test API endpoint
response=$(curl -s -X POST http://localhost:9191/api/completions \
  -H "Content-Type: application/json" \
  -d '{"content":"test","cursorPosition":{"line":0,"character":4},"fileName":"test.js","language":"javascript"}' || echo "FAILED")

# Cleanup
kill $BACKEND_PID 2>/dev/null || true

if [[ "$response" == "FAILED" ]] || ! echo "$response" | jq -e '.suggestions' > /dev/null 2>&1; then
  echo "✗ Backend API test failed"
  echo "Response: $response"
  exit 1
fi
echo "  ✓ Backend API returns valid responses"

# Summary
echo ""
echo "==================================="
echo "✓ All integration tests passed!"
echo "==================================="
echo ""
echo "Extension is ready to use."
echo ""
echo "To install:"
echo "  ln -s \"\$(pwd)\" ~/.local/share/code-server/extensions/ai-completion"
echo ""
echo "To start dummy backend:"
echo "  node dummy-backend.js"
echo ""
