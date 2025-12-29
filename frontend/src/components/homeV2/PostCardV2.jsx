import { useState, useRef, useEffect, useMemo, memo } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button, IconButton } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';
import { Dialog, DialogContent } from '../ui/Dialog';
import {
  ThumbsUp,
  MessageCircle,
  Repeat2,
  Send,
  MoreHorizontal,
  Globe,
  Bookmark,
  Link as LinkIcon,
  Flag,
  ChevronLeft,
  ChevronRight,
  X,
  Smile,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import queries from '../../queries';
import { toast } from '../../lib/toast';
import { formatTimeAgo } from '../../lib/time';
import { checkTextClamped } from '../../lib/text';
import { cn } from '../../lib/utils';
import { useCurrentUser } from '../../hooks/useCurrentUser';

const INITIAL_COMMENTS_SHOWN = 2;
const COMMENTS_LOAD_INCREMENT = 5;

// Helper to construct headline
const constructHeadline = (role, department) => {
  const roleMap = {
    PROFESSOR: 'Professor',
    STUDENT: 'Student',
    ADMIN: 'Administrator'
  };
  const deptMap = {
    COMPUTER_SCIENCE: 'Computer Science',
    ELECTRICAL_AND_COMPUTER_ENGINEERING: 'Electrical & Computer Engineering',
    BIOMEDICAL_ENGINEERING: 'Biomedical Engineering',
    MECHANICAL_ENGINEERING: 'Mechanical Engineering',
    CHEMICAL_ENGINEERING_AND_MATERIALS_SCIENCE: 'Chemical Engineering & Materials Science',
  };
  return `${roleMap[role] || role} • ${deptMap[department] || department}`;
};

const PostCardV2Component = ({ post, onLike, onComment, onDelete }) => {
  const { user } = useCurrentUser();

  // Safe defaults for state initialization (prevent crashes if stats missing)
  const [isLiked, setIsLiked] = useState(post.viewerState?.likedByMe ?? false);
  const [likeCount, setLikeCount] = useState(post.stats?.likeCount ?? 0);
  const [commentCount, setCommentCount] = useState(post.stats?.commentCount ?? 0);
  const [comments, setComments] = useState([]);
  const [visibleComments, setVisibleComments] = useState(INITIAL_COMMENTS_SHOWN);
  const [showAllComments, setShowAllComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [isTextClamped, setIsTextClamped] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [sortOrder, setSortOrder] = useState('relevant'); // 'relevant' | 'newest'
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const textRef = useRef(null);
  const commentInputRef = useRef(null);

  const userName = useMemo(() =>
    user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User',
    [user]
  );

  // Safe media extraction (prevent crashes if media structure incomplete)
  const images = post.media?.images ?? [];
  const video = post.media?.video ?? null;

  // GraphQL queries/mutations
  const [loadComments, { loading: commentsLoading }] = useLazyQuery(queries.POST_COMMENTS);
  const [addCommentMutation] = useMutation(queries.ADD_POST_COMMENT);
  const [deletePostMutation] = useMutation(queries.DELETE_POST);

  const timeAgo = useMemo(() => formatTimeAgo(post.createdAt), [post.createdAt]);

  // Check if text is clamped
  useEffect(() => {
    if (textRef.current && !isTextExpanded) {
      const clamped = checkTextClamped(textRef.current);
      setIsTextClamped(clamped);
    }
  }, [post.text, isTextExpanded]);

  const handleLike = () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount((prev) => (newLikedState ? prev + 1 : prev - 1));

    if (onLike) {
      onLike(post.id, newLikedState);
    }
  };

  const handleCommentClick = async () => {
    const newState = !showAllComments;
    setShowAllComments(newState);

    // Load comments when expanding (if not already loaded)
    if (newState && comments.length === 0) {
      try {
        const { data } = await loadComments({
          variables: {
            postId: post.id,
            cursor: { limit: 20 }
          }
        });

        if (data?.postComments?.items) {
          // Transform GraphQL comments to frontend format
          const transformedComments = data.postComments.items.map(c => ({
            id: c._id,
            author: {
              id: c.commenter._id,
              name: `${c.commenter.firstName} ${c.commenter.lastName}`,
              headline: constructHeadline(c.commenter.role, c.commenter.department),
              department: c.commenter.department
            },
            text: c.text,
            createdAt: c.createdAt
          }));
          setComments(transformedComments);
        }
      } catch (error) {
        console.error('Error loading comments:', error);
        toast.error('Failed to load comments');
      }
    }

    // Focus comment input after a brief delay for animation (only when expanding)
    if (newState) {
      setTimeout(() => {
        commentInputRef.current?.focus();
      }, 150);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const { data } = await addCommentMutation({
        variables: {
          postId: post.id,
          text: newComment.trim()
        }
      });

      if (data?.addPostComment) {
        // Transform and add new comment to local state
        const transformedComment = {
          id: data.addPostComment._id,
          author: {
            id: data.addPostComment.commenter._id,
            name: `${data.addPostComment.commenter.firstName} ${data.addPostComment.commenter.lastName}`,
            headline: constructHeadline(data.addPostComment.commenter.role, data.addPostComment.commenter.department),
            department: data.addPostComment.commenter.department
          },
          text: data.addPostComment.text,
          createdAt: data.addPostComment.createdAt
        };

        setComments((prev) => [...prev, transformedComment]);
        setCommentCount((prev) => prev + 1);
        setNewComment('');
        toast.success('Comment added');

        if (onComment) {
          onComment(post.id, transformedComment);
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleLoadMoreComments = () => {
    setVisibleComments((prev) => Math.min(prev + COMMENTS_LOAD_INCREMENT, comments.length));
  };

  const handleSeeLessComments = () => {
    setVisibleComments(INITIAL_COMMENTS_SHOWN);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied');
  };

  const handleDeletePost = async () => {
    try {
      await deletePostMutation({
        variables: { postId: post.id }
      });

      toast.success('Post deleted');
      setShowDeleteDialog(false);

      // Notify parent to remove from feed
      if (onDelete) {
        onDelete(post.id);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error(error.message || 'Failed to delete post');
      setShowDeleteDialog(false);
    }
  };

  // Check if current user is the post author
  const isOwnPost = useMemo(() => {
    if (!user || !post.author?.id) return false;
    return user._id === post.author.id;
  }, [user, post.author?.id]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  // Sort comments based on order
  const sortedComments = useMemo(() => {
    if (sortOrder === 'newest') {
      return [...comments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    // Default: most relevant (for now, same as newest)
    return comments;
  }, [comments, sortOrder]);

  const displayedComments = sortedComments.slice(0, visibleComments);
  const hasMoreComments = sortedComments.length > visibleComments;
  const hasPreviousComments = visibleComments < sortedComments.length && visibleComments > INITIAL_COMMENTS_SHOWN;

  // Lightbox keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft' && lightboxIndex > 0) {
        setLightboxIndex((prev) => prev - 1);
      } else if (e.key === 'ArrowRight' && lightboxIndex < images.length - 1) {
        setLightboxIndex((prev) => prev + 1);
      } else if (e.key === 'Escape') {
        setLightboxOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [lightboxOpen, lightboxIndex, images.length]);

  return (
    <Card className="mb-3 overflow-hidden hover:shadow-card-hover transition-shadow">
      {/* Header */}
      <div className="p-3 pb-2">
        <div className="flex items-start gap-2">
          <Avatar name={post.author.name} size="md" className="-mt-1" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <button type="button" className="font-semibold text-sm text-gray-900 hover:text-stevensMaroon hover:underline">
                {post.author.name}
              </button>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
              <Globe className="w-3 h-3 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground leading-tight mt-0.5">
              {post.author.headline}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconButton variant="ghost" size="sm" aria-label="More options">
                <MoreHorizontal className="w-5 h-5" />
              </IconButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast.success('Saved')}>
                <Bookmark className="w-4 h-4 mr-2" />
                Save
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink}>
                <LinkIcon className="w-4 h-4 mr-2" />
                Copy link
              </DropdownMenuItem>
              {isOwnPost && (
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete post
                </DropdownMenuItem>
              )}
              {!isOwnPost && (
                <DropdownMenuItem onClick={() => toast.info('Reported')}>
                  <Flag className="w-4 h-4 mr-2" />
                  Report
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Text Content with Line Clamp */}
      {post.text && (
        <div className="px-3 pb-2">
          <div
            ref={textRef}
            className={cn(
              'text-sm text-gray-900 whitespace-pre-wrap break-words',
              !isTextExpanded && 'line-clamp-3'
            )}
          >
            {post.text}
          </div>
          {(isTextClamped || isTextExpanded) && (
            <button
              type="button"
              onClick={() => setIsTextExpanded(!isTextExpanded)}
              className="text-sm font-semibold text-muted-foreground hover:text-stevensMaroon mt-1"
              aria-label={isTextExpanded ? 'See less' : 'See more'}
            >
              {isTextExpanded ? '...see less' : '...see more'}
            </button>
          )}
        </div>
      )}

      {/* Media Content */}
      {post.media && (
        <div className="mb-0">
          {post.media.type === 'image' && images.length > 0 && (
            <div
              className={cn(
                'grid gap-0.5 bg-gray-100',
                images.length === 1 && 'grid-cols-1',
                images.length === 2 && 'grid-cols-2',
                images.length === 3 && 'grid-cols-2',
                images.length === 4 && 'grid-cols-2'
              )}
            >
              {images.map((image, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'relative overflow-hidden cursor-pointer group bg-gray-100',
                    images.length === 1 && 'aspect-video',
                    images.length === 2 && 'aspect-[4/3]',
                    images.length === 3 && idx === 0 && 'row-span-2 aspect-square',
                    images.length === 3 && idx > 0 && 'aspect-video',
                    images.length === 4 && 'aspect-square'
                  )}
                  onClick={() => {
                    setLightboxIndex(idx);
                    setLightboxOpen(true);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setLightboxIndex(idx);
                      setLightboxOpen(true);
                    }
                  }}
                  aria-label={`View image ${idx + 1} of ${images.length}`}
                >
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          )}

          {post.media.type === 'video' && video?.url && (
            <div className="bg-gray-100">
              <video
                src={video.url}
                poster={video.posterUrl || undefined}
                controls
                className="w-full max-h-[500px] object-contain"
                aria-label="Video content"
              />
            </div>
          )}
        </div>
      )}

      {/* Engagement Counts */}
      {(likeCount > 0 || commentCount > 0) && (
        <div className="px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            {likeCount > 0 && (
              <button
                type="button"
                onClick={handleLike}
                className="flex items-center gap-1 hover:text-stevensMaroon transition-colors"
                aria-label={`${likeCount} ${likeCount === 1 ? 'like' : 'likes'}`}
              >
                <div className="flex items-center -space-x-0.5">
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center border border-white z-10">
                    <ThumbsUp className="w-2.5 h-2.5 text-white fill-white" />
                  </div>
                </div>
                <span>
                  {isLiked && likeCount === 1 ? 'You' :
                   isLiked && likeCount > 1 ? `You and ${likeCount - 1} ${likeCount - 1 === 1 ? 'other' : 'others'}` :
                   likeCount}
                </span>
              </button>
            )}
          </div>
          {commentCount > 0 && (
            <button
              type="button"
              onClick={handleCommentClick}
              className="hover:text-stevensMaroon hover:underline transition-colors"
              aria-label={`${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}`}
            >
              {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>
      )}

      {/* Action Row */}
      <div className="px-2 py-1 border-t border-borderLight flex items-center">
        <motion.button
          type="button"
          onClick={handleLike}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors',
            isLiked && 'text-blue-600 font-semibold'
          )}
          aria-label={isLiked ? 'Unlike' : 'Like'}
          aria-pressed={isLiked}
        >
          <motion.div
            animate={isLiked ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <ThumbsUp
              className={cn('w-5 h-5', isLiked && 'fill-blue-600')}
            />
          </motion.div>
          <span className="text-sm font-medium">Like</span>
        </motion.button>

        <button
          type="button"
          onClick={handleCommentClick}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
          aria-label="Comment"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Comment</span>
        </button>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => {}}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
              aria-label="Repost (coming soon)"
            >
              <Repeat2 className="w-5 h-5" />
              <span className="text-sm font-medium">Repost</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>Coming soon</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => {}}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
              aria-label="Send (coming soon)"
            >
              <Send className="w-5 h-5" />
              <span className="text-sm font-medium">Send</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>Coming soon</TooltipContent>
        </Tooltip>
      </div>

      {/* Comments Section */}
      {showAllComments && (
        <div className="border-t border-borderLight bg-white">
          {/* Sort Dropdown */}
          {comments.length > 0 && (
            <div className="px-3 py-2 border-b border-borderLight">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="text-xs font-semibold text-gray-900 border-none bg-transparent focus:outline-none cursor-pointer"
                aria-label="Sort comments"
              >
                <option value="relevant">Most relevant</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          )}

          {/* Comments List */}
          <AnimatePresence mode="popLayout">
            {displayedComments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="px-3 py-2"
              >
                <div className="flex gap-2">
                  <Avatar name={comment.author.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <p className="font-semibold text-xs text-gray-900">
                          {comment.author.name}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Load More Comments */}
          {hasMoreComments && (
            <div className="px-3 py-2">
              <button
                type="button"
                onClick={handleLoadMoreComments}
                className="text-xs font-semibold text-muted-foreground hover:text-stevensMaroon transition-colors"
                aria-label={`Load ${Math.min(COMMENTS_LOAD_INCREMENT, sortedComments.length - visibleComments)} more comments`}
              >
                Load more comments ({sortedComments.length - visibleComments})
              </button>
            </div>
          )}

          {/* See Less Comments */}
          {!hasMoreComments && visibleComments > INITIAL_COMMENTS_SHOWN && (
            <div className="px-3 py-2">
              <button
                type="button"
                onClick={handleSeeLessComments}
                className="text-xs font-semibold text-muted-foreground hover:text-stevensMaroon transition-colors"
                aria-label="See less comments"
              >
                See less
              </button>
            </div>
          )}

          {/* Add Comment */}
          <div className="px-3 py-3 bg-white">
            <div className="flex gap-2 items-start">
              <Avatar name={userName} size="sm" />
              <div className="flex-1 relative">
                <textarea
                  ref={commentInputRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add a comment..."
                  className="w-full px-4 py-2 pr-20 border border-borderLight rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-stevensMaroon focus:border-transparent text-sm min-h-[40px] max-h-32"
                  rows={1}
                  aria-label="Add a comment"
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                  }}
                />
                {newComment.trim() && (
                  <Button
                    variant="primary"
                    onClick={handleAddComment}
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 px-3 text-xs"
                    style={{ backgroundColor: '#9D1535', color: 'white' }}
                    aria-label="Post comment"
                  >
                    Post
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2 ml-10">
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconButton variant="ghost" size="sm" disabled aria-label="Add emoji (coming soon)">
                    <Smile className="w-4 h-4 text-muted-foreground" />
                  </IconButton>
                </TooltipTrigger>
                <TooltipContent>Coming soon</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconButton variant="ghost" size="sm" disabled aria-label="Add image (coming soon)">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  </IconButton>
                </TooltipTrigger>
                <TooltipContent>Coming soon</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {post.media?.type === 'image' && images.length > 0 && (
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-5xl p-0 bg-black/95">
            <div className="relative w-full h-[85vh] flex items-center justify-center">
              <motion.img
                key={lightboxIndex}
                src={images[lightboxIndex]?.url}
                alt={images[lightboxIndex]?.alt}
                className="max-w-full max-h-full object-contain"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              />

              {images.length > 1 && (
                <>
                  {lightboxIndex > 0 && (
                    <IconButton
                      onClick={() => setLightboxIndex((prev) => prev - 1)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg w-12 h-12"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </IconButton>
                  )}
                  {lightboxIndex < images.length - 1 && (
                    <IconButton
                      onClick={() => setLightboxIndex((prev) => prev + 1)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg w-12 h-12"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </IconButton>
                  )}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                    {lightboxIndex + 1} / {images.length}
                  </div>
                </>
              )}

              <IconButton
                onClick={() => setLightboxOpen(false)}
                className="absolute top-4 right-4 bg-white/90 hover:bg-white shadow-lg w-10 h-10"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </IconButton>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col gap-4 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Delete post?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This action cannot be undone. Your post and all its comments will be permanently deleted.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleDeletePost}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

// Memoize component to prevent unnecessary re-renders
export const PostCardV2 = memo(PostCardV2Component);
