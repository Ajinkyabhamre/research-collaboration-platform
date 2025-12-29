# Development Commands Reference

## Quick Start

**Automated:** `./scripts/dev.sh` (starts all services)

**Manual (3 terminals):**
```bash
# Terminal 1: redis-stack-server
# Terminal 2: cd backend && npm run seed && npm start
# Terminal 3: cd frontend && npm run dev
```

## Database Seeding

**Command:** `cd backend && npm run seed`

**Location:** `backend/tasks/seed.js`

**Creates:** 20 professors, 20 students, 15 projects, 15 posts, updates, applications, comments

**Note:** Requires Clerk accounts with matching emails and metadata.

## Stop Services

**Automated:** `./scripts/stop.sh`

**Manual:** `lsof -ti:4000 -ti:4001 -ti:8080 | xargs kill -9`

## Logs

Dev script logs: `logs/backend.log`, `logs/frontend.log`, `logs/redis.log`

View live: `tail -f logs/backend.log`

## Health Checks

```bash
curl http://localhost:4000/health   # GraphQL + Upload
curl http://localhost:4001/health   # Socket.io
curl http://localhost:8080          # Frontend (HTML)
```
