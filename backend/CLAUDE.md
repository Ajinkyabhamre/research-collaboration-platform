# Backend - Stevens Research Platform

## Purpose

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
