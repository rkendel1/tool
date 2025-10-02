#!/bin/bash

# Script to start app1 development server
# Usage: ./start-app1.sh

echo "Starting App1 (React)..."
echo ""

cd ../app-code/app1 || exit 1

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo ""
echo "Starting development server on port 3000..."
echo "Access at: http://localhost:3000"
echo ""

npm start
