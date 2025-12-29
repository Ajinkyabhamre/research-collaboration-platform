import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { motion } from 'framer-motion';
import { PostComposerV3 } from './PostComposerV3';
import { PostCardV2 } from './PostCardV2';
import { LeftSidebar } from '../home/LeftSidebar';
import { RightSidebar } from '../home/RightSidebar';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import queries from '../../queries';
import { useUser } from '@clerk/clerk-react';
import { FileText } from 'lucide-react';
import { fadeUp } from '../../lib/motion';
import { validatePostV2 } from '../../contracts/homeFeedV2.contract';

// Helper to construct headline from role and department
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
    CHEMISTRY_AND_CHEMICAL_BIOLOGY: 'Chemistry & Chemical Biology',
    CIVIL_ENVIRONMENTAL_AND_OCEAN_ENGINEERING: 'Civil, Environmental & Ocean Engineering',
    MATHEMATICAL_SCIENCES: 'Mathematical Sciences',
    PHYSICS: 'Physics',
    SYSTEMS_AND_ENTERPRISES: 'Systems & Enterprises'
  };
  const roleText = roleMap[role] || role;
  const deptText = deptMap[department] || department;
  return `${roleText} • ${deptText}`;
};

/**
 * Transform GraphQL post to frontend format with defensive defaults
 * @param {any} graphqlPost - Raw post from GraphQL
 * @returns {import('../../contracts/homeFeedV2.contract').PostV2|null} Transformed post or null if invalid
 */
const transformPost = (graphqlPost) => {
  // Guard: Return null if post is missing
  if (!graphqlPost) {
    if (import.meta.env.DEV) {
      console.warn('[HomeFeedV2] Received null/undefined post in transformPost');
    }
    return null;
  }

  const { _id, author, media, likeCount, commentCount, viewerHasLiked, ...rest } = graphqlPost;

  // Guard: Ensure author exists with safe defaults
  const safeAuthor = author || {};
  const authorId = safeAuthor._id || 'unknown';
  const firstName = safeAuthor.firstName || 'Unknown';
  const lastName = safeAuthor.lastName || 'User';
  const role = safeAuthor.role || '';
  const department = safeAuthor.department || '';

  // Transform media array to frontend format with safe checks
  let transformedMedia = null;
  if (media && Array.isArray(media) && media.length > 0) {
    const firstMedia = media[0];
    if (firstMedia && firstMedia.type === 'IMAGE') {
      transformedMedia = {
        type: 'image',
        images: media.map(m => ({
          url: m?.url || '',
          alt: m?.alt || ''
        }))
      };
    } else if (firstMedia && firstMedia.type === 'VIDEO') {
      transformedMedia = {
        type: 'video',
        video: {
          url: firstMedia.url || '',
          posterUrl: firstMedia.thumbnailUrl || null
        }
      };
    }
  }

  return {
    id: _id || 'unknown',
    authorId,
    author: {
      id: authorId,
      name: `${firstName} ${lastName}`,
      headline: constructHeadline(role, department),
      department,
      avatarUrl: null
    },
    ...rest,
    media: transformedMedia,
    stats: {
      likeCount: typeof likeCount === 'number' ? likeCount : 0,
      commentCount: typeof commentCount === 'number' ? commentCount : 0
    },
    viewerState: {
      likedByMe: Boolean(viewerHasLiked)
    },
    comments: [] // Comments loaded separately when expanded
  };
};

