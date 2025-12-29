# Frontend - Stevens Research Platform

## Purpose

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

**Known Issues** (see agent_docs/home-feed-v2-map.md):
- No rollback on failed optimistic updates
- GraphQL field renames break transformPost()
- Orphaned media if mutation fails after upload

## Feature Flags

Check `src/pages/Home.jsx` for toggle between legacy feed (Newsfeed component) and Home Feed V2 (HomeFeedV2 component).
