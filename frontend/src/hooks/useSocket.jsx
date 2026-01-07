import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useUser, useAuth } from '@clerk/clerk-react';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    // Only create socket connection when user is loaded and signed in
    if (!isLoaded || !user) {
      return;
    }

    // Create socket connection with JWT authentication
    const initSocket = async () => {
      try {
        // Get initial Clerk JWT token
        const token = await getToken();

        if (!token) {
          console.error('Failed to get authentication token');
          return;
        }

        // Create socket connection (unified server: GraphQL + Socket.IO) with JWT auth
        // Support both full URL (production) and IP+PORT (local dev)
        const socketUrl = import.meta.env.VITE_SOCKET_URL ||
          `http://${import.meta.env.VITE_SOCKET_IP}:${import.meta.env.VITE_SOCKET_PORT}`;

        // IMPORTANT: Use auth callback to refresh token on every reconnection attempt
        const newSocket = io(socketUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
          auth: async (cb) => {
            // Refresh token on every connection/reconnection
            const freshToken = await getToken();
            console.log('🔑 [Socket] Refreshing JWT token for connection');
            cb({ token: freshToken });
          },
        });

        return newSocket;
      } catch (error) {
        console.error('Error initializing socket:', error);
        return null;
      }
    };

    let newSocket = null;

    initSocket().then((sock) => {
      if (!sock) return;

      newSocket = sock;

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('🟢 [Socket] CONNECTED - Socket ID:', newSocket.id);
      setIsConnected(true);

      // Emit user_connected event with user email
      newSocket.emit('user_connected', {
        email: user.primaryEmailAddress?.emailAddress,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔴 [Socket] DISCONNECTED - Reason:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ [Socket] Connection error:', error.message);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 [Socket] RECONNECTED after', attemptNumber, 'attempts');
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('⏳ [Socket] Reconnection attempt', attemptNumber);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setIsConnected(false);
    });

      setSocket(newSocket);
    });

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user, isLoaded, getToken]);

  const value = {
    socket,
    isConnected,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
