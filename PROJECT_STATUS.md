# Stevens Research — Current Status

**Last Updated:** December 24, 2025
**Version:** Phase 2D Complete + UI Redesign
**Status:** ✅ Phase 2D feature-complete (ready for end-to-end testing)

> All core features fully implemented with LinkedIn-quality UI. Ready for end-to-end test runbook execution, auth hardening, email notifications, and monitoring setup before production deployment.

---

## Current Tech Stack

### Backend
- **Runtime:** Node.js v18+
- **API:** GraphQL (Apollo Server v4.11.0)
- **Database:** MongoDB v6.9.0 (Atlas Cloud)
- **Cache:** Redis v4.7.0
- **Real-time:** Socket.io v4.8.1
- **Auth:** Clerk Backend SDK v1.15.9

### Frontend
- **Framework:** React 18.3.1
- **Build:** Vite 5.4.10
- **State:** Apollo Client v3.11.10
- **Router:** React Router DOM v6.28.0
- **Auth:** Clerk React v5.18.0
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **UI Primitives:** Radix UI (Dialog, DropdownMenu, Tooltip, Tabs)
- **Toasts:** Sonner
- **Utilities:** clsx, tailwind-merge, class-variance-authority

### Infrastructure
- **Container:** Docker (Node 18-alpine)
- **Package Manager:** pnpm 9.14.2
- **Services:** Redis (local), MongoDB (Atlas), Clerk (cloud)

---

## Architecture Overview

### System Design
```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Browser   │─────▶│  Vite :8080  │─────▶│  Clerk Auth │
└─────────────┘      └──────────────┘      └─────────────┘
       │                     │
       │ GraphQL             │ JWT Token
       ▼                     ▼
┌─────────────┐      ┌──────────────┐
│Apollo :4000 │◀────▶│ MongoDB      │
│             │      │ Atlas        │
└─────────────┘      └──────────────┘
       │                     │
       │ Cache               │
       ▼                     ▼
┌─────────────┐      ┌──────────────┐
│Redis :6379  │      │ Socket.io    │
│             │      │ :4001        │
└─────────────┘      └──────────────┘
```

**Note:** Clerk handles authentication only (token issuance and verification). The browser communicates directly with GraphQL (:4000) and Socket.io (:4001) after obtaining a JWT token from Clerk.

### Authentication Flow
1. User signs in via Clerk (frontend)
2. Clerk issues JWT token
3. Token sent with every GraphQL request (Authorization header)
4. Backend verifies token with Clerk SDK
5. User fetched/created in MongoDB
6. Role-based authorization enforced (STUDENT, PROFESSOR, ADMIN)

### Database Schema
- **users** - User profiles (Clerk handles passwords)
- **projects** - Research projects with teams
- **updates** - Project announcements/progress
- **applications** - Student project applications
- **comments** - Comments on updates/applications
- **messages** - Real-time chat messages per project
- **posts** - LinkedIn-style social feed posts
- **postLikes** - Like tracking for posts (separate collection for scalability)
- **postComments** - Comments on feed posts (separate for pagination)

### Caching Strategy
- **List queries:** 1-hour TTL in Redis
- **Single resources:** No expiration
- **Invalidation:** Manual on mutations

---

## Features Implemented

### Phase 1 - Core Platform ✅
- ✅ User registration & authentication (Clerk)
- ✅ Role-based access control (STUDENT/PROFESSOR/ADMIN)
- ✅ Project CRUD operations
- ✅ Application system (apply/approve/reject)
- ✅ Updates & comments system
- ✅ Client-side filtering (title, department, year)
- ✅ GraphQL API with Apollo Server
- ✅ MongoDB Atlas integration
- ✅ Redis caching layer

**Note:** No backend full-text search or indexing implemented. Filtering is performed client-side on fetched data.

### Phase 2A - Discovery & Exploration ✅
- ✅ Public project discovery (browse all projects)
- ✅ Project detail views with team members
- ✅ Application workflow UI (apply button, status tracking)
- ✅ Request management page (approve/reject applications)
- ✅ Advanced filtering (department, year)
- ✅ Application status badges (PENDING, APPROVED, REJECTED)

### Phase 2B - Social Features ✅
- ✅ Global newsfeed (all project updates)
- ✅ Feed composer (create updates with rich text editor)
- ✅ Comment threads on updates
- ✅ Left sidebar (user info, navigation)
- ✅ Right sidebar (notifications preview, trending)
- ✅ Feed post cards with metadata

