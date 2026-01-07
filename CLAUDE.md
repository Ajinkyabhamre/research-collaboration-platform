# CLAUDE.md - Research Collaboration Platform

> **Context file for AI assistants working on this codebase**

## What This Is

A full-stack GraphQL + React platform for research collaboration (professors, students). Key features: project management, real-time chat (Socket.io), social feed (LinkedIn-style), application tracking, file uploads.

## Current Stable State

**Status**: Production-ready monorepo (Jan 2026)
- Backend: GraphQL + Socket.io servers running independently
- Frontend: Vite + React with Tailwind CSS
- Caching: Redis with 1-hour TTL
- Auth: Clerk JWT (verified on every request)
- Database: MongoDB Atlas
- Real-time: Socket.io with project-based channels

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Vite)                   │
│  Apollo Client + React Router + Clerk React         │
│  Port: 8080 (or 5173)                              │
└──────────────┬──────────────────────┬───────────────┘
               │                      │
         GraphQL (4000)         Socket.io (4001)
               │                      │
┌──────────────┴──────────────────────┴───────────────┐
│              Backend (Node.js + Express)            │
│  - Apollo Server (GraphQL)                          │
│  - Socket.io Server (separate from GraphQL)         │
│  - Clerk auth verification                          │
│  - Redis caching layer                              │
│  - File upload endpoint (POST /api/upload)          │
└──────────────┬──────────────────────┬───────────────┘
               │                      │
          MongoDB Atlas            Redis (6379)
```

## Quick Start (3 Terminals)

**Terminal 1: Redis**
```bash
redis-stack-server
# Verify: redis-cli ping → PONG
```

**Terminal 2: Backend**
```bash
cd backend
npm install
npm run seed    # First time only
npm start
# GraphQL: http://localhost:4000
# Socket.io: http://localhost:4001
```

**Terminal 3: Frontend**
```bash
cd frontend
npm install
npm run dev
# App: http://localhost:8080 (or :5173)
```

**Automated (all services):**
```bash
./scripts/dev.sh    # Start all
./scripts/stop.sh   # Stop all
# Logs: logs/backend.log, logs/frontend.log, logs/redis.log
```

## Critical Ports

| Service | Port | Health Check |
|---------|------|--------------|
| Frontend (Vite) | 8080 or 5173 | Open in browser |
| GraphQL Server | 4000 | `curl http://localhost:4000/health` |
| Socket.io Server | 4001 | `curl http://localhost:4001/health` |
| Redis | 6379 | `redis-cli ping` → PONG |
| MongoDB Atlas | Cloud | Check connection string |

## Environment Variables (Required)

**Backend** (`.env`):
- `mongoServerUrl` - MongoDB Atlas connection string
- `mongoDbname` - Database name
- `redis_ip` - Redis host (127.0.0.1)
- `redis_port` - Redis port (6379)
- `CLERK_SECRET_KEY` - Clerk secret key (sk_test_...)
- `NODE_ENV` - development/production

**Frontend** (`.env`):
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk publishable key (pk_test_...)
- `VITE_GRAPHQL_IP` - GraphQL host (localhost)
- `VITE_GRAPHQL_PORT` - GraphQL port (4000)
- `VITE_SOCKET_IP` - Socket.io host (localhost)
- `VITE_SOCKET_PORT` - Socket.io port (4001)

Copy from `.env.example` files in each directory.

## Key Routes (Frontend)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Landing page | Public landing |
| `/home` | HomeFeedV2 | LinkedIn-style social feed |
| `/projects-new` | ProjectsHub | Browse projects (new design) |
| `/projects/:id` | ProjectDetails | Project info, updates, team |
| `/projects/:id/requests` | ApplicationRequests | Review/manage applications |
| `/messaging` | Messaging | Socket.io real-time chat |
| `/profile` | Profile | User profile management |

## Database Collections (MongoDB)

- `users` - User profiles (Clerk ID, role, department)
- `projects` - Research projects (team, description)
- `updates` - Project updates (like announcements)
- `applications` - Student applications to projects
- `comments` - Comments on updates/applications
- `messages` - Chat messages (project channels)
- `posts` - Social feed posts (Home Feed V2)
- `postLikes` - Like relationships
- `postComments` - Comments on posts

## Authentication Flow

1. User signs in via Clerk (frontend)
2. Clerk issues JWT token
3. Frontend stores token (managed by Clerk React)
4. Apollo Client attaches `Authorization: Bearer <token>` to every GraphQL request
5. Backend verifies token with Clerk SDK (`@clerk/clerk-sdk-node`)
6. Backend fetches/creates user in MongoDB (auto-provisioning)
7. User object attached to GraphQL context (`context.user`)
8. Resolvers enforce role-based access (STUDENT, PROFESSOR, ADMIN)

## Caching Strategy (Redis)

- **List queries** (e.g., `projects`, `feed`): 1-hour TTL
- **Single resource** (e.g., `getProjectById`): No expiration (manual invalidation)
- **Invalidation**: On mutations (e.g., `addProject` clears `projects:*`)
- **Key format**: `<query>:<args>` (e.g., `projects:{}`)

