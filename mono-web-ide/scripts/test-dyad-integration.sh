#!/bin/bash

# Integration test script for Dyad test server in Docker environment
# This script tests the Dyad test server and Code Server integration

set -e

echo "========================================"
echo "Dyad Integration Test (Docker)"
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if service is running
check_service() {
    local service=$1
    local url=$2
    
    if curl -s "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ $service is running${NC}"
        return 0
    else
        echo -e "${RED}✗ $service is not running${NC}"
        echo "  URL checked: $url"
        return 1
    fi
}

# Check if Docker Compose is running
echo -e "${YELLOW}Checking if services are running...${NC}"
echo ""

# Check Code Server
if ! check_service "Code Server" "http://localhost:8080/healthz"; then
    echo "  Start with: docker-compose up"
    exit 1
fi

# Check Dyad Test Server
if ! check_service "Dyad Test Server" "http://localhost:5000/health"; then
    echo "  Start with: docker-compose up"
    exit 1
fi

echo ""
echo "========================================"
echo "Test 1: Dyad Test Server Health Check"
echo "========================================"

HEALTH_RESPONSE=$(curl -s http://localhost:5000/health)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}✓ Test server health check passed${NC}"
    echo "  Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}✗ Test server health check failed${NC}"
    exit 1
fi

echo ""
echo "========================================"
echo "Test 2: Dyad Completion Endpoint"
echo "========================================"

TEST_REQUEST='{
  "sessionId": "test-session-123",
  "userId": "test-user-456",
  "code": "const x = ",
  "cursorPosition": {"line": 0, "character": 10},
  "language": "javascript",
  "fileName": "test.js"
}'

RESPONSE=$(curl -s -X POST http://localhost:5000/completion \
  -H "Content-Type: application/json" \
  -d "$TEST_REQUEST")

if echo "$RESPONSE" | grep -q "completions"; then
    echo -e "${GREEN}✓ Completion endpoint test passed${NC}"
    echo "  Received completions successfully"
else
    echo -e "${RED}✗ Completion endpoint test failed${NC}"
    echo "  Response: $RESPONSE"
    exit 1
fi

echo ""
echo "========================================"
echo "Test 3: Docker Service Status"
echo "========================================"

# Check if containers are healthy
CODE_SERVER_HEALTH=$(docker-compose ps code-server | grep -c "healthy" || echo "0")
DYAD_SERVER_HEALTH=$(docker-compose ps dyad-server | grep -c "healthy" || echo "0")

if [ "$CODE_SERVER_HEALTH" -gt 0 ]; then
    echo -e "${GREEN}✓ Code Server container is healthy${NC}"
else
    echo -e "${YELLOW}⚠ Code Server container health status unknown${NC}"
fi

if [ "$DYAD_SERVER_HEALTH" -gt 0 ]; then
    echo -e "${GREEN}✓ Dyad Server container is healthy${NC}"
else
    echo -e "${YELLOW}⚠ Dyad Server container health status unknown${NC}"
fi

echo ""
echo "========================================"
echo "Test 4: Volume Persistence"
echo "========================================"

# Check if app-code directory exists and is writable
if docker-compose exec -T code-server test -w /home/coder/project/app-code; then
    echo -e "${GREEN}✓ app-code volume is mounted and writable${NC}"
else
    echo -e "${RED}✗ app-code volume is not writable${NC}"
    exit 1
fi

# Check if extensions are mounted
if docker-compose exec -T code-server test -d /home/coder/project/extensions/ai-completion; then
    echo -e "${GREEN}✓ extensions volume is mounted${NC}"
else
    echo -e "${RED}✗ extensions volume is not mounted${NC}"
    exit 1
fi

echo ""
echo "========================================"
echo "All Tests Passed! ✅"
echo "========================================"
echo ""
echo "Your mono-web-ide environment is ready to use!"
echo ""
echo "Next steps:"
echo "  1. Open Code Server: http://localhost:8080"
echo "  2. Start app1: cd app-code/app1 && npm install && npm start"
echo "  3. Start app2: cd app-code/app2 && npm install && npm start"
echo ""
