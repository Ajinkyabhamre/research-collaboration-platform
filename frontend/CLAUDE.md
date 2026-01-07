# Frontend - Research Collaboration Platform

> **Context file for AI assistants working on the frontend**

## Current Stable State

**Status**: Production-ready React + Vite SPA (Jan 2026)

React SPA with GraphQL data layer, real-time messaging, and LinkedIn-style design system. Handles authentication via Clerk, media uploads, and optimistic UI updates.

## Stack

- React 18.3 + Vite 5.4
- Apollo Client 3.11 (GraphQL)
- Clerk React 5.18 (Auth)
- Tailwind CSS 4 + Radix UI
- Socket.io Client 4.8
- Framer Motion (animations)
- Sonner (toasts)

## Structure

**Key Files:**
- `src/main.jsx` - App entry, providers
- `src/App.jsx` - Routes + auth guards
- `src/queries.js` - All GraphQL operations (lines 1-890)
- `src/pages/*` - 8 route pages (Landing, Home, Projects, etc.)
- `src/components/homeV2/*` - Feed components (HomeFeedV2, PostComposer, PostCard)
- `src/contracts/homeFeedV2.contract.js` - PostV2 type definition
- `src/components/ui/*` - Design system primitives (Button, Card, Dialog, etc.)
- `src/components/layout/*` - AppShell, TopNav, PageContainer
- `src/hooks/*` - useSocket, useCurrentUser
- `src/lib/*` - upload.js, utils.js, toast.js, motion.js, time.js

## Commands

```bash
npm run dev      # Start Vite dev server (port 8080)
npm run build    # Production build
npm run preview  # Preview production build
```

Note: Vite configured for port 8080 (see vite.config.js:13)

## Home Feed V2

**GraphQL Operations** (queries.js:738-890):
- `FEED` - Fetch paginated posts (lines 741-770)
- `POST_COMMENTS` - Lazy-load comments (lines 772-792)
- `CREATE_POST` - Create post with media (lines 794-819)
- `TOGGLE_LIKE` - Like/unlike post (lines 821-829)
- `ADD_POST_COMMENT` - Add comment (lines 831-848)

**Contract** (contracts/homeFeedV2.contract.js):
- PostV2 shape with author, text, media, stats, viewerState
- validatePostV2() for runtime validation

**Upload Flow** (lib/upload.js):
1. Select files → uploadMultipleMedia() → POST /api/upload
2. Returns URLs array
3. Pass URLs to CREATE_POST mutation

**Known Issues**:
- No rollback on failed optimistic updates
- GraphQL field renames break transformPost()
- Orphaned media if mutation fails after upload

## How to Run Locally

```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev
# App: http://localhost:8080 (or :5173)

# Build for production
npm run build

# Preview production build
npm run preview
```

## Key Commands

```bash
npm run dev      # Start Vite dev server (port 8080)
npm run build    # Build for production (outputs to dist/)
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Environment Variables Required

Create `frontend/.env` (copy from `.env.example`):

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...  # Clerk publishable key
VITE_GRAPHQL_IP=localhost               # GraphQL server host
VITE_GRAPHQL_PORT=4000                  # GraphQL server port
VITE_SOCKET_IP=localhost                # Socket.io server host
VITE_SOCKET_PORT=4001                   # Socket.io server port
```

## Key Routes

| Route | Component | Purpose | Protected |
|-------|-----------|---------|-----------|
| `/` | Landing | Public landing page | No |
| `/home` | Home (HomeFeedV2) | LinkedIn-style social feed | Yes |
| `/projects-new` | ProjectsHub | Browse projects (new design) | Yes |
| `/projects/:id` | ProjectDetails | Project info, updates, team | Yes |
| `/projects/:id/requests` | ApplicationRequests | Review/manage applications | Yes |
| `/messaging` | Messaging | Real-time Socket.io chat | Yes |
| `/profile` | Profile | User profile management | Yes |

**Route Guards**: Protected routes redirect to `/` if not authenticated (see `App.jsx`).

## GraphQL Queries & Mutations

**Defined in `src/queries.js` (890 lines):**

**Key Queries:**
- `ME` - Get current user (with Clerk ID, role, department)
- `GET_PROJECTS` - List all projects
- `GET_PROJECT_BY_ID` - Get project details
- `FEED` - Get social feed posts (paginated)
- `POST_COMMENTS` - Get post comments (paginated, lazy)

