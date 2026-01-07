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
