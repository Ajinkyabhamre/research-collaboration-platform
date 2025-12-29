#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Emojis
SKULL="💀"
CLEAN="🧹"
CHECK="✅"
FIRE="🔥"
PEACE="✌️"

echo -e "\n${CYAN}╔════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  ${SKULL} STOPPING ALL SERVICES ${SKULL}             ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}\n"

# Kill processes on ports
echo -e "${YELLOW}${CLEAN} Cleaning up ports...${NC}"

ports=(6379 4000 4001 5173 8080 3000 27017)
killed=0

for port in "${ports[@]}"; do
    pids=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        echo -e "  ${FIRE} Port ${port}: Terminating..."
        echo "$pids" | xargs kill -9 2>/dev/null
        killed=$((killed + 1))
        sleep 0.2
    fi
done

if [ $killed -eq 0 ]; then
    echo -e "\n  ${CHECK} ${GREEN}No services were running${NC}"
else
    echo -e "\n  ${CHECK} ${GREEN}Stopped ${killed} service(s)${NC}"
fi

echo -e "\n${PEACE} ${CYAN}All services stopped. See you later!${NC} ${PEACE}\n"