**Key Mutations:**
- `LOGIN_MUTATION` - Auto-provision user from Clerk token
- `CREATE_PROJECT` - Create new project
- `CREATE_APPLICATION` - Apply to project
- `CREATE_POST` - Create social feed post
- `TOGGLE_LIKE` - Like/unlike post
- `ADD_POST_COMMENT` - Comment on post

## Socket.io Integration

**Hook**: `src/hooks/useSocket.js`

**Usage:**
```javascript
const { socket, isConnected } = useSocket();

// Join channel
socket.emit('join_channel', projectId);

// Send message
socket.emit('chat_message', { projectId, text });

// Listen for messages
socket.on('receive_message', (message) => { ... });
```

**Auth**: JWT token passed on connection via `socket.handshake.auth.token`.

## File Upload Flow

**File**: `src/lib/upload.js`

**Functions:**
- `uploadSingleMedia(file)` - Upload single file, returns URL
- `uploadMultipleMedia(files)` - Upload multiple files, returns URL array

**Usage in PostComposer:**
1. User selects files
2. Frontend calls `uploadMultipleMedia(files)` → POST to backend `/api/upload`
3. Backend saves files to `public/uploads/YYYY/MM/` and returns URLs
4. Frontend calls `CREATE_POST` mutation with URLs
5. Backend saves post with media URLs to MongoDB

**Max Sizes**: 6MB images, 40MB videos

## Common Gotchas

1. **Backend must be running first**: Frontend crashes if GraphQL server is down.
2. **Clerk keys**: `VITE_CLERK_PUBLISHABLE_KEY` must start with `pk_test_`. Backend uses secret key.
3. **Port mismatch**: Ensure `VITE_GRAPHQL_PORT` matches backend GraphQL port (4000).
4. **Socket.io connection**: Check `VITE_SOCKET_IP` and `VITE_SOCKET_PORT` match backend Socket.io server (4001).
5. **Cache issues**: Apollo Client caches aggressively. Clear browser cache or use `fetchPolicy: 'network-only'`.
6. **Optimistic updates**: HomeFeedV2 uses optimistic UI. If mutation fails, UI shows incorrect state (no rollback).
7. **Build output**: `npm run build` outputs to `dist/`. Don't commit this folder.
8. **Env var prefix**: All env vars MUST start with `VITE_` to be exposed to client code.

## Where to Change What

| Task | Files |
|------|-------|
| Add GraphQL query/mutation | `src/queries.js` |
| Add new page/route | `src/App.jsx` (router), create component in `src/pages/` |
| Modify social feed UI | `src/components/homeV2/*` (HomeFeedV2, PostCardV2, PostComposerV2) |
| Add UI component | `src/components/ui/*` (shadcn/ui components) |
| Modify layout | `src/components/layout/*` (AppShell, TopNav, PageContainer) |
| Add custom hook | `src/hooks/` |
| Change upload logic | `src/lib/upload.js` |
| Modify auth flow | `src/main.jsx` (ClerkProvider), `src/App.jsx` (route guards) |
| Add toast notification | Use `toast()` from `src/lib/toast.js` |
| Change theme/colors | `tailwind.config.js` |

## DO NOT DO

1. **DO NOT** modify Apollo Client cache configuration without understanding implications. Can break optimistic updates.
2. **DO NOT** rename GraphQL query/mutation variables without updating backend schema. Breaking change.
3. **DO NOT** commit `.env` file. Only `.env.example` should be tracked.
4. **DO NOT** commit `dist/` folder. Build artifacts are ignored.
5. **DO NOT** use env vars without `VITE_` prefix. They won't be exposed to client.
6. **DO NOT** skip Clerk authentication checks. Use `useUser()` hook to verify auth state.
7. **DO NOT** modify `src/components/ui/*` directly if using shadcn/ui. Regenerate via CLI instead.
8. **DO NOT** hardcode backend URLs. Use env vars (`VITE_GRAPHQL_IP`, etc.).

## Known Issues

1. **No optimistic rollback**: HomeFeedV2 optimistic updates don't roll back on mutation failure.
2. **Enum display**: New backend role/department enums show as raw strings. Update `constructHeadline()` functions.
3. **No error boundaries**: App crashes on uncaught errors. No graceful error UI.
4. **No loading states on some pages**: ProjectDetails, Messaging lack proper skeleton loaders.

---

**Last Updated**: Jan 2026
**For backend context, see**: `../backend/CLAUDE.md`
**For high-level architecture, see**: `../CLAUDE.md`
