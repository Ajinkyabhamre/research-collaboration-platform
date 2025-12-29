/**
 * Text utilities for content display
 */

/**
 * Check if an element's text is clamped (truncated)
 * @param {HTMLElement} element - The element to check
 * @returns {boolean} - Whether text is clamped
 */
export function checkTextClamped(element) {
  if (!element) return false;
  return element.scrollHeight > element.clientHeight;
}

/**
 * Fallback character-based truncation for environments without line-clamp
 * @param {string} text - Text to truncate
 * @param {number} limit - Character limit
 * @returns {{ truncatedText: string, isTruncated: boolean }}
 */
export function truncateText(text, limit = 240) {
  if (!text || text.length <= limit) {
    return { truncatedText: text || '', isTruncated: false };
  }

  // Try to truncate at last space before limit
  let truncateAt = limit;
  const lastSpace = text.lastIndexOf(' ', limit);
  if (lastSpace > limit * 0.8) {
    truncateAt = lastSpace;
  }

  return {
    truncatedText: text.substring(0, truncateAt).trim() + '…',
    isTruncated: true,
  };
}
