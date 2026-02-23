#!/bin/bash

echo "========================================"
echo "   Book My Table - Quick Start"
echo "========================================"
echo

echo "Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "Error installing backend dependencies!"
    exit 1
fi

echo
echo "Installing frontend dependencies..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo "Error installing frontend dependencies!"
    exit 1
fi

echo
echo "========================================"
echo "   Setup Complete!"
echo "========================================"
echo
echo "To start the application:"
echo "1. Open two terminals"
echo "2. In first terminal: cd backend && npm run dev"
echo "3. In second terminal: cd frontend && npm run dev"
echo "4. Open browser to http://localhost:3000"
echo
