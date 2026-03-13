/**
 * Scraping Service
 * 
 * Fetches public engagement metrics from X (Twitter) and LinkedIn posts
 * using Cheerio for lightweight HTML parsing.
 * 
 * Validates: Requirements 2.1, 2.2, 2.3
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import Bottleneck from 'bottleneck';
import { ScrapedMetrics } from '../types/index.js';

/**
 * Request timeout in milliseconds (10 seconds as per design)
 */
const REQUEST_TIMEOUT = 10000;

/**
 * User agent string to mimic browser requests
 */
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Retry configuration for exponential backoff
 * Delays: 1s, 2s, 4s for attempts 1, 2, 3
 */
const RETRY_DELAYS = [1000, 2000, 4000];
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Sleep utility for retry delays
 * 
 * @param ms - Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper with exponential backoff
 * 
 * Implements retry logic with delays of 1s, 2s, 4s
 * Maximum 3 attempts total
 * Logs each retry attempt with context
 * 
 * @param fn - Async function to retry
 * @param platform - Platform name for logging (x or linkedin)
 * @param postId - Post ID for logging
 * @returns Result from the function or final error
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  platform: string,
  postId: string
): Promise<T> {
  let lastError: Error | unknown;
  
  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      // Attempt the operation
      const result = await fn();
      
      // If successful, return immediately
      return result;
    } catch (error) {
      lastError = error;
      
      // Log the retry attempt
      const attemptNumber = attempt + 1;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(
        `[Scraper] Retry attempt ${attemptNumber}/${MAX_RETRY_ATTEMPTS} for ${platform} post ${postId}: ${errorMessage}`
      );
      
      // If this was the last attempt, don't wait
      if (attempt === MAX_RETRY_ATTEMPTS - 1) {
        break;
      }
      
      // Wait with exponential backoff before next retry
      const delay = RETRY_DELAYS[attempt];
      console.log(`[Scraper] Waiting ${delay}ms before retry...`);
      await sleep(delay);
    }
  }
  
  // All retries exhausted, throw the last error
  const errorMessage = lastError instanceof Error ? lastError.message : 'Unknown error occurred';
  console.error(
    `[Scraper] All ${MAX_RETRY_ATTEMPTS} attempts failed for ${platform} post ${postId}: ${errorMessage}`
  );
  throw lastError;
}

/**
 * Rate limiter for X (Twitter) scraping
 * Max 10 requests per minute (60000ms)
 */
const xLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 6000, // 6 seconds between requests = 10 requests per minute
  reservoir: 10, // Start with 10 requests available
  reservoirRefreshAmount: 10, // Refill to 10 requests
  reservoirRefreshInterval: 60000, // Every 60 seconds
});

/**
 * Rate limiter for LinkedIn scraping
 * Max 10 requests per minute (60000ms)
 */
const linkedInLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 6000, // 6 seconds between requests = 10 requests per minute
  reservoir: 10, // Start with 10 requests available
  reservoirRefreshAmount: 10, // Refill to 10 requests
  reservoirRefreshInterval: 60000, // Every 60 seconds
});

/**
 * Internal function to scrape X post without rate limiting
 * 
 * @param postId - The X post ID to scrape
 * @returns ScrapedMetrics object with likes count and success status
 */
