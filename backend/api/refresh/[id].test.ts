import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import handler from './[id].js';
import { prisma } from '../../src/lib/db.js';
import * as scraperModule from '../../src/services/scraper.js';

// Mock the database
vi.mock('../../src/lib/db.js', () => ({
  prisma: {
    company: {
      findUnique: vi.fn(),
    },
    launchPost: {
      update: vi.fn(),
    },
  },
}));

// Mock the scraper service
vi.mock('../../src/services/scraper.js', () => ({
  scrapeXPost: vi.fn(),
  scrapeLinkedInPost: vi.fn(),
}));

describe('POST /api/refresh/:id', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: any;
  let statusMock: any;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {
      method: 'POST',
      query: { id: 'company1' },
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    vi.clearAllMocks();
  });

  it('should return 405 for non-POST requests', async () => {
    mockRequest.method = 'GET';

    await handler(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(405);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  it('should return 400 when company ID is missing', async () => {
    mockRequest.query = {};

    await handler(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ 
      error: 'Invalid request: company ID is required' 
    });
  });

  it('should return 400 when company ID is not a string', async () => {
    mockRequest.query = { id: ['company1', 'company2'] };

    await handler(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ 
      error: 'Invalid request: company ID is required' 
    });
  });

  it('should return 404 when company does not exist', async () => {
    (prisma.company.findUnique as any).mockResolvedValue(null);

    await handler(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Company not found' });
  });

  it('should return success with 0 updated when company has no launch posts', async () => {
    (prisma.company.findUnique as any).mockResolvedValue({
      id: 'company1',
      name: 'Test Company',
      launchPosts: [],
    });

    await handler(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      updated: 0,
      failed: 0,
      errors: [],
    });
  });

  it('should successfully update X post metrics', async () => {
    const mockPost = {
      id: 'post1',
      companyId: 'company1',
      platform: 'X',
      url: 'https://x.com/test/status/123',
      postId: '123',
      likes: 50,
      dataSource: 'SCRAPED',
      lastScraped: null,
      scrapeFailed: false,
      scrapeError: null,
    };

    (prisma.company.findUnique as any).mockResolvedValue({
      id: 'company1',
      name: 'Test Company',
      launchPosts: [mockPost],
    });

    const scrapedMetrics = {
      likes: 150,
      success: true,
      scrapedAt: new Date('2024-01-15'),
    };

    (scraperModule.scrapeXPost as any).mockResolvedValue(scrapedMetrics);

    await handler(mockRequest as Request, mockResponse as Response);

    expect(scraperModule.scrapeXPost).toHaveBeenCalledWith('123');
    expect(prisma.launchPost.update).toHaveBeenCalledWith({
      where: { id: 'post1' },
      data: {
        likes: 150,
        lastScraped: scrapedMetrics.scrapedAt,
        scrapeFailed: false,
        scrapeError: null,
      },
    });

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      updated: 1,
      failed: 0,
      errors: [],
    });
  });

  it('should successfully update LinkedIn post metrics', async () => {
    const mockPost = {
      id: 'post1',
      companyId: 'company1',
      platform: 'LINKEDIN',
      url: 'https://linkedin.com/feed/update/urn:li:activity:123',
      postId: '123',
      likes: 30,
      dataSource: 'SCRAPED',
      lastScraped: null,
      scrapeFailed: false,
      scrapeError: null,
    };

    (prisma.company.findUnique as any).mockResolvedValue({
      id: 'company1',
      name: 'Test Company',
      launchPosts: [mockPost],
    });

    const scrapedMetrics = {
      likes: 200,
      success: true,
      scrapedAt: new Date('2024-01-15'),
    };

    (scraperModule.scrapeLinkedInPost as any).mockResolvedValue(scrapedMetrics);

    await handler(mockRequest as Request, mockResponse as Response);

    expect(scraperModule.scrapeLinkedInPost).toHaveBeenCalledWith('123');
    expect(prisma.launchPost.update).toHaveBeenCalledWith({
      where: { id: 'post1' },
      data: {
        likes: 200,
        lastScraped: scrapedMetrics.scrapedAt,
        scrapeFailed: false,
        scrapeError: null,
      },
    });

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      updated: 1,
      failed: 0,
      errors: [],
    });
  });

  it('should handle scraping failure and mark record as failed', async () => {
    const mockPost = {
      id: 'post1',
      companyId: 'company1',
      platform: 'X',
      url: 'https://x.com/test/status/123',
      postId: '123',
      likes: 50,
      dataSource: 'SCRAPED',
      lastScraped: null,
      scrapeFailed: false,
      scrapeError: null,
    };

    (prisma.company.findUnique as any).mockResolvedValue({
      id: 'company1',
      name: 'Test Company',
      launchPosts: [mockPost],
    });

    const scrapedMetrics = {
      likes: 0,
      success: false,
      error: 'Rate limit exceeded',
      scrapedAt: new Date('2024-01-15'),
    };

    (scraperModule.scrapeXPost as any).mockResolvedValue(scrapedMetrics);

    await handler(mockRequest as Request, mockResponse as Response);

    expect(prisma.launchPost.update).toHaveBeenCalledWith({
      where: { id: 'post1' },
      data: {
        scrapeFailed: true,
        scrapeError: 'Rate limit exceeded',
        lastScraped: scrapedMetrics.scrapedAt,
      },
    });

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      updated: 0,
      failed: 1,
      errors: ['Rate limit exceeded'],
    });
  });

  it('should handle multiple posts with mixed success/failure', async () => {
    const mockPosts = [
      {
        id: 'post1',
        companyId: 'company1',
        platform: 'X',
        url: 'https://x.com/test/status/123',
        postId: '123',
        likes: 50,
        dataSource: 'SCRAPED',
        lastScraped: null,
        scrapeFailed: false,
        scrapeError: null,
      },
      {
        id: 'post2',
        companyId: 'company1',
        platform: 'LINKEDIN',
        url: 'https://linkedin.com/feed/update/urn:li:activity:456',
        postId: '456',
        likes: 30,
        dataSource: 'SCRAPED',
        lastScraped: null,
        scrapeFailed: false,
        scrapeError: null,
      },
    ];

    (prisma.company.findUnique as any).mockResolvedValue({
      id: 'company1',
      name: 'Test Company',
      launchPosts: mockPosts,
    });

    (scraperModule.scrapeXPost as any).mockResolvedValue({
      likes: 150,
      success: true,
      scrapedAt: new Date('2024-01-15'),
    });

    (scraperModule.scrapeLinkedInPost as any).mockResolvedValue({
      likes: 0,
      success: false,
      error: 'Network timeout',
      scrapedAt: new Date('2024-01-15'),
    });

    await handler(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      updated: 1,
      failed: 1,
      errors: ['Network timeout'],
    });
  });

  it('should handle exception during scraping and continue processing', async () => {
    const mockPosts = [
      {
        id: 'post1',
        companyId: 'company1',
        platform: 'X',
        url: 'https://x.com/test/status/123',
        postId: '123',
        likes: 50,
        dataSource: 'SCRAPED',
        lastScraped: null,
        scrapeFailed: false,
        scrapeError: null,
      },
      {
        id: 'post2',
        companyId: 'company1',
        platform: 'LINKEDIN',
        url: 'https://linkedin.com/feed/update/urn:li:activity:456',
        postId: '456',
        likes: 30,
        dataSource: 'SCRAPED',
        lastScraped: null,
        scrapeFailed: false,
        scrapeError: null,
      },
    ];

    (prisma.company.findUnique as any).mockResolvedValue({
      id: 'company1',
      name: 'Test Company',
      launchPosts: mockPosts,
    });

    (scraperModule.scrapeXPost as any).mockRejectedValue(new Error('Scraper crashed'));
    (scraperModule.scrapeLinkedInPost as any).mockResolvedValue({
      likes: 200,
      success: true,
      scrapedAt: new Date('2024-01-15'),
    });

    await handler(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    const response = jsonMock.mock.calls[0][0];
    expect(response.success).toBe(true);
    expect(response.updated).toBe(1);
    expect(response.failed).toBe(1);
    expect(response.errors).toContain('Error processing post post1: Scraper crashed');
  });

  it('should handle unknown platform gracefully', async () => {
    const mockPost = {
      id: 'post1',
      companyId: 'company1',
      platform: 'UNKNOWN',
      url: 'https://example.com/post/123',
      postId: '123',
      likes: 50,
      dataSource: 'SCRAPED',
      lastScraped: null,
      scrapeFailed: false,
      scrapeError: null,
    };

    (prisma.company.findUnique as any).mockResolvedValue({
      id: 'company1',
      name: 'Test Company',
      launchPosts: [mockPost],
    });

    await handler(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      updated: 0,
      failed: 1,
      errors: ['Unknown platform for post post1'],
    });
  });

  it('should handle database error during update', async () => {
    const mockPost = {
      id: 'post1',
      companyId: 'company1',
      platform: 'X',
      url: 'https://x.com/test/status/123',
      postId: '123',
      likes: 50,
      dataSource: 'SCRAPED',
      lastScraped: null,
      scrapeFailed: false,
      scrapeError: null,
    };

    (prisma.company.findUnique as any).mockResolvedValue({
      id: 'company1',
      name: 'Test Company',
      launchPosts: [mockPost],
    });

    (scraperModule.scrapeXPost as any).mockResolvedValue({
      likes: 150,
      success: true,
      scrapedAt: new Date('2024-01-15'),
    });

    (prisma.launchPost.update as any).mockRejectedValue(new Error('Database connection failed'));

    await handler(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    const response = jsonMock.mock.calls[0][0];
    expect(response.success).toBe(true);
    expect(response.updated).toBe(0);
    expect(response.failed).toBe(1);
    expect(response.errors).toContain('Error updating post post1: Database connection failed');
  });

  it('should handle database error during company lookup', async () => {
    (prisma.company.findUnique as any).mockRejectedValue(new Error('Database connection failed'));

    await handler(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
