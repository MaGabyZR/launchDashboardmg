/**
 * Tests for DM Generator Service
 * 
 * Tests the classifyEngagement and generateDM functions with both unit tests and property-based tests
 */

import { describe, it, expect } from 'vitest';
import { classifyEngagement, generateDM } from './dmGenerator.js';
import { LaunchPost, Platform } from '../types/index.js';
import fc from 'fast-check';

describe('DM Generator Service', () => {
  describe('classifyEngagement - Unit Tests', () => {
    it('should return false for empty launch posts array', () => {
      const result = classifyEngagement([]);
      expect(result).toBe(false);
    });

    it('should return true for X post with likes below threshold (< 50)', () => {
      const launchPosts: LaunchPost[] = [
        {
          id: '1',
          companyId: 'company1',
          platform: 'x',
          url: 'https://x.com/user/status/123',
          postId: '123',
          likes: 30,
          dataSource: 'scraped',
          lastScraped: new Date(),
          scrapeFailed: false,
          scrapeError: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = classifyEngagement(launchPosts);
      expect(result).toBe(true);
    });

    it('should return false for X post with likes at threshold (50)', () => {
      const launchPosts: LaunchPost[] = [
        {
          id: '1',
          companyId: 'company1',
          platform: 'x',
          url: 'https://x.com/user/status/123',
          postId: '123',
          likes: 50,
          dataSource: 'scraped',
          lastScraped: new Date(),
          scrapeFailed: false,
          scrapeError: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = classifyEngagement(launchPosts);
      expect(result).toBe(false);
    });

    it('should return false for X post with likes above threshold (> 50)', () => {
      const launchPosts: LaunchPost[] = [
        {
          id: '1',
          companyId: 'company1',
          platform: 'x',
          url: 'https://x.com/user/status/123',
          postId: '123',
          likes: 100,
          dataSource: 'scraped',
          lastScraped: new Date(),
          scrapeFailed: false,
          scrapeError: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = classifyEngagement(launchPosts);
      expect(result).toBe(false);
    });

    it('should return true for LinkedIn post with likes below threshold (< 100)', () => {
      const launchPosts: LaunchPost[] = [
        {
          id: '1',
          companyId: 'company1',
          platform: 'linkedin',
          url: 'https://linkedin.com/posts/user_activity-123-abcd',
          postId: '123',
          likes: 75,
          dataSource: 'scraped',
          lastScraped: new Date(),
          scrapeFailed: false,
          scrapeError: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = classifyEngagement(launchPosts);
      expect(result).toBe(true);
    });

    it('should return false for LinkedIn post with likes at threshold (100)', () => {
      const launchPosts: LaunchPost[] = [
        {
          id: '1',
          companyId: 'company1',
          platform: 'linkedin',
          url: 'https://linkedin.com/posts/user_activity-123-abcd',
          postId: '123',
          likes: 100,
          dataSource: 'scraped',
          lastScraped: new Date(),
          scrapeFailed: false,
          scrapeError: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = classifyEngagement(launchPosts);
      expect(result).toBe(false);
    });

    it('should return false for LinkedIn post with likes above threshold (> 100)', () => {
      const launchPosts: LaunchPost[] = [
        {
          id: '1',
          companyId: 'company1',
          platform: 'linkedin',
          url: 'https://linkedin.com/posts/user_activity-123-abcd',
          postId: '123',
          likes: 150,
          dataSource: 'scraped',
          lastScraped: new Date(),
          scrapeFailed: false,
          scrapeError: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = classifyEngagement(launchPosts);
      expect(result).toBe(false);
    });

    it('should return true if any post has low engagement (mixed platforms)', () => {
      const launchPosts: LaunchPost[] = [
        {
          id: '1',
          companyId: 'company1',
          platform: 'x',
          url: 'https://x.com/user/status/123',
          postId: '123',
          likes: 100, // Above threshold
          dataSource: 'scraped',
          lastScraped: new Date(),
          scrapeFailed: false,
          scrapeError: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          companyId: 'company1',
          platform: 'linkedin',
          url: 'https://linkedin.com/posts/user_activity-456-abcd',
          postId: '456',
          likes: 50, // Below threshold
          dataSource: 'scraped',
          lastScraped: new Date(),
          scrapeFailed: false,
          scrapeError: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = classifyEngagement(launchPosts);
      expect(result).toBe(true);
    });

    it('should return false if all posts have high engagement (mixed platforms)', () => {
      const launchPosts: LaunchPost[] = [
        {
          id: '1',
          companyId: 'company1',
          platform: 'x',
          url: 'https://x.com/user/status/123',
          postId: '123',
          likes: 100,
          dataSource: 'scraped',
          lastScraped: new Date(),
          scrapeFailed: false,
          scrapeError: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          companyId: 'company1',
          platform: 'linkedin',
          url: 'https://linkedin.com/posts/user_activity-456-abcd',
          postId: '456',
          likes: 200,
          dataSource: 'scraped',
          lastScraped: new Date(),
          scrapeFailed: false,
          scrapeError: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = classifyEngagement(launchPosts);
      expect(result).toBe(false);
    });

    it('should handle posts with 0 likes as low engagement', () => {
      const launchPosts: LaunchPost[] = [
        {
          id: '1',
          companyId: 'company1',
          platform: 'x',
          url: 'https://x.com/user/status/123',
          postId: '123',
          likes: 0,
          dataSource: 'scraped',
          lastScraped: new Date(),
          scrapeFailed: false,
          scrapeError: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = classifyEngagement(launchPosts);
      expect(result).toBe(true);
    });
  });

  describe('classifyEngagement - Property-Based Tests', () => {
    // Feature: launch-tracker-dashboard, Property 6: Low Engagement Classification
    it('should correctly classify X posts based on 50 likes threshold', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 200 }), // likes count
          (likes) => {
            const launchPost: LaunchPost = {
              id: '1',
              companyId: 'company1',
              platform: 'x',
              url: 'https://x.com/user/status/123',
              postId: '123',
              likes,
              dataSource: 'scraped',
              lastScraped: new Date(),
              scrapeFailed: false,
              scrapeError: null,
              createdAt: new Date(),
              updatedAt: new Date()
            };

            const isLowEngagement = classifyEngagement([launchPost]);

            if (likes < 50) {
              expect(isLowEngagement).toBe(true);
            } else {
              expect(isLowEngagement).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: launch-tracker-dashboard, Property 6: Low Engagement Classification
    it('should correctly classify LinkedIn posts based on 100 likes threshold', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 300 }), // likes count
          (likes) => {
            const launchPost: LaunchPost = {
              id: '1',
              companyId: 'company1',
              platform: 'linkedin',
              url: 'https://linkedin.com/posts/user_activity-123-abcd',
              postId: '123',
              likes,
              dataSource: 'scraped',
              lastScraped: new Date(),
              scrapeFailed: false,
              scrapeError: null,
              createdAt: new Date(),
              updatedAt: new Date()
            };

            const isLowEngagement = classifyEngagement([launchPost]);

            if (likes < 100) {
              expect(isLowEngagement).toBe(true);
            } else {
              expect(isLowEngagement).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: launch-tracker-dashboard, Property 6: Low Engagement Classification
    it('should classify as low engagement if ANY post is below threshold', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              platform: fc.constantFrom('x' as Platform, 'linkedin' as Platform),
              likes: fc.integer({ min: 0, max: 300 })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (posts) => {
            const launchPosts: LaunchPost[] = posts.map((post, index) => ({
              id: `${index}`,
              companyId: 'company1',
              platform: post.platform,
              url: post.platform === 'x' 
                ? `https://x.com/user/status/${index}`
                : `https://linkedin.com/posts/user_activity-${index}-abcd`,
              postId: `${index}`,
              likes: post.likes,
              dataSource: 'scraped',
              lastScraped: new Date(),
              scrapeFailed: false,
              scrapeError: null,
              createdAt: new Date(),
              updatedAt: new Date()
            }));

            const isLowEngagement = classifyEngagement(launchPosts);

            // Check if any post is below its threshold
            const hasLowEngagement = posts.some(post => {
              const threshold = post.platform === 'x' ? 50 : 100;
              return post.likes < threshold;
            });

            expect(isLowEngagement).toBe(hasLowEngagement);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('generateDM - Unit Tests', () => {
    it('should return null for companies without low engagement', () => {
      const launchPosts: LaunchPost[] = [
        {
          id: '1',
          companyId: 'company1',
          platform: 'x',
          url: 'https://x.com/user/status/123',
          postId: '123',
          likes: 100, // Above threshold
          dataSource: 'scraped',
          lastScraped: new Date(),
          scrapeFailed: false,
          scrapeError: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = generateDM('TestCompany', launchPosts);
      expect(result).toBeNull();
    });

    it('should return null for empty launch posts array', () => {
      const result = generateDM('TestCompany', []);
      expect(result).toBeNull();
    });

    it('should generate DM draft for X post with low engagement', () => {
      const launchPosts: LaunchPost[] = [
        {
          id: '1',
          companyId: 'company1',
          platform: 'x',
          url: 'https://x.com/user/status/123',
          postId: '123',
          likes: 30, // Below threshold
          dataSource: 'scraped',
          lastScraped: new Date(),
          scrapeFailed: false,
          scrapeError: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = generateDM('TestCompany', launchPosts);
      
      expect(result).not.toBeNull();
      expect(result?.companyName).toBe('TestCompany');
      expect(result?.reason).toBe('Low engagement on X launch post');
      expect(result?.message).toContain('Hi TestCompany team');
      expect(result?.message).toContain('X post');
    });

    it('should generate DM draft for LinkedIn post with low engagement', () => {
      const launchPosts: LaunchPost[] = [
        {
          id: '1',
          companyId: 'company1',
          platform: 'linkedin',
          url: 'https://linkedin.com/posts/user_activity-123-abcd',
          postId: '123',
          likes: 50, // Below threshold
          dataSource: 'scraped',
          lastScraped: new Date(),
          scrapeFailed: false,
          scrapeError: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = generateDM('TestCompany', launchPosts);
      
      expect(result).not.toBeNull();
      expect(result?.companyName).toBe('TestCompany');
      expect(result?.reason).toBe('Low engagement on LinkedIn launch post');
      expect(result?.message).toContain('Hi TestCompany team');
      expect(result?.message).toContain('LinkedIn post');
    });

    it('should generate DM draft mentioning both platforms when both have low engagement', () => {
      const launchPosts: LaunchPost[] = [
        {
          id: '1',
          companyId: 'company1',
          platform: 'x',
          url: 'https://x.com/user/status/123',
          postId: '123',
          likes: 20, // Below threshold
          dataSource: 'scraped',
          lastScraped: new Date(),
          scrapeFailed: false,
          scrapeError: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          companyId: 'company1',
          platform: 'linkedin',
          url: 'https://linkedin.com/posts/user_activity-456-abcd',
          postId: '456',
          likes: 40, // Below threshold
          dataSource: 'scraped',
          lastScraped: new Date(),
          scrapeFailed: false,
          scrapeError: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = generateDM('TestCompany', launchPosts);
      
      expect(result).not.toBeNull();
      expect(result?.companyName).toBe('TestCompany');
      expect(result?.reason).toBe('Low engagement on X and LinkedIn launch post');
      expect(result?.message).toContain('Hi TestCompany team');
      expect(result?.message).toContain('X and LinkedIn post');
    });

    it('should generate DM draft when only one platform has low engagement in mixed posts', () => {
      const launchPosts: LaunchPost[] = [
        {
          id: '1',
          companyId: 'company1',
          platform: 'x',
          url: 'https://x.com/user/status/123',
          postId: '123',
          likes: 100, // Above threshold
          dataSource: 'scraped',
          lastScraped: new Date(),
          scrapeFailed: false,
          scrapeError: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          companyId: 'company1',
          platform: 'linkedin',
          url: 'https://linkedin.com/posts/user_activity-456-abcd',
          postId: '456',
          likes: 50, // Below threshold
          dataSource: 'scraped',
          lastScraped: new Date(),
          scrapeFailed: false,
          scrapeError: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = generateDM('TestCompany', launchPosts);
      
      expect(result).not.toBeNull();
      expect(result?.companyName).toBe('TestCompany');
      expect(result?.reason).toBe('Low engagement on LinkedIn launch post');
      expect(result?.message).toContain('Hi TestCompany team');
      expect(result?.message).toContain('LinkedIn post');
    });

    it('should handle posts with 0 likes', () => {
      const launchPosts: LaunchPost[] = [
        {
          id: '1',
          companyId: 'company1',
          platform: 'x',
          url: 'https://x.com/user/status/123',
          postId: '123',
          likes: 0,
          dataSource: 'scraped',
          lastScraped: new Date(),
          scrapeFailed: false,
          scrapeError: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = generateDM('TestCompany', launchPosts);
      
      expect(result).not.toBeNull();
      expect(result?.companyName).toBe('TestCompany');
      expect(result?.reason).toBe('Low engagement on X launch post');
    });

    it('should include company name in the message', () => {
      const launchPosts: LaunchPost[] = [
        {
          id: '1',
          companyId: 'company1',
          platform: 'x',
          url: 'https://x.com/user/status/123',
          postId: '123',
          likes: 10,
          dataSource: 'scraped',
          lastScraped: new Date(),
          scrapeFailed: false,
          scrapeError: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = generateDM('AcmeInc', launchPosts);
      
      expect(result).not.toBeNull();
      expect(result?.message).toContain('Hi AcmeInc team');
      expect(result?.companyName).toBe('AcmeInc');
    });
  });

  describe('generateDM - Property-Based Tests', () => {
    // Feature: launch-tracker-dashboard, Property 7: DM Draft Generation
    it('should generate DM draft for any company with low engagement posts', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }), // company name
          fc.array(
            fc.record({
              platform: fc.constantFrom('x' as Platform, 'linkedin' as Platform),
              likes: fc.integer({ min: 0, max: 300 })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (companyName, posts) => {
            const launchPosts: LaunchPost[] = posts.map((post, index) => ({
              id: `${index}`,
              companyId: 'company1',
              platform: post.platform,
              url: post.platform === 'x' 
                ? `https://x.com/user/status/${index}`
                : `https://linkedin.com/posts/user_activity-${index}-abcd`,
              postId: `${index}`,
              likes: post.likes,
              dataSource: 'scraped',
              lastScraped: new Date(),
              scrapeFailed: false,
              scrapeError: null,
              createdAt: new Date(),
              updatedAt: new Date()
            }));

            const result = generateDM(companyName, launchPosts);

            // Check if any post is below its threshold
            const hasLowEngagement = posts.some(post => {
              const threshold = post.platform === 'x' ? 50 : 100;
              return post.likes < threshold;
            });

            if (hasLowEngagement) {
              // Should generate a DM draft
              expect(result).not.toBeNull();
              expect(result?.companyName).toBe(companyName);
              expect(result?.message).toContain(`Hi ${companyName} team`);
              expect(result?.reason).toContain('Low engagement on');
            } else {
              // Should not generate a DM draft
              expect(result).toBeNull();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: launch-tracker-dashboard, Property 7: DM Draft Generation
    it('should always include company name in message and DMDraft object', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }), // company name
          fc.constantFrom('x' as Platform, 'linkedin' as Platform),
          fc.integer({ min: 0, max: 49 }), // likes below both thresholds
          (companyName, platform, likes) => {
            const launchPost: LaunchPost = {
              id: '1',
              companyId: 'company1',
              platform,
              url: platform === 'x' 
                ? 'https://x.com/user/status/123'
                : 'https://linkedin.com/posts/user_activity-123-abcd',
              postId: '123',
              likes,
              dataSource: 'scraped',
              lastScraped: new Date(),
              scrapeFailed: false,
              scrapeError: null,
              createdAt: new Date(),
              updatedAt: new Date()
            };

            const result = generateDM(companyName, [launchPost]);

            expect(result).not.toBeNull();
            expect(result?.companyName).toBe(companyName);
            expect(result?.message).toContain(companyName);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: launch-tracker-dashboard, Property 7: DM Draft Generation
    it('should include reason field explaining why company qualifies for outreach', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }), // company name
          fc.constantFrom('x' as Platform, 'linkedin' as Platform),
          fc.integer({ min: 0, max: 49 }), // likes below both thresholds
          (companyName, platform, likes) => {
            const launchPost: LaunchPost = {
              id: '1',
              companyId: 'company1',
              platform,
              url: platform === 'x' 
                ? 'https://x.com/user/status/123'
                : 'https://linkedin.com/posts/user_activity-123-abcd',
              postId: '123',
              likes,
              dataSource: 'scraped',
              lastScraped: new Date(),
              scrapeFailed: false,
              scrapeError: null,
              createdAt: new Date(),
              updatedAt: new Date()
            };

            const result = generateDM(companyName, [launchPost]);

            expect(result).not.toBeNull();
            expect(result?.reason).toBeTruthy();
            expect(result?.reason).toContain('Low engagement');
            expect(result?.reason).toContain('launch post');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
