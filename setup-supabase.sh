#!/bin/bash

# Supabase Local Development Setup Script
# This script helps you get started with Supabase quickly

set -e

echo "========================================="
echo "Supabase Local Development Setup"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗${NC} Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

echo -e "${GREEN}✓${NC} Docker is installed"

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo -e "${RED}✗${NC} Docker Compose is not available. Please install Docker Compose V2."
    exit 1
fi

echo -e "${GREEN}✓${NC} Docker Compose is available"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo ""
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo -e "${GREEN}✓${NC} .env file created"
    echo ""
    echo -e "${YELLOW}Note:${NC} Default configuration is set for local development."
    echo "For production, please update the following in .env:"
    echo "  - POSTGRES_PASSWORD"
    echo "  - JWT_SECRET"
    echo "  - ANON_KEY and SERVICE_ROLE_KEY"
    echo "  - SMTP settings"
else
    echo -e "${GREEN}✓${NC} .env file already exists"
fi

echo ""
echo "========================================="
echo "Checking required directories..."
echo "========================================="

# Create directories if they don't exist
mkdir -p volumes/api
mkdir -p volumes/db
mkdir -p volumes/storage
mkdir -p volumes/functions/main

echo -e "${GREEN}✓${NC} Required directories are ready"

echo ""
echo "========================================="
echo "Verifying database migration files..."
echo "========================================="

# Check for required migration files
REQUIRED_FILES=(
    "volumes/db/roles.sql"
    "volumes/db/realtime.sql"
    "volumes/db/99-create-users.sh"
    "volumes/db/jwt.sql"
    "volumes/db/05-auth-schema.sql"
    "volumes/db/06-storage-schema.sql"
)

MISSING_FILES=()
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -eq 0 ]; then
    echo -e "${GREEN}✓${NC} All required migration files are present"
else
    echo -e "${RED}✗${NC} Missing migration files:"
    for file in "${MISSING_FILES[@]}"; do
        echo "  - $file"
    done
    echo ""
    echo "Please ensure all migration files are present in volumes/db/"
    exit 1
fi

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Start Supabase:"
echo "   ${GREEN}docker compose up -d${NC}"
echo ""
echo "2. Check service status:"
echo "   ${GREEN}docker compose ps${NC}"
echo ""
echo "3. View logs:"
echo "   ${GREEN}docker compose logs -f${NC}"
echo ""
echo "4. Access Supabase Studio:"
echo "   ${GREEN}http://localhost:3000${NC}"
echo ""
echo "5. Access API Gateway:"
echo "   ${GREEN}http://localhost:8000${NC}"
echo ""
echo "For detailed documentation, see: SUPABASE_SETUP.md"
echo ""
echo "To stop all services:"
echo "   ${GREEN}docker compose down${NC}"
echo ""
echo "To stop and remove all data (CAUTION):"
echo "   ${RED}docker compose down -v${NC}"
echo ""
