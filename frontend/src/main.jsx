import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";

import "./styles/globals.css";

import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  ApolloProvider,
  from,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { SocketProvider } from "./hooks/useSocket.jsx";
import { Toaster } from "sonner";
import { TooltipProvider } from "./components/ui/Tooltip.jsx";

// ===== DEV-ONLY SAFE DIAGNOSTICS =====
// Enable with: localStorage.setItem('debugNav', '1')
if (import.meta.env.DEV && localStorage.getItem('debugNav') === '1') {
  console.log('[NAV] Installing safe navigation diagnostics...');

  // Log navigation type on startup
  try {
    const navEntry = performance.getEntriesByType('navigation')[0];
    console.log('[NAV] navigation.type =', navEntry?.type || 'unknown');
    console.log('[NAV] Full navigation entry:', navEntry);
  } catch (e) {
    console.warn('[NAV] Could not read navigation entry:', e);
  }

  // Store original history methods
  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  // Patch history.pushState (SAFE - this works)
  history.pushState = function(...args) {
    console.log('[NAV] history.pushState → URL:', args[2] || '(same page)');
    console.trace('[NAV] Stack trace:');
    return originalPushState(...args);
  };

  // Patch history.replaceState (SAFE - this works)
  history.replaceState = function(...args) {
    console.log('[NAV] history.replaceState → URL:', args[2] || '(same page)');
    console.trace('[NAV] Stack trace:');
    return originalReplaceState(...args);
  };

  // Listen for beforeunload (page about to unload/reload)
  window.addEventListener('beforeunload', (e) => {
    console.warn('[NAV] beforeunload event fired! Page is about to reload/navigate.');
    console.trace('[NAV] Stack trace:');
  }, true);

  // Listen for pagehide (page hidden/unloaded)
  window.addEventListener('pagehide', (e) => {
    console.warn('[NAV] pagehide event fired! persisted:', e.persisted);
  }, true);

  // Listen for pageshow (page shown/loaded)
  window.addEventListener('pageshow', (e) => {
    console.log('[NAV] pageshow event fired! persisted:', e.persisted, '(true = from cache)');
  }, true);

  // Listen for popstate (back/forward navigation)
  window.addEventListener('popstate', (e) => {
    console.log('[NAV] popstate event fired! state:', e.state);
    console.trace('[NAV] Stack trace:');
  }, true);

  // Listen for hashchange (URL hash changed)
  window.addEventListener('hashchange', (e) => {
    console.log('[NAV] hashchange event fired! old:', e.oldURL, 'new:', e.newURL);
  }, true);

  // Listen for visibility changes (tab switching)
  document.addEventListener('visibilitychange', () => {
    console.log('[NAV] visibilitychange → document.visibilityState:', document.visibilityState);
  }, true);

  // Listen for unhandled errors
  window.addEventListener('error', (e) => {
    // Distinguish resource errors from JS errors
    if (e.target && (e.target.src || e.target.href)) {
      // Resource load error (img, script, link, etc.)
      const url = e.target.src || e.target.href;
      const tagName = e.target.tagName || 'unknown';
      console.warn('[NAV] Resource load error:', url, `(${tagName})`);
      console.warn('[NAV]   This is NOT an app crash, just a failed resource.');
    } else if (e.error || (e.message && e.message.trim())) {
      // Real JS error
      console.error('[NAV] Unhandled JS error!');
      console.error('[NAV]   message:', e.message);
      console.error('[NAV]   filename:', e.filename);
      console.error('[NAV]   lineno:', e.lineno, 'colno:', e.colno);
      console.error('[NAV]   error object:', e.error);
      if (e.error?.stack) {
        console.error('[NAV]   stack:', e.error.stack);
      }
    } else {
      console.warn('[NAV] Unknown error event:', e);
    }
  }, true);

  // Listen for unhandled promise rejections
  window.addEventListener('unhandledrejection', (e) => {
    console.error('[NAV] Unhandled promise rejection!');
    console.error('[NAV]   reason:', e.reason);
    if (e.reason?.stack) {
      console.error('[NAV]   stack:', e.reason.stack);
    }
    console.trace('[NAV] Stack trace:');
  });

  // Listen for handled promise rejections (rejections that were later caught)
  window.addEventListener('rejectionhandled', (e) => {
    console.log('[NAV] Promise rejection was handled (late catch)');
    console.log('[NAV]   reason:', e.reason);
  });

  console.log('[NAV] Safe diagnostics installed successfully');
}
// ===== END SAFE DIAGNOSTICS =====

