#!/bin/bash

# Stevens Research - Test Reset Script
# Purpose: Kill all ports and prepare for clean system test
# Usage: ./scripts/test-reset.sh

set +e  # Don't exit on errors (ports might not be in use)

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Stevens Research - Test Reset Script                     ║"
echo "║  Killing all service ports...                             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to kill port
kill_port() {
    local port=$1
    local service=$2

    echo -n "Checking port $port ($service)... "

    # Find PID using lsof
    pid=$(lsof -ti :$port 2>/dev/null)

    if [ -z "$pid" ]; then
        echo -e "${GREEN}Not in use${NC}"
    else
        echo -e "${YELLOW}Found PID $pid${NC}"
        kill -9 $pid 2>/dev/null
        sleep 0.5

        # Verify killed
        if lsof -ti :$port >/dev/null 2>&1; then
            echo -e "${RED}Failed to kill${NC}"
        else
            echo -e "${GREEN}Killed successfully${NC}"
        fi
    fi
}

# Kill all ports
echo "Step 1: Killing service ports..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
kill_port 4000 "Backend GraphQL"
kill_port 4001 "Backend Socket.io"
kill_port 8080 "Frontend Vite (8080)"
kill_port 5173 "Frontend Vite (5173 default)"
echo ""

# Check Redis
echo "Step 2: Checking Redis..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if redis-cli ping >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis is running${NC}"
else
    echo -e "${YELLOW}⚠ Redis is NOT running${NC}"
    echo "  Start Redis with:"
    echo "    macOS:  brew services start redis"
    echo "    Linux:  sudo systemctl start redis"
    echo "    Manual: redis-server"
fi
echo ""

# Check environment files
echo "Step 3: Checking environment files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✓ backend/.env exists${NC}"
else
    echo -e "${RED}✗ backend/.env missing${NC}"
    echo "  Create from template: cp backend/.env.example backend/.env"
fi

if [ -f "frontend/.env" ]; then
    echo -e "${GREEN}✓ frontend/.env exists${NC}"
else
    echo -e "${RED}✗ frontend/.env missing${NC}"
    echo "  Create from template: cp frontend/.env.example frontend/.env"
fi
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Ports cleared! Next steps:                               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Terminal 1 - Redis (if needed):"
echo "  ${YELLOW}redis-server${NC}"
echo ""
echo "Terminal 2 - Backend:"
echo "  ${YELLOW}cd backend && npm install && npm start${NC}"
echo ""
echo "Terminal 3 - Frontend:"
echo "  ${YELLOW}cd frontend && npm install && npm run dev${NC}"
echo ""
echo "Then follow: SYSTEM_TEST_RUNBOOK.md"
echo ""
echo -e "${GREEN}Ready for testing! 🚀${NC}"
