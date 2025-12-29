# System Test Runbook

**Last Updated:** December 23, 2025
**Purpose:** End-to-end manual testing guide for Stevens Research Collaboration Platform

---

## Prerequisites

### Required Software
- Node.js v18+
- Redis (redis-stack-server)
- MongoDB Atlas account (free tier)
- Clerk account (free tier)
- macOS, Linux, or Windows with WSL

### Required Credentials
- MongoDB Atlas connection string
- Clerk Secret Key (backend)
- Clerk Publishable Key (frontend)

---

## Hard Reset (Clean Start)

### Kill All Ports (macOS/Linux)

```bash
# Kill backend GraphQL/Upload server (port 4000)
lsof -ti :4000 | xargs kill -9

# Kill Socket.io server (port 4001)
lsof -ti :4001 | xargs kill -9

# Kill frontend dev server (port 5173 or 8080)
lsof -ti :5173 | xargs kill -9
lsof -ti :8080 | xargs kill -9

# Kill Redis (port 6379) - optional, usually fine to keep running
lsof -ti :6379 | xargs kill -9
```

### Clear Node Modules (if dependencies changed)

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

---

## Environment Setup

### Backend (.env)

Create `backend/.env`:

```env
mongoServerUrl=mongodb+srv://user:pass@cluster.mongodb.net/...
mongoDbname=research_collaboration_db
redis_ip=127.0.0.1
redis_port=6379
CLERK_SECRET_KEY=sk_test_...
NODE_ENV=development
```

### Frontend (.env)

Create `frontend/.env`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_GRAPHQL_IP=localhost
VITE_GRAPHQL_PORT=4000
VITE_SOCKET_IP=localhost
VITE_SOCKET_PORT=4001
VITE_API_BASE_URL=http://localhost:4000
```

---

## Step-by-Step Startup

### 1. Start Redis

```bash
# Terminal 1
redis-stack-server
```

**Expected Output:**
```
Ready to accept connections
```

**Verify:**
```bash
redis-cli ping
# Should return: PONG
```

---

### 2. Seed Database

```bash
# Terminal 2
cd backend
npm run seed
```

**Expected Output:**
```
Connected to database
Seeding users...
Inserted 40 users
Seeding projects...
Inserted 20 projects
Seeding posts...
Inserted 15 posts
Inserted 350 likes
Inserted 75 comments
Posts seeding complete!
```

**Verify MongoDB:**
- Open MongoDB Compass or Atlas UI
- Check collections exist: `users`, `projects`, `posts`, `postLikes`, `postComments`
- Verify `posts` collection has 15 documents
- Check `posts` have media URLs starting with `https://images.unsplash.com`

---

### 3. Start Backend

```bash
# Still in Terminal 2 (after seed completes)
npm start
```

**Expected Output:**
```
Connected to Redis
🚀 GraphQL Server ready at: http://localhost:4000/graphql
📁 Static files served at: http://localhost:4000/static
📤 Upload endpoint at: http://localhost:4000/api/upload
🔌 Socket.IO server running on http://localhost:4001
```

**Verify GraphQL Endpoint:**
```bash
curl http://localhost:4000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "services": {
    "graphql": "running",
    "upload": "running",
    "port": 4000
  },
  "timestamp": "2025-12-23T..."
}
```

**Test GraphQL Query:**
Open http://localhost:4000/graphql in browser (Apollo Sandbox) and run:

```graphql
query {
  me {
    _id
    firstName
    lastName
    email
    role
  }
}
```

**Expected:** Returns null (not authenticated) OR your user data if you add Authorization header.

---

### 4. Start Frontend

```bash
# Terminal 3
cd frontend
npm run dev
```

