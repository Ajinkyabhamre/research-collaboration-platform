# Research Collaboration Platform

A full-stack web platform for research collaboration between professors and students. Features project management, real-time chat, social feed, and application tracking with role-based access control.

> **For detailed architecture and development context, see [CLAUDE.md](./CLAUDE.md)**

## Tech Stack

**Backend:**
- Node.js 18 + Express
- GraphQL (Apollo Server 4)
- MongoDB Atlas
- Redis (caching)
- Socket.io (real-time messaging)
- Clerk (authentication)

**Frontend:**
- React 18 + Vite
- Apollo Client (GraphQL)
- React Router
- Clerk React (auth)
- Tailwind CSS + shadcn/ui

## Quick Start

### Prerequisites

- Node.js 18+
- Redis Stack Server
- MongoDB Atlas account (free tier)
- Clerk account (free tier)

### 1. Environment Setup

**Backend** (`backend/.env`):
```env
mongoServerUrl=mongodb+srv://user:password@cluster.mongodb.net/?retryWrites=true&w=majority
mongoDbname=research_collaboration_db
redis_ip=127.0.0.1
redis_port=6379
CLERK_SECRET_KEY=sk_test_...
NODE_ENV=development
```

**Frontend** (`frontend/.env`):
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_GRAPHQL_IP=localhost
VITE_GRAPHQL_PORT=4000
VITE_SOCKET_IP=localhost
VITE_SOCKET_PORT=4001
```

Copy from `.env.example` files in each directory.

### 2. Start Services

**Terminal 1 - Redis:**
```bash
redis-stack-server
```

**Terminal 2 - Backend:**

```bash
cd backend
npm install
npm run seed    # First time only
npm start
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### 3. Access Application

- **Frontend**: http://localhost:8080 (or :5173)
- **GraphQL Playground**: http://localhost:4000
- **Socket.io**: http://localhost:4001

## Key Features

| Feature | Route | Description |
|---------|-------|-------------|
| **Projects Hub** | `/projects-new` | Browse and search research projects |
| **Project Details** | `/projects/:id` | View project info, updates, team |
| **Applications** | `/projects/:id/requests` | Apply to projects (students) / review applications (professors) |
| **Social Feed** | `/home` | LinkedIn-style posts with media, likes, comments |
| **Messaging** | `/messaging` | Real-time Socket.io chat per project |
| **Profile** | `/profile` | User profile and settings |

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `mongoServerUrl` | ✅ Backend | MongoDB Atlas connection string |
| `mongoDbname` | ✅ Backend | Database name |
| `redis_ip` | ✅ Backend | Redis host (127.0.0.1 for local) |
| `redis_port` | ✅ Backend | Redis port (default: 6379) |
| `CLERK_SECRET_KEY` | ✅ Backend | Clerk secret key (starts with `sk_test_`) |
| `VITE_CLERK_PUBLISHABLE_KEY` | ✅ Frontend | Clerk publishable key (starts with `pk_test_`) |
| `VITE_GRAPHQL_IP` | ✅ Frontend | GraphQL server host |
| `VITE_GRAPHQL_PORT` | ✅ Frontend | GraphQL server port (default: 4000) |
| `VITE_SOCKET_IP` | ✅ Frontend | Socket.io server host |
| `VITE_SOCKET_PORT` | ✅ Frontend | Socket.io server port (default: 4001) |

## Development Scripts

**Backend:**
```bash
npm start       # Start GraphQL + Socket.io servers
npm run seed    # Seed database with test data
```

**Frontend:**
```bash
npm run dev     # Start Vite dev server
npm run build   # Build for production
npm run preview # Preview production build
```

**Root:**
```bash
./scripts/dev.sh   # Start all services (Redis + Backend + Frontend)
./scripts/stop.sh  # Stop all services
```

## Architecture Notes

- **Authentication**: Clerk JWT tokens verified on every GraphQL request
- **Caching**: Redis with 1-hour TTL for list queries, manual invalidation on mutations
- **Real-time**: Socket.io with JWT auth, project-based channels
- **File Uploads**: Stored in `backend/public/uploads/YYYY/MM/`, served via `/static/*`
- **Role-Based Access**: STUDENT, PROFESSOR, ADMIN roles enforced at resolver level

## Deployment

### Backend (Railway)

**Prerequisites:**
- Railway account
- Redis instance (Railway add-on or external like Upstash)
- MongoDB Atlas cluster with IP whitelist `0.0.0.0/0` (allow all)
- Clerk account with secret key

**Setup:**
1. Create new Railway project
2. Connect your GitHub repository
3. Set root directory: `backend`
4. Configure environment variables (see table below)
5. Deploy

