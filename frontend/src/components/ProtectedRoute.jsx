import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useQuery, useMutation } from "@apollo/client";
import queries from "../queries";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const location = useLocation();

  // Query to get current user from MongoDB
  const { data, loading, error, refetch } = useQuery(queries.ME, {
    skip: !isSignedIn,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });

  // Login mutation to bootstrap user on first auth
  const [login] = useMutation(queries.LOGIN_MUTATION);

  // Bootstrap user in MongoDB on first authentication
  useEffect(() => {
    const bootstrapUser = async () => {
      if (isSignedIn && !loading && !data?.me && clerkUser) {
        try {
          // Wait for Clerk token to be available
          const token = await getToken();

          if (!token) {
            console.error("No Clerk token available");
            return;
          }

          console.log("Bootstrapping user with Clerk ID:", clerkUser.id);

          // The login mutation requires a token parameter in the schema,
          // but the actual authentication happens via the Authorization header
          // (added automatically by Apollo auth link in main.jsx)
          // We pass a placeholder to satisfy the schema requirement
          const result = await login({ variables: { token: "authenticated-via-header" } });
          console.log("Login mutation result:", result);

          // Refetch ME query to get the user data
          await refetch();
        } catch (err) {
          console.error("Failed to bootstrap user:", err);
          // Log more details about the error
          if (err.graphQLErrors) {
            console.error("GraphQL Errors:", err.graphQLErrors);
          }
          if (err.networkError) {
            console.error("Network Error:", err.networkError);
          }
        }
      }
    };

    bootstrapUser();
  }, [isSignedIn, loading, data, clerkUser, login, refetch, getToken]);

  // Wait for Clerk to load
  if (!isLoaded || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // Check if there was an error fetching user data
  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <p>Error loading user data. Please try refreshing the page.</p>
      </div>
    );
  }

  // Wait for user to be bootstrapped in MongoDB
  if (!data?.me) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <p>Setting up your account...</p>
      </div>
    );
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(data.me.role)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', flexDirection: 'column' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
        <p>Required roles: {allowedRoles.join(', ')}</p>
        <p>Your role: {data.me.role}</p>
        <a href="/dashboard">Go to Dashboard</a>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
