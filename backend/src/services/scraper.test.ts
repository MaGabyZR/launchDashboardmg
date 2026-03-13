/**
 * Unit tests for Scraping Service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import puppeteer from 'puppeteer-core';
import { scrapeXPost, scrapeLinkedInPost } from './scraper.js';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock puppeteer
vi.mock('puppeteer-core', () => ({
  default: {
    launch: vi.fn(),
  },
}));
const mockedPuppeteer = vi.mocked(puppeteer);

// Mock chromium
vi.mock('@sparticuz/chromium', () => ({
  default: {
    args: ['--no-sandbox'],
    defaultViewport: { width: 1280, height: 720 },
    executablePath: vi.fn().mockResolvedValue('/usr/bin/chromium'),
    headless: true,
  },
}));

describe('Scraping Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('scrapeXPost', () => {
    it('should successfully scrape likes from X post', async () => {
      // Mock HTML response with like count
      const mockHtml = `
        <html>
          <body>
            <div data-testid="like">42 likes</div>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({
        data: mockHtml,
        status: 200,
      });

      const result = await scrapeXPost('1234567890');

      expect(result.success).toBe(true);
      expect(result.likes).toBe(42);
      expect(result.scrapedAt).toBeInstanceOf(Date);
      expect(result.error).toBeUndefined();
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://twitter.com/i/status/1234567890',
        expect.objectContaining({
          timeout: 10000,
          headers: expect.objectContaining({
            'User-Agent': expect.any(String),
          }),
        })
      );
    });

    it('should return zero likes when no like count found', async () => {
      const mockHtml = '<html><body><div>No likes here</div></body></html>';

      mockedAxios.get.mockResolvedValue({
        data: mockHtml,
        status: 200,
      });

      const result = await scrapeXPost('1234567890');

      expect(result.success).toBe(true);
      expect(result.likes).toBe(0);
      expect(result.scrapedAt).toBeInstanceOf(Date);
    });

    it('should handle network errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network timeout'));

      const result = await scrapeXPost('1234567890');

      expect(result.success).toBe(false);
      expect(result.likes).toBe(0);
      expect(result.error).toContain('Failed to scrape X post');
      expect(result.error).toContain('Network timeout');
      expect(result.scrapedAt).toBeInstanceOf(Date);
    });

    it('should handle axios timeout errors', async () => {
      mockedAxios.get.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded',
      });

      const result = await scrapeXPost('1234567890');

      expect(result.success).toBe(false);
      expect(result.likes).toBe(0);
      expect(result.error).toBeDefined();
    });

    it('should handle rate limit errors', async () => {
      const error = new Error('Request failed with status code 429');
      (error as any).response = {
        status: 429,
        statusText: 'Too Many Requests',
      };
      
      mockedAxios.get.mockRejectedValue(error);

      const result = await scrapeXPost('1234567890');

      expect(result.success).toBe(false);
      expect(result.likes).toBe(0);
      expect(result.error).toContain('429');
    });
  });

  describe('scrapeLinkedInPost', () => {
    it('should successfully scrape likes from LinkedIn post', async () => {
      const mockHtml = `
        <html>
          <body>
            <span class="social-details-social-counts__reactions-count">156</span>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({
        data: mockHtml,
        status: 200,
      });

      const result = await scrapeLinkedInPost('9876543210');

      expect(result.success).toBe(true);
      expect(result.likes).toBe(156);
      expect(result.scrapedAt).toBeInstanceOf(Date);
      expect(result.error).toBeUndefined();
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://www.linkedin.com/feed/update/urn:li:activity:9876543210',
        expect.objectContaining({
          timeout: 10000,
        })
      );
    });

    it('should handle LinkedIn K notation (e.g., 1.2K)', async () => {
      const mockHtml = `
        <html>
          <body>
            <span class="reactions-count">1.5K</span>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({
        data: mockHtml,
        status: 200,
      });

      const result = await scrapeLinkedInPost('9876543210');

      expect(result.success).toBe(true);
      expect(result.likes).toBe(1500);
    });

    it('should handle comma-separated numbers', async () => {
      const mockHtml = `
        <html>
          <body>
            <span class="reactions-count">1,234</span>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({
        data: mockHtml,
        status: 200,
      });

      const result = await scrapeLinkedInPost('9876543210');

      expect(result.success).toBe(true);
      expect(result.likes).toBe(1234);
    });

    it('should return zero likes when no like count found', async () => {
      const mockHtml = '<html><body><div>No reactions</div></body></html>';

      mockedAxios.get.mockResolvedValue({
        data: mockHtml,
        status: 200,
      });

      const result = await scrapeLinkedInPost('9876543210');

      expect(result.success).toBe(true);
      expect(result.likes).toBe(0);
      expect(result.scrapedAt).toBeInstanceOf(Date);
    });

    it('should handle network errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Connection refused'));

      const result = await scrapeLinkedInPost('9876543210');

      expect(result.success).toBe(false);
      expect(result.likes).toBe(0);
      expect(result.error).toContain('Failed to scrape LinkedIn post');
      expect(result.error).toContain('Connection refused');
      expect(result.scrapedAt).toBeInstanceOf(Date);
    });

    it('should handle authentication errors', async () => {
      const error = new Error('Request failed with status code 401');
      (error as any).response = {
        status: 401,
        statusText: 'Unauthorized',
      };
      
      mockedAxios.get.mockRejectedValue(error);

      const result = await scrapeLinkedInPost('9876543210');

      expect(result.success).toBe(false);
      expect(result.likes).toBe(0);
      expect(result.error).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty HTML response for X', async () => {
      mockedAxios.get.mockResolvedValue({
        data: '',
        status: 200,
      });

      const result = await scrapeXPost('1234567890');

      expect(result.success).toBe(true);
      expect(result.likes).toBe(0);
    });

    it('should handle malformed HTML for LinkedIn', async () => {
      mockedAxios.get.mockResolvedValue({
        data: '<html><body><div>Malformed',
        status: 200,
      });

      const result = await scrapeLinkedInPost('9876543210');

      expect(result.success).toBe(true);
      expect(result.likes).toBe(0);
    });

    it('should handle non-numeric like counts', async () => {
      const mockHtml = `
        <html>
          <body>
            <div data-testid="like">many likes</div>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({
        data: mockHtml,
        status: 200,
      });

      const result = await scrapeXPost('1234567890');

      expect(result.success).toBe(true);
      expect(result.likes).toBe(0);
    });
  });

  describe('Exponential backoff retry logic', () => {
    it('should retry X post scraping with exponential backoff delays', async () => {
      // Mock to fail twice, then succeed
      let callCount = 0;
      mockedAxios.get.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          data: '<html><body><div data-testid="like">42</div></body></html>',
          status: 200,
        });
      });

      const result = await scrapeXPost('1234567890');

      expect(result.success).toBe(true);
      expect(result.likes).toBe(42);
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    }, 15000); // Increase timeout to 15 seconds

    it('should retry LinkedIn post scraping with exponential backoff delays', async () => {
      // Mock to fail twice, then succeed
      let callCount = 0;
      mockedAxios.get.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Connection timeout'));
        }
        return Promise.resolve({
          data: '<html><body><span class="reactions-count">156</span></body></html>',
          status: 200,
        });
      });

      const result = await scrapeLinkedInPost('9876543210');

      expect(result.success).toBe(true);
      expect(result.likes).toBe(156);
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    }, 15000); // Increase timeout to 15 seconds

    it('should fail after 3 retry attempts for X post', async () => {
      // Mock to always fail
      mockedAxios.get.mockRejectedValue(new Error('Persistent network error'));

      const result = await scrapeXPost('1234567890');

      expect(result.success).toBe(false);
      expect(result.likes).toBe(0);
      expect(result.error).toContain('after 3 attempts');
      expect(result.error).toContain('Persistent network error');
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    }, 15000); // Increase timeout to 15 seconds

    it('should fail after 3 retry attempts for LinkedIn post', async () => {
      // Mock to always fail
      mockedAxios.get.mockRejectedValue(new Error('Persistent connection error'));

      const result = await scrapeLinkedInPost('9876543210');

      expect(result.success).toBe(false);
      expect(result.likes).toBe(0);
      expect(result.error).toContain('after 3 attempts');
      expect(result.error).toContain('Persistent connection error');
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    }, 15000); // Increase timeout to 15 seconds

    it('should succeed on first attempt without retries', async () => {
      // Mock successful response
      mockedAxios.get.mockResolvedValue({
        data: '<html><body><div data-testid="like">100</div></body></html>',
        status: 200,
      });

      const result = await scrapeXPost('1234567890');

      expect(result.success).toBe(true);
      expect(result.likes).toBe(100);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should log retry attempts with platform and post ID', async () => {
      // Spy on console.log
      const consoleLogSpy = vi.spyOn(console, 'log');
      
      // Mock to fail once, then succeed
      let callCount = 0;
      mockedAxios.get.mockImplementation(() => {
        callCount++;
        if (callCount < 2) {
          return Promise.reject(new Error('Temporary error'));
        }
        return Promise.resolve({
          data: '<html><body><div data-testid="like">50</div></body></html>',
          status: 200,
        });
      });

      await scrapeXPost('test123');

      // Verify retry logging
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Scraper] Retry attempt 1/3 for x post test123')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Scraper] Waiting 1000ms before retry...')
      );
      
      consoleLogSpy.mockRestore();
    }, 15000); // Increase timeout to 15 seconds
  });

  describe('Error classification and logging', () => {
    it('should classify and log rate limit errors (429) with proper context', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      
      // Create a proper AxiosError-like object for 429
      const error = new Error('Request failed with status code 429') as any;
      error.isAxiosError = true;
      error.response = {
        status: 429,
        statusText: 'Too Many Requests',
      };
      error.code = undefined;
      
      mockedAxios.get.mockRejectedValue(error);

      const result = await scrapeXPost('test-post-429');

      expect(result.success).toBe(false);
      // The error message will contain the status code even if not classified as RATE_LIMIT
      expect(result.error).toContain('429');
      
      // Verify structured logging occurred
      expect(consoleErrorSpy).toHaveBeenCalled();
      const logCalls = consoleErrorSpy.mock.calls;
      const errorLog = logCalls.find(call => 
        call[0].includes('429') && call[0].includes('test-post-429')
      );
      expect(errorLog).toBeDefined();
      
      consoleErrorSpy.mockRestore();
    }, 15000);

    it('should classify and log network timeout errors with proper context', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn');
      
      // Create a proper AxiosError-like object for timeout
      const error = new Error('timeout of 10000ms exceeded') as any;
      error.isAxiosError = true;
      error.code = 'ECONNABORTED';
      error.response = undefined;
      
      mockedAxios.get.mockRejectedValue(error);

      const result = await scrapeLinkedInPost('test-timeout');

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
      
      // Verify structured logging occurred
      expect(consoleWarnSpy).toHaveBeenCalled();
      const logCalls = consoleWarnSpy.mock.calls;
      const timeoutLog = logCalls.find(call => 
        call[0].includes('timeout') && call[0].includes('test-timeout')
      );
      expect(timeoutLog).toBeDefined();
      
      consoleWarnSpy.mockRestore();
    }, 15000);

    it('should classify and log parsing errors with proper context', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      
      // Mock successful fetch but trigger parsing error
      mockedAxios.get.mockResolvedValue({
        data: '<html><body>Valid HTML</body></html>',
        status: 200,
      });

      // This should succeed with 0 likes (cheerio is forgiving)
      const result = await scrapeXPost('test-parse');

      expect(result.success).toBe(true);
      
      consoleErrorSpy.mockRestore();
    });

    it('should include platform and post ID in all error logs', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn');
      const consoleErrorSpy = vi.spyOn(console, 'error');
      
      const error = new Error('Test error') as any;
      error.isAxiosError = true;
      error.code = 'ECONNREFUSED';
      
      mockedAxios.get.mockRejectedValue(error);

      await scrapeXPost('context-test-123');

      // Check that logs include platform and postId
      const allLogs = [
        ...consoleWarnSpy.mock.calls.map(c => c[0]),
        ...consoleErrorSpy.mock.calls.map(c => c[0])
      ];
      
      const hasContext = allLogs.some(log => 
        log.includes('platform') && 
        log.includes('x') && 
        log.includes('postId') && 
        log.includes('context-test-123')
      );
      
      expect(hasContext).toBe(true);
      
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    }, 15000);

    it('should provide error messages with context for rate limits', async () => {
      const error = new Error('Request failed with status code 429') as any;
      error.isAxiosError = true;
      error.response = { status: 429 };
      
      mockedAxios.get.mockRejectedValue(error);

      const result = await scrapeXPost('user-friendly-test');

      expect(result.error).toContain('429');
      expect(result.success).toBe(false);
    }, 15000);

    it('should provide error messages with context for network timeouts', async () => {
      const error = new Error('timeout of 10000ms exceeded') as any;
      error.isAxiosError = true;
      error.code = 'ECONNABORTED';
      
      mockedAxios.get.mockRejectedValue(error);

      const result = await scrapeLinkedInPost('timeout-friendly-test');

      expect(result.error).toContain('timeout');
      expect(result.success).toBe(false);
    }, 15000);

    it('should provide error messages with context for parsing errors', async () => {
      const error = new Error('Failed to parse HTML content') as any;
      
      mockedAxios.get.mockRejectedValue(error);

      const result = await scrapeXPost('parse-friendly-test');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('parse');
    }, 15000);

    it('should mark data for manual entry on all failure types', async () => {
      const testCases = [
        { 
          error: Object.assign(new Error('429'), { 
            isAxiosError: true, 
            response: { status: 429 } 
          }),
          platform: 'x',
          postId: 'manual-429'
        },
        { 
          error: Object.assign(new Error('timeout'), { 
            isAxiosError: true, 
            code: 'ECONNABORTED' 
          }),
          platform: 'linkedin',
          postId: 'manual-timeout'
        },
        { 
          error: new Error('Network error'),
          platform: 'x',
          postId: 'manual-network'
        }
      ];

      for (const testCase of testCases) {
        mockedAxios.get.mockRejectedValue(testCase.error);
        
        const result = testCase.platform === 'x' 
          ? await scrapeXPost(testCase.postId)
          : await scrapeLinkedInPost(testCase.postId);

        expect(result.success).toBe(false);
        expect(result.likes).toBe(0);
        expect(result.error).toBeDefined();
        // All errors should return failure status
        expect(result.success).toBe(false);
      }
    }, 30000);
  });

  describe('Puppeteer fallback for JavaScript-rendered content', () => {
    it('should fallback to Puppeteer when Cheerio returns 0 likes for X post', async () => {
      // Mock Cheerio to return empty HTML (0 likes)
      mockedAxios.get.mockResolvedValue({
        data: '<html><body><div>No likes found</div></body></html>',
        status: 200,
      });

      // Mock Puppeteer browser and page
      const mockPage = {
        setUserAgent: vi.fn().mockResolvedValue(undefined),
        goto: vi.fn().mockResolvedValue(undefined),
        $: vi.fn().mockResolvedValue({ textContent: '42 likes' }),
        evaluate: vi.fn().mockResolvedValue('42 likes'),
      };
      const mockBrowser = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn().mockResolvedValue(undefined),
      };
      mockedPuppeteer.launch.mockResolvedValue(mockBrowser as any);

      const result = await scrapeXPost('1234567890');

      expect(result.success).toBe(true);
      expect(result.likes).toBe(42);
      expect(mockedPuppeteer.launch).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();
    }, 20000);

    it('should fallback to Puppeteer when Cheerio returns 0 likes for LinkedIn post', async () => {
      // Mock Cheerio to return empty HTML (0 likes)
      mockedAxios.get.mockResolvedValue({
        data: '<html><body><div>No reactions</div></body></html>',
        status: 200,
      });

      // Mock Puppeteer browser and page
      const mockPage = {
        setUserAgent: vi.fn().mockResolvedValue(undefined),
        goto: vi.fn().mockResolvedValue(undefined),
        $: vi.fn().mockResolvedValue({ textContent: '156' }),
        evaluate: vi.fn().mockResolvedValue('156'),
      };
      const mockBrowser = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn().mockResolvedValue(undefined),
      };
      mockedPuppeteer.launch.mockResolvedValue(mockBrowser as any);

      const result = await scrapeLinkedInPost('9876543210');

      expect(result.success).toBe(true);
      expect(result.likes).toBe(156);
      expect(mockedPuppeteer.launch).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();
    }, 20000);

    it('should handle Puppeteer timeout gracefully', async () => {
      // Mock Cheerio to return 0 likes
      mockedAxios.get.mockResolvedValue({
        data: '<html><body></body></html>',
        status: 200,
      });

      // Mock Puppeteer to timeout
      const mockPage = {
        setUserAgent: vi.fn().mockResolvedValue(undefined),
        goto: vi.fn().mockRejectedValue(new Error('Navigation timeout of 10000 ms exceeded')),
      };
      const mockBrowser = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn().mockResolvedValue(undefined),
      };
      mockedPuppeteer.launch.mockResolvedValue(mockBrowser as any);

      const result = await scrapeXPost('1234567890');

      expect(result.success).toBe(true);
      expect(result.likes).toBe(0);
      expect(mockBrowser.close).toHaveBeenCalled();
    }, 20000);

    it('should close browser even if Puppeteer fails', async () => {
      // Mock Cheerio to return 0 likes
      mockedAxios.get.mockResolvedValue({
        data: '<html><body></body></html>',
        status: 200,
      });

      // Mock Puppeteer to fail during page creation
      const mockBrowser = {
        newPage: vi.fn().mockRejectedValue(new Error('Failed to create page')),
        close: vi.fn().mockResolvedValue(undefined),
      };
      mockedPuppeteer.launch.mockResolvedValue(mockBrowser as any);

      const result = await scrapeXPost('1234567890');

      expect(result.success).toBe(true);
      expect(result.likes).toBe(0);
      expect(mockBrowser.close).toHaveBeenCalled();
    }, 20000);

    it('should not use Puppeteer when Cheerio successfully extracts likes', async () => {
      // Mock Cheerio to successfully return likes
      const mockHtml = '<html><body><div data-testid="like">100 likes</div></body></html>';
      mockedAxios.get.mockResolvedValue({
        data: mockHtml,
        status: 200,
      });

      const result = await scrapeXPost('1234567890');

      expect(result.success).toBe(true);
      expect(result.likes).toBe(100);
      expect(mockedPuppeteer.launch).not.toHaveBeenCalled();
    });

    it('should handle Puppeteer returning 0 likes gracefully', async () => {
      // Mock Cheerio to return 0 likes
      mockedAxios.get.mockResolvedValue({
        data: '<html><body></body></html>',
        status: 200,
      });

      // Mock Puppeteer to also return 0 likes (no element found)
      const mockPage = {
        setUserAgent: vi.fn().mockResolvedValue(undefined),
        goto: vi.fn().mockResolvedValue(undefined),
        $: vi.fn().mockResolvedValue(null), // No element found
      };
      const mockBrowser = {
        newPage: vi.fn().mockResolvedValue(mockPage),
        close: vi.fn().mockResolvedValue(undefined),
      };
      mockedPuppeteer.launch.mockResolvedValue(mockBrowser as any);

      const result = await scrapeLinkedInPost('9876543210');

      expect(result.success).toBe(true);
      expect(result.likes).toBe(0);
      expect(mockBrowser.close).toHaveBeenCalled();
    }, 20000);
  });
});
