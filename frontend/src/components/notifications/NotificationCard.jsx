import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { CheckCircle, MessageCircle, Briefcase, MessageSquare, Users } from 'lucide-react';
import { cn } from '../../lib/utils';

const getNotificationIcon = (type) => {
  const iconProps = { className: 'w-5 h-5', strokeWidth: 2 };

  switch (type) {
    case 'application_update':
      return <CheckCircle {...iconProps} className="w-5 h-5 text-green-600" />;
    case 'mention':
      return <MessageCircle {...iconProps} className="w-5 h-5 text-blue-600" />;
    case 'project_update':
      return <Briefcase {...iconProps} className="w-5 h-5 text-stevensMaroon" />;
    case 'message':
      return <MessageSquare {...iconProps} className="w-5 h-5 text-purple-600" />;
    case 'team_update':
      return <Users {...iconProps} className="w-5 h-5 text-indigo-600" />;
    default:
      return <Briefcase {...iconProps} className="w-5 h-5 text-stevensMaroon" />;
  }
};

const getIconBackground = (type) => {
  switch (type) {
    case 'application_update':
      return 'bg-green-50';
    case 'mention':
      return 'bg-blue-50';
    case 'project_update':
      return 'bg-red-50';
    case 'message':
      return 'bg-purple-50';
    case 'team_update':
      return 'bg-indigo-50';
    default:
      return 'bg-gray-50';
  }
};

export const NotificationCard = ({ notification }) => {
  const { type, title, message, timestamp, read, link } = notification;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ x: 4 }}
    >
      <Link to={link}>
        <Card
          className={cn(
            'p-4 transition-all duration-200 hover:shadow-card-hover',
            !read && 'border-l-4 border-l-stevensMaroon bg-blue-50/30'
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'flex-shrink-0 p-2 rounded-lg',
                getIconBackground(type)
              )}
            >
              {getNotificationIcon(type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-semibold text-sm text-gray-900">{title}</h4>
                {!read && (
                  <Badge variant="primary" className="flex-shrink-0">
                    New
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">{message}</p>
              <p className="text-xs text-muted-foreground">{timestamp}</p>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
};
