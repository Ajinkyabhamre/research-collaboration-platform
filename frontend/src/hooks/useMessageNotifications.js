import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MessageSquare } from 'lucide-react';

export const useMessageNotifications = () => {
  const { socket } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    // Join the personal DM room to receive conversation updates
    socket.emit('join_dm_room');

    const handleConversationUpdate = (data) => {
      // Only show toast if not currently on the messaging page
      const isOnMessagingPage = location.pathname.startsWith('/messaging');

      if (!isOnMessagingPage && data.lastMessage) {
        // Show toast notification for new message
        toast(
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-stevensMaroon shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">New message</p>
              <p className="text-sm text-gray-600 truncate">
                {data.lastMessage.text}
              </p>
            </div>
          </div>,
          {
            duration: 4000,
            action: {
              label: 'View',
              onClick: () => navigate('/messaging?tab=direct')
            },
          }
        );
      }
    };

    socket.on('conversation_updated', handleConversationUpdate);

    return () => {
      socket.off('conversation_updated', handleConversationUpdate);
    };
  }, [socket, location, navigate]);
};