**Required Environment Variables:**
| Variable | Example | Description |
|----------|---------|-------------|
| `PORT` | Auto-set by Railway | Server port (Railway provides this) |
| `mongoServerUrl` | `mongodb+srv://user:pass@cluster.mongodb.net/...` | MongoDB Atlas connection string |
| `mongoDbname` | `research_collaboration_db` | Database name |
| `redis_ip` | `redis.railway.internal` | Redis host (Railway internal DNS or external) |
| `redis_port` | `6379` | Redis port |
| `CLERK_SECRET_KEY` | `sk_live_...` | Clerk secret key (use production key) |
| `NODE_ENV` | `production` | Environment |
| `FRONTEND_ORIGIN` | `https://your-app.vercel.app` | Comma-separated allowed origins for CORS |
| `BASE_URL` | `https://your-backend.railway.app` | Backend public URL (for file upload URLs) |

**Health Check:**
```bash
curl https://your-backend.railway.app/health
```

**Important Notes:**
- Socket.io runs on the same port as GraphQL (unified server on PORT)
- Ensure MongoDB Atlas IP whitelist includes `0.0.0.0/0` or Railway's IP ranges
- Redis can be added as a Railway plugin or use external service (Upstash)
- File uploads are stored in ephemeral filesystem (consider external storage for production)

### Frontend (Vercel)

**Prerequisites:**
- Vercel account
- Deployed backend (Railway URL)
- Clerk publishable key

**Setup:**
1. Import GitHub repository to Vercel
2. Set root directory: `frontend`
3. Framework preset: `Vite`
4. Build command: `npm run build` (auto-detected)
5. Output directory: `dist` (auto-detected)
6. Configure environment variables (see table below)
7. Deploy

**Required Environment Variables:**
| Variable | Example | Description |
|----------|---------|-------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_...` | Clerk publishable key (production) |
| `VITE_GRAPHQL_URL` | `https://your-backend.railway.app/graphql` | Full GraphQL endpoint URL |
| `VITE_SOCKET_URL` | `https://your-backend.railway.app` | Full Socket.io server URL |
| `VITE_API_BASE_URL` | `https://your-backend.railway.app` | Backend base URL (for uploads) |

**Important Notes:**
- Do NOT set `VITE_GRAPHQL_IP` or `VITE_GRAPHQL_PORT` in production (use `VITE_GRAPHQL_URL` instead)
- Do NOT set `VITE_SOCKET_IP` or `VITE_SOCKET_PORT` in production (use `VITE_SOCKET_URL` instead)
- All `VITE_*` variables must be set at build time (Vercel handles this automatically)

### Deployment Checklist

**Before deploying:**
- [ ] MongoDB Atlas cluster created and IP whitelist configured
- [ ] Redis instance provisioned (Railway or Upstash)
- [ ] Clerk production keys obtained
- [ ] Backend deployed to Railway
- [ ] Backend health check passes: `curl https://your-backend.railway.app/health`
- [ ] Frontend environment variables configured in Vercel
- [ ] Frontend deployed to Vercel

**After deploying:**
- [ ] Test authentication (sign in/sign out)
- [ ] Test GraphQL queries (projects, feed)
- [ ] Test real-time messaging (Socket.io)
- [ ] Test file uploads (create post with image)
- [ ] Check browser console for errors
- [ ] Verify CORS (no CORS errors in browser console)

### CI/CD

**GitHub Actions:**
- Workflow: `.github/workflows/ci.yml`
- Triggers: Pull requests and pushes to `main`
- Jobs: Backend validation (syntax check) + Frontend validation (lint + build)
- Auto-runs on every PR to catch issues early

## Ports

| Service | Port |
|---------|------|
| Frontend (Vite) | 8080 or 5173 |
| GraphQL Server | 4000 |
| Socket.io Server | 4001 |
| Redis | 6379 |

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - High-level architecture and context
- **[backend/CLAUDE.md](./backend/CLAUDE.md)** - Backend specifics (GraphQL, Socket.io, Redis)
- **[frontend/CLAUDE.md](./frontend/CLAUDE.md)** - Frontend specifics (React, Apollo, Clerk)
- **[docs/SYSTEM_TEST_RUNBOOK.md](./docs/SYSTEM_TEST_RUNBOOK.md)** - Full testing procedures

## Troubleshooting

**Backend won't start:**
- Verify MongoDB Atlas connection string and IP whitelist
- Check Redis is running (`redis-cli ping` should return `PONG`)
- Ensure ports 4000 and 4001 are available

**Frontend won't start:**
- Check `VITE_CLERK_PUBLISHABLE_KEY` is set
- Ensure backend is running first
- Clear browser cache if components don't load

**Authentication errors:**
- Verify Clerk keys are correct (backend secret, frontend publishable)
- Sign out and back in to refresh token

**Chat not working:**
- Check Socket.io server is running on port 4001
- Verify `VITE_SOCKET_IP` and `VITE_SOCKET_PORT` in frontend `.env`

## License

MIT
