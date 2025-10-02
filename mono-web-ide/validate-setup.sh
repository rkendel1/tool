#!/bin/bash

# Validation script to check if all files are in place
# This validates the setup without running Docker

set -e

echo "========================================="
echo "Mono Web IDE - Setup Validation"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

# Function to check if file exists
check_file() {
    local file=$1
    local desc=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $desc"
    else
        echo -e "${RED}✗${NC} $desc (missing: $file)"
        ERRORS=$((ERRORS + 1))
    fi
}

# Function to check if directory exists
check_dir() {
    local dir=$1
    local desc=$2
    
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $desc"
    else
        echo -e "${RED}✗${NC} $desc (missing: $dir)"
        ERRORS=$((ERRORS + 1))
    fi
}

echo "Checking Docker configuration files..."
check_file "docker-compose.yml" "Docker Compose configuration"
check_file "Dockerfile-codeserver" "Code Server Dockerfile"
check_file "Dockerfile-dyad-server" "Dyad Server Dockerfile"
check_file "Dockerfile-auth-service" "Auth Service Dockerfile"
echo ""

echo "Checking service implementation files..."
check_file "dyad-test-server.js" "Dyad test server"
check_file "auth-service.js" "Auth service"
check_file "auth-package.json" "Auth service package.json"
echo ""

echo "Checking configuration files..."
check_file ".env.example" "Environment variables template"
check_file "setup.sh" "Setup script"
echo ""

echo "Checking database initialization..."
check_dir "postgres-init" "Postgres init directory"
check_file "postgres-init/01-init.sql" "Database initialization SQL"
echo ""

echo "Checking pgAdmin configuration..."
check_dir "pgadmin-config" "pgAdmin config directory"
check_file "pgadmin-config/servers.json" "pgAdmin server configuration"
echo ""

echo "Checking application code..."
check_dir "app-code" "Application code directory"
check_dir "app-code/app1" "App1 (React)"
check_dir "app-code/app2" "App2 (Express)"
check_file "app-code/app1/.env.example" "App1 environment template"
check_file "app-code/app2/.env.example" "App2 environment template"
check_file "app-code/app2/index.js" "App2 simple version"
check_file "app-code/app2/index-with-db.js" "App2 DB-integrated version"
echo ""

echo "Checking documentation..."
check_file "README.md" "Main README"
check_file "QUICKSTART.md" "Quick start guide"
check_file "ARCHITECTURE.md" "Architecture documentation"
check_file "IMPLEMENTATION_SUMMARY.md" "Implementation summary"
echo ""

echo "Checking scripts..."
check_dir "scripts" "Scripts directory"
check_file "scripts/test-dyad-integration.sh" "Integration test script"
echo ""

echo "Validating docker-compose.yml syntax..."
if docker compose config > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} docker-compose.yml is valid"
else
    echo -e "${RED}✗${NC} docker-compose.yml has syntax errors"
    ERRORS=$((ERRORS + 1))
fi
echo ""

echo "Checking for required services in docker-compose.yml..."
SERVICES=("code-server" "dyad-server" "postgres" "pgadmin" "auth-service" "redis")
for service in "${SERVICES[@]}"; do
    if docker compose config --services | grep -q "^${service}$"; then
        echo -e "${GREEN}✓${NC} Service: $service"
    else
        echo -e "${RED}✗${NC} Service missing: $service"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

echo "========================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}All validation checks passed! ✅${NC}"
    echo "========================================="
    echo ""
    echo "Your mono-web-ide is ready!"
    echo ""
    echo "Next steps:"
    echo "  1. Run: ./setup.sh"
    echo "  2. Run: docker compose up -d"
    echo "  3. Access Code Server at http://localhost:8080"
    echo "  4. Access pgAdmin at http://localhost:5050"
    echo ""
    exit 0
else
    echo -e "${RED}Found $ERRORS error(s)! ✗${NC}"
    echo "========================================="
    exit 1
fi