export const HomeFeedV2 = () => {
  const { user, isLoaded } = useUser();
  const [posts, setPosts] = useState([]);

  // Memoize user name
  const userName = useMemo(() =>
    user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User',
    [user]
  );

  // GraphQL query for feed
  const { data, loading, error, refetch, fetchMore } = useQuery(queries.FEED, {
    variables: { cursor: { limit: 10 } },
    fetchPolicy: 'cache-and-network', // Changed from 'network-only' to prevent excessive refetches
    nextFetchPolicy: 'cache-first'
  });

  const [loadingMore, setLoadingMore] = useState(false);

  // GraphQL mutations
  const [createPostMutation] = useMutation(queries.CREATE_POST);
  const [toggleLikeMutation] = useMutation(queries.TOGGLE_LIKE);

  // Update posts when data changes
  useEffect(() => {
    if (data?.feed?.items) {
      const transformedPosts = data.feed.items
        .map(transformPost)
        .filter(Boolean); // Filter out nulls from failed transformations

      // Dev-only: Sanity check first post
      if (import.meta.env.DEV && transformedPosts.length > 0) {
        const firstPost = transformedPosts[0];
        if (!validatePostV2(firstPost)) {
          console.warn('[HomeFeedV2] First post failed validation:', firstPost?.id);
        }
      }

      setPosts(transformedPosts);
    }
  }, [data]);

  // Memoize callbacks to prevent re-renders
  const handleCreatePost = useCallback(async (postData) => {
    try {
      // Transform media from frontend format to GraphQL format
      let mediaArray = [];
      if (postData.media) {
        if (postData.media.type === 'image') {
          mediaArray = postData.media.images.map(img => ({
            type: 'IMAGE',
            url: img.url,
            alt: img.alt || ''
          }));
        } else if (postData.media.type === 'video') {
          mediaArray = [{
            type: 'VIDEO',
            url: postData.media.video.url,
            thumbnailUrl: postData.media.video.posterUrl,
            alt: ''
          }];
        }
      }

      const { data: result } = await createPostMutation({
        variables: {
          text: postData.text,
          media: mediaArray
        }
      });

      if (result?.createPost) {
        // Add new post to top of feed (optimistic update)
        const newPost = transformPost(result.createPost);
        if (newPost) {
          setPosts((prev) => [newPost, ...prev]);
        }
      }

      // No need to refetch - we already updated local state optimistically
    } catch (error) {
      console.error('Error creating post:', error);
      throw error; // Re-throw so PostComposerV2 can show error toast
    }
  }, [createPostMutation]);

  const handleLikePost = useCallback(async (postId, liked) => {
    try {
      const { data: result } = await toggleLikeMutation({
        variables: { postId }
      });

      if (result?.toggleLike) {
        // Update post in local state
        setPosts(prev => prev.map(post =>
          post.id === postId
            ? {
                ...post,
                stats: {
                  ...post.stats,
                  likeCount: result.toggleLike.likeCount
                },
                viewerState: {
                  likedByMe: result.toggleLike.viewerHasLiked
                }
              }
            : post
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }, [toggleLikeMutation]);

  const handleCommentPost = useCallback((postId, comment) => {
    // Comments are handled within PostCardV2
    // This callback is for future use
    console.log('Comment on post:', postId, comment);
  }, []);

  const handleDeletePost = useCallback((postId) => {
    // Remove post from local state
    setPosts(prev => prev.filter(post => post.id !== postId));
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (!data?.feed?.nextCursor || loadingMore) return;

    setLoadingMore(true);
    try {
      await fetchMore({
        variables: {
          cursor: {
            limit: 10,
            cursor: data.feed.nextCursor
          }
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          return {
            feed: {
              ...fetchMoreResult.feed,
              items: [...prev.feed.items, ...fetchMoreResult.feed.items]
            }
          };
        }
      });
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [data, fetchMore, loadingMore]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-appBg">
        <div className="max-w-container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar Skeleton */}
            <div className="hidden lg:block lg:col-span-3">
              <Skeleton className="h-64 w-full mb-4 rounded-lg" />
            </div>

            {/* Center Feed Skeleton */}
            <div className="lg:col-span-6">
              <Skeleton className="h-32 w-full mb-4 rounded-lg" />
              <Skeleton className="h-96 w-full mb-4 rounded-lg" />
              <Skeleton className="h-96 w-full mb-4 rounded-lg" />
            </div>

            {/* Right Sidebar Skeleton */}
            <div className="hidden lg:block lg:col-span-3">
              <Skeleton className="h-64 w-full mb-4 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-appBg">
      <div className="max-w-container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-20">
              <LeftSidebar />
            </div>
          </div>

          {/* Center Feed */}
          <div className="lg:col-span-6">
            {/* Post Composer */}
            <PostComposerV3 onPost={handleCreatePost} />

            {/* Feed */}
            {posts.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No posts yet"
                description="Be the first to share an update!"
              />
            ) : (
              <div>
                {posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: Math.min(index * 0.03, 0.3) }}
                  >
                    <PostCardV2
                      post={post}
                      onLike={handleLikePost}
                      onComment={handleCommentPost}
                      onDelete={handleDeletePost}
                    />
                  </motion.div>
                ))}

                {/* Pagination Controls */}
                {data?.feed?.nextCursor && (
                  <div className="mt-6 flex justify-center">
                    <Button
                      variant="secondary"
                      onClick={handleLoadMore}
                      loading={loadingMore}
                      disabled={loadingMore}
                      className="px-8"
                    >
                      {loadingMore ? 'Loading...' : 'Load more posts'}
                    </Button>
                  </div>
                )}

                {/* End of Feed Message */}
                {posts.length > 0 && !data?.feed?.nextCursor && (
                  <div className="mt-6 text-center py-8">
                    <p className="text-textSecondary text-sm">
                      You're all caught up! 🎉
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-20">
              <RightSidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
