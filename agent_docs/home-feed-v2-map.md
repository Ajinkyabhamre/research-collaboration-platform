# Home Feed V2 - Architecture Map

## Purpose

LinkedIn-style social feed (Phase 2D). Text/image/video posts, likes, comments, cursor pagination, optimistic UI.

## Files

**Frontend:**
- `components/homeV2/HomeFeedV2.jsx` - transformPost() (41-85), handleLoadMore() (194-221)
- `components/homeV2/PostComposerV2.jsx` - Upload flow (98-132)
- `components/homeV2/PostCardV2.jsx` - Like/comment UI
- `contracts/homeFeedV2.contract.js` - PostV2 typedef, validatePostV2()
- `queries.js:738-890` - FEED, CREATE_POST, TOGGLE_LIKE, POST_COMMENTS, ADD_POST_COMMENT

**Backend:**
- `graphQl/typeDefs.js:304-360` - Post types
- `graphQl/typeDefs.js:558-590` - Mutations
- `server.js:135-190` - POST /api/upload
- `server.js:89` - Static serving /static/*
- Storage: `public/uploads/YYYY/MM/`

## Known Couplings (High Risk)

**1. No Rollback on Optimistic Update Failures**
- Like, comment, post creation update UI immediately
- If backend mutation fails, UI shows incorrect state
- Location: All optimistic updates in HomeFeedV2.jsx, PostCardV2.jsx

**2. GraphQL Field Rename Risk**
- transformPost() expects exact field names: _id, text, author, media, likeCount, commentCount, viewerHasLiked
- Renaming breaks transformation (HomeFeedV2.jsx:41-85)

**3. Cursor Format Dependency**
- Pagination relies on backend returning feed.nextCursor
- Format changes break "Load more" (HomeFeedV2.jsx:194-221)

**4. Orphaned Media Files**
- Upload succeeds → GraphQL mutation fails → orphaned files in public/uploads/
- No cleanup implemented (PostComposerV2.jsx:98-132)

**5. Enum Mapping Hardcoded**
- Department/Role enums mapped in constructHeadline() functions
- New backend enums display as raw strings
- Locations: HomeFeedV2.jsx:17-38, PostCardV2.jsx:43-57

## Symptom → Fix

**Feed not loading:** Check FEED query fields match schema (queries.js:741-770 vs typeDefs.js:308-320)

**Images not uploading:** Check upload.js POST /api/upload, server.js:135-190, Clerk token

**Pagination broken:** Verify nextCursor in FeedPage (typeDefs.js:342-347), handleLoadMore() (HomeFeedV2.jsx:194-221)

**Post shape errors:** Run validatePostV2(), check transformPost() (HomeFeedV2.jsx:41-85)
