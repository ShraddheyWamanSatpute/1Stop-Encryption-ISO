#!/bin/bash
# Setup script for development environment
# Installs dependencies for both main app and YourStop

echo "Setting up 1Stop Development Environment..."
echo ""

# Install main app dependencies
echo "Installing main app dependencies..."
npm install

# Install YourStop frontend dependencies
echo "Installing YourStop frontend dependencies..."
cd src/yourstop/frontend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "YourStop dependencies already installed"
fi

# Install YourStop backend dependencies (if needed)
echo "Installing YourStop backend dependencies..."
cd ../backend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "YourStop backend dependencies already installed"
fi

# Return to root
cd ../../../../

echo ""
echo "✓ Setup complete!"
echo ""
echo "To start both apps, run:"
echo "  npm run dev:all"
echo ""
echo "Or start separately:"
echo "  npm run dev          (main app)"
echo "  npm run dev:yourstop (YourStop)"

