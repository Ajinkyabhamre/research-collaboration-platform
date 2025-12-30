/**
 * Time formatting utilities for feed posts and comments
 */

/**
 * Format ISO date string to relative time (LinkedIn-style)
 * @param {string} isoString - ISO date string
 * @returns {string} - "Just now", "5m", "2h", "3d", "1w", etc.
 */
export function formatTimeAgo(isoString) {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffWeeks < 4) return `${diffWeeks}w`;
  if (diffMonths < 12) return `${diffMonths}mo`;
  return `${diffYears}y`;
}

/**
 * Truncate text to a character limit with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} limit - Character limit (default 240)
 * @returns {{ truncatedText: string, isTruncated: boolean }}
 */
export function safeTruncate(text, limit = 240) {
  if (!text || text.length <= limit) {
    return { truncatedText: text || '', isTruncated: false };
  }

  // Try to truncate at last space before limit
  let truncateAt = limit;
  const lastSpace = text.lastIndexOf(' ', limit);
  if (lastSpace > limit * 0.8) {
    // If last space is reasonably close to limit, use it
    truncateAt = lastSpace;
  }

  return {
    truncatedText: text.substring(0, truncateAt).trim() + '…',
    isTruncated: true,
  };
}

/**
 * Format read receipt timestamp
 * @param {string} isoString - ISO date string
 * @returns {string} - "Seen 2m ago", "Seen at 3:45 PM", etc.
 */
export function formatReadReceipt(isoString) {
  if (!isoString) return '';

  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / 1000 / 60);

  // Less than 1 minute
  if (diffMinutes < 1) return 'Seen just now';

  // Less than 60 minutes
  if (diffMinutes < 60) return `Seen ${diffMinutes}m ago`;

  // Today - show time
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return `Seen at ${timeStr}`;
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Seen yesterday';
  }

  // Within last week
  const diffDays = Math.floor(diffMinutes / 1440);
  if (diffDays < 7) {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    return `Seen ${dayName}`;
  }

  // Older - show date
  return `Seen ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}
