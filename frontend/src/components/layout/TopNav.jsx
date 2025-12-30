import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserButton, useAuth } from '@clerk/clerk-react';
import { useQuery } from '@apollo/client';
import { Home, Briefcase, MessageSquare, Bell, User, Search, Key, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import queries from '../../queries';

const NavItem = ({ to, icon: Icon, label, active, badge }) => {
  const [isAnimating, setIsAnimating] = React.useState(false);
  const prevBadgeRef = React.useRef(badge);

  React.useEffect(() => {
    // Trigger animation when badge count increases
    if (badge > 0 && badge > prevBadgeRef.current) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
    prevBadgeRef.current = badge;
  }, [badge]);

  return (
    <Link
      to={to}
      className={cn(
        'flex flex-col items-center justify-center px-4 py-2 min-w-[80px] relative',
        'transition-colors duration-200',
        active
          ? 'text-stevensMaroon'
          : 'text-gray-600 hover:text-gray-900'
      )}
    >
      {badge > 0 && (
        <span
          className={cn(
            "absolute top-1 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold",
            "transition-all duration-200",
            isAnimating && "animate-badge-pulse"
          )}
        >
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      <Icon className={cn('w-6 h-6 mb-1', active && 'stroke-[2.5]')} />
      <span className="text-xs font-medium">{label}</span>
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-stevensMaroon rounded-t-full" />
      )}
    </Link>
  );
};

// Dev-only token copy button (gated behind env flags)
const DevTokenCopyButton = () => {
  const { getToken } = useAuth();
  const [copied, setCopied] = useState(false);

  const copyToken = async () => {
    try {
      const token = await getToken();
      if (token) {
        await navigator.clipboard.writeText(token);
        setCopied(true);
        toast.success('Clerk token copied to clipboard!', {
          description: 'Use this token for curl testing. See backend/docs/AUTH_CURL_TEST.md',
        });
        setTimeout(() => setCopied(false), 2000);
      } else {
        toast.error('No token available', {
          description: 'Make sure you are logged in',
        });
      }
    } catch (error) {
      console.error('Failed to copy token:', error);
      toast.error('Failed to copy token', {
        description: error.message,
      });
    }
  };

  return (
    <button
      onClick={copyToken}
      title="Copy Clerk JWT token for curl testing"
      className={cn(
        'p-2 rounded-lg transition-all duration-200',
        'hover:bg-muted active:scale-95',
        copied ? 'bg-green-100 text-green-700' : 'bg-muted/50 text-gray-600'
      )}
    >
      {copied ? (
        <Check className="w-4 h-4" />
      ) : (
        <Key className="w-4 h-4" />
      )}
    </button>
  );
};

export const TopNav = () => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/home') {
      return location.pathname === '/home';
    }
    return location.pathname.startsWith(path);
  };

  // Fetch conversations for unread count
  const { data: conversationsData } = useQuery(queries.CONVERSATIONS, {
    fetchPolicy: 'cache-and-network',
    pollInterval: 30000, // Poll every 30 seconds
  });

  // Calculate total unread messages
  const totalUnread = conversationsData?.conversations?.items?.reduce(
    (sum, conv) => sum + (conv.unreadCount || 0),
    0
  ) || 0;

  // Show dev tools only when both conditions met: non-prod env + explicit flag
  const devAuthToolsEnabled = import.meta.env.MODE !== 'production' && import.meta.env.VITE_ENABLE_DEV_AUTH_TOOLS === 'true';

  return (
    <nav className="fixed top-0 left-0 right-0 backdrop-blur-nav border-b border-border z-50 shadow-sm">
      <div className="max-w-container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left section: Brand + Search */}
          <div className="flex items-center space-x-4 flex-1 max-w-md">
            <Link to="/home" className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-8 h-8 gradient-maroon rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">SR</span>
              </div>
              <span className="font-bold text-xl text-gray-900 hidden lg:inline whitespace-nowrap">
                Stevens Research
              </span>
            </Link>
            <div className="relative hidden md:block flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className={cn(
                  'w-full pl-10 pr-4 py-1.5 rounded-full',
                  'bg-muted border border-transparent',
                  'focus:bg-white focus:border-border focus:ring-2 focus:ring-stevensMaroon/20',
                  'transition-all duration-200 text-sm',
                  'placeholder:text-gray-400'
                )}
              />
            </div>
          </div>

          {/* Center section: Main Navigation */}
          <div className="flex items-center">
            <NavItem
              to="/home"
              icon={Home}
              label="Home"
              active={isActive('/home')}
            />
            <NavItem
              to="/projects"
              icon={Briefcase}
              label="Projects"
              active={isActive('/projects')}
            />
            <NavItem
              to="/messaging"
              icon={MessageSquare}
              label="Messages"
              active={isActive('/messaging')}
              badge={totalUnread}
            />
            <NavItem
              to="/notifications"
              icon={Bell}
              label="Notifications"
              active={isActive('/notifications')}
            />
            <NavItem
              to="/me"
              icon={User}
              label="Me"
              active={isActive('/me')}
            />
          </div>

          {/* Right section: Dev Tools + User Button */}
          <div className="flex items-center justify-end gap-2 ml-4 flex-1 max-w-[160px]">
            {devAuthToolsEnabled && <DevTokenCopyButton />}
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8 ring-2 ring-offset-2 ring-stevensMaroon/20',
                },
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
};
