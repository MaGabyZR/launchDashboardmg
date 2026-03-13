/**
 * URL Parser Service
 * 
 * Parses and validates URLs from X (Twitter) and LinkedIn to extract
 * platform type and post identifiers.
 * 
 * Validates: Requirements 1.3, 1.4, 11.1, 11.2, 11.3, 11.5
 */

import { ParsedURL, Platform } from '../types/index.js';

/**
 * Regular expressions for URL parsing
 */
const URL_PATTERNS = {
  // X (Twitter) patterns - supports twitter.com, x.com, and mobile variants
  // Format: https://twitter.com/username/status/1234567890
  // Format: https://x.com/username/status/1234567890
  // Format: https://mobile.twitter.com/username/status/1234567890
  x: /^https?:\/\/(?:www\.|mobile\.)?(?:twitter\.com|x\.com)\/[^\/]+\/status\/(\d+)/i,
  
  // LinkedIn patterns - supports posts and feed updates
  // Format: https://www.linkedin.com/posts/username_activity-1234567890-abcd
  // Format: https://linkedin.com/feed/update/urn:li:activity:1234567890
  linkedin: [
    /^https?:\/\/(?:www\.)?linkedin\.com\/posts\/[^\/]+_activity-(\d+)-[a-zA-Z0-9]+/i,
    /^https?:\/\/(?:www\.)?linkedin\.com\/feed\/update\/urn:li:activity:(\d+)/i
  ]
};

/**
 * Parse a URL to extract platform type and post ID
 * 
 * @param url - The URL string to parse
 * @returns ParsedURL object with platform, postId, and validation status
 */
export function parseURL(url: string): ParsedURL {
  // Validate input
  if (!url || typeof url !== 'string') {
    return {
      platform: 'x', // Default platform for type safety
      postId: '',
      isValid: false,
      error: 'URL must be a non-empty string'
    };
  }

  // Trim whitespace
  const trimmedUrl = url.trim();

  if (trimmedUrl.length === 0) {
    return {
      platform: 'x',
      postId: '',
      isValid: false,
      error: 'URL cannot be empty'
    };
  }

  // Try to match X (Twitter) URL
  const xMatch = trimmedUrl.match(URL_PATTERNS.x);
  if (xMatch && xMatch[1]) {
    return {
      platform: 'x' as Platform,
      postId: xMatch[1],
      isValid: true
    };
  }

  // Try to match LinkedIn URL patterns
  for (const pattern of URL_PATTERNS.linkedin) {
    const linkedInMatch = trimmedUrl.match(pattern);
    if (linkedInMatch && linkedInMatch[1]) {
      return {
        platform: 'linkedin' as Platform,
        postId: linkedInMatch[1],
        isValid: true
      };
    }
  }

  // No pattern matched - determine error message
  if (trimmedUrl.includes('twitter.com') || trimmedUrl.includes('x.com')) {
    return {
      platform: 'x',
      postId: '',
      isValid: false,
      error: 'Invalid X (Twitter) URL format. Expected format: https://twitter.com/username/status/1234567890 or https://x.com/username/status/1234567890'
    };
  }

  if (trimmedUrl.includes('linkedin.com')) {
    return {
      platform: 'linkedin',
      postId: '',
      isValid: false,
      error: 'Invalid LinkedIn URL format. Expected format: https://www.linkedin.com/posts/username_activity-1234567890-abcd or https://linkedin.com/feed/update/urn:li:activity:1234567890'
    };
  }

  // Unknown platform
  return {
    platform: 'x',
    postId: '',
    isValid: false,
    error: 'Unsupported platform. Only X (Twitter) and LinkedIn URLs are supported.'
  };
}
