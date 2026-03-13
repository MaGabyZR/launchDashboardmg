/**
 * Unit tests for URL Parser Service
 * 
 * Tests URL parsing and validation for X (Twitter) and LinkedIn URLs
 * Validates: Requirements 1.3, 1.4, 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { describe, it, expect } from 'vitest';
import { parseURL } from './urlParser.js';

describe('URL Parser Service', () => {
  describe('X (Twitter) URL Parsing', () => {
    it('should parse standard twitter.com URL', () => {
      const result = parseURL('https://twitter.com/elonmusk/status/1234567890123456789');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('x');
      expect(result.postId).toBe('1234567890123456789');
      expect(result.error).toBeUndefined();
    });

    it('should parse x.com URL', () => {
      const result = parseURL('https://x.com/elonmusk/status/9876543210987654321');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('x');
      expect(result.postId).toBe('9876543210987654321');
      expect(result.error).toBeUndefined();
    });

    it('should parse mobile.twitter.com URL', () => {
      const result = parseURL('https://mobile.twitter.com/username/status/1111111111111111111');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('x');
      expect(result.postId).toBe('1111111111111111111');
      expect(result.error).toBeUndefined();
    });

    it('should parse twitter.com URL with www prefix', () => {
      const result = parseURL('https://www.twitter.com/user123/status/2222222222222222222');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('x');
      expect(result.postId).toBe('2222222222222222222');
      expect(result.error).toBeUndefined();
    });

    it('should parse x.com URL with www prefix', () => {
      const result = parseURL('https://www.x.com/testuser/status/3333333333333333333');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('x');
      expect(result.postId).toBe('3333333333333333333');
      expect(result.error).toBeUndefined();
    });

    it('should parse URL with http protocol', () => {
      const result = parseURL('http://twitter.com/user/status/4444444444444444444');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('x');
      expect(result.postId).toBe('4444444444444444444');
      expect(result.error).toBeUndefined();
    });

    it('should handle URLs with trailing slashes', () => {
      const result = parseURL('https://twitter.com/user/status/5555555555555555555/');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('x');
      expect(result.postId).toBe('5555555555555555555');
    });

    it('should handle URLs with query parameters', () => {
      const result = parseURL('https://twitter.com/user/status/6666666666666666666?s=20&t=abc123');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('x');
      expect(result.postId).toBe('6666666666666666666');
    });

    it('should reject malformed twitter URL without status', () => {
      const result = parseURL('https://twitter.com/elonmusk');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid X (Twitter) URL format');
    });

    it('should reject twitter URL with invalid status path', () => {
      const result = parseURL('https://twitter.com/user/tweet/1234567890');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid X (Twitter) URL format');
    });

    it('should reject twitter URL without post ID', () => {
      const result = parseURL('https://twitter.com/user/status/');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid X (Twitter) URL format');
    });
  });

  describe('LinkedIn URL Parsing', () => {
    it('should parse standard LinkedIn posts URL', () => {
      const result = parseURL('https://www.linkedin.com/posts/johndoe_activity-1234567890123456789-abcd');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('linkedin');
      expect(result.postId).toBe('1234567890123456789');
      expect(result.error).toBeUndefined();
    });

    it('should parse LinkedIn posts URL without www', () => {
      const result = parseURL('https://linkedin.com/posts/janedoe_activity-9876543210987654321-xyz1');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('linkedin');
      expect(result.postId).toBe('9876543210987654321');
      expect(result.error).toBeUndefined();
    });

    it('should parse LinkedIn feed update URL', () => {
      const result = parseURL('https://www.linkedin.com/feed/update/urn:li:activity:1111111111111111111');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('linkedin');
      expect(result.postId).toBe('1111111111111111111');
      expect(result.error).toBeUndefined();
    });

    it('should parse LinkedIn feed update URL without www', () => {
      const result = parseURL('https://linkedin.com/feed/update/urn:li:activity:2222222222222222222');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('linkedin');
      expect(result.postId).toBe('2222222222222222222');
      expect(result.error).toBeUndefined();
    });

    it('should parse LinkedIn URL with http protocol', () => {
      const result = parseURL('http://www.linkedin.com/posts/user_activity-3333333333333333333-test');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('linkedin');
      expect(result.postId).toBe('3333333333333333333');
      expect(result.error).toBeUndefined();
    });

    it('should handle LinkedIn URLs with various suffix formats', () => {
      const result = parseURL('https://www.linkedin.com/posts/username_activity-4444444444444444444-ABCD');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('linkedin');
      expect(result.postId).toBe('4444444444444444444');
    });

    it('should handle LinkedIn URLs with trailing slashes', () => {
      const result = parseURL('https://www.linkedin.com/posts/user_activity-5555555555555555555-test/');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('linkedin');
      expect(result.postId).toBe('5555555555555555555');
    });

    it('should reject malformed LinkedIn URL without activity', () => {
      const result = parseURL('https://www.linkedin.com/posts/johndoe');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid LinkedIn URL format');
    });

    it('should reject LinkedIn profile URL', () => {
      const result = parseURL('https://www.linkedin.com/in/johndoe');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid LinkedIn URL format');
    });

    it('should reject LinkedIn company page URL', () => {
      const result = parseURL('https://www.linkedin.com/company/example-company');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid LinkedIn URL format');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should reject empty string', () => {
      const result = parseURL('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be a non-empty string');
    });

    it('should reject whitespace-only string', () => {
      const result = parseURL('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });

    it('should handle URLs with leading/trailing whitespace', () => {
      const result = parseURL('  https://twitter.com/user/status/1234567890123456789  ');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('x');
      expect(result.postId).toBe('1234567890123456789');
    });

    it('should reject null input', () => {
      const result = parseURL(null as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be a non-empty string');
    });

    it('should reject undefined input', () => {
      const result = parseURL(undefined as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be a non-empty string');
    });

    it('should reject non-string input', () => {
      const result = parseURL(12345 as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be a non-empty string');
    });

    it('should reject unsupported platform URL', () => {
      const result = parseURL('https://facebook.com/post/123456');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unsupported platform');
    });

    it('should reject random URL', () => {
      const result = parseURL('https://example.com/some/path');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unsupported platform');
    });

    it('should reject malformed URL', () => {
      const result = parseURL('not-a-url');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unsupported platform');
    });

    it('should handle special characters in username', () => {
      const result = parseURL('https://twitter.com/user_name-123/status/1234567890123456789');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('x');
      expect(result.postId).toBe('1234567890123456789');
    });

    it('should handle encoded URLs', () => {
      const result = parseURL('https://twitter.com/user%20name/status/1234567890123456789');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('x');
      expect(result.postId).toBe('1234567890123456789');
    });

    it('should handle URLs with fragments', () => {
      const result = parseURL('https://twitter.com/user/status/1234567890123456789#reply');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('x');
      expect(result.postId).toBe('1234567890123456789');
    });

    it('should handle very long post IDs', () => {
      const result = parseURL('https://twitter.com/user/status/99999999999999999999');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('x');
      expect(result.postId).toBe('99999999999999999999');
    });
  });

  describe('Case Sensitivity', () => {
    it('should handle mixed case in domain (twitter)', () => {
      const result = parseURL('https://Twitter.com/user/status/1234567890123456789');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('x');
      expect(result.postId).toBe('1234567890123456789');
    });

    it('should handle mixed case in domain (linkedin)', () => {
      const result = parseURL('https://LinkedIn.com/posts/user_activity-1234567890123456789-abcd');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('linkedin');
      expect(result.postId).toBe('1234567890123456789');
    });

    it('should handle uppercase in path', () => {
      const result = parseURL('https://twitter.com/USER/STATUS/1234567890123456789');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('x');
      expect(result.postId).toBe('1234567890123456789');
    });
  });
});
