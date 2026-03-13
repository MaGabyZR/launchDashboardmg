/**
 * Scraping Service
 * 
 * Fetches public engagement metrics from X (Twitter) and LinkedIn posts
 * using Cheerio for lightweight HTML parsing.
 * 
 * Validates: Requirements 2.1, 2.2, 2.3, 2.5, 2.6, 10.1, 10.2, 10.5
 */

import axios, { AxiosError } from 'axios';
import * as cheerio from 'cheerio';
import Bottleneck from 'bottleneck';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { ScrapedMetrics } from '../types/index.js';

/**
 * Error types for scraping operations
 */
enum ScraperErrorType {
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  PARSING_ERROR = 'PARSING_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Structured error log entry
 */
interface ScraperErrorLog {
  timestamp: string;
  level: 'ERROR' | 'WARN';
  service: 'scraper';
  operation: string;
  errorType: ScraperErrorType;
  error: {
    message: string;
    code?: string;
    statusCode?: number;
  };
  context: {
    platform: string;
    postId: string;
    attempt?: number;
    maxAttempts?: number;
  };
}

/**
 * Log structured error with context
 * 
 * @param errorLog - Structured error log entry
 */
function logError(errorLog: ScraperErrorLog): void {
  const logMessage = JSON.stringify(errorLog, null, 2);
  
  if (errorLog.level === 'ERROR') {
    console.error(`[Scraper Error] ${logMessage}`);
  } else {
    console.warn(`[Scraper Warning] ${logMessage}`);
  }
}

/**
 * Classify error type from axios error or generic error
 * 
 * @param error - Error object from axios or other source
 * @returns Classified error type
 */
function classifyError(error: unknown): ScraperErrorType {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    
    // Check for rate limit (429)
    if (axiosError.response?.status === 429) {
      return ScraperErrorType.RATE_LIMIT;
    }
    
    // Check for network timeout
    if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
      return ScraperErrorType.NETWORK_TIMEOUT;
    }
    
    // Other network errors
    if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND') {
      return ScraperErrorType.NETWORK_ERROR;
    }
  }
  
  // Check for parsing errors
  if (error instanceof Error && error.message.includes('parse')) {
    return ScraperErrorType.PARSING_ERROR;
  }
  
  return ScraperErrorType.UNKNOWN_ERROR;
}

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
 * Puppeteer fallback for JavaScript-rendered content
 * 
 * Uses Puppeteer in lightweight mode to render JavaScript-heavy pages
 * when Cheerio fails to extract metrics. Configured with 10-second timeout.
 * 
 * @param url - The URL to scrape with Puppeteer
 * @param selectors - Array of CSS selectors to try for extracting likes
 * @returns Likes count or 0 if extraction fails
 */
