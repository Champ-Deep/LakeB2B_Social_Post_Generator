#!/bin/bash

# LakeB2B Social Post Generator - macOS Launcher
# Double-click this file to start the server

# Change to the directory containing this script
cd "$(dirname "$0")"

echo "🚀 LakeB2B Social Post Generator"
echo "==============================="
echo ""
echo "Starting development server..."
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not available"
    echo "Please ensure Node.js is properly installed"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Could not find package.json"
    echo "Please ensure this script is in the project root directory"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        echo ""
        read -p "Press Enter to exit..."
        exit 1
    fi
    echo "✅ Dependencies installed successfully"
    echo ""
fi

# Start the auto-start service
echo "🎯 Starting auto-start service..."
npm run start:auto

# Keep terminal open if there's an error
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Failed to start server"
    echo "Try running 'npm run restart' in Terminal"
    echo ""
    read -p "Press Enter to exit..."
fi