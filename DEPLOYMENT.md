# Deployment Verification Guide

This document provides commands and procedures to verify the deployment readiness of the Research Collaboration Platform.

## Local Verification (Before Deploying)

### 1. Backend Verification

**Start backend with production-like settings:**
```bash
cd backend

# Set production-like env vars
export PORT=4000
export FRONTEND_ORIGIN="http://localhost:8080,http://localhost:5173"
export BASE_URL="http://localhost:4000"
export NODE_ENV=development

# Start server
npm start
```

**Verify backend health:**
```bash
# Health check endpoint
curl http://localhost:4000/health

# Expected output:
# {
#   "status": "ok",
#   "services": {
#     "graphql": "running",
#     "socketio": "running",
#     "upload": "running"
#   },
#   "port": 4000,
#   "timestamp": "2026-01-07T..."
# }
```

**Test GraphQL endpoint:**
```bash
# Test GraphQL (no auth required for introspection)
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { queryType { name } } }"}'

# Expected output:
# {"data":{"__schema":{"queryType":{"name":"Query"}}}}
```

**Check CORS headers:**
```bash
# Test CORS preflight
curl -X OPTIONS http://localhost:4000/graphql \
  -H "Origin: http://localhost:8080" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Look for in response headers:
# Access-Control-Allow-Origin: http://localhost:8080
# Access-Control-Allow-Credentials: true
```

**Verify environment variables:**
```bash
# Check that backend respects PORT env var
lsof -ti:4000

# Check CORS origins in startup logs (should print allowed origins)
# Look for: "CORS allowed origins: http://localhost:8080, http://localhost:5173"
```

### 2. Frontend Verification

**Build frontend:**
```bash
cd frontend

# Test build with production-like env vars
export VITE_CLERK_PUBLISHABLE_KEY="pk_test_dummy"
export VITE_GRAPHQL_URL="http://localhost:4000/graphql"
export VITE_SOCKET_URL="http://localhost:4000"
export VITE_API_BASE_URL="http://localhost:4000"

npm run build

# Expected output:
# ✓ built in XXXms
# dist/index.html                   X.XX kB
# dist/assets/...
```

**Verify build output:**
```bash
# Check that dist/ directory exists
ls -lah frontend/dist/

# Should contain:
# - index.html
# - assets/ (with .js, .css files)

# Verify env vars are embedded in build
grep -r "VITE_GRAPHQL_URL" frontend/dist/assets/*.js
# (Should find references if env vars are used)
```

**Test production preview:**
```bash
cd frontend
npm run preview

# Open http://localhost:4173 in browser
# Verify app loads (may show auth errors if backend not configured)
```

### 3. CI/CD Verification

**Test GitHub Actions locally (optional - requires act):**
```bash
# Install act: https://github.com/nektos/act
# brew install act

# Test backend job
act -j backend

# Test frontend job
act -j frontend
```

**Push to GitHub and verify:**
```bash
# Commit and push changes
git add .
git commit -m "chore: add CI/CD and deployment readiness"
git push origin main

# Check GitHub Actions tab
# https://github.com/YOUR_USERNAME/YOUR_REPO/actions
# Verify both backend and frontend jobs pass
```

## Production Verification (After Deploying)

### Backend (Railway)

**1. Health Check:**
```bash
# Replace with your Railway URL
BACKEND_URL="https://your-backend.railway.app"

curl $BACKEND_URL/health

# Expected output:
# {
#   "status": "ok",
#   "services": {
#     "graphql": "running",
#     "socketio": "running",
#     "upload": "running"
#   },
#   "port": XXXX,
#   "timestamp": "..."
# }
```

**2. GraphQL Endpoint:**
```bash
# Test GraphQL introspection
curl -X POST $BACKEND_URL/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { queryType { name } } }"}'

# Should return schema info
```

**3. CORS Configuration:**
```bash
# Test CORS from your frontend origin
curl -X OPTIONS $BACKEND_URL/graphql \
  -H "Origin: https://your-app.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Verify response headers include:
# Access-Control-Allow-Origin: https://your-app.vercel.app
```

**4. Socket.io Connection:**
```bash
# Test Socket.io endpoint (should return 404 for GET, but server is responsive)
curl $BACKEND_URL/socket.io/

# If it returns "0" or similar, Socket.io is running
```

**5. Check Railway Logs:**
```bash
# In Railway dashboard, check deployment logs for:
# ✅ Server ready at http://localhost:XXXX
# CORS allowed origins: https://your-app.vercel.app
# No MongoDB connection errors
# No Redis connection errors
```

### Frontend (Vercel)

**1. Deployment Success:**
```bash
# Check Vercel deployment status
# Should show "Ready" with green checkmark

# Access your frontend URL
FRONTEND_URL="https://your-app.vercel.app"
curl -I $FRONTEND_URL

# Should return 200 OK
```

**2. Environment Variables:**
```bash
# In Vercel dashboard > Settings > Environment Variables
# Verify all required variables are set:
# - VITE_CLERK_PUBLISHABLE_KEY
# - VITE_GRAPHQL_URL
# - VITE_SOCKET_URL
# - VITE_API_BASE_URL

# Check build logs for env var warnings
# Look for: "Using VITE_GRAPHQL_URL: https://..."
```