**Expected Output:**
```
VITE v5.4.10  ready in 1234 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Open:** http://localhost:5173 (or :8080 if configured)

---

## Test Scenarios

### Scenario 1: Authentication & User Auto-Creation

**Steps:**
1. Open http://localhost:5173
2. Click "Sign In" (Clerk modal appears)
3. Sign in with test account OR create new account
4. After successful sign-in, should redirect to /home

**Expected:**
- User is auto-created in MongoDB (check Atlas)
- User's role and department populated from Clerk metadata
- No errors in browser console
- No errors in backend terminal

**Verify:**
```bash
# In MongoDB, check users collection
# Should have a new document with your email
```

---

### Scenario 2: Home Feed V2 - View Posts

**Steps:**
1. Navigate to `/home`
2. Wait for feed to load (skeleton → posts)

**Expected:**
- Feed displays 10 posts (seed created 15, but limit is 10)
- Each post shows:
  - Author name and headline (e.g., "Professor • Computer Science")
  - Time ago (e.g., "2 hours ago", "5 days ago")
  - Post text content
  - Media (images or video if present)
  - Like count and comment count
  - Action buttons: Like, Comment
- "Load more posts" button appears at bottom
- No console errors

**Verify Data:**
- Posts are sorted newest first (check timestamps)
- Like counts match MongoDB `posts.likeCount`
- Comment counts match MongoDB `posts.commentCount`

---

### Scenario 3: Create Text-Only Post

**Steps:**
1. On `/home`, click in post composer ("What's on your mind?")
2. Type: "Testing the new home feed! This is a text-only post."
3. Click "Post" button

**Expected:**
- Post button shows "Posting..." briefly
- New post appears at top of feed
- Toast notification: "Posted!"
- Composer clears
- Post shows your name, "just now", and the text
- Like count: 0, Comment count: 0

**Verify:**
```bash
# Refresh page
# Post should still be there (persisted in DB)
# Check MongoDB posts collection - should have new document
```

---

### Scenario 4: Create Post with Images

**Steps:**
1. Click post composer
2. Type: "Here's our latest research lab setup!"
3. Click image icon (camera)
4. Select 2-3 image files from your computer (JPG/PNG, < 6MB each)
5. Preview images appear
6. Click "Post"

**Expected:**
- Button shows "Uploading 1/3...", "Uploading 2/3...", etc.
- After uploads complete, button shows "Posting..."
- Post appears with all images in a grid layout
- Images are clickable (lightbox opens)
- Refresh page → images still load (URLs are permanent, not ObjectURLs)

**Verify Upload:**
```bash
# Check backend/public/uploads/YYYY/MM/ directory
# Should have 2-3 new files (timestamped filenames)

# Check MongoDB posts collection
# New post should have media array with URLs like:
# "http://localhost:4000/static/uploads/2025/12/1703356789-xyz123.jpg"
```

**Test Errors:**
- Try uploading file > 6MB → should show error toast
- Try uploading .txt file → should show error toast

---

### Scenario 5: Like/Unlike Post

**Steps:**
1. Find any post in feed
2. Click thumbs-up icon (Like button)
3. Wait ~200ms
4. Click again (Unlike)

**Expected:**
- First click: Button turns blue, count increments by 1
- Second click: Button turns gray, count decrements by 1
- Changes persist on refresh

**Verify:**
```bash
# Check MongoDB postLikes collection
# Should have document with your userId and postId
# When unliked, document is deleted
```

---

### Scenario 6: View & Add Comments

**Steps:**
1. Find post with "5 comments" (or any count > 0)
2. Click "5 comments"
3. Comments section expands
4. Type comment: "Great work! Looking forward to the paper."
5. Click Send icon or press Enter

**Expected:**
- First 2 comments load immediately
- "Load more comments" button appears if > 2 comments
- After adding comment:
  - Comment appears immediately
  - Comment count increments
  - Toast: "Comment added"
- Refresh page → comment persists

**Verify:**
```bash
# Check MongoDB postComments collection
# Should have new document with your userId, postId, and text
```

**Test Load More:**
- If post has > 2 comments, click "Load more comments"
- Next 5 comments load
- Button disappears when all loaded

---

### Scenario 7: Feed Pagination

**Steps:**
1. Scroll to bottom of feed
2. Click "Load more posts" button
3. Wait for loading

**Expected:**
- Button shows "Loading..." with spinner
- Next 10 posts appear (if available)
- If all 15 posts loaded, message appears: "You're all caught up! 🎉"
- No "Load more" button after all posts loaded

**Verify:**
- Posts don't duplicate
- Newest posts stay at top

---

### Scenario 8: Create Post with Video

**Steps:**
1. Click post composer
2. Click video icon
3. Select .mp4 or .webm file (< 40MB)
4. Type: "Demo of our robotic arm prototype"
5. Click "Post"

**Expected:**
- Video uploads (shows progress)
- Post appears with video player
- Video is playable
- Refresh → video still loads from permanent URL

**Verify:**
```bash
# Check backend/public/uploads/YYYY/MM/
# Should have .mp4 or .webm file