### Phase 2C - Real-time Messaging ✅
- ✅ Project-based chat channels (Socket.io)
- ✅ Real-time message broadcasting to all connected clients
- ✅ Message persistence in MongoDB
- ✅ Load last 50 messages on channel join
- ✅ Conversation list UI with project channels
- ✅ Message timestamps & sender identification
- ✅ Connection status indicators
- ✅ Reconnection handling

**Messaging UI supports project channels + real-time send/receive + persistence; no unread/presence features yet.**

### Phase 2D - Home Feed V2 (LinkedIn-Style Social Feed) ✅
- ✅ LinkedIn-quality post creation with media support
- ✅ Image posts (1-4 images) and video posts
- ✅ Media upload via separate upload service (`uploadMultipleMedia()`)
- ✅ Like/unlike posts with optimistic UI updates
- ✅ Nested comments with lazy-loading on expand
- ✅ Feed cursor-based pagination (10 posts per page, "Load more" button)
- ✅ Optimistic UI for all interactions (create, like, comment)
- ✅ Realistic seed data (15 Stevens research posts)
- ✅ Static file serving for uploads
- ✅ Proper URL persistence (no ObjectURLs in DB)

**Backend:**
- **Collections:** `posts`, `postLikes`, `postComments`
- **Endpoints:** `POST /api/upload` (Clerk-authenticated), `GET /static/*`
- **GraphQL Operations:**
  - `FEED` - Cursor-based feed query with `nextCursor` pagination
  - `CREATE_POST` - Create post with text + media URLs
  - `TOGGLE_LIKE` - Toggle like state, returns updated counts
  - `POST_COMMENTS` - Lazy query for loading comments (limit: 20)
  - `ADD_POST_COMMENT` - Add comment mutation

**Data Flow:**
1. Media upload: Files → `uploadMultipleMedia()` → Returns URLs
2. Post creation: URLs passed to `CREATE_POST` GraphQL mutation
3. Feed fetch: `FEED` query with cursor pagination
4. Comments: Lazy-loaded via `POST_COMMENTS` when user expands

**Not Implemented:** Delete post/comment, edit post, share post, post analytics, rollback on mutation failure.

---

## UI/UX (LinkedIn-Style Design System)

### Design System Components
- **Layout:** Shared `PageContainer`, `PageHeader`, `AppShell` with page transitions
- **Navigation:** Sticky `TopNav` with blur backdrop and active state indicators
- **UI Primitives:** `Button`, `Card`, `Input`, `Select`, `Badge`, `Avatar`, `Tabs`, `Dialog`, `Tooltip`, `DropdownMenu`
- **State Components:** `Skeleton` (loading), `EmptyState` (no data), `InlineAlert` (errors/warnings)
- **Notifications:** Toast system using Sonner
- **Motion:** Page transitions, hover effects, message animations with Framer Motion

### Pages Upgraded (8/8)
1. ✅ **Landing** - Hero section, feature cards, CTA sections, stats
2. ✅ **Home** - Three-column layout (sidebar, feed, sidebar), feed composer, post cards
3. ✅ **Projects** - Grid view with filters, search, skeleton loading, empty states
4. ✅ **ProjectDetails** - Two-column layout, team tabs, application button, stats sidebar
5. ✅ **ProjectRequests** - Stats cards, tabbed views (pending/all), per-row loading states
6. ✅ **Messaging** - Two-column layout, conversation list with search, message thread with real-time updates
7. ✅ **Notifications** - Tabbed views (all/mentions), notification cards with icons, motion effects
8. ✅ **Profile** - Cover image, avatar, bio, real project data, activity timeline

