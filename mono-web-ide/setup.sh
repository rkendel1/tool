#!/bin/bash

# Setup script for mono-web-ide
# This script prepares the environment before running docker-compose

set -e

echo "========================================="
echo "Mono Web IDE - Setup"
echo "========================================="
echo ""

# Check if we're in the correct directory
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: Please run this script from the mono-web-ide directory"
    exit 1
fi

# Copy dyad-test-server.js if it doesn't exist
if [ ! -f "dyad-test-server.js" ]; then
    echo "Copying dyad-test-server.js from extensions directory..."
    if [ -f "../extensions/ai-completion/dyad-test-server.js" ]; then
        cp ../extensions/ai-completion/dyad-test-server.js .
        echo "✓ dyad-test-server.js copied successfully"
    else
        echo "Error: ../extensions/ai-completion/dyad-test-server.js not found"
        exit 1
    fi
else
    echo "✓ dyad-test-server.js already exists"
fi

# Create .env file from .env.example if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "✓ .env file created"
    echo ""
    echo "Note: You can edit .env to customize your configuration"
else
    echo "✓ .env file already exists"
fi

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "You can now start the environment with:"
echo "  docker compose up"
echo ""
echo "Or run in detached mode:"
echo "  docker compose up -d"
echo ""
