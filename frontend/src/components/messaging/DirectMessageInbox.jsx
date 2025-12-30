import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useSocket } from '../../hooks/useSocket';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import queries from '../../queries';
import { Input } from '../ui/Input';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { Search } from 'lucide-react';
import { cn } from '../../lib/utils';

export const DirectMessageInbox = ({
  activeConversationId,
  onSelectConversation,
  onConversationsUpdate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [localConversations, setLocalConversations] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const { socket } = useSocket();
  const { user: currentUser } = useCurrentUser();

  const { data, loading, refetch } = useQuery(queries.CONVERSATIONS, {
    fetchPolicy: 'network-only',
    skip: !currentUser,
  });

  useEffect(() => {
    if (data?.conversations?.items) {
      setLocalConversations(data.conversations.items);
    }
  }, [data]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleConversationUpdated = (update) => {
      setLocalConversations(prev => {
        if (!prev) return prev;
        const exists = prev.find(c => c._id === update.conversationId);
        if (exists) {
          return prev.map(c =>
            c._id === update.conversationId
              ? { ...c, lastMessage: update.lastMessage, updatedAt: new Date().toISOString() }
              : c
          );
        }
        refetch();
        return prev;
      });
      onConversationsUpdate();
    };

    const handleUserOnline = ({ userId }) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    };

    const handleUserOffline = ({ userId }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    socket.on('conversation_updated', handleConversationUpdated);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);

    return () => {
      socket.off('conversation_updated', handleConversationUpdated);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
    };
  }, [socket, onConversationsUpdate, refetch]);

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
      <div className="flex flex-col h-full bg-white">
        <div className="p-5 border-b border-gray-100">
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="w-14 h-14 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">

      {/* Modern search header */}
      <div className="p-5 border-b border-gray-100 bg-white">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Conversation list with better spacing */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-900 font-semibold mb-1">
              {searchTerm ? 'No conversations found' : 'No conversations yet'}
            </p>
            <p className="text-sm text-gray-500">
              {searchTerm ? 'Try a different search term' : 'Start a new conversation'}
            </p>
          </div>
        ) : (
          filteredConversations.map(conv => {
            const otherUser = conv.participants.find(p => p._id !== currentUser._id);
            const isActive = activeConversationId === conv._id;
            const isUnread = conv.unreadCount > 0;
            const isOnline = onlineUsers.has(otherUser._id);

            return (
              <div
                key={conv._id}
                onClick={() => onSelectConversation(conv)}
                className={cn(
                  "px-4 py-4 cursor-pointer transition-all duration-200 border-b border-gray-100",
                  "hover:bg-gray-50 active:bg-gray-100",
                  isActive && "bg-blue-50 hover:bg-blue-50 border-l-4 border-l-stevensMaroon pl-[14px]",
                  isUnread && !isActive && "bg-gray-50"
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar with online indicator */}
                  <div className="relative flex-shrink-0">
                    <Avatar
                      src={otherUser.profilePhoto}
                      fallback={otherUser.firstName[0] + (otherUser.lastName?.[0] || '')}
                      className={cn(
                        "transition-all duration-200",
                        isUnread ? "w-14 h-14 ring-2 ring-stevensMaroon ring-offset-2" : "w-12 h-12"
                      )}
                    />
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                    )}
                  </div>

                  {/* Content with better spacing */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <p className={cn(
                        "truncate transition-all",
                        isUnread ? "font-bold text-gray-900 text-base" : "font-semibold text-gray-700"
                      )}>
                        {otherUser.firstName} {otherUser.lastName}
                      </p>
                      {isUnread && (
                        <Badge variant="destructive" className="ml-2 shrink-0 min-w-[24px] h-6 px-2 text-xs font-bold shadow-sm">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </Badge>
                      )}
                    </div>

                    {conv.lastMessage && (
                      <div className="flex items-center gap-2">
                        {isUnread && (
                          <div className="w-2 h-2 rounded-full bg-stevensMaroon flex-shrink-0" />
                        )}
                        <p className={cn(
                          "text-sm truncate",
                          isUnread ? "text-gray-900 font-semibold" : "text-gray-500"
                        )}>
                          {conv.lastMessage.sender._id === currentUser._id ? 'You: ' : ''}
                          {conv.lastMessage.text}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
