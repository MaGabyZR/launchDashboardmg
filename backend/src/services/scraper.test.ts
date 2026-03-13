/**
 * Unit tests for Scraping Service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { scrapeXPost, scrapeLinkedInPost } from './scraper.js';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

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
});
