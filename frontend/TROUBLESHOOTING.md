# Troubleshooting: Authentication Failed Error

## Error
```
Failed to bootstrap user: ApolloError: Authentication failed
```

## Likely Causes

### 1. Missing or Invalid Clerk Secret Key (Backend)

**Check:** Ensure `backend/.env` has a valid Clerk secret key:
```bash
cat backend/.env | grep CLERK_SECRET_KEY
```

**Expected:**
```
CLERK_SECRET_KEY=sk_test_XXXXXXXXXX  # or sk_live_XXXXXXXXXX
```

**How to get your Clerk Secret Key:**
1. Go to https://dashboard.clerk.com
2. Select your application
3. Go to "API Keys" section
4. Copy the "Secret Key" (starts with `sk_test_` or `sk_live_`)
5. Add it to `backend/.env`

**Then restart the backend:**
```bash
cd backend
# Stop the running backend (Ctrl+C or kill the process)
npm start
```

### 2. Missing Clerk Publishable Key (Frontend)

**Check:** Ensure `frontend/.env` has your Clerk publishable key:
```bash
cat frontend/.env | grep VITE_CLERK_PUBLISHABLE_KEY
```

**Expected:**
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_XXXXXXXXXX  # or pk_live_XXXXXXXXXX
```

**How to get your Clerk Publishable Key:**
1. Go to https://dashboard.clerk.com
2. Select your application
3. Go to "API Keys" section
4. Copy the "Publishable Key" (starts with `pk_test_` or `pk_live_`)
5. Add it to `frontend/.env`

**Then restart the frontend:**
```bash
cd frontend
# Stop the running frontend (Ctrl+C)
npm run dev
```

### 3. Clerk Application Domains Not Configured

**Check:** Ensure your Clerk application allows localhost:
1. Go to https://dashboard.clerk.com
2. Select your application
3. Go to "Domains" section
4. Ensure `http://localhost:8080` is in the allowed domains

### 4. User Metadata Not Configured in Clerk

The backend expects users to have `role` and `department` in their Clerk `publicMetadata`.

**For testing, manually add metadata to your test user:**
1. Go to https://dashboard.clerk.com
2. Go to "Users" section
3. Click on your test user
4. Scroll to "Public metadata" section
5. Click "Edit"
6. Add this JSON:
```json
{
  "role": "STUDENT",
  "department": "COMPUTER_SCIENCE"
}
```
7. Click "Save"

**Valid roles:**
- `STUDENT`
- `PROFESSOR`
- `ADMIN`

**Valid departments:**
- `COMPUTER_SCIENCE`
- `ELECTRICAL_AND_COMPUTER_ENGINEERING`
- `MECHANICAL_ENGINEERING`
- `CIVIL_ENVIRONMENTAL_AND_OCEAN_ENGINEERING`
- `CHEMICAL_ENGINEERING_AND_MATERIALS_SCIENCE`
- etc. (see backend/graphQl/typeDefs.js for full list)

### 5. Backend Not Running or Wrong Port

**Check if backend is running:**
```bash
lsof -ti:4000
```

If no output, the backend isn't running. Start it:
```bash
cd backend
npm start
```

**Check frontend GraphQL configuration:**
```bash
cat frontend/.env | grep VITE_GRAPHQL
```

**Expected:**
```
VITE_GRAPHQL_IP=localhost
VITE_GRAPHQL_PORT=4000
```

### 6. MongoDB Atlas Connection Issue

**Check backend logs** for MongoDB connection errors. If you see connection errors:

1. Verify MongoDB Atlas connection string in `backend/.env`:
```bash
cat backend/.env | grep mongoServerUrl
```

2. Ensure:
   - Connection string has correct password
   - Your IP is whitelisted in MongoDB Atlas Network Access
   - Database user has read/write permissions

### 7. Redis Not Running

**Check if Redis is running:**
```bash
redis-cli ping
```

**Expected:** `PONG`

If Redis isn't running:
```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Or run in foreground
redis-server
```

## Debugging Steps

### Step 1: Check Browser Console

Open browser DevTools → Console tab. Look for additional error details:

```javascript
// You should see these logs from ProtectedRoute:
// "Bootstrapping user with Clerk ID: user_XXXXXX"
// "GraphQL Errors: [...]"  // <- This will show the exact error
```

### Step 2: Check Backend Logs

Look at your backend terminal for error messages. You should see:
```
Connected to Redis
MongoDB connected successfully
Server running at http://localhost:4000
```

If you see errors about Clerk or authentication, that's your issue.

### Step 3: Test Clerk Token Manually

Add this temporary code to ProtectedRoute to see if you're getting a token:

```javascript
const token = await getToken();
console.log("Clerk Token:", token?.substring(0, 20) + "...");  // Show first 20 chars
```

If token is `null` or `undefined`, Clerk isn't working properly.

### Step 4: Test GraphQL Without Auth

Try the ME query in your browser console:

```javascript
fetch('http://localhost:4000', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apollo-require-preflight': 'true',
  },
  body: JSON.stringify({
    query: '{ me { _id firstName lastName email role } }'
  })
})
.then(r => r.json())
.then(console.log);
```

**Expected error:** "UNAUTHENTICATED" (because no token)

This confirms GraphQL is working, just auth is failing.

## Quick Fix Checklist

- [ ] `backend/.env` has `CLERK_SECRET_KEY=sk_test_...` or `sk_live_...`
- [ ] `frontend/.env` has `VITE_CLERK_PUBLISHABLE_KEY=pk_test_...` or `pk_live_...`
- [ ] `frontend/.env` has `VITE_GRAPHQL_IP=localhost` and `VITE_GRAPHQL_PORT=4000`
- [ ] Backend is running on port 4000
- [ ] Frontend is running on port 8080
- [ ] Clerk application domains include `http://localhost:8080`
- [ ] Test user has `publicMetadata.role` and `publicMetadata.department` set in Clerk
- [ ] Redis is running (`redis-cli ping` returns `PONG`)
- [ ] MongoDB Atlas is connected (check backend logs)

## Still Not Working?

### Check if it's a Clerk environment mismatch:

**Problem:** Using a test publishable key with a live secret key (or vice versa).

**Solution:** Ensure both keys are from the same environment:
- `pk_test_` + `sk_test_` (Development environment)
- OR `pk_live_` + `sk_live_` (Production environment)

### Verify Clerk Backend Configuration:

The backend code expects Clerk to work in a specific way. Check [backend/app.js:58-116](../backend/app.js#L58-L116) to see how it verifies tokens.

If you're using a different Clerk setup, you may need to adjust the authentication logic.

---

## Expected Working Flow

When everything is configured correctly:

1. **User signs in via Clerk** → Clerk redirects to `/home`
2. **ProtectedRoute loads** → Calls ME query (fails because user not in MongoDB yet)
3. **Bootstrap process starts:**
   - Gets Clerk token via `getToken()`
   - Calls LOGIN mutation with token in Authorization header
   - Backend verifies Clerk token with Clerk API
   - Backend creates user in MongoDB with data from Clerk
   - Returns success
4. **ME query refetches** → Now returns user from MongoDB
5. **User sees homepage** → No errors

If you see "Authentication failed", the flow breaks at step 3 when the backend tries to verify the Clerk token.

**Most Common Fix:** Add the correct `CLERK_SECRET_KEY` to `backend/.env` and restart the backend.
