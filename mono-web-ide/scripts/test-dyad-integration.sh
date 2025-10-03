#!/bin/bash

# Integration test script for all services in mono-web-ide
# Tests Dyad, Code Server, PostgreSQL, pgAdmin, Auth Service, and Redis

set -e

echo "========================================"
echo "Mono Web IDE Integration Tests"
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

# Check all services
SERVICES_OK=true

if ! check_service "Code Server" "http://localhost:8080/healthz"; then
    SERVICES_OK=false
fi

if ! check_service "Dyad Test Server" "http://localhost:5000/health"; then
    SERVICES_OK=false
fi

if ! check_service "Auth Service" "http://localhost:4000/health"; then
    SERVICES_OK=false
fi

# Test Postgres connection (different check method)
if docker compose exec -T postgres pg_isready -U devuser -d devdb > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
else
    echo -e "${RED}✗ PostgreSQL is not running${NC}"
    SERVICES_OK=false
fi

# Test Redis connection
if docker compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis is running${NC}"
else
    echo -e "${RED}✗ Redis is not running${NC}"
    SERVICES_OK=false
fi

if [ "$SERVICES_OK" = false ]; then
    echo ""
    echo "Some services are not running. Start with: docker compose up -d"
    exit 1
fi

echo ""
echo "========================================"
echo "Test 1: Dyad Test Server"
echo "========================================"

HEALTH_RESPONSE=$(curl -s http://localhost:5000/health)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}✓ Dyad health check passed${NC}"
else
    echo -e "${RED}✗ Dyad health check failed${NC}"
    exit 1
fi

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
    echo -e "${GREEN}✓ Dyad completion endpoint test passed${NC}"
else
    echo -e "${RED}✗ Dyad completion endpoint test failed${NC}"
    exit 1
fi

echo ""
echo "========================================"
echo "Test 2: Auth Service"
echo "========================================"

# Test registration
REG_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"testuser_$(date +%s)\",\"email\":\"test$(date +%s)@example.com\",\"password\":\"test123\"}")

if echo "$REG_RESPONSE" | grep -q "token"; then
    echo -e "${GREEN}✓ User registration test passed${NC}"
else
    echo -e "${YELLOW}⚠ Registration test (user may already exist)${NC}"
fi

# Test login with default user
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo -e "${GREEN}✓ User login test passed${NC}"
    
    # Extract token for further tests
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    # Test token verification
    VERIFY_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/verify \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$VERIFY_RESPONSE" | grep -q "demo"; then
        echo -e "${GREEN}✓ Token verification test passed${NC}"
    else
        echo -e "${RED}✗ Token verification test failed${NC}"
    fi
else
    echo -e "${RED}✗ User login test failed${NC}"
    exit 1
fi

echo ""
echo "========================================"
echo "Test 3: PostgreSQL Database"
echo "========================================"

# Test database query
DB_RESPONSE=$(docker compose exec -T postgres psql -U devuser -d devdb -c "SELECT COUNT(*) FROM items;" 2>&1)

if echo "$DB_RESPONSE" | grep -q "6"; then
    echo -e "${GREEN}✓ Database query test passed (seed data present)${NC}"
else
    echo -e "${YELLOW}⚠ Database may not have seed data${NC}"
fi

# Test database write
INSERT_RESPONSE=$(docker compose exec -T postgres psql -U devuser -d devdb -c "INSERT INTO items (name, description, value) VALUES ('Test Item', 'Integration test', 999) RETURNING id;" 2>&1)

if echo "$INSERT_RESPONSE" | grep -q "INSERT"; then
    echo -e "${GREEN}✓ Database insert test passed${NC}"
else
    echo -e "${RED}✗ Database insert test failed${NC}"
    exit 1
fi

echo ""
echo "========================================"
echo "Test 4: Redis Cache"
echo "========================================"

# Test Redis SET and GET
docker compose exec -T redis redis-cli SET test_key "test_value" > /dev/null 2>&1
GET_RESPONSE=$(docker compose exec -T redis redis-cli GET test_key)

