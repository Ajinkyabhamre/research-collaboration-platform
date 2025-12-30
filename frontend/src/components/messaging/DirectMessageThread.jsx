import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useSocket } from '../../hooks/useSocket';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import queries from '../../queries';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { Send, ChevronLeft } from 'lucide-react';

export const DirectMessageThread = ({ conversation, onMessageSent, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const { socket, isConnected } = useSocket();
  const { user: currentUser } = useCurrentUser();

  const { data, loading } = useQuery(queries.CONVERSATION_MESSAGES, {
    variables: { conversationId: conversation._id },
    skip: !conversation,
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.conversationMessages?.items) {
        setMessages([...data.conversationMessages.items].reverse());
      }
    }
  });

  const [sendMessage] = useMutation(queries.SEND_DIRECT_MESSAGE);
  const [markAsRead] = useMutation(queries.MARK_CONVERSATION_AS_READ);

  const otherUser = conversation?.participants?.find(p => p._id !== currentUser?._id);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark as read
  useEffect(() => {
    if (!conversation) return;
    markAsRead({ variables: { conversationId: conversation._id } })
      .catch(err => console.error('[DM] Mark as read failed:', err));
  }, [conversation, markAsRead]);

  // Socket listeners
  useEffect(() => {
    if (!socket || !conversation) return;

    const handleNewMessage = (data) => {
      if (data.conversationId === conversation._id) {
        if (data.message.sender._id !== currentUser._id) {
          setMessages(prev => {
            if (prev.some(m => m._id === data.message._id)) return prev;
            return [...prev, data.message];
          });
          markAsRead({ variables: { conversationId: conversation._id } });
        }
        onMessageSent?.();
      }
    };

    const handleTyping = (data) => {
      if (data.conversationId === conversation._id && data.userId !== currentUser._id) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    };

    socket.on('new_direct_message', handleNewMessage);
    socket.on('user_typing', handleTyping);
    socket.on('user_stopped_typing', () => setIsTyping(false));

    return () => {
      socket.off('new_direct_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
      socket.off('user_stopped_typing');
    };
  }, [socket, conversation, currentUser, markAsRead, onMessageSent]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !otherUser) return;

    const messageText = text.trim();
    setText('');

    try {
      const { data } = await sendMessage({
        variables: { recipientId: otherUser._id, text: messageText }
      });

      if (data?.sendDirectMessage) {
        setMessages(prev => [...prev, data.sendDirectMessage]);
        onMessageSent?.();
      }
    } catch (error) {
      console.error('[DM] Send failed:', error);
      toast.error('Failed to send message');
      setText(messageText);
    }
  };

  const handleTyping = () => {
    if (socket && conversation) {
      socket.emit('typing_start', { conversationId: conversation._id });
      clearTimeout(window.typingTimeout);
      window.typingTimeout = setTimeout(() => {
        socket.emit('typing_stop', { conversationId: conversation._id });
      }, 1000);
    }
  };

  if (!conversation || !currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No conversation selected</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">

      {/* Modern header with gradient */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50">
        <button
          onClick={onBack}
          className="md:hidden w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          aria-label="Back to conversations"
        >
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <Avatar
          src={otherUser?.profilePhoto}
          fallback={otherUser?.firstName?.[0]}
          className="w-11 h-11 ring-2 ring-gray-100 ring-offset-2"
        />
        <div className="flex-1">
          <p className="font-bold text-gray-900 text-base">{otherUser?.firstName} {otherUser?.lastName}</p>
          <p className="text-sm text-gray-500 flex items-center gap-1.5">
            {isTyping ? (
              <>
                <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                typing...
              </>
            ) : isConnected ? (
              <>
                <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full" />
                Online
              </>
            ) : (
              <>
                <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full" />
                Offline
              </>
            )}
          </p>
        </div>
      </div>

      {/* Messages with better spacing and modern bubbles */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-br from-gray-50 to-white">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3 animate-pulse">
                <div className="w-6 h-6 rounded-full bg-gray-300" />
              </div>
              <p className="text-gray-500 text-sm">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-700 font-semibold mb-1">No messages yet</p>
              <p className="text-sm text-gray-500">Send a message to start the conversation</p>
            </div>
          </div>
        ) : (
          messages.map(msg => {
            const isOwn = msg.sender._id === currentUser._id;

            return (
              <div
                key={msg._id}
                className={cn(
                  "flex gap-3 items-end",
                  isOwn ? "justify-end" : "justify-start"
                )}
              >
                {/* Modern message bubble with shadow */}
                <div className={cn(
                  "rounded-2xl px-4 py-3 max-w-sm shadow-sm",
                  isOwn
                    ? "bg-stevensMaroon text-white rounded-br-md"
                    : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
                )}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
              </div>
            );
          })
        )}

        {/* Enhanced typing indicator */}
        {isTyping && (
          <div className="flex gap-3 items-end justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-5 py-3.5 shadow-sm">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Modern input area */}
      <div className="border-t border-gray-100 p-5 bg-white">
        <form onSubmit={handleSend} className="flex gap-3">
          <Input
            type="text"
            value={text}
            onChange={(e) => { setText(e.target.value); handleTyping(); }}
            placeholder={isConnected ? "Type a message..." : "Reconnecting..."}
            disabled={!isConnected}
            className="flex-1 h-12 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-colors px-5"
          />
          <Button
            type="submit"
            disabled={!isConnected || !text.trim()}
            className="shrink-0 w-12 h-12 p-0 rounded-xl shadow-sm hover:shadow transition-all"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
};