**3. Browser Console Check:**
```bash
# Open frontend in browser
# Open DevTools > Console
# Look for:
# - No CORS errors
# - No 401 Unauthorized on GraphQL requests (before login is OK)
# - Socket.io connection logs: "🟢 [Socket] CONNECTED"
```

**4. Verify Build Output:**
```bash
# In Vercel deployment logs, check:
# - Build command: npm run build
# - Output directory: dist
# - Build status: Success
# - No missing env var warnings
```

## Production Smoke Test Checklist

Once both backend and frontend are deployed, run through this checklist:

### Authentication
- [ ] Navigate to frontend URL
- [ ] Click "Sign In" (Clerk widget should appear)
- [ ] Sign in with test account
- [ ] Verify redirect to `/home` after successful login
- [ ] Check browser console for auth errors (should be none)

### GraphQL
- [ ] On `/home` page, verify feed loads
- [ ] Navigate to `/projects-new`, verify projects load
- [ ] Click on a project, verify details load
- [ ] Check Network tab for GraphQL requests (should be 200 OK)

### Socket.io
- [ ] Navigate to `/messaging`
- [ ] Check browser console for: "🟢 [Socket] CONNECTED"
- [ ] Join a project channel
- [ ] Send a test message
- [ ] Verify message appears in chat
- [ ] Open second browser tab, verify real-time message appears

### File Upload
- [ ] Navigate to `/home`
- [ ] Create a new post with image attachment
- [ ] Click "Upload" and select an image
- [ ] Verify upload progress indicator
- [ ] Submit post
- [ ] Verify image displays in feed
- [ ] Check Network tab: upload request should be 200 OK
- [ ] Verify image URL points to backend (not localhost)

### CORS
- [ ] Open browser DevTools > Console
- [ ] Check for any CORS errors (should be none)
- [ ] If CORS errors appear, verify `FRONTEND_ORIGIN` in Railway matches Vercel URL

### Error Handling
- [ ] Sign out (should redirect to landing page)
- [ ] Try accessing protected route (should redirect to `/`)
- [ ] Try invalid GraphQL query (should show error, not crash)

## Common Issues & Solutions

### Issue: Backend health check fails
**Solution:**
- Check Railway logs for errors
- Verify MongoDB connection string is correct
- Verify Redis is accessible (Railway plugin or external)
- Check environment variables are set

### Issue: CORS errors in browser
**Solution:**
- Verify `FRONTEND_ORIGIN` in Railway includes your Vercel URL
- Format: `https://your-app.vercel.app` (no trailing slash)
- If multiple domains, separate with commas: `https://app1.vercel.app,https://app2.vercel.app`
- Redeploy backend after changing env vars

### Issue: Socket.io won't connect
**Solution:**
- Verify `VITE_SOCKET_URL` in Vercel points to backend URL
- Check backend logs for Socket.io errors
- Verify Clerk token is valid (sign out and back in)
- Check browser console for connection errors

### Issue: File uploads return localhost URLs
**Solution:**
- Set `BASE_URL` in Railway to your backend URL
- Format: `https://your-backend.railway.app` (no trailing slash)
- Redeploy backend

### Issue: GraphQL 401 Unauthorized
**Solution:**
- Verify Clerk keys match (backend secret, frontend publishable)
- Use production keys in production (not test keys)
- Sign out and back in to refresh token
- Check Clerk dashboard for API limits

### Issue: CI fails on GitHub Actions
**Solution:**
- Check workflow logs for specific errors
- Verify `package-lock.json` files exist (required for `npm ci`)
- For frontend build errors, verify dummy env vars in workflow are set
- Ensure `npm run lint` passes locally before pushing

## Local Commands Reference

```bash
# Backend
cd backend
npm start                    # Start backend server
curl http://localhost:4000/health  # Health check

# Frontend
cd frontend
npm run build                # Build for production
npm run preview              # Preview production build
npm run lint                 # Run linter

# Root
./scripts/dev.sh             # Start all services
./scripts/stop.sh            # Stop all services

# Redis
redis-stack-server           # Start Redis
redis-cli ping               # Check Redis (should return PONG)
redis-cli FLUSHALL           # Clear Redis cache

# Port cleanup (if ports are stuck)
lsof -ti:4000 -ti:4001 -ti:8080 | xargs kill -9
```

## Environment Variables Quick Reference

### Backend (Railway)
```env
PORT=4000                                          # Auto-provided by Railway
mongoServerUrl=mongodb+srv://...                  # MongoDB Atlas
mongoDbname=research_collaboration_db
redis_ip=redis.railway.internal                   # Railway Redis or external
redis_port=6379
CLERK_SECRET_KEY=sk_live_...                      # Production key
NODE_ENV=production
FRONTEND_ORIGIN=https://your-app.vercel.app       # Your Vercel URL
BASE_URL=https://your-backend.railway.app         # Your Railway URL
```

### Frontend (Vercel)
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...                    # Production key
VITE_GRAPHQL_URL=https://your-backend.railway.app/graphql # Full GraphQL URL
VITE_SOCKET_URL=https://your-backend.railway.app          # Backend URL
VITE_API_BASE_URL=https://your-backend.railway.app        # Backend URL
```

---

**Last Updated:** Jan 2026
**Maintainer:** Team Cool Kids