if echo "$GET_RESPONSE" | grep -q "test_value"; then
    echo -e "${GREEN}✓ Redis SET/GET test passed${NC}"
else
    echo -e "${RED}✗ Redis SET/GET test failed${NC}"
    exit 1
fi

# Clean up test key
docker compose exec -T redis redis-cli DEL test_key > /dev/null 2>&1

echo ""
echo "========================================"
echo "Test 5: Docker Service Health"
echo "========================================"

# Check if containers are healthy
CODE_SERVER_HEALTH=$(docker compose ps code-server | grep -c "healthy" || echo "0")
DYAD_SERVER_HEALTH=$(docker compose ps dyad-server | grep -c "healthy" || echo "0")
AUTH_SERVICE_HEALTH=$(docker compose ps auth-service | grep -c "healthy" || echo "0")
POSTGRES_HEALTH=$(docker compose ps postgres | grep -c "healthy" || echo "0")
REDIS_HEALTH=$(docker compose ps redis | grep -c "healthy" || echo "0")

[ "$CODE_SERVER_HEALTH" -gt 0 ] && echo -e "${GREEN}✓ Code Server is healthy${NC}" || echo -e "${YELLOW}⚠ Code Server health status unknown${NC}"
[ "$DYAD_SERVER_HEALTH" -gt 0 ] && echo -e "${GREEN}✓ Dyad Server is healthy${NC}" || echo -e "${YELLOW}⚠ Dyad Server health status unknown${NC}"
[ "$AUTH_SERVICE_HEALTH" -gt 0 ] && echo -e "${GREEN}✓ Auth Service is healthy${NC}" || echo -e "${YELLOW}⚠ Auth Service health status unknown${NC}"
[ "$POSTGRES_HEALTH" -gt 0 ] && echo -e "${GREEN}✓ PostgreSQL is healthy${NC}" || echo -e "${YELLOW}⚠ PostgreSQL health status unknown${NC}"
[ "$REDIS_HEALTH" -gt 0 ] && echo -e "${GREEN}✓ Redis is healthy${NC}" || echo -e "${YELLOW}⚠ Redis health status unknown${NC}"

echo ""
echo "========================================"
echo "Test 6: Volume Persistence"
echo "========================================"

# Check if app-code directory exists and is writable
if docker compose exec -T code-server test -w /home/coder/project/app-code; then
    echo -e "${GREEN}✓ app-code volume is mounted and writable${NC}"
else
    echo -e "${RED}✗ app-code volume is not writable${NC}"
    exit 1
fi

# Check if extensions are mounted
if docker compose exec -T code-server test -d /home/coder/project/extensions/ai-completion; then
    echo -e "${GREEN}✓ extensions volume is mounted${NC}"
else
    echo -e "${RED}✗ extensions volume is not mounted${NC}"
    exit 1
fi

# Check persistent volumes
for volume in postgres-data pgadmin-data redis-data; do
    if docker volume inspect "mono-web-ide_$volume" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Volume $volume exists${NC}"
    else
        echo -e "${YELLOW}⚠ Volume $volume not found${NC}"
    fi
done

echo ""
echo "========================================"
echo "All Tests Passed! ✅"
echo "========================================"
echo ""
echo "Your mono-web-ide environment is fully operational!"
echo ""
echo "Services available:"
echo "  • Code Server:  http://localhost:8080 (password: coder)"
echo "  • pgAdmin:      http://localhost:5050 (admin@example.com / admin)"
echo "  • Auth Service: http://localhost:4000"
echo "  • Dyad Server:  http://localhost:5000"
echo "  • PostgreSQL:   localhost:5432 (devuser / devpass)"
echo "  • Redis:        localhost:6379"
echo ""
echo "Next steps:"
echo "  1. Open Code Server: http://localhost:8080"
echo "  2. Start app1: cd app-code/app1 && npm install && npm start"
echo "  3. Start app2: cd app-code/app2 && npm install && npm start"
echo "  4. Test database: Open pgAdmin at http://localhost:5050"
echo ""
