# Bug Fix: LOGIN_MUTATION Token Parameter Error

## Issue
When accessing the app after the Phase 1 redesign, users encountered the following error in the browser console:

```
Failed to bootstrap user: ApolloError: Variable "$token" of required type "String!" was not provided.
```

## Root Cause

The `LOGIN_MUTATION` GraphQL mutation defined in [queries.js:654-664](src/queries.js#L654-L664) requires a `$token: String!` parameter:

```graphql
mutation Login($token: String!) {
  login(token: $token) {
    message
    _id
    name
    email
    role
  }
}
```

However, in [ProtectedRoute.jsx:27](src/components/ProtectedRoute.jsx#L27), the mutation was being called without passing the required `token` variable:

```javascript
await login();  // ❌ Missing required variable
```

## Why This Happened

The backend authentication was redesigned during the Firebase-to-Clerk migration. The new authentication flow works as follows:

1. **Clerk token in Authorization header** - Apollo Client automatically adds the Clerk JWT token to every GraphQL request via the `authLink` configured in [main.jsx:24-34](src/main.jsx#L24-L34)

2. **Backend verifies token from header** - The backend's `app.js` [authenticateUser function](../../backend/app.js#L58-L116) extracts and verifies the token from the `Authorization: Bearer <token>` header

3. **User bootstrapping** - If the user exists in Clerk but not in MongoDB, the backend automatically creates a MongoDB user record

4. **Login mutation's token parameter is unused** - The `login` resolver in [backend/graphQl/resolvers.js:3306-3321](../../backend/graphQl/resolvers.js#L3306-L3321) doesn't actually use the `token` parameter from the mutation variables - it uses `context.currentUser` which was already set by the authentication middleware

```javascript
// Backend resolver - ignores args.token
login: async (_, args, context) => {
  // Token is already verified in context (app.js)
  if (!context.currentUser) {
    throw new GraphQLError('Authentication failed', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }

  return {
    message: "Login successful",
    _id: context.currentUser._id,
    // ...
  };
}
```

## The Fix

Updated [ProtectedRoute.jsx:30](src/components/ProtectedRoute.jsx#L30) to pass a placeholder token value:

```javascript
// Before (broken):
await login();

// After (fixed):
await login({ variables: { token: "authenticated-via-header" } });
```

### Why This Works

- The GraphQL schema requirement is satisfied (we provide the required `String!` parameter)
- The backend resolver ignores this parameter and uses the token from the Authorization header instead
- Authentication still works correctly through the Clerk JWT in the header
- User bootstrapping completes successfully

## Alternative Solutions Considered

### Option 1: Make token parameter optional in backend schema
```graphql
# Change from:
login(token: String!): LoginResponse!

# To:
login(token: String): LoginResponse!
```

**Pros:**
- More accurate schema (reflects that token isn't actually used)
- Frontend doesn't need to pass placeholder

**Cons:**
- Requires backend schema change
- Breaking change for any existing clients expecting required parameter

**Decision:** Not chosen for Phase 1 to avoid backend changes

### Option 2: Remove token parameter entirely
```graphql
login: LoginResponse!
```

**Pros:**
- Cleanest solution - schema matches implementation
- No unused parameters

**Cons:**
- Larger backend change
- Would need to update backend resolver signature

**Decision:** Can be done in Phase 2 as part of backend cleanup

### Option 3: Pass actual Clerk token to mutation
```javascript
const { getToken } = useAuth();
const token = await getToken();
await login({ variables: { token } });
```

**Pros:**
- Passes real token value

**Cons:**
- Redundant - token is already in Authorization header
- Adds unnecessary async call
- Backend doesn't use it anyway

**Decision:** Not chosen - adds unnecessary complexity

## Testing

After the fix:

✅ **User authentication works**
- Clerk sign-in redirects to `/home`
- ME query returns user data
- User bootstrapping creates MongoDB record

✅ **No console errors**
- LOGIN_MUTATION executes successfully
- Browser console is clean

✅ **Protected routes work**
- Authenticated users can access all routes
- Role-based access control functions correctly

## Files Modified

- [frontend/src/components/ProtectedRoute.jsx](src/components/ProtectedRoute.jsx#L30)

## Related Documentation

- [Phase 1 Complete](../../PHASE_1_COMPLETE.md) - Frontend redesign documentation
- [Migration Summary](../../MIGRATION_SUMMARY.md) - Firebase to Clerk migration details
- [Backend app.js](../../backend/app.js#L58-L116) - Authentication middleware
- [Backend resolvers.js](../../backend/graphQl/resolvers.js#L3306-L3321) - Login mutation resolver

---

**Status:** ✅ Fixed
**Date:** December 20, 2025
**Impact:** Resolved critical authentication bug blocking all protected routes
