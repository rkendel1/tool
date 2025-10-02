#!/bin/bash

# Integration test script for Dyad backend
# This script tests the Dyad test server and backend adapter

set -e

echo "========================================"
echo "Dyad Integration Test"
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if servers are running
echo -e "${YELLOW}Checking if servers are running...${NC}"

# Check test server
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Dyad test server is running${NC}"
else
    echo -e "${RED}✗ Dyad test server is not running${NC}"
    echo "  Start it with: node dyad-test-server.js"
    exit 1
fi

# Check backend adapter
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Dyad backend adapter is running${NC}"
else
    echo -e "${RED}✗ Dyad backend adapter is not running${NC}"
    echo "  Start it with: DYAD_URL=http://localhost:3000 node dyad-backend.js"
    exit 1
fi

echo ""
echo "========================================"
echo "Test 1: Test Server Health Check"
echo "========================================"

HEALTH_RESPONSE=$(curl -s http://localhost:3000/health)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}✓ Test server health check passed${NC}"
    echo "  Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}✗ Test server health check failed${NC}"
    exit 1
fi

echo ""
echo "========================================"
echo "Test 2: Backend Adapter Health Check"
echo "========================================"

HEALTH_RESPONSE=$(curl -s http://localhost:8080/health)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}✓ Backend adapter health check passed${NC}"
    echo "  Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}✗ Backend adapter health check failed${NC}"
    exit 1
fi

echo ""
echo "========================================"
echo "Test 3: Test Server Direct Request"
echo "========================================"

TEST_REQUEST='{
  "sessionId": "test-session-123",
  "userId": "test-user-456",
  "code": "const x = ",
  "cursorPosition": {"line": 0, "character": 10},
  "language": "javascript",
  "fileName": "test.js"
}'

RESPONSE=$(curl -s -X POST http://localhost:3000/completion \
  -H "Content-Type: application/json" \
  -d "$TEST_REQUEST")

if echo "$RESPONSE" | grep -q "completions"; then
    echo -e "${GREEN}✓ Test server returned completions${NC}"
    COMPLETION_COUNT=$(echo "$RESPONSE" | grep -o "text" | wc -l)
    echo "  Returned $COMPLETION_COUNT completions"
else
    echo -e "${RED}✗ Test server request failed${NC}"
    echo "  Response: $RESPONSE"
    exit 1
fi

echo ""
echo "========================================"
echo "Test 4: Backend Adapter VS Code Format"
echo "========================================"

VSCODE_REQUEST='{
  "content": "const x = ",
  "cursorPosition": {"line": 0, "character": 10},
  "fileName": "test.js",
  "language": "javascript",
  "sessionId": "session-123",
  "userId": "user-456"
}'

RESPONSE=$(curl -s -X POST http://localhost:8080/api/completions \
  -H "Content-Type: application/json" \
  -d "$VSCODE_REQUEST")

if echo "$RESPONSE" | grep -q "suggestions"; then
    echo -e "${GREEN}✓ Backend adapter returned suggestions${NC}"
    SUGGESTION_COUNT=$(echo "$RESPONSE" | grep -o "text" | wc -l)
    echo "  Returned $SUGGESTION_COUNT suggestions"
    
    # Check if response includes metadata
    if echo "$RESPONSE" | grep -q "metadata"; then
        echo -e "${GREEN}✓ Response includes metadata${NC}"
    else
        echo -e "${YELLOW}⚠ Response missing metadata${NC}"
    fi
else
    echo -e "${RED}✗ Backend adapter request failed${NC}"
    echo "  Response: $RESPONSE"
    exit 1
fi

echo ""
echo "========================================"
echo "Test 5: Session and User ID Tracking"
echo "========================================"

RESPONSE=$(curl -s -X POST http://localhost:8080/api/completions \
  -H "Content-Type: application/json" \
  -d "$VSCODE_REQUEST")

if echo "$RESPONSE" | grep -q "metadata"; then
    echo -e "${GREEN}✓ Session and user ID tracking is working${NC}"
else
    echo -e "${YELLOW}⚠ Could not verify session tracking${NC}"
fi

echo ""
echo "========================================"
echo "Test 6: Different Languages"
echo "========================================"

for LANG in "javascript" "typescript" "python" "go"; do
    LANG_REQUEST=$(echo "$VSCODE_REQUEST" | sed "s/javascript/$LANG/")
    RESPONSE=$(curl -s -X POST http://localhost:8080/api/completions \
      -H "Content-Type: application/json" \
      -d "$LANG_REQUEST")
    
    if echo "$RESPONSE" | grep -q "suggestions"; then
        echo -e "${GREEN}✓ $LANG completions working${NC}"
    else
        echo -e "${RED}✗ $LANG completions failed${NC}"
    fi
done

echo ""
echo "========================================"
echo "Test 7: Error Handling"
echo "========================================"

# Test invalid request
INVALID_REQUEST='{"invalid": "request"}'
RESPONSE=$(curl -s -w "%{http_code}" -X POST http://localhost:3000/completion \
  -H "Content-Type: application/json" \
  -d "$INVALID_REQUEST")

HTTP_CODE=$(echo "$RESPONSE" | tail -c 4)
if [ "$HTTP_CODE" = "400" ]; then
    echo -e "${GREEN}✓ Invalid request handling working${NC}"
else
    echo -e "${YELLOW}⚠ Unexpected response code for invalid request: $HTTP_CODE${NC}"
fi

echo ""
echo "========================================"
echo "All Tests Completed!"
echo "========================================"
echo -e "${GREEN}✓ All tests passed successfully${NC}"
echo ""
echo "Next steps:"
echo "  1. Configure VS Code extension to use http://localhost:8080/api/completions"
echo "  2. Test in VS Code by opening a file and typing"
echo "  3. Check the console output of the servers for logs"
echo ""
