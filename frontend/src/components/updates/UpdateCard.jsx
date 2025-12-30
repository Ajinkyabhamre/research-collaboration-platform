import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Clock, MessageCircle } from 'lucide-react';
import { formatUpdateSubject, getSubjectBadgeVariant } from '../../constants/updateSubjects';

const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const UpdateCard = ({ update }) => {
  const { posterUser, subject, content, postedDate, numOfComments } = update;

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      {/* Header: Avatar + Name + Time */}
      <div className="flex items-start gap-3 mb-4">
        <Avatar
          src={posterUser.profilePhoto}
          name={`${posterUser.firstName} ${posterUser.lastName}`}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-gray-900">
              {posterUser.firstName} {posterUser.lastName}
            </p>
            <Badge variant={getSubjectBadgeVariant(subject)}>
              {formatUpdateSubject(subject)}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatRelativeTime(postedDate)}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{content}</p>
      </div>

      {/* Footer: Comments count */}
      {numOfComments > 0 && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MessageCircle className="w-4 h-4" />
          <span>{numOfComments} comment{numOfComments === 1 ? '' : 's'}</span>
        </div>
      )}
    </Card>
  );
};