async function scrapeXPostInternal(postId: string): Promise<ScrapedMetrics> {
  try {
    // Wrap the scraping logic with retry mechanism
    const result = await retryWithBackoff(
      async () => {
        // Construct the URL for the X post
        const url = `https://twitter.com/i/status/${postId}`;
        
        // Fetch the HTML content
        const response = await axios.get(url, {
          timeout: REQUEST_TIMEOUT,
          headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
        });

        // Parse HTML with Cheerio
        const $ = cheerio.load(response.data);
        
        // Try to extract likes count from various possible selectors
        // Note: X's HTML structure may change, so we try multiple approaches
        let likes = 0;
        
        // Look for like count in common patterns
        // This is a simplified implementation - actual selectors may need adjustment
        const likeSelectors = [
          '[data-testid="like"]',
          '[aria-label*="like"]',
          '.r-1777fci', // Common X CSS class for engagement metrics
        ];
        
        for (const selector of likeSelectors) {
          const element = $(selector).first();
          if (element.length > 0) {
            const text = element.text().trim();
            const match = text.match(/(\d+)/);
            if (match) {
              likes = parseInt(match[1], 10);
              break;
            }
          }
        }

        return {
          likes,
          success: true,
          scrapedAt: new Date(),
        };
      },
      'x',
      postId
    );
    
    return result;
  } catch (error) {
    // Handle errors and return failure status after all retries exhausted
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      likes: 0,
      success: false,
      error: `Failed to scrape X post after ${MAX_RETRY_ATTEMPTS} attempts: ${errorMessage}`,
      scrapedAt: new Date(),
    };
  }
}

/**
 * Scrape engagement metrics from an X (Twitter) post with rate limiting
 * 
 * @param postId - The X post ID to scrape
 * @returns ScrapedMetrics object with likes count and success status
 */
export async function scrapeXPost(postId: string): Promise<ScrapedMetrics> {
  return xLimiter.schedule(() => scrapeXPostInternal(postId));
}

/**
 * Internal function to scrape LinkedIn post without rate limiting
 * 
 * @param postId - The LinkedIn post ID to scrape
 * @returns ScrapedMetrics object with likes count and success status
 */
async function scrapeLinkedInPostInternal(postId: string): Promise<ScrapedMetrics> {
  try {
    // Wrap the scraping logic with retry mechanism
    const result = await retryWithBackoff(
      async () => {
        // Construct the URL for the LinkedIn post
        const url = `https://www.linkedin.com/feed/update/urn:li:activity:${postId}`;
        
        // Fetch the HTML content
        const response = await axios.get(url, {
          timeout: REQUEST_TIMEOUT,
          headers: {
            'User-Agent': USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
        });

        // Parse HTML with Cheerio
        const $ = cheerio.load(response.data);
        
        // Try to extract likes count from various possible selectors
        // Note: LinkedIn's HTML structure may change, so we try multiple approaches
        let likes = 0;
        
        // Look for like count in common patterns
        const likeSelectors = [
          '.social-details-social-counts__reactions-count',
          '[data-test-id="social-actions__reaction-count"]',
          '.reactions-count',
        ];
        
        for (const selector of likeSelectors) {
          const element = $(selector).first();
          if (element.length > 0) {
            const text = element.text().trim();
            // LinkedIn may use formats like "123" or "1,234" or "1.2K"
            const cleanText = text.replace(/,/g, '');
            
            // Handle "K" notation (e.g., "1.2K" = 1200)
            if (cleanText.includes('K')) {
              const match = cleanText.match(/([\d.]+)K/i);
              if (match) {
                likes = Math.round(parseFloat(match[1]) * 1000);
                break;
              }
            } else {
              const match = cleanText.match(/(\d+)/);
              if (match) {
                likes = parseInt(match[1], 10);
                break;
              }
            }
          }
        }

        return {
          likes,
          success: true,
          scrapedAt: new Date(),
        };
      },
      'linkedin',
      postId
    );
    
    return result;
  } catch (error) {
    // Handle errors and return failure status after all retries exhausted
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      likes: 0,
      success: false,
      error: `Failed to scrape LinkedIn post after ${MAX_RETRY_ATTEMPTS} attempts: ${errorMessage}`,
      scrapedAt: new Date(),
    };
  }
}

/**
 * Scrape engagement metrics from a LinkedIn post with rate limiting
 * 
 * @param postId - The LinkedIn post ID to scrape
 * @returns ScrapedMetrics object with likes count and success status
 */
export async function scrapeLinkedInPost(postId: string): Promise<ScrapedMetrics> {
  return linkedInLimiter.schedule(() => scrapeLinkedInPostInternal(postId));
}