### Design Tokens
- **Colors:** Stevens Maroon (#9D1535) primary, semantic colors for states
- **Typography:** System font stack, consistent sizing scale
- **Spacing:** 4px base grid system
- **Shadows:** Subtle card shadows, elevated states on hover
- **Animations:** 200ms transitions, prefers-reduced-motion support

---

## Quick Setup

### Prerequisites
- Node.js v18+
- Redis running locally (port 6379)
- MongoDB Atlas account (free tier)
- Clerk account (free tier)

### Environment Variables

**Backend** (`backend/.env`):
```env
mongoServerUrl=mongodb+srv://user:pass@cluster.mongodb.net/...
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

### Start Services

```bash
# Terminal 1: Redis
redis-stack-server

# Terminal 2: Backend
cd backend
npm install
npm run seed  # First time only
npm start     # GraphQL :4000, Socket.io :4001

# Terminal 3: Frontend
cd frontend
npm install
npm run dev   # Vite :8080
```

---

## Ports Reference

| Service                  | Port        | URL                              |
| ------------------------ | ----------- | -------------------------------- |
| Frontend (Vite)          | 5173 / 8080 | http://localhost:5173 (default)  |
| GraphQL API              | 4000        | http://localhost:4000/graphql    |
| Upload Endpoint          | 4000        | http://localhost:4000/api/upload |
| Static Files             | 4000        | http://localhost:4000/static     |
| Socket.io Server         | 4001        | http://localhost:4001            |
| Redis                    | 6379        | localhost:6379                   |
| MongoDB                  | Cloud       | Atlas connection string          |

**Note:** Vite defaults to port 5173 but may use 8080 if configured in vite.config.js or if 5173 is already in use.

---

## Current Project Structure

```
research-collaboration-platform/
├── backend/
│   ├── app.js              # Socket.io server
│   ├── index.js            # Apollo Server entry point
│   ├── graphQl/
│   │   ├── resolvers.js    # GraphQL resolvers
│   │   └── typeDefs.js     # GraphQL schema
│   ├── data/               # MongoDB operations
│   ├── tasks/
│   │   └── seed.js         # Database seeding script
│   └── .env.example        # Environment template
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── home/       # Feed, sidebars
│   │   │   ├── messaging/  # Chat components
│   │   │   ├── projects/   # Project views
│   │   │   ├── notifications/ # Notification cards
│   │   │   ├── layout/     # AppShell, PageContainer, TopNav
│   │   │   └── ui/         # Design system primitives
│   │   ├── pages/          # Route pages (8 core pages)
│   │   ├── hooks/          # Custom hooks (useSocket, useCurrentUser)
│   │   ├── lib/            # Utilities (utils.js, motion.js, toast.js)
│   │   ├── styles/         # Global CSS and Tailwind config
│   │   └── queries.js      # GraphQL queries/mutations
│   └── .env.example        # Environment template
├── scripts/                # Development utilities
├── docs/                   # Testing documentation
│   └── SYSTEM_TEST_RUNBOOK.md  # Manual testing guide
├── README.MD               # Full setup & usage guide
└── PROJECT_STATUS.md       # This file (current state)
```

---

## Testing

### System Test Checklist
See `docs/SYSTEM_TEST_RUNBOOK.md` for comprehensive end-to-end testing guide before production deployment.

**Quick Smoke Tests:**

1. **Home Feed V2** - `/home` (PRIMARY TEST)
   - Feed loads 10 posts from database
   - Create text-only post → appears at top
   - Create post with images (1-4) → uploads + displays correctly
   - Like/unlike post → count updates, button state changes
   - Click comments → loads from database
   - Add comment → count increments, appears immediately
   - Load more posts → cursor pagination works
   - Refresh page → everything persists (URLs not ObjectURLs)

2. **Legacy Feed Post** - `/home` (if using old feed)
   - Professor/Admin can compose and post update with rich text
   - Update appears in feed immediately
   - Users can add comments

3. **Project Application** - `/projects`
   - Student can browse projects and apply
   - Application status changes to "Application submitted"
   - Application appears in professor's request list

4. **Request Management** - `/projects/:id/requests`
   - Professor sees pending applications
   - Can approve or reject with per-row loading states
   - Status updates reflect in project details

5. **Real-time Messaging** - `/messaging`
   - Open in two browser windows (different users)
   - Select same project channel
   - Messages appear in real-time in both windows
   - Connection status indicator shows "Connected"

6. **Profile Projects** - `/me`
   - User's projects load from GraphQL query
   - Project count matches actual data
   - Clicking project navigates to details

**Health Check:**
```bash
# Verify GraphQL endpoint
curl http://localhost:4000/graphql

# Verify Socket.io endpoint
curl http://localhost:4001/health

# Open frontend
open http://localhost:8080
```

### Test Accounts
Seed script creates 20 professors and 20 students. Create corresponding Clerk accounts with metadata:
```json
{
  "role": "PROFESSOR",
  "department": "COMPUTER_SCIENCE"
}
```

---

## Known Issues & Limitations

### Current Limitations
- No file uploads/attachments in chat or updates (legacy feed only; Home Feed V2 has media)
- No email notifications for updates/applications
- No backend full-text search (client-side filtering only)
- No message search or filtering
- No typing indicators in chat
- No read receipts or unread message counts
- No user presence indicators (online/offline status)
- No infinite scroll on legacy feed (Home Feed V2 has cursor pagination)

### Browser Support
- Chrome/Firefox/Safari (latest versions)
- Requires JavaScript enabled
- WebSocket support required for real-time chat

---

## Next Steps / Roadmap

### Pre-Production Requirements
- [ ] Execute full system test runbook (`docs/SYSTEM_TEST_RUNBOOK.md`)
- [ ] Auth hardening (rate limiting, token refresh)
- [ ] Error monitoring setup (Sentry/LogRocket)
- [ ] Performance optimization (code splitting, lazy loading)
- [ ] Production environment variables setup

### Potential Phase 3 Features
- [ ] File sharing in chat/updates
- [ ] Email notifications (Resend/SendGrid)
- [ ] Message search & filtering
- [ ] Typing indicators and read receipts
- [ ] User presence (online/offline)
- [ ] Project analytics dashboard
- [ ] Export project data
- [ ] Admin panel for user management
- [ ] Advanced search (full-text, tags, filters)
- [ ] Infinite scroll pagination
- [ ] Mobile responsive refinements

---

## Troubleshooting

### Quick Fixes

**Backend won't start:**
- Check MongoDB Atlas IP whitelist
- Verify Redis is running: `redis-cli ping`
- Verify Clerk secret key in `backend/.env`

**Frontend won't start:**
- Check Clerk publishable key in `frontend/.env`
- Clear browser cache and node_modules
- Verify backend is running first
- Run `npm install` if dependencies changed

**Chat not working:**
- Verify Socket.io server running on :4001
- Check browser console for WebSocket errors
- Ensure `VITE_SOCKET_IP` and `VITE_SOCKET_PORT` are correct
- Check connection status indicator in UI

**User not in MongoDB:**
- Sign in first (triggers auto-create)
- Check MongoDB Atlas connection
- Verify IP whitelist includes your current IP
- Check Clerk webhook configuration

**Build fails:**
- Clear `dist` folder: `rm -rf dist`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Reinstall dependencies: `rm -rf node_modules && npm install`

---

## Known Couplings/Risks

### Home Feed V2 Dependencies
1. **Optimistic Updates (No Rollback)**
   - Like, comment, and post creation update UI immediately
   - If backend mutation fails, UI shows incorrect state
   - No automatic rollback implemented
   - Risk: User confusion on network errors

2. **GraphQL Schema Field Rename Risk**
   - Frontend expects exact field names: `_id`, `text`, `author`, `media`, `likeCount`, `commentCount`, `viewerHasLiked`
   - Backend schema changes (e.g., `_id` → `id`, `text` → `content`) will break transformations
   - Location: `HomeFeedV2.jsx:41-85` (`transformPost()` function)

3. **Cursor Format Dependency**
   - Pagination relies on backend returning `feed.nextCursor` in specific format
   - Changes to cursor structure will break "Load more" feature
   - Location: `HomeFeedV2.jsx:194-221` (`handleLoadMore()`)

4. **Clerk Availability Dependency**
   - Entire feed blocks if Clerk fails to load (`HomeFeedV2.jsx:223`)
   - Media upload requires Clerk token (`PostComposerV2.jsx:88`)
   - No graceful degradation on auth failure

5. **Media Upload Service Coupling**
   - Two-step process: Upload files → GraphQL mutation with URLs
   - Upload service (`uploadMultipleMedia()`) must be available before post creation
   - If upload succeeds but GraphQL mutation fails, orphaned files exist
   - Location: `PostComposerV2.jsx:98-132`

6. **Department/Role Enum Mapping**
   - Hardcoded mappings in `constructHeadline()` functions
   - New backend enums (e.g., `QUANTUM_PHYSICS`) display as raw strings
   - Locations: `HomeFeedV2.jsx:17-38`, `PostCardV2.jsx:43-57`

### Mitigation Strategies (Not Implemented)
- Add contract validation layer for GraphQL responses
- Implement rollback logic for failed optimistic updates
- Add enum mapping fallback with warning logs
- Graceful degradation when Clerk unavailable
- Cleanup orphaned media files on mutation failure

---

## References

- **Full Setup Guide:** `README.MD`
- **Testing Guide:** `docs/SYSTEM_TEST_RUNBOOK.md`
- **Seed Data:** `backend/tasks/seed.js`
- **GraphQL Schema:** `backend/graphQl/typeDefs.js`
- **UI Components:** `frontend/src/components/ui/`
- **Design System:** `frontend/tailwind.config.js`, `frontend/src/styles/globals.css`

---

**For questions or issues, open a GitHub issue.**
