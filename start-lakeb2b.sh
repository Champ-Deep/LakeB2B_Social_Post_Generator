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

# Enhanced port cleanup with retry logic
cleanup_ports() {
    local ports=(3000 3001 3002)
    local max_attempts=3
    
    for port in "${ports[@]}"; do
        local attempt=1
        while [ $attempt -le $max_attempts ]; do
            if lsof -ti:$port >/dev/null 2>&1; then
                log_warning "Attempt $attempt: Killing process on port $port"
                lsof -ti:$port | xargs kill -9 2>/dev/null || true
                sleep 1
                
                # Verify port is actually free
                if ! lsof -ti:$port >/dev/null 2>&1; then
                    log_success "Port $port successfully freed"
                    break
                fi
            else
                log_info "Port $port is already free"
                break
            fi
            ((attempt++))
        done
        
        # Final check - if port still occupied, use different approach
        if lsof -ti:$port >/dev/null 2>&1; then
            log_warning "Force killing stubborn process on port $port"
            pkill -f ".*:$port" 2>/dev/null || true
            sleep 2
        fi
    done
}

# Function to find available port
find_available_port() {
    local start_port=3000
    local max_port=3010
    
    for ((port=$start_port; port<=$max_port; port++)); do
        if ! lsof -ti:$port >/dev/null 2>&1; then
            echo $port
            return 0
        fi
    done
    
    log_error "No available ports found between $start_port and $max_port"
    return 1
}

# Function to wait for server to be ready
wait_for_server() {
    local port=$1
    local max_wait=60
    local wait_time=0
    
    log_info "Waiting for server to be ready on port $port..."
    
    while [ $wait_time -lt $max_wait ]; do
        if curl -s "http://localhost:$port/api/health" >/dev/null 2>&1; then
            log_success "Server is ready on port $port"
            return 0
        fi
        sleep 2
        ((wait_time+=2))
        echo -n "."
    done
    
    echo ""
    log_error "Server failed to start within ${max_wait}s"
    return 1
}

# Clean up existing processes and ports
log_info "Cleaning up existing processes and ports..."
cleanup_ports

# Start server with enhanced monitoring
start_server() {
    local mode=$1
    local available_port
    
    # Find available port
    available_port=$(find_available_port)
    if [ $? -ne 0 ]; then
        log_error "Failed to find available port"
        exit 1
    fi
    
    log_info "Using port $available_port"
    
    # Export port for Next.js to use
    export PORT=$available_port
    
    case $mode in
        "simple")
            log_info "Starting simple mode on port $available_port..."
            npm run dev -- --port $available_port &
            SERVER_PID=$!
            ;;
        "supervised")
            log_info "Starting supervised mode on port $available_port..."
            PORT=$available_port npm run dev:supervised &
            SERVER_PID=$!
            ;;
        "validate")
            log_info "Running validation only..."
            npm run validate
            return $?
            ;;
        *)
            log_error "Unknown mode: $mode"
            return 1
            ;;
    esac
    
    # Wait for server to be ready
    if [ "$mode" != "validate" ]; then
        sleep 5  # Give server time to start
        if wait_for_server $available_port; then
            log_success "🎉 LakeB2B Social Post Generator is ready!"
            log_success "🌐 Open: http://localhost:$available_port"
            log_info "Press Ctrl+C to stop the server"
            
            # Keep script running and handle shutdown gracefully
            trap "log_info 'Shutting down server...'; kill $SERVER_PID 2>/dev/null; cleanup_ports; exit 0" INT TERM
            wait $SERVER_PID
        else
            log_error "Server failed to start properly"
            kill $SERVER_PID 2>/dev/null
            cleanup_ports
            exit 1
        fi
    fi
}

# Choose startup method
if [ "$1" = "--simple" ]; then
    start_server "simple"
elif [ "$1" = "--supervised" ]; then
    start_server "supervised"
elif [ "$1" = "--validate" ]; then
    start_server "validate"
elif [ "$1" = "--auto" ]; then
    log_info "Starting auto-start service..."
    npm run start:auto
elif [ "$1" = "--status" ]; then
    log_info "Checking server status..."
    npm run server:status
elif [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "LakeB2B Social Post Generator - Startup Options"
    echo "=============================================="
    echo ""
    echo "Usage: $0 [option]"
    echo ""
    echo "Options:"
    echo "  --simple      Start in simple mode (npm run dev)"
    echo "  --supervised  Start with process supervision"
    echo "  --auto        Start with auto-restart service (recommended)"
    echo "  --validate    Run validation only"
    echo "  --status      Check server status"
    echo "  --help, -h    Show this help message"
    echo ""
    echo "Recommended: $0 --auto"
    exit 0
else
    log_info "Choose startup mode:"
    echo "  1. Simple mode (npm run dev)"
    echo "  2. Supervised mode (automatic recovery)"
    echo "  3. Auto-restart service (recommended)"
    echo "  4. Validation only"
    echo "  5. Check status"
    echo ""
    read -p "Enter your choice (1-5): " choice
    
    case $choice in
        1)
            start_server "simple"
            ;;
        2)
            start_server "supervised"
            ;;
        3)
            log_info "Starting auto-restart service..."
            npm run start:auto
            ;;
        4)
            start_server "validate"
            ;;
        5)
            log_info "Checking server status..."
            npm run server:status
            ;;
        *)
            log_error "Invalid choice. Starting auto-restart service as default..."
            npm run start:auto
            ;;
    esac
fi