import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import queries from '../../queries';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useSocket } from '../../hooks/useSocket';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';
import { Search } from 'lucide-react';

export const DirectMessageInbox = ({
  activeConversationId,
  onSelectConversation,
  onConversationsUpdate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [localConversations, setLocalConversations] = useState([]);
  const { currentUser } = useCurrentUser();
  const { socket } = useSocket();

  const { data, loading, refetch } = useQuery(queries.CONVERSATIONS, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.conversations?.items) {
        setLocalConversations(data.conversations.items);
      }
    }
  });

  // Listen for conversation updates via Socket.IO
  useEffect(() => {
    if (!socket) return;

    socket.emit('join_dm_room');

    const handleConversationUpdate = (data) => {
      console.log('[DM Inbox] Conversation updated:', data);

      // Update local conversations list
      setLocalConversations(prev => {
        const existing = prev.find(conv => conv._id === data.conversationId);

        if (existing) {
          // Update existing conversation
          return prev.map(conv =>
            conv._id === data.conversationId
              ? { ...conv, lastMessage: data.lastMessage, updatedAt: new Date().toISOString() }
              : conv
          ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        } else {
          // Refetch to get the new conversation with full data
          refetch();
          return prev;
        }
      });

      // Notify parent to update unread count
      if (onConversationsUpdate) {
        onConversationsUpdate();
      }
    };

    socket.on('conversation_updated', handleConversationUpdate);

    return () => {
      socket.off('conversation_updated', handleConversationUpdate);
    };
  }, [socket, refetch, onConversationsUpdate]);

  const conversations = localConversations || [];

  const filteredConversations = conversations.filter(conv => {
    if (!currentUser) return false;

    const otherUser = conv.participants.find(p => p._id !== currentUser._id);
    if (!otherUser) return false;

    return `${otherUser.firstName} ${otherUser.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
  });

  if (loading && conversations.length === 0) {
    return (
      <div className="flex flex-col h-full border-r border-border bg-white">
        <div className="p-4 border-b border-border">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full border-r border-border bg-white">
        <p className="text-gray-500">Loading user...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border-r border-border bg-white">
      {/* Search header */}
      <div className="p-4 border-b border-border bg-white sticky top-0 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium mb-1">
              {searchTerm ? 'No conversations found' : 'No conversations yet'}
            </p>
            <p className="text-sm text-gray-400">
              {searchTerm
                ? 'Try a different search term'
                : 'Start a conversation from a user profile'}
            </p>
          </div>
        ) : (
          filteredConversations.map(conv => {
            const otherUser = conv.participants.find(p => p._id !== currentUser._id);

            if (!otherUser) return null;

            const isActive = activeConversationId === conv._id;

            return (
              <div
                key={conv._id}
                onClick={() => onSelectConversation(conv)}
                className={cn(
                  'flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-border',
                  'hover:bg-gray-50 active:bg-gray-100',
                  isActive && 'bg-blue-50 hover:bg-blue-50 border-l-4 border-l-stevensMaroon'
                )}
              >
                <Avatar
                  src={otherUser.profilePhoto}
                  fallback={otherUser.firstName[0] + (otherUser.lastName?.[0] || '')}
                  className="w-12 h-12"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className={cn(
                      "font-medium truncate",
                      conv.unreadCount > 0 && "text-gray-900 font-semibold"
                    )}>
                      {otherUser.firstName} {otherUser.lastName}
                    </p>
                    {conv.unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-2 shrink-0">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </Badge>
                    )}
                  </div>

                  {conv.lastMessage && (
                    <p className={cn(
                      "text-sm truncate",
                      conv.unreadCount > 0 ? "text-gray-900 font-medium" : "text-gray-500"
                    )}>
                      {conv.lastMessage.sender._id === currentUser._id ? 'You: ' : ''}
                      {conv.lastMessage.text}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
