import { useQuery } from "@apollo/client";
import { useAuth } from "@clerk/clerk-react";
import queries from "../queries";

// Custom hook to get current user from MongoDB via ME query
// This replaces the old AuthContext
export const useCurrentUser = () => {
  const { isSignedIn, isLoaded } = useAuth();

  const { data, loading, error, refetch } = useQuery(queries.ME, {
    skip: !isSignedIn,
    // PHASE 4: Use cache-first for better UX
    // With proper type policies, cache will be updated by mutations
    // and this will re-render automatically
    fetchPolicy: "cache-first",
    // Fetch from network first time, then use cache
    nextFetchPolicy: "cache-first",
  });

  return {
    user: data?.me || null,
    loading: !isLoaded || loading,
    error,
    refetch,
    isAuthenticated: isSignedIn && !!data?.me,
  };
};
