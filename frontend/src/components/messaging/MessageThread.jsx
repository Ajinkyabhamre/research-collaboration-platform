import React, { useState, useEffect, useRef } from 'react';
import { Avatar } from '../ui/Avatar';
import { Button, IconButton } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { InlineAlert } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import { useSocket } from '../../hooks/useSocket';
import { useUser } from '@clerk/clerk-react';
import { Send, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const MessageThread = ({ project }) => {
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { socket, isConnected } = useSocket();
  const { user } = useUser();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket || !project || !isConnected) {
      return;
    }

    setLoading(true);
    setMessages([]);

    // Join the project channel
    socket.emit('join_channel', project._id);

    // Listen for previous messages when joining
    const handlePreviousMessages = (previousMessages) => {
      setMessages(previousMessages || []);
      setLoading(false);
    };

    // Listen for new messages
    const handleNewMessage = (messageData) => {
      setMessages((prev) => [...prev, messageData]);
    };

    socket.on('previous_messages', handlePreviousMessages);
    socket.on('chat_message', handleNewMessage);

    // Cleanup listeners when project changes or component unmounts
    return () => {
      socket.off('previous_messages', handlePreviousMessages);
      socket.off('chat_message', handleNewMessage);
    };
  }, [socket, project, isConnected]);

  const handleSend = () => {
    if (!newMessage.trim() || !socket || !project || !user) {
      return;
    }

    const messageData = {
      channel: project._id,
      user: user.primaryEmailAddress?.emailAddress || 'Anonymous',
      message: newMessage.trim(),
      timestamp: new Date(),
    };

    // Emit message to server
    socket.emit('chat_message', messageData);

    // Clear input
    setNewMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!project) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <EmptyState
          icon={MessageSquare}
          title="Select a project"
          description="Choose a project channel from the list to start messaging"
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-borderLight">
        <h3 className="font-semibold text-lg">{project.title}</h3>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="default" className="text-xs">Project Channel</Badge>
          {isConnected && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              Connected
            </div>
          )}
        </div>
      </div>

      {/* Disconnected Alert */}
      {!isConnected && (
        <div className="p-4">
          <InlineAlert variant="warning" title="Connecting to chat...">
            Please wait while we establish a connection.
          </InlineAlert>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-16 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              icon={MessageSquare}
              title="No messages yet"
              description="Start the conversation by sending the first message!"
            />
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-4">
              {messages.map((msg, index) => {
                const isOwnMessage = msg.user === user?.primaryEmailAddress?.emailAddress;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      'flex',
                      isOwnMessage ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div className="flex items-end gap-2 max-w-[70%]">
                      {!isOwnMessage && <Avatar name={msg.user} size="sm" />}
                      <div className="flex flex-col">
                        {!isOwnMessage && (
                          <p className="text-xs text-muted-foreground mb-1 px-1">
                            {msg.user}
                          </p>
                        )}
                        <div
                          className={cn(
                            'rounded-2xl px-4 py-2',
                            isOwnMessage
                              ? 'bg-gradient-maroon text-white rounded-br-sm'
                              : 'bg-muted text-gray-900 rounded-bl-sm'
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.message}
                          </p>
                          <p
                            className={cn(
                              'text-xs mt-1',
                              isOwnMessage ? 'text-white/80' : 'text-muted-foreground'
                            )}
                          >
                            {formatTimestamp(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                      {isOwnMessage && <Avatar name={msg.user} size="sm" />}
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-borderLight">
        <div className="flex items-end gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Write a message... (Enter to send, Shift+Enter for new line)"
            className={cn(
              'flex-1 px-4 py-3 rounded-2xl border resize-none',
              'focus:outline-none focus:ring-2 focus:ring-stevensMaroon focus:border-transparent',
              'transition-all duration-200',
              !isConnected && 'bg-muted cursor-not-allowed'
            )}
            rows={1}
            disabled={!isConnected}
          />
          <IconButton
            onClick={handleSend}
            disabled={!newMessage.trim() || !isConnected}
            className="bg-gradient-maroon text-white hover:opacity-90 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </IconButton>
        </div>
        {!isConnected && (
          <p className="text-xs text-muted-foreground mt-2">
            Chat is currently unavailable. Connecting...
          </p>
        )}
      </div>
    </div>
  );
};
