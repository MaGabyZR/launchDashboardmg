/**
 * DM Generator Service
 * 
 * Classifies companies based on engagement metrics and generates
 * outreach message drafts for low-engagement launches.
 * 
 * Validates: Requirements 6.1, 6.2, 6.3
 */

import { LaunchPost, DMDraft } from '../types/index.js';

/**
 * Engagement thresholds by platform
 */
const ENGAGEMENT_THRESHOLDS = {
  x: 50,
  linkedin: 100
} as const;

/**
 * Classify whether a company has low engagement based on launch post metrics
 * 
 * A company is considered to have low engagement if:
 * - Any X post has < 50 likes
 * - Any LinkedIn post has < 100 likes
 * 
 * @param launchPosts - Array of launch posts with engagement metrics
 * @returns true if the company has low engagement, false otherwise
 */
export function classifyEngagement(launchPosts: LaunchPost[]): boolean {
  // If no launch posts, cannot classify as low engagement
  if (!launchPosts || launchPosts.length === 0) {
    return false;
  }

  // Check each launch post against platform-specific thresholds
  for (const post of launchPosts) {
    const threshold = ENGAGEMENT_THRESHOLDS[post.platform];
    
    if (post.likes < threshold) {
      return true; // Low engagement detected
    }
  }

  // All posts meet or exceed their thresholds
  return false;
}

/**
 * Generate a DM draft for companies with low engagement launches
 * 
 * Creates an outreach message template with the company name and
 * reason for outreach based on their launch post engagement metrics.
 * 
 * @param companyName - Name of the company
 * @param launchPosts - Array of launch posts with engagement metrics
 * @returns DMDraft object with message, companyName, and reason, or null if not low engagement
 */
export function generateDM(companyName: string, launchPosts: LaunchPost[]): DMDraft | null {
  // Check if company has low engagement
  if (!classifyEngagement(launchPosts)) {
    return null;
  }

  // Determine which platform(s) have low engagement for the reason
  const lowEngagementPlatforms: string[] = [];
  
  for (const post of launchPosts) {
    const threshold = ENGAGEMENT_THRESHOLDS[post.platform];
    if (post.likes < threshold) {
      const platformName = post.platform === 'x' ? 'X' : 'LinkedIn';
      if (!lowEngagementPlatforms.includes(platformName)) {
        lowEngagementPlatforms.push(platformName);
      }
    }
  }

  const platformText = lowEngagementPlatforms.length > 1 
    ? lowEngagementPlatforms.join(' and ')
    : lowEngagementPlatforms[0];

  const reason = `Low engagement on ${platformText} launch post`;

  const message = `Hi ${companyName} team,

I came across your recent launch and wanted to reach out. I noticed your ${platformText} post and thought our service might help you reach a wider audience.

Would you be open to a quick chat about how we can support your growth?

Best,
[Your Name]`;

  return {
    message,
    companyName,
    reason
  };
}