# Check MongoDB post media
# Should have type: "VIDEO"
```

---

### Scenario 9: Regression - Projects Still Work

**Steps:**
1. Navigate to `/projects`
2. Browse project list
3. Click a project → detail page loads
4. (If student) Click "Apply" → application submits
5. (If professor) View `/projects/:id/requests` → see applications

**Expected:**
- All project features work as before
- No GraphQL errors
- Applications save to MongoDB

---

### Scenario 10: Regression - Messaging Still Works

**Steps:**
1. Navigate to `/messaging`
2. Select a project channel
3. Type message: "Testing message persistence"
4. Send

**Expected:**
- Socket.io connects (check "Connected" indicator)
- Message appears immediately
- Message persists (refresh and check)
- Open in second browser (different user) → real-time message appears

---

## Error Handling Tests

### Test 1: Upload Endpoint Auth

```bash
# Try uploading without auth token
curl -X POST http://localhost:4000/api/upload \
  -F "file=@test.jpg"
```

**Expected Response:**
```json
{
  "error": "Unauthorized",
  "message": "You must be logged in to upload files"
}
```

### Test 2: Upload Invalid File Type

```bash
# With valid Clerk token
curl -X POST http://localhost:4000/api/upload \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -F "file=@document.pdf"
```

**Expected Response:**
```json
{
  "error": "Upload failed",
  "message": "File type not allowed. Allowed types: ..."
}
```

### Test 3: Create Post Without Auth

```graphql
mutation {
  createPost(text: "Test post") {
    _id
  }
}
```

**Expected Error:**
```
You must be logged in to perform this action
```

---

## Performance Checks

### Load Time Benchmarks

- **Feed Initial Load:** < 1 second (10 posts)
- **Single Image Upload:** < 2 seconds (for 2MB image)
- **Like Toggle:** < 300ms (optimistic UI feels instant)
- **Comment Load:** < 500ms (first 20 comments)
- **Load More Posts:** < 800ms (next 10 posts)

### Browser DevTools Checks

1. Network tab:
   - GraphQL query `feed` returns 200 OK
   - Media URLs return 200 OK (images load)
   - No 404 errors

2. Console:
   - No React errors
   - No GraphQL errors
   - Apollo cache warnings are OK (expected)

3. Application tab:
   - LocalStorage has Clerk session
   - No sensitive data in localStorage

---

## Rollback Procedure

If major issues found:

1. **Stop all servers** (Ctrl+C in all terminals)
2. **Revert database:**
   ```bash
   cd backend
   npm run seed  # Drops and re-seeds
   ```
3. **Clear Redis:**
   ```bash
   redis-cli FLUSHALL
   ```
4. **Restart servers** (steps 1-4 above)

---

## Success Criteria

All scenarios pass with:
- ✅ No console errors
- ✅ No GraphQL errors
- ✅ Data persists across refreshes
- ✅ URLs are permanent (not ObjectURLs)
- ✅ Uploads stored in backend/public/uploads/
- ✅ MongoDB collections populated correctly
- ✅ Existing features (Projects, Messaging) unaffected

---

## Common Issues & Fixes

### Issue: "Cannot read property 'items' of undefined"

**Fix:** Backend not seeded. Run `npm run seed`.

### Issue: Images show broken icon

**Fix:** Check static file serving:
```bash
curl http://localhost:4000/static/seed-media/.gitkeep
# Should return file content, not 404
```

### Issue: "Network error" on GraphQL query

**Fix:**
1. Check backend is running on port 4000
2. Check `VITE_GRAPHQL_IP` and `VITE_GRAPHQL_PORT` in frontend/.env
3. Restart frontend dev server

### Issue: Upload fails with "Authentication required"

**Fix:**
1. Sign out and sign back in (refresh Clerk token)
2. Check Clerk env vars in backend/.env
3. Check Authorization header in Network tab (should be `Bearer ...`)

### Issue: Socket.io not connecting

**Fix:**
1. Check app.js is running (separate from server.js)
2. Check port 4001 not blocked
3. Check `VITE_SOCKET_IP` and `VITE_SOCKET_PORT` in frontend/.env

---

## Post-Testing Checklist

After all scenarios pass:

- [ ] All 10 test scenarios completed
- [ ] No errors in browser console
- [ ] No errors in backend terminal
- [ ] MongoDB collections verified
- [ ] Upload directory verified
- [ ] Regression tests passed
- [ ] Performance benchmarks met
- [ ] Error handling tested

---

**Ready for production deployment!** 🚀
