import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useSocket } from '../../hooks/useSocket';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import queries from '../../queries';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Avatar } from '../ui/Avatar';
import { InlineAlert as Alert } from '../ui/Alert';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { Send, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DirectMessageThread = ({ conversation, onMessageSent }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { socket, isConnected } = useSocket();
  const { currentUser } = useCurrentUser();

  const { data, loading } = useQuery(queries.CONVERSATION_MESSAGES, {
    variables: { conversationId: conversation._id },
    skip: !conversation,
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.conversationMessages?.items) {
        // Reverse to show oldest first
        setMessages([...data.conversationMessages.items].reverse());
      }
    }
  });

  const [sendMessage] = useMutation(queries.SEND_DIRECT_MESSAGE);
  const [markAsRead] = useMutation(queries.MARK_CONVERSATION_AS_READ);

  const otherUser = conversation?.participants?.find(p => p._id !== currentUser?._id);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Join conversation room and mark as read
  useEffect(() => {
    if (!socket || !conversation) return;

    socket.emit('join_conversation', conversation._id);

    // Mark as read when opening
    markAsRead({
      variables: { conversationId: conversation._id }
    }).catch(err => {
      console.error('Failed to mark as read:', err);
    });

    return () => {
      socket.emit('leave_conversation', conversation._id);
    };
  }, [socket, conversation, markAsRead]);

  // Listen for new messages
  useEffect(() => {
    if (!socket || !conversation) return;

    const handleNewMessage = (data) => {
      if (data.conversationId === conversation._id) {
        setMessages(prev => [...prev, data.message]);

        // Mark as read immediately if conversation is active
        markAsRead({
          variables: { conversationId: conversation._id }
        }).catch(err => {
          console.error('Failed to mark as read:', err);
        });

        // Notify parent to update inbox
        if (onMessageSent) {
          onMessageSent();
        }
      }
    };

    const handleUserTyping = (data) => {
      if (data.conversationId === conversation._id && data.userId !== currentUser._id) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    };

    const handleUserStoppedTyping = (data) => {
      if (data.conversationId === conversation._id) {
        setIsTyping(false);
      }
    };

    socket.on('new_direct_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);

    return () => {
      socket.off('new_direct_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
    };
  }, [socket, conversation, currentUser, markAsRead, onMessageSent]);

  // Typing indicator
  const handleInputChange = (e) => {
    setText(e.target.value);

    if (socket && conversation) {
      socket.emit('typing_start', { conversationId: conversation._id });

      // Debounce stop typing
      clearTimeout(window.typingTimeout);
      window.typingTimeout = setTimeout(() => {
        socket.emit('typing_stop', { conversationId: conversation._id });
      }, 1000);
    }
  };

  const handleSend = async () => {
    if (!text.trim() || !otherUser) return;

    const messageText = text.trim();
    setText('');

    try {
      const { data } = await sendMessage({
        variables: { recipientId: otherUser._id, text: messageText }
      });

      if (data?.sendDirectMessage) {
        // Optimistically add to local state
        setMessages(prev => [...prev, data.sendDirectMessage]);

        // Notify parent to update inbox
        if (onMessageSent) {
          onMessageSent();
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message', {
        description: error.message
      });
      // Restore the text if send failed
      setText(messageText);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversation || !currentUser) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 font-medium mb-2">No conversation selected</p>
          <p className="text-sm text-gray-400">Select a conversation from the sidebar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-white sticky top-0 z-10">
        <Avatar
          src={otherUser?.profilePhoto}
          fallback={otherUser?.firstName?.[0] + (otherUser?.lastName?.[0] || '')}
          className="w-10 h-10"
        />
        <div className="flex-1">
          <p className="font-semibold text-gray-900">
            {otherUser?.firstName} {otherUser?.lastName}
          </p>
          <p className="text-sm text-gray-500">
            {isConnected ? (isTyping ? 'typing...' : 'Online') : 'Offline'}
          </p>
        </div>
      </div>

      {/* Connection status alert */}
      {!isConnected && (
        <Alert variant="warning" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <div>
            <p className="font-medium">Connection lost</p>
            <p className="text-sm">Messages will be sent when connection is restored.</p>
          </div>
        </Alert>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-gray-500 font-medium mb-1">No messages yet</p>
              <p className="text-sm text-gray-400">Send a message to start the conversation</p>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => {
              const isOwnMessage = msg.sender._id === currentUser._id;
              const showAvatar = index === 0 || messages[index - 1].sender._id !== msg.sender._id;

              return (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'flex gap-2',
                    isOwnMessage ? 'justify-end' : 'justify-start'
                  )}
                >
                  {!isOwnMessage && showAvatar && (
                    <Avatar
                      src={msg.sender.profilePhoto}
                      fallback={msg.sender.firstName[0]}
                      className="w-8 h-8"
                    />
                  )}
                  {!isOwnMessage && !showAvatar && <div className="w-8" />}

                  <div
                    className={cn(
                      'max-w-[70%] px-4 py-2 rounded-2xl break-words',
                      isOwnMessage
                        ? 'bg-stevensMaroon text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4 bg-white">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={isConnected ? "Type a message..." : "Reconnecting..."}
            className="flex-1"
            disabled={!isConnected}
          />
          <Button
            onClick={handleSend}
            disabled={!isConnected || !text.trim()}
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
