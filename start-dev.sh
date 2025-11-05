#!/bin/bash

echo "🚀 Starting LakeB2B Social Post Generator..."

# Kill any existing processes on ports 3000, 3001, and 3002
# (Next.js auto-increments ports if 3000 is busy, causing conflicts)
echo "📡 Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true

# Clear Next.js cache
echo "🧹 Clearing cache..."
rm -rf .next

# Start the development server
echo "⚡ Starting development server on port 3000..."
npm run dev

echo "✅ Server should be running at http://localhost:3000"