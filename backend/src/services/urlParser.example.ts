/**
 * Example usage of URL Parser Service
 * 
 * This file demonstrates how to use the parseURL function
 * to validate and extract information from social media URLs.
 */

import { parseURL } from './urlParser.js';

// Example 1: Valid X (Twitter) URL
console.log('Example 1: Valid X URL');
const xResult = parseURL('https://twitter.com/elonmusk/status/1234567890123456789');
console.log(xResult);
// Output: { platform: 'x', postId: '1234567890123456789', isValid: true }

// Example 2: Valid LinkedIn URL
console.log('\nExample 2: Valid LinkedIn URL');
const linkedInResult = parseURL('https://www.linkedin.com/posts/johndoe_activity-9876543210987654321-abcd');
console.log(linkedInResult);
// Output: { platform: 'linkedin', postId: '9876543210987654321', isValid: true }

// Example 3: Invalid URL
console.log('\nExample 3: Invalid URL');
const invalidResult = parseURL('https://facebook.com/post/123456');
console.log(invalidResult);
// Output: { platform: 'x', postId: '', isValid: false, error: 'Unsupported platform...' }

// Example 4: Malformed Twitter URL
console.log('\nExample 4: Malformed Twitter URL');
const malformedResult = parseURL('https://twitter.com/user');
console.log(malformedResult);
// Output: { platform: 'x', postId: '', isValid: false, error: 'Invalid X (Twitter) URL format...' }

// Example 5: Using in application logic
console.log('\nExample 5: Application logic');
function processURL(url: string) {
  const parsed = parseURL(url);
  
  if (parsed.isValid) {
    console.log(`✓ Valid ${parsed.platform} post with ID: ${parsed.postId}`);
    // Store in database, trigger scraping, etc.
  } else {
    console.log(`✗ Invalid URL: ${parsed.error}`);
    // Show error to user
  }
}

processURL('https://x.com/user/status/1111111111111111111');
processURL('https://linkedin.com/feed/update/urn:li:activity:2222222222222222222');
processURL('https://invalid-url.com');