// Apollo Client wrapper component that has access to Clerk auth
function ApolloProviderWithAuth({ children }) {
  const { getToken } = useAuth();

  // ✅ Memoize httpLink (static config, never changes)
  const httpLink = React.useMemo(
    () =>
      new HttpLink({
        uri: `http://${import.meta.env.VITE_GRAPHQL_IP}:${
          import.meta.env.VITE_GRAPHQL_PORT
        }/graphql`,
      }),
    []
  );

  // ✅ Memoize authLink (getToken is stable from Clerk)
  const authLink = React.useMemo(
    () =>
      setContext(async (_, { headers }) => {
        // Get the authentication token from Clerk
        const token = await getToken();

        // Return the headers to the context so httpLink can read them
        return {
          headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : "",
          },
        };
      }),
    [getToken]
  );

  // ✅ Memoize client (only recreate if links change, which they won't)
  const client = React.useMemo(
    () =>
      new ApolloClient({
        cache: new InMemoryCache({
          typePolicies: {
            User: {
              keyFields: ["_id"], // Normalize User by _id
            },
            Post: {
              keyFields: ["_id"], // Normalize Post by _id
            },
            Project: {
              keyFields: ["_id"], // Normalize Project by _id
            },
          },
        }),
        link: from([authLink, httpLink]),
      }),
    [authLink, httpLink]
  );

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}

// Get Clerk publishable key from environment
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error("Missing Clerk Publishable Key. Please add VITE_CLERK_PUBLISHABLE_KEY to your .env file.");
}

createRoot(document.getElementById("root")).render(
  <ClerkProvider publishableKey={clerkPubKey}>
    <ApolloProviderWithAuth>
      <SocketProvider>
        <BrowserRouter>
          <TooltipProvider delayDuration={300}>
            <App />
            <Toaster
              position="top-right"
              richColors
              closeButton
              toastOptions={{
                style: {
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                },
              }}
            />
          </TooltipProvider>
        </BrowserRouter>
      </SocketProvider>
    </ApolloProviderWithAuth>
  </ClerkProvider>
);

// ===== DEV-ONLY HMR LOGGING (SAFE) =====
if (import.meta.env.DEV && import.meta.hot && localStorage.getItem('debugNav') === '1') {
  try {
    // Guard each listener - if event name is invalid, it will silently fail

    try {
      import.meta.hot.on('vite:beforeFullReload', (payload) => {
        console.warn('[HMR] ⚠️  vite:beforeFullReload triggered! Full page reload incoming.');
        console.warn('[HMR] Payload:', payload);
        console.trace('[HMR] Stack trace:');
      });
    } catch (e) {
      console.log('[HMR] Could not register vite:beforeFullReload listener');
    }

    try {
      import.meta.hot.on('vite:beforeUpdate', (payload) => {
        console.log('[HMR] ✨ vite:beforeUpdate (normal HMR):', payload?.updates?.length || 0, 'updates');
      });
    } catch (e) {
      console.log('[HMR] Could not register vite:beforeUpdate listener');
    }

    try {
      import.meta.hot.on('vite:error', (payload) => {
        console.error('[HMR] ❌ vite:error:', payload);
      });
    } catch (e) {
      console.log('[HMR] Could not register vite:error listener');
    }

    try {
      import.meta.hot.on('vite:invalidate', (payload) => {
        console.warn('[HMR] 🔄 vite:invalidate (forcing full reload):', payload);
      });
    } catch (e) {
      console.log('[HMR] Could not register vite:invalidate listener');
    }

    console.log('[HMR] Vite HMR event listeners installed successfully');
  } catch (e) {
    console.warn('[HMR] Failed to install HMR listeners:', e);
  }
}
// ===== END HMR LOGGING =====
