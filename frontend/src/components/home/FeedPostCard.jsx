import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { formatUpdateSubject, getSubjectBadgeVariant } from '../../constants/updateSubjects';
import queries from '../../queries';

export const FeedPostCard = ({ update, onCommentAdded }) => {
  const { user } = useCurrentUser();
  const [showComments, setShowComments] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [addComment, { loading: commentLoading }] = useMutation(queries.ADD_COMMENT);

  const {
    _id,
    posterUser,
    subject,
    content,
    project,
    postedDate,
    comments = [],
    numOfComments,
  } = update;

  const posterName = `${posterUser.firstName} ${posterUser.lastName}`;
  const formattedDate = new Date(postedDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleAddComment = async () => {
    if (!commentContent.trim() || !user) return;

    try {
      await addComment({
        variables: {
          commenterId: user._id,
          destinationId: _id,
          content: commentContent.trim(),
        },
      });

      setCommentContent('');

      // Refetch updates to show new comment
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  return (
    <Card className="mb-4" hover>
      <div className="flex space-x-3">
        <Avatar name={posterName} size="md" />
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold text-sm hover:text-stevensMaroon cursor-pointer">
                {posterName}
              </h4>
              <p className="text-xs text-gray-600">
                {posterUser.role} · {posterUser.department?.replace(/_/g, ' ')}
              </p>
              <p className="text-xs text-gray-500 mt-1">{formattedDate}</p>
            </div>
            <Badge variant={getSubjectBadgeVariant(subject)} className="text-xs">
              {formatUpdateSubject(subject)}
            </Badge>
          </div>

          {/* Project Link */}
          {project && (
            <Link
              to={`/projects/${project._id}`}
              className="inline-block text-xs text-stevensMaroon hover:underline font-medium mb-2"
            >
              {project.title}
            </Link>
          )}

          {/* Content */}
          <div className="mt-3">
            <div
              className="text-sm text-gray-800 whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>

          {/* Action Bar */}
          <div className="flex items-center space-x-6 mt-4 pt-3 border-t border-gray-200">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-600 hover:text-stevensMaroon transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span className="text-sm">
                {numOfComments || comments.length} {numOfComments === 1 ? 'Comment' : 'Comments'}
              </span>
            </button>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              {/* Existing Comments */}
              {comments.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {comments.map((comment) => (
                    <div key={comment._id} className="flex space-x-2">
                      <Avatar
                        name={`${comment.commenter.firstName} ${comment.commenter.lastName}`}
                        size="sm"
                      />
                      <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                        <p className="text-xs font-semibold text-gray-900">
                          {comment.commenter.firstName} {comment.commenter.lastName}
                        </p>
                        <p className="text-sm text-gray-800 mt-1">{comment.content}</p>
                        {comment.postedDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(comment.postedDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-4">No comments yet. Be the first to comment!</p>
              )}

              {/* Add Comment */}
              {user && (
                <div className="flex space-x-2">
                  <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />
                  <div className="flex-1">
                    <textarea
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      placeholder="Write a comment..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-stevensMaroon focus:border-transparent resize-none text-sm"
                      rows={2}
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleAddComment}
                        disabled={!commentContent.trim() || commentLoading}
                        style={{ backgroundColor: '#9D1535', color: 'white' }}
                      >
                        {commentLoading ? 'Posting...' : 'Comment'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
