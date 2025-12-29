/**
 * Home Feed V2 Contract - Frontend Post Shape
 *
 * This file defines the exact structure expected by HomeFeedV2, PostCardV2, and PostComposerV2.
 * Use these typedefs via JSDoc to document transformations and prevent runtime crashes.
 *
 * @module homeFeedV2.contract
 */

/**
 * @typedef {Object} PostAuthorV2
 * @property {string} id - Author user ID (required)
 * @property {string} name - Full name (required, fallback: "Unknown User")
 * @property {string} headline - Role • Department (required, fallback: "")
 * @property {string} department - Department enum (required, fallback: "")
 * @property {string|null} avatarUrl - Avatar URL (optional, usually null)
 */

/**
 * @typedef {Object} PostImageV2
 * @property {string} url - Image URL (required)
 * @property {string} alt - Alt text (optional, default: "")
 */

/**
 * @typedef {Object} PostVideoV2
 * @property {string} url - Video URL (required)
 * @property {string|null} posterUrl - Video poster/thumbnail URL (optional)
 */

/**
 * @typedef {Object} PostMediaV2
 * @property {'image'|'video'} type - Media type
 * @property {PostImageV2[]} [images] - Array of images (required if type='image')
 * @property {PostVideoV2} [video] - Video object (required if type='video')
 */

/**
 * @typedef {Object} PostStatsV2
 * @property {number} likeCount - Total likes (required, default: 0)
 * @property {number} commentCount - Total comments (required, default: 0)
 */

/**
 * @typedef {Object} PostViewerStateV2
 * @property {boolean} likedByMe - Whether current user liked this post (required, default: false)
 */

/**
 * @typedef {Object} PostCommentV2
 * @property {string} id - Comment ID (required)
 * @property {PostAuthorV2} author - Comment author (required)
 * @property {string} text - Comment text (required)
 * @property {string} createdAt - ISO timestamp (required)
 */

/**
 * Main Post object used throughout Home Feed V2
 *
 * @typedef {Object} PostV2
 * @property {string} id - Post ID (required, fallback: "unknown")
 * @property {string} authorId - Author user ID (required, fallback: "unknown")
 * @property {PostAuthorV2} author - Author details (required)
 * @property {string} text - Post text content (optional)
 * @property {PostMediaV2|null} media - Media attachments (optional, null if none)
 * @property {string} createdAt - ISO timestamp (required)
 * @property {string} updatedAt - ISO timestamp (optional)
 * @property {PostStatsV2} stats - Engagement stats (required)
 * @property {PostViewerStateV2} viewerState - Viewer-specific state (required)
 * @property {PostCommentV2[]} comments - Lazy-loaded comments (default: [])
 */

/**
 * Validates a post object has minimum required fields
 * Non-throwing, returns boolean + warnings in dev mode
 *
 * @param {any} post - Post object to validate
 * @returns {boolean} - True if valid
 */
export function validatePostV2(post) {
  if (!post) return false;

  const hasId = typeof post.id === 'string' && post.id.length > 0;
  const hasAuthor = post.author && typeof post.author.name === 'string';
  const hasStats = post.stats && typeof post.stats.likeCount === 'number';

  const isValid = hasId && hasAuthor && hasStats;

  // Dev-only warnings
  if (!isValid && import.meta.env.DEV) {
    console.warn('[Contract] Invalid PostV2 shape:', {
      postId: post?.id || 'missing',
      hasId,
      hasAuthor,
      hasStats
    });
  }

  return isValid;
}
