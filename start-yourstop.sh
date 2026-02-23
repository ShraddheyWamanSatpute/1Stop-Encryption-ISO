#!/bin/bash
# Bash script to start YourStop Next.js app
# Run this in a separate terminal while the main app is running

echo "Starting YourStop Next.js Application..."
echo ""

# Navigate to YourStop frontend directory
cd src/yourstop/frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the Next.js development server
echo "Starting Next.js dev server on http://localhost:3000"
echo "Access YourStop at: http://localhost:3000"
echo "Or via main app: http://localhost:5173/YourStop"
echo ""

npm run dev

