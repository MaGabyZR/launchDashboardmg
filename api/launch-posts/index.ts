import type { Request, Response } from 'express';
import { prisma } from '../src/lib/db.js';
import { parseURL } from '../src/services/urlParser.js';
import { scrapeXPost, scrapeLinkedInPost } from '../src/services/scraper.js';
import { searchYCCompany } from '../src/services/ycClient.js';
import type { DataSource } from '../src/types/index.js';

/**
 * POST /api/launch-posts
 * Add new launch post URL(s)
 * 
 * Request Body:
 * - urls: string[] - One or more URLs
 * - companyName: string
 * - manualMetrics?: { platform: 'x' | 'linkedin', likes: number }[]
 * 
 * Processing:
 * 1. Validate each URL format
 * 2. Parse platform and post ID
 * 3. Create or find company record
 * 4. Store URL metadata
 * 5. Trigger async scraping for each URL (non-blocking)
 * 6. Query YC API if company name provided
 * 7. Return results array with success/failure status per URL
 * 
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 8.5, 13.3, 13.4
 */
export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { urls, companyName, manualMetrics } = req.body;

    // Validate request body
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request: urls array is required' 
      });
    }

    if (!companyName || typeof companyName !== 'string' || companyName.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request: companyName is required' 
      });
    }

    const trimmedCompanyName = companyName.trim();

    // Step 1: Find or create company record
    let company = await prisma.company.findFirst({
      where: {
        name: {
          equals: trimmedCompanyName,
          mode: 'insensitive'
        }
      }
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          name: trimmedCompanyName
        }
      });
      console.log(`[Launch Posts API] Created new company: ${trimmedCompanyName} (${company.id})`);
    } else {
      console.log(`[Launch Posts API] Found existing company: ${trimmedCompanyName} (${company.id})`);
    }

    // Step 2: Query YC API for fundraise data (async, non-blocking for response)
    searchYCCompany(trimmedCompanyName)
      .then(async (ycData) => {
        if (ycData) {
          console.log(`[Launch Posts API] Found YC data for ${trimmedCompanyName}: ${ycData.batch}, $${ycData.amountRaised}`);
          
          // Check if fundraise record already exists
          const existingFundraise = await prisma.fundraise.findUnique({
            where: { companyId: company.id }
          });

          if (!existingFundraise) {
            await prisma.fundraise.create({
              data: {
                companyId: company.id,
                amount: ycData.amountRaised,
                announcementDate: new Date(ycData.announcementDate),
                source: 'YC_API'
              }
            });
            
            // Update company with YC batch
            await prisma.company.update({
              where: { id: company.id },
              data: { ycBatch: ycData.batch }
            });
            
            console.log(`[Launch Posts API] Stored YC fundraise data for ${trimmedCompanyName}`);
          } else {
            console.log(`[Launch Posts API] Fundraise data already exists for ${trimmedCompanyName}`);
          }
        } else {
          console.log(`[Launch Posts API] No YC data found for ${trimmedCompanyName}`);
        }
      })
      .catch((error) => {
        console.error(`[Launch Posts API] Error fetching YC data for ${trimmedCompanyName}:`, error);
      });

    // Step 3: Process each URL
    const results = await Promise.all(
      urls.map(async (url) => {
        try {
          // Validate URL is a string
          if (typeof url !== 'string' || url.trim().length === 0) {
            return {
              url: url || '',
              status: 'failed' as const,
              error: 'URL must be a non-empty string'
            };
          }

          const trimmedUrl = url.trim();

          // Parse URL to extract platform and post ID
          const parsedUrl = parseURL(trimmedUrl);

          if (!parsedUrl.isValid) {
            return {
              url: trimmedUrl,
              status: 'failed' as const,
              error: parsedUrl.error || 'Invalid URL format'
            };
          }

          // Check if URL already exists
          const existingPost = await prisma.launchPost.findUnique({
            where: { url: trimmedUrl }
          });

          if (existingPost) {
            return {
              url: trimmedUrl,
              status: 'failed' as const,
              error: 'URL already exists in database',
              companyId: existingPost.companyId
            };
          }

          // Check if manual metrics provided for this URL
          const manualMetric = manualMetrics?.find(
            (m: any) => m.platform === parsedUrl.platform
          );

          const dataSource: DataSource = manualMetric ? 'manual' : 'scraped';
          const initialLikes = manualMetric?.likes || 0;

          // Convert platform to uppercase for Prisma enum
          const platformEnum = parsedUrl.platform.toUpperCase() as 'X' | 'LINKEDIN';

          // Store URL metadata in database
          const launchPost = await prisma.launchPost.create({
            data: {
              companyId: company.id,
              platform: platformEnum,
              url: trimmedUrl,
              postId: parsedUrl.postId,
              likes: initialLikes,
              dataSource: dataSource.toUpperCase() as 'MANUAL' | 'SCRAPED',
              lastScraped: manualMetric ? null : new Date(),
              scrapeFailed: false
            }
          });

          console.log(`[Launch Posts API] Stored launch post: ${trimmedUrl} (${launchPost.id})`);

          // Trigger async scraping if not manual (non-blocking)
          if (!manualMetric) {
            (async () => {
              try {
                console.log(`[Launch Posts API] Starting async scrape for ${parsedUrl.platform} post ${parsedUrl.postId}`);
                
                let scrapedMetrics;
                if (parsedUrl.platform === 'x') {
                  scrapedMetrics = await scrapeXPost(parsedUrl.postId);
                } else {
                  scrapedMetrics = await scrapeLinkedInPost(parsedUrl.postId);
                }

                if (scrapedMetrics.success) {
                  await prisma.launchPost.update({
                    where: { id: launchPost.id },
                    data: {
                      likes: scrapedMetrics.likes,
                      lastScraped: scrapedMetrics.scrapedAt,
                      scrapeFailed: false,
                      scrapeError: null
                    }
                  });
                  console.log(`[Launch Posts API] Successfully scraped ${scrapedMetrics.likes} likes for ${trimmedUrl}`);
                } else {
                  await prisma.launchPost.update({
                    where: { id: launchPost.id },
                    data: {
                      scrapeFailed: true,
                      scrapeError: scrapedMetrics.error || 'Unknown scraping error',
                      lastScraped: scrapedMetrics.scrapedAt
                    }
                  });
                  console.error(`[Launch Posts API] Scraping failed for ${trimmedUrl}: ${scrapedMetrics.error}`);
                }
              } catch (scrapeError) {
                const errorMessage = scrapeError instanceof Error ? scrapeError.message : 'Unknown error';
                await prisma.launchPost.update({
                  where: { id: launchPost.id },
                  data: {
                    scrapeFailed: true,
                    scrapeError: errorMessage,
                    lastScraped: new Date()
                  }
                });
                console.error(`[Launch Posts API] Exception during scraping for ${trimmedUrl}:`, scrapeError);
              }
            })();
          }

          return {
            url: trimmedUrl,
            status: 'success' as const,
            companyId: company.id
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`[Launch Posts API] Error processing URL ${url}:`, error);
          return {
            url: url || '',
            status: 'failed' as const,
            error: errorMessage
          };
        }
      })
    );

    // Return response with results for each URL
    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    console.log(`[Launch Posts API] Processed ${urls.length} URLs: ${successCount} success, ${failedCount} failed`);

    res.status(200).json({
      success: successCount > 0,
      results
    });
  } catch (error) {
    console.error('[Launch Posts API] Error adding launch posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
