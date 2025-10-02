#!/bin/bash

# Script to start app2 development server
# Usage: ./start-app2.sh

echo "Starting App2 (Express API)..."
echo ""

cd ../app-code/app2 || exit 1

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo ""
echo "Starting development server on port 3001..."
echo "Access at: http://localhost:3001"
echo ""

npm run dev