async function scrapeWithPuppeteer(url: string, selectors: string[]): Promise<number> {
  let browser;
  
  try {
    // Launch Puppeteer in lightweight mode
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
    
    const page = await browser.newPage();
    
    // Set user agent to mimic real browser
    await page.setUserAgent(USER_AGENT);
    
    // Navigate to URL with 10-second timeout
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: REQUEST_TIMEOUT,
    });
    
    // Try each selector to extract likes count
    for (const selector of selectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await page.evaluate(el => el.textContent, element);
          if (text) {
            const match = text.trim().match(/(\d+)/);
            if (match) {
              const likes = parseInt(match[1], 10);
              console.log(`[Scraper] Puppeteer successfully extracted ${likes} likes from ${url}`);
              return likes;
            }
          }
        }
      } catch (selectorError) {
        // Continue to next selector if this one fails
        continue;
      }
    }
    
    console.log(`[Scraper] Puppeteer could not extract likes from ${url} using provided selectors`);
    return 0;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Scraper] Puppeteer fallback failed for ${url}: ${errorMessage}`);
    return 0;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
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
      const attemptNumber = attempt + 1;
      const errorType = classifyError(error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log structured error with context
      const errorLog: ScraperErrorLog = {
        timestamp: new Date().toISOString(),
        level: 'WARN',
        service: 'scraper',
        operation: 'retry_attempt',
        errorType,
        error: {
          message: errorMessage,
          code: axios.isAxiosError(error) ? error.code : undefined,
          statusCode: axios.isAxiosError(error) ? error.response?.status : undefined,
        },
        context: {
          platform,
          postId,
          attempt: attemptNumber,
          maxAttempts: MAX_RETRY_ATTEMPTS,
        },
      };
      
      logError(errorLog);
      
      // Log retry attempt
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
  
  // All retries exhausted, log final error
  const errorType = classifyError(lastError);
  const errorMessage = lastError instanceof Error ? lastError.message : 'Unknown error occurred';
  
  const finalErrorLog: ScraperErrorLog = {
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    service: 'scraper',
    operation: 'scrape_failed_all_retries',
    errorType,
    error: {
      message: errorMessage,
      code: axios.isAxiosError(lastError) ? lastError.code : undefined,
      statusCode: axios.isAxiosError(lastError) ? lastError.response?.status : undefined,
    },
    context: {
      platform,
      postId,
      attempt: MAX_RETRY_ATTEMPTS,
      maxAttempts: MAX_RETRY_ATTEMPTS,
    },
  };
  
  logError(finalErrorLog);
  
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
        
        let response;
        try {
          // Fetch the HTML content
          response = await axios.get(url, {
            timeout: REQUEST_TIMEOUT,
            headers: {
              'User-Agent': USER_AGENT,
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
            },
          });
        } catch (fetchError) {
          // Log network/timeout errors with context
          const errorType = classifyError(fetchError);
          const errorLog: ScraperErrorLog = {
            timestamp: new Date().toISOString(),
            level: 'WARN',
            service: 'scraper',
            operation: 'fetch_html',
            errorType,
            error: {
              message: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error',
              code: axios.isAxiosError(fetchError) ? fetchError.code : undefined,
              statusCode: axios.isAxiosError(fetchError) ? fetchError.response?.status : undefined,
            },
            context: {
              platform: 'x',
              postId,
            },
          };
          logError(errorLog);
          throw fetchError;
        }

        // Parse HTML with Cheerio
        let $;
        try {
          $ = cheerio.load(response.data);
        } catch (parseError) {
          // Log parsing errors with context
          const errorLog: ScraperErrorLog = {
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            service: 'scraper',
            operation: 'parse_html',
            errorType: ScraperErrorType.PARSING_ERROR,
            error: {
              message: parseError instanceof Error ? parseError.message : 'HTML parsing failed',
            },
            context: {
              platform: 'x',
              postId,
            },
          };
          logError(errorLog);
          throw parseError;
        }
        
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

        // Fallback to Puppeteer if Cheerio parsing failed (0 likes)
        if (likes === 0) {
          console.log(`[Scraper] Cheerio failed to extract likes for X post ${postId}, trying Puppeteer fallback`);
          likes = await scrapeWithPuppeteer(url, likeSelectors);
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
    const errorType = classifyError(error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Log final failure with full context
    const errorLog: ScraperErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      service: 'scraper',
      operation: 'scrape_x_post',
      errorType,
      error: {
        message: errorMessage,
        code: axios.isAxiosError(error) ? error.code : undefined,
        statusCode: axios.isAxiosError(error) ? error.response?.status : undefined,
      },
      context: {
        platform: 'x',
        postId,
      },
    };
    logError(errorLog);
    
    // Return detailed error message based on error type
    let userFriendlyError = `Failed to scrape X post after ${MAX_RETRY_ATTEMPTS} attempts: ${errorMessage}`;
    
    if (errorType === ScraperErrorType.RATE_LIMIT) {
      userFriendlyError = `Rate limit exceeded (429) for X post ${postId}. Please try again later or enter data manually.`;
    } else if (errorType === ScraperErrorType.NETWORK_TIMEOUT) {
      userFriendlyError = `Network timeout while scraping X post ${postId}. Please check your connection or enter data manually.`;
    } else if (errorType === ScraperErrorType.PARSING_ERROR) {
      userFriendlyError = `Failed to parse X post ${postId}. The page structure may have changed. Please enter data manually.`;
    }
    
    return {
      likes: 0,
      success: false,
      error: userFriendlyError,
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

        // Fallback to Puppeteer if Cheerio parsing failed (0 likes)
        if (likes === 0) {
          console.log(`[Scraper] Cheerio failed to extract likes for LinkedIn post ${postId}, trying Puppeteer fallback`);
          likes = await scrapeWithPuppeteer(url, likeSelectors);
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
    const errorType = classifyError(error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Log final failure with full context
    const errorLog: ScraperErrorLog = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      service: 'scraper',
      operation: 'scrape_linkedin_post',
      errorType,
      error: {
        message: errorMessage,
        code: axios.isAxiosError(error) ? error.code : undefined,
        statusCode: axios.isAxiosError(error) ? error.response?.status : undefined,
      },
      context: {
        platform: 'linkedin',
        postId,
      },
    };
    logError(errorLog);
    
    // Return detailed error message based on error type
    let userFriendlyError = `Failed to scrape LinkedIn post after ${MAX_RETRY_ATTEMPTS} attempts: ${errorMessage}`;
    
    if (errorType === ScraperErrorType.RATE_LIMIT) {
      userFriendlyError = `Rate limit exceeded (429) for LinkedIn post ${postId}. Please try again later or enter data manually.`;
    } else if (errorType === ScraperErrorType.NETWORK_TIMEOUT) {
      userFriendlyError = `Network timeout while scraping LinkedIn post ${postId}. Please check your connection or enter data manually.`;
    } else if (errorType === ScraperErrorType.PARSING_ERROR) {
      userFriendlyError = `Failed to parse LinkedIn post ${postId}. The page structure may have changed. Please enter data manually.`;
    }
    
    return {
      likes: 0,
      success: false,
      error: userFriendlyError,
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
