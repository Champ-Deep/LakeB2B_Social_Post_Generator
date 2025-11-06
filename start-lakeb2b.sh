#!/bin/bash

# LakeB2B Social Post Generator - Unified Startup Script
# This script provides bulletproof startup with automatic recovery

echo "🚀 LakeB2B Social Post Generator - Starting Application"
echo "======================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    log_error "Please run this script from the project root directory"
    exit 1
fi

# Kill any existing processes
log_info "Cleaning up existing processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "node.*supervisor" 2>/dev/null || true

# Clean up ports
for port in 3000 3001 3002; do
    if lsof -ti:$port >/dev/null 2>&1; then
        log_warning "Killing process on port $port"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
    fi
done

sleep 2

# Choose startup method
if [ "$1" = "--simple" ]; then
    log_info "Starting with simple mode (npm run dev)..."
    npm run dev
elif [ "$1" = "--supervised" ]; then
    log_info "Starting with supervisor (automatic recovery enabled)..."
    npm run dev:supervised
else
    log_info "Choose startup mode:"
    echo "  1. Simple mode (npm run dev)"
    echo "  2. Supervised mode (automatic recovery)"
    echo "  3. Validation only"
    echo ""
    read -p "Enter your choice (1-3): " choice
    
    case $choice in
        1)
            log_info "Starting simple mode..."
            npm run dev
            ;;
        2)
            log_info "Starting supervised mode..."
            npm run dev:supervised
            ;;
        3)
            log_info "Running validation only..."
            npm run validate
            ;;
        *)
            log_error "Invalid choice. Starting simple mode as default..."
            npm run dev
            ;;
    esac
fi