## File Uploads

- **Endpoint**: `POST /api/upload` (backend, separate from GraphQL)
- **Auth**: Clerk JWT (same as GraphQL)
- **Storage**: `backend/public/uploads/YYYY/MM/`
- **Serving**: Static files at `http://localhost:4000/static/uploads/*`
- **Max size**: 6MB images, 40MB videos
- **Allowed types**: jpg, jpeg, png, gif, mp4, webm

## Real-Time Messaging (Socket.io)

- **Server**: `backend/server.js` (Socket.io on port 4001, separate from GraphQL)
- **Auth**: JWT token passed on connection (`socket.handshake.auth.token`)
- **Channels**: Project-based (users join `project-<projectId>`)
- **Events**: `send_message`, `receive_message`
- **Storage**: Messages saved to MongoDB `messages` collection
- **History**: Last 50 messages loaded on join

## Common Commands

```bash
# Start all services
./scripts/dev.sh

# Stop all services
./scripts/stop.sh

# Seed database
cd backend && npm run seed

# Health checks
curl http://localhost:4000/health   # GraphQL + Upload
curl http://localhost:4001/health   # Socket.io
curl http://localhost:8080          # Frontend

# Kill stuck processes
lsof -ti:4000 -ti:4001 -ti:8080 | xargs kill -9

# Clear Redis cache
redis-cli FLUSHALL

# Check logs
tail -f logs/backend.log
tail -f logs/frontend.log
```

## Common Gotchas

1. **Redis not running**: Backend will crash. Always start Redis first.
2. **MongoDB IP whitelist**: Atlas requires IP whitelisting. Add `0.0.0.0/0` for local dev.
3. **Clerk token expired**: Sign out and back in to refresh.
4. **Port conflicts**: Kill processes on 4000, 4001, 8080, 6379 before starting.
5. **Cache stale data**: Clear Redis if data seems outdated (`redis-cli FLUSHALL`).
6. **Socket.io not connecting**: Verify port 4001 is running and `VITE_SOCKET_IP/PORT` are correct.
7. **File uploads fail**: Check `backend/public/uploads/` directory exists and has write permissions.

## Where to Change What

| Task | Files to Modify |
|------|----------------|
| Add GraphQL query/mutation | `backend/graphQl/typeDefs.js`, `backend/graphQl/resolvers.js` |
| Add frontend query | `frontend/src/queries.js` |
| Add new page/route | `frontend/src/App.jsx` (router), create component in `src/pages/` |
| Change caching logic | `backend/graphQl/resolvers.js` (Redis get/set/del) |
| Add Socket.io event | `backend/server.js` (Socket.io handlers), frontend Socket hook |
| Update auth logic | `backend/config/settings.js` (Clerk verification) |
| Add DB collection | `backend/config/mongoCollections.js` |
| Modify social feed | `frontend/src/components/homeV2/*` (HomeFeedV2, PostCardV2, etc.) |
| Add file upload type | `backend/server.js` (multer config, allowed MIME types) |

## DO NOT DO (Stability Rules)

1. **DO NOT** modify `backend/server.js` Socket.io setup unless you know what you're doing. It's fragile.
2. **DO NOT** change Redis key format without clearing cache first. Stale keys will cause issues.
3. **DO NOT** rename GraphQL fields without updating all frontend queries. Use `transformPost()` helpers if renaming.
4. **DO NOT** skip Clerk auth verification. Always verify tokens on backend.
5. **DO NOT** commit `.env` files. Only `.env.example` should be tracked.
6. **DO NOT** delete `backend/public/seed-media/`. It's tracked in git for seed script.
7. **DO NOT** run `npm run seed` in production. It drops all collections.
8. **DO NOT** modify `package.json` scripts without testing. They're used by CI/CD and dev scripts.

## Known Issues / Tech Debt

1. **Optimistic UI rollback**: HomeFeedV2 uses optimistic updates (like, comment, post) but doesn't roll back on failure. If mutation fails, UI shows incorrect state.
2. **Orphaned uploads**: If file upload succeeds but GraphQL mutation fails, files remain in `public/uploads/` with no cleanup.
3. **No pagination cursor validation**: Backend assumes cursors are valid. Malformed cursors can crash queries.
4. **Hardcoded enum mappings**: Department/Role enums are mapped in `constructHeadline()` functions. New backend enums display as raw strings.

## Testing

- **Manual testing**: See `docs/SYSTEM_TEST_RUNBOOK.md` for full test scenarios
- **Unit tests**: None yet (tech debt)
- **Integration tests**: None yet (tech debt)

## Related Documentation

- **Backend details**: `backend/CLAUDE.md`
- **Frontend details**: `frontend/CLAUDE.md`
- **System testing**: `docs/SYSTEM_TEST_RUNBOOK.md`
- **User-facing README**: `README.md`

---

**Last Updated**: Jan 2026
**Maintained By**: Team Cool Kids (CS-554)
