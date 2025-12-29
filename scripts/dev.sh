#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Emojis
ROCKET="🚀"
FIRE="🔥"
SPARKLES="✨"
CHECK="✅"
CROSS="❌"
HOURGLASS="⏳"
GEAR="⚙️"
PACKAGE="📦"
SERVER="🖥️"
GLOBE="🌐"
CLEAN="🧹"
PARTY="🎉"
HAMMER="🔨"
MAGNIFY="🔍"
SKULL="💀"

# Get project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Spinner animation
spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

# Progress bar
progress_bar() {
    local duration=$1
    local width=50
    local progress=0

    while [ $progress -le $width ]; do
        local filled=$((progress * 100 / width))
        local bar=$(printf "█%.0s" $(seq 1 $progress))
        local empty=$(printf "░%.0s" $(seq 1 $((width - progress))))
        printf "\r  ${CYAN}${bar}${NC}${empty} ${filled}%%"
        progress=$((progress + 1))
        sleep $(echo "$duration / $width" | bc -l)
    done
    echo ""
}

# Animated banner
show_banner() {
    clear
    echo -e "${MAGENTA}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                                                                ║"
    echo "║        ${FIRE} RESEARCH COLLABORATION PLATFORM ${FIRE}              ║"
    echo "║                                                                ║"
    echo "║           ${ROCKET} Development Environment Launcher ${ROCKET}            ║"
    echo "║                                                                ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    sleep 0.5
}

