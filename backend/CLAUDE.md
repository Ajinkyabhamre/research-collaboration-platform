# Backend - Research Collaboration Platform

> **Context file for AI assistants working on the backend**

## Current Stable State

**Status**: Production-ready GraphQL + Socket.io backend (Jan 2026)

GraphQL API server with real-time messaging, media upload, Redis caching, and MongoDB persistence. Handles authentication via Clerk, serves static files, and provides Socket.io channels for project-based chat.

## Structure

**Entry Points:**
- `server.js` - GraphQL server + upload endpoint (port 4000)
- `app.js` - Socket.io server (port 4001)

**GraphQL:**
- `graphQl/typeDefs.js` - Schema definitions (Users, Projects, Updates, Posts, etc.)
- `graphQl/resolvers.js` - Query/mutation implementations
- `graphQl/helpers.js` - Utility functions

**Data Layer:**
- `config/mongoCollections.js` - MongoDB collection accessors
- `messageOperations/index.js` - Chat message operations

**Tasks:**
- `tasks/seed.js` - Database seeding script

**Static:**
- `public/uploads/YYYY/MM/` - Uploaded media storage
- `public/seed-media/` - Seed data media files

## Commands

```bash
npm run seed   # Seed database (first time or reset)
npm start      # Start both GraphQL (4000) and Socket.io (4001)
```

Note: `npm start` runs `node server.js & node app.js` (see package.json:7)

## Authentication

**Flow:**
1. Frontend sends Clerk JWT in `Authorization: Bearer <token>` header
2. Backend verifies token with Clerk SDK (server.js:29-78)
3. User auto-created in MongoDB if not exists (server.js:50-66)
4. `context.currentUser` available to all resolvers

**Collections:** Uses Clerk public metadata for role (STUDENT/PROFESSOR/ADMIN) and department.

## Home Feed V2 Contracts

**GraphQL Operations** (see typeDefs.js):
- `feed(cursor: FeedCursorInput): FeedPage!` - Lines 148-152
- `postComments(postId: String!, cursor: CommentsCursorInput): CommentsPage!` - Lines 154-158
- `createPost(text: String!, media: [PostMediaInput!]): Post!` - Lines 565-569
- `toggleLike(postId: String!): Post!` - Lines 575-579
- `addPostComment(postId: String!, text: String!): PostComment!` - Lines 584-588

**Types** (see typeDefs.js:304-360):
- `Post` - Main post object with author, text, media, stats
- `PostComment` - Comment with commenter, text, timestamps
- `PostMedia` - Media attachment (type, url, thumbnailUrl, alt)
- `FeedPage` - Paginated response with items + nextCursor

**Upload Flow:**
1. Frontend: POST /api/upload (Clerk-authenticated) → returns URL
2. Frontend: Pass URLs to `createPost` mutation
3. Backend: Stores URLs in MongoDB posts collection
4. Static serving: GET /static/uploads/YYYY/MM/filename

**Critical:** Upload endpoint at server.js:135-190; serves from public/ via server.js:89

## Caching Strategy

**Redis TTL:**
- List queries (projects, updates, etc.): 1 hour
- Single resources (getById): No expiration
- Invalidation: Manual on mutations (see resolvers.js)

**Collections:**
- `users`, `projects`, `updates`, `applications`, `comments` (legacy feed)
- `messages` (Socket.io chat)
- `posts`, `postLikes`, `postComments` (Home Feed V2)

## Real-time Messaging

**Socket.io** (app.js):
- Port 4001
- Events: `join_channel`, `chat_message`, `user_connected`, `disconnect`
- Channels: Project-based (uses project._id)
- Persistence: Last 50 messages loaded on join

## How to Run Locally

```bash
# Install dependencies
npm install

# Seed database (first time or reset)
npm run seed

# Start both servers
npm start
# GraphQL Server: http://localhost:4000
# Socket.io Server: http://localhost:4001
```

## Key Commands

```bash
npm start          # Start GraphQL (4000) + Socket.io (4001)
npm run seed       # Seed database with test data
node server.js     # Start GraphQL server only
node app.js        # Start Socket.io server only

# Health checks
curl http://localhost:4000/health  # GraphQL + Upload
curl http://localhost:4001/health  # Socket.io
```

