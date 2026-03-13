import type { Request, Response } from 'express';
import { prisma } from '../../src/lib/db.js';
import { scrapeXPost, scrapeLinkedInPost } from '../../src/services/scraper.js';
import type { RefreshResponse } from '../../src/types/index.js';

/**
 * POST /api/refresh/:id
 * Refresh engagement metrics for a company
 * 
 * Path Parameters:
 * - id: Company identifier
 * 
 * Validates: Requirements 12.1, 12.2, 12.3
 */
export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid request: company ID is required' 
      });
    }

    // Get company's launch posts from database
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        launchPosts: true,
      },
    });

    if (!company) {
      return res.status(404).json({ 
        error: 'Company not found' 
      });
    }

    // If company has no launch posts, return early
    if (company.launchPosts.length === 0) {
      return res.status(200).json({
        success: true,
        updated: 0,
        failed: 0,
        errors: [],
      });
    }

    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    // Trigger scraping for each URL and update records
    for (const post of company.launchPosts) {
      try {
        let metrics;

        // Scrape based on platform
        if (post.platform === 'X') {
          metrics = await scrapeXPost(post.postId);
        } else if (post.platform === 'LINKEDIN') {
          metrics = await scrapeLinkedInPost(post.postId);
        } else {
          errors.push(`Unknown platform for post ${post.id}`);
          failed++;
          continue;
        }

        // Update the launch post with new metrics
        if (metrics.success) {
          try {
            await prisma.launchPost.update({
              where: { id: post.id },
              data: {
                likes: metrics.likes,
                lastScraped: metrics.scrapedAt,
                scrapeFailed: false,
                scrapeError: null,
              },
            });
            updated++;
          } catch (updateError) {
            const errorMessage = updateError instanceof Error ? updateError.message : 'Unknown error';
            errors.push(`Error updating post ${post.id}: ${errorMessage}`);
            failed++;
          }
        } else {
          // Scraping failed, mark the record
          try {
            await prisma.launchPost.update({
              where: { id: post.id },
              data: {
                scrapeFailed: true,
                scrapeError: metrics.error || 'Unknown scraping error',
                lastScraped: metrics.scrapedAt,
              },
            });
          } catch (updateError) {
            const errorMessage = updateError instanceof Error ? updateError.message : 'Unknown error';
            errors.push(`Error updating post ${post.id}: ${errorMessage}`);
          }
          errors.push(metrics.error || `Failed to scrape post ${post.id}`);
          failed++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Error processing post ${post.id}: ${errorMessage}`);
        failed++;
      }
    }

    const response: RefreshResponse = {
      success: true,
      updated,
      failed,
      errors,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error refreshing data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