# Typing effect
type_text() {
    local text="$1"
    local delay=0.03
    for ((i=0; i<${#text}; i++)); do
        echo -n "${text:$i:1}"
        sleep $delay
    done
    echo ""
}

# Kill processes on ports
kill_ports() {
    echo -e "\n${YELLOW}${CLEAN} Cleaning up ports...${NC}"

    local ports=(4000 4001 5173 8080 3000 6379 27017)
    local killed=0

    for port in "${ports[@]}"; do
        local pids=$(lsof -ti:$port 2>/dev/null)
        if [ ! -z "$pids" ]; then
            echo -e "  ${SKULL} Killing process on port ${port}..."
            echo "$pids" | xargs kill -9 2>/dev/null
            killed=$((killed + 1))
        fi
    done

    if [ $killed -eq 0 ]; then
        echo -e "  ${CHECK} All ports are clean!"
    else
        echo -e "  ${CHECK} Killed ${killed} process(es)"
    fi
    sleep 0.5
}

# Check if directory exists
check_directory() {
    local dir=$1
    local name=$2

    if [ ! -d "$dir" ]; then
        echo -e "${CROSS} ${RED}${name} directory not found!${NC}"
        echo -e "  Expected: ${dir}"
        exit 1
    fi
}

# Check if dependencies are installed
check_dependencies() {
    local dir=$1
    local name=$2

    if [ ! -d "$dir/node_modules" ]; then
        echo -e "\n${YELLOW}${PACKAGE} Installing ${name} dependencies...${NC}"
        cd "$dir"
        npm install &
        local pid=$!
        spinner $pid
        wait $pid
        if [ $? -eq 0 ]; then
            echo -e "${CHECK} ${GREEN}${name} dependencies installed!${NC}"
        else
            echo -e "${CROSS} ${RED}Failed to install ${name} dependencies${NC}"
            exit 1
        fi
    fi
}

# Start Redis
start_redis() {
    echo -e "\n${RED}${FIRE} Starting Redis Stack Server...${NC}"

    # Check if redis-stack-server is installed
    if ! command -v redis-stack-server &> /dev/null; then
        echo -e "  ${CROSS} ${RED}redis-stack-server not found!${NC}"
        echo -e "  ${MAGNIFY} Install it with: brew install redis-stack"
        return 1
    fi

    # Check if Redis is already running
    if lsof -ti:6379 > /dev/null 2>&1; then
        echo -e "  ${CHECK} ${GREEN}Redis already running on port 6379${NC}"
        return 0
    fi

    # Start Redis in background
    redis-stack-server > "$PROJECT_ROOT/logs/redis.log" 2>&1 &
    REDIS_PID=$!

    # Wait for Redis to be ready
    local max_attempts=10
    local attempt=0

    echo -ne "  ${HOURGLASS} Waiting for Redis"

    while [ $attempt -lt $max_attempts ]; do
        if lsof -ti:6379 > /dev/null 2>&1; then
            echo -e "\n  ${CHECK} ${GREEN}Redis ready on port 6379${NC}"
            return 0
        fi
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done

    echo -e "\n  ${CROSS} ${RED}Redis failed to start${NC}"
    echo -e "  ${MAGNIFY} Check logs: tail -f logs/redis.log"
    return 1
}

# Start backend
start_backend() {
    echo -e "\n${BLUE}${GEAR} Starting Backend Server...${NC}"

    cd "$PROJECT_ROOT/backend"

    # Start backend in background and log to file
    npm start > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
    BACKEND_PID=$!

    # Wait for backend to be ready
    local max_attempts=30
    local attempt=0

    echo -ne "  ${HOURGLASS} Waiting for backend"

    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:4000/health > /dev/null 2>&1; then
            echo -e "\n  ${CHECK} ${GREEN}Backend ready at http://localhost:4000${NC}"
            return 0
        fi
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done

    echo -e "\n  ${CROSS} ${RED}Backend failed to start${NC}"
    echo -e "  ${MAGNIFY} Check logs: tail -f logs/backend.log"
    return 1
}

# Start frontend
start_frontend() {
    echo -e "\n${CYAN}${GLOBE} Starting Frontend Server...${NC}"

    cd "$PROJECT_ROOT/frontend"

    # Start frontend in background and log to file
    npm run dev > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
    FRONTEND_PID=$!

    # Wait for frontend to be ready (Vite runs on port 8080 per vite.config.js)
    local max_attempts=30
    local attempt=0

    echo -ne "  ${HOURGLASS} Waiting for frontend"

    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:8080 > /dev/null 2>&1; then
            echo -e "\n  ${CHECK} ${GREEN}Frontend ready at http://localhost:8080${NC}"
            return 0
        fi
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done

    echo -e "\n  ${CROSS} ${RED}Frontend failed to start${NC}"
    echo -e "  ${MAGNIFY} Check logs: tail -f logs/frontend.log"
    return 1
}

# Show success message
show_success() {
    echo -e "\n${GREEN}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                                                                ║"
    echo "║           ${PARTY} ALL SYSTEMS OPERATIONAL ${PARTY}                      ║"
    echo "║                                                                ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    echo -e "${BOLD}${WHITE}${ROCKET} Services Running:${NC}"
    echo -e "  ${FIRE} Redis:    ${CYAN}localhost:6379${NC}"
    echo -e "  ${SERVER} Backend:  ${CYAN}http://localhost:4000${NC}"
    echo -e "  ${GLOBE} Frontend: ${CYAN}http://localhost:8080${NC}"
    echo -e "  ${HAMMER} GraphQL:  ${CYAN}http://localhost:4000/graphql${NC}"

    echo -e "\n${BOLD}${WHITE}${MAGNIFY} Logs:${NC}"
    echo -e "  ${RED}Redis:${NC}    tail -f logs/redis.log"
    echo -e "  ${BLUE}Backend:${NC}  tail -f logs/backend.log"
    echo -e "  ${BLUE}Frontend:${NC} tail -f logs/frontend.log"

    echo -e "\n${BOLD}${WHITE}${SKULL} To stop all services:${NC}"
    echo -e "  ${YELLOW}Press Ctrl+C or run:${NC} ./scripts/stop.sh"

    echo -e "\n${SPARKLES} ${CYAN}Happy Coding!${NC} ${SPARKLES}\n"
}

# Cleanup function
cleanup() {
    echo -e "\n\n${YELLOW}${CLEAN} Shutting down services...${NC}"

    if [ ! -z "$REDIS_PID" ]; then
        echo -e "  ${CROSS} Stopping Redis (PID: $REDIS_PID)..."
        kill $REDIS_PID 2>/dev/null
    fi

    if [ ! -z "$BACKEND_PID" ]; then
        echo -e "  ${CROSS} Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null
    fi

    if [ ! -z "$FRONTEND_PID" ]; then
        echo -e "  ${CROSS} Stopping frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null
    fi

    # Kill all processes on our ports
    lsof -ti:6379 -ti:4000 -ti:4001 -ti:5173 -ti:8080 | xargs kill -9 2>/dev/null

    echo -e "\n${CHECK} ${GREEN}All services stopped${NC}"
    echo -e "${SPARKLES} Goodbye! ${SPARKLES}\n"
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    # Show banner
    show_banner

    # Create logs directory
    mkdir -p "$PROJECT_ROOT/logs"

    # Step 1: Kill existing ports
    type_text "${HAMMER} Step 1/6: Cleaning up existing processes..."
    kill_ports

    # Step 2: Check directories
    type_text "${MAGNIFY} Step 2/6: Verifying project structure..."
    check_directory "$PROJECT_ROOT/backend" "Backend"
    check_directory "$PROJECT_ROOT/frontend" "Frontend"
    echo -e "  ${CHECK} Project structure verified!"
    sleep 0.5

    # Step 3: Check dependencies
    type_text "${PACKAGE} Step 3/6: Checking dependencies..."
    check_dependencies "$PROJECT_ROOT/backend" "Backend"
    check_dependencies "$PROJECT_ROOT/frontend" "Frontend"
    echo -e "  ${CHECK} All dependencies ready!"
    sleep 0.5

    # Step 4: Start Redis
    type_text "${FIRE} Step 4/6: Launching Redis Stack server..."
    if ! start_redis; then
        echo -e "${CROSS} ${RED}Failed to start Redis${NC}"
        echo -e "${MAGNIFY} ${YELLOW}Note: Backend will try to reconnect to Redis automatically${NC}"
        # Don't exit - backend can handle Redis being down
    fi

    # Step 5: Start backend
    type_text "${ROCKET} Step 5/6: Launching backend server..."
    if ! start_backend; then
        echo -e "${CROSS} ${RED}Failed to start backend${NC}"
        cleanup
        exit 1
    fi

    # Step 6: Start frontend
    type_text "${ROCKET} Step 6/6: Launching frontend server..."
    if ! start_frontend; then
        echo -e "${CROSS} ${RED}Failed to start frontend${NC}"
        cleanup
        exit 1
    fi

    # Success!
    progress_bar 1.5
    show_success

    # Keep script running
    echo -e "${HOURGLASS} Monitoring services... (Press Ctrl+C to stop)"

    # Monitor processes
    while true; do
        # Check if Redis is still running (check port instead of PID)
        if [ ! -z "$REDIS_PID" ]; then
            if ! lsof -ti:6379 > /dev/null 2>&1; then
                echo -e "\n${CROSS} ${RED}Redis crashed!${NC}"
                echo -e "${MAGNIFY} Check logs: tail logs/redis.log"
                echo -e "${YELLOW}Attempting to restart Redis...${NC}"
                start_redis
            fi
        fi

        # Check if backend is still running (check port 4000 instead of PID)
        if ! curl -s http://localhost:4000/health > /dev/null 2>&1; then
            echo -e "\n${CROSS} ${RED}Backend crashed or became unresponsive!${NC}"
            echo -e "${MAGNIFY} Check logs: tail logs/backend.log"
            cleanup
        fi

        # Check if frontend is still running (check port 8080 instead of PID)
        if ! curl -s http://localhost:8080 > /dev/null 2>&1; then
            echo -e "\n${CROSS} ${RED}Frontend crashed or became unresponsive!${NC}"
            echo -e "${MAGNIFY} Check logs: tail logs/frontend.log"
            cleanup
        fi

        sleep 5
    done
}

# Run main
main