## Environment Variables Required

Create `backend/.env` (copy from `.env.example`):

```env
mongoServerUrl=mongodb+srv://...     # MongoDB Atlas connection string
mongoDbname=research_collaboration_db
redis_ip=127.0.0.1
redis_port=6379
CLERK_SECRET_KEY=sk_test_...         # Clerk secret key
NODE_ENV=development
```

## GraphQL Schema Structure

**Main Types:**
- `User` - User profiles (Clerk ID, role, department)
- `Project` - Research projects with teams
- `Update` - Project updates/announcements
- `Application` - Student applications to projects
- `Comment` - Comments on updates/applications
- `Post` - Social feed posts (Home Feed V2)
- `PostComment` - Comments on posts
- `PostMedia` - Media attachments

**Key Queries:**
- `me` - Get current authenticated user
- `projects` - List all projects (cached)
- `getProjectById(id)` - Get project details
- `feed(cursor)` - Get social feed posts (paginated)
- `postComments(postId, cursor)` - Get post comments (paginated)

**Key Mutations:**
- `login(token)` - Auto-provision user from Clerk
- `addProject(...)` - Create project (PROFESSOR/ADMIN only)
- `addApplication(...)` - Apply to project
- `changeApplicationStatus(...)` - Approve/reject application
- `createPost(text, media)` - Create social feed post
- `toggleLike(postId)` - Like/unlike post
- `addPostComment(postId, text)` - Comment on post

## Common Gotchas

1. **Redis must be running**: Backend crashes if Redis is down. Start `redis-stack-server` first.
2. **MongoDB IP whitelist**: MongoDB Atlas requires IP whitelisting. Add `0.0.0.0/0` for local dev or your current IP.
3. **Clerk token verification**: Every GraphQL request verifies the Clerk JWT. If verification fails, request is rejected.
4. **Socket.io JWT auth**: Socket.io also requires JWT token on connection (`socket.handshake.auth.token`).
5. **File upload permissions**: Ensure `backend/public/uploads/` has write permissions.
6. **Port conflicts**: Ensure ports 4000 and 4001 are free before starting.
7. **Seed script drops collections**: `npm run seed` DROPS all collections. Never run in production.
8. **Cache stale data**: If data seems outdated, clear Redis (`redis-cli FLUSHALL`).

## Where to Change What

| Task | Files |
|------|-------|
| Add GraphQL type/query/mutation | `graphQl/typeDefs.js`, `graphQl/resolvers.js` |
| Modify auth logic | `server.js` (lines 29-78), `config/settings.js` |
| Change caching | `graphQl/resolvers.js` (Redis get/set/del calls) |
| Add Socket.io event | `app.js` (Socket.io event handlers) |
| Modify file upload | `server.js` (lines 135-190, multer config) |
| Add DB collection | `config/mongoCollections.js` |
| Change seed data | `tasks/seed.js` |

## DO NOT DO

1. **DO NOT** modify `server.js` Socket.io setup without testing thoroughly. It's fragile.
2. **DO NOT** change Redis key format without clearing cache first.
3. **DO NOT** skip Clerk token verification. Security critical.
4. **DO NOT** run `npm run seed` in production. It drops all data.
5. **DO NOT** commit `.env` file. Only `.env.example` should be tracked.
6. **DO NOT** delete `public/seed-media/`. It's tracked in git for seed script.
7. **DO NOT** modify `package.json` scripts without updating `scripts/dev.sh` and `scripts/stop.sh`.
8. **DO NOT** rename GraphQL fields without updating frontend queries. Breaking change.

## Known Issues

1. **No upload cleanup**: If file upload succeeds but mutation fails, orphaned files remain in `public/uploads/`.
2. **No pagination cursor validation**: Malformed cursors can crash queries.
3. **No graceful shutdown**: Servers don't handle SIGTERM/SIGINT properly. Use `lsof` + `kill` to stop.

---

**Last Updated**: Jan 2026
**For frontend context, see**: `frontend/CLAUDE.md`
**For high-level architecture, see**: `../CLAUDE.md`
