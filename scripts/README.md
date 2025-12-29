# Scripts Directory 🚀

This directory contains utility scripts for the Stevens Research Collaboration Platform.

## Available Scripts

### 🎉 dev.sh (NEW!)

**Purpose:** All-in-one development environment launcher with animations and monitoring!

**Usage:**
```bash
./scripts/dev.sh
```

**Features:**
- ✨ Animated startup sequence with emojis
- 🧹 Auto-cleans ports before starting
- 📦 Checks and installs dependencies automatically
- 🚀 Starts both backend and frontend servers
- 📊 Real-time health monitoring
- 🔥 Auto-restart on crashes
- 📝 Logs everything to `logs/` directory
- ⌨️  Press Ctrl+C to stop all services

**What it does:**
1. Kills existing processes on ports (4000, 5173, 3000, 27017)
2. Verifies project structure
3. Installs missing dependencies
4. Starts backend at http://localhost:4000
5. Starts frontend at http://localhost:5173
6. Monitors both services continuously

**Logs location:**
- `logs/backend.log` - Backend server output
- `logs/frontend.log` - Frontend server output

---

### 💀 stop.sh (NEW!)

**Purpose:** Quickly stop all running services.

**Usage:**
```bash
./scripts/stop.sh
```

**What it does:**
1. Kills processes on ports: 4000, 5173, 3000, 27017
2. Shows count of stopped services
3. Clean exit with confirmation

---

### 🔍 check-home-feed-data.js (NEW!)

**Purpose:** Verify Home Feed V2 data in MongoDB.

**Usage:**
```bash
cd backend
node ../scripts/check-home-feed-data.js
```

**What it shows:**
- 📊 Collection statistics (posts, likes, comments count)
- 📝 Recent posts (last 5 with details)
- ❤️  Recent likes (last 5)
- 💬 Recent comments (last 5 with text)

---

### 🔄 test-reset.sh

**Purpose:** Prepare system for clean testing by killing all service ports.

**Usage:**
```bash
./scripts/test-reset.sh
```

**What it does:**
1. Kills processes on ports: 4000, 4001, 8080, 5173
2. Checks Redis connection status
3. Verifies environment files exist
4. Prints next steps for starting services

**Requirements:**
- macOS or Linux
- `lsof` command available (standard on macOS/Linux)
- No sudo required

**After running:**
Follow the printed instructions to start:
1. Redis (if needed)
2. Backend (Terminal 2)
3. Frontend (Terminal 3)

Then proceed with [SYSTEM_TEST_RUNBOOK.md](../SYSTEM_TEST_RUNBOOK.md)

---

## 🚀 Quick Start Guide

### First Time Setup
```bash
# Make sure scripts are executable
chmod +x scripts/*.sh

# Start everything with one command!
./scripts/dev.sh
```

### Daily Development Workflow
```bash
# Start servers (one command does it all!)
./scripts/dev.sh

# In another terminal: Check database
cd backend && node ../scripts/check-home-feed-data.js

# When done: Stop everything
./scripts/stop.sh
# (or just press Ctrl+C in the dev.sh terminal)
```

### View Logs
```bash
# Backend logs
tail -f logs/backend.log

# Frontend logs
tail -f logs/frontend.log

# Both at once
tail -f logs/*.log
```

---

## 📋 Troubleshooting

### "Port already in use" error
```bash
./scripts/stop.sh
./scripts/dev.sh
```

### Services not starting
Check the logs for errors:
```bash
cat logs/backend.log
cat logs/frontend.log
```

### Dependencies out of sync
The `dev.sh` script automatically checks and installs missing dependencies, but you can also manually run:
```bash
cd backend && npm install
cd frontend && npm install
```

---

## Adding New Scripts

When adding new scripts to this directory:
1. Use `.sh` extension for bash scripts
2. Make executable: `chmod +x scripts/your-script.sh`
3. Add shebang: `#!/bin/bash`
4. Document in this README
5. Include usage examples
6. Handle errors gracefully (don't require sudo unless absolutely necessary)
