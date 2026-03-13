import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { Request, Response } from 'express';
import handler from './index.js';
import { prisma } from '../../src/lib/db.js';
import * as urlParser from '../../src/services/urlParser.js';
import * as scraper from '../../src/services/scraper.js';
import * as ycClient from '../../src/services/ycClient.js';

// Mock the services
vi.mock('../../src/lib/db.js', () => ({
  prisma: {
    company: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    launchPost: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    fundraise: {
      findUnique: vi.fn(),
      create: vi.fn()
    }
  }
}));

vi.mock('../../src/services/urlParser.js');
vi.mock('../../src/services/scraper.js', () => ({
  scrapeXPost: vi.fn().mockResolvedValue({
    likes: 100,
    success: true,
    scrapedAt: new Date()
  }),
  scrapeLinkedInPost: vi.fn().mockResolvedValue({
    likes: 200,
    success: true,
    scrapedAt: new Date()
  })
}));
vi.mock('../../src/services/ycClient.js');

describe('POST /api/launch-posts', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn(() => ({ json: jsonMock }));
    
    req = {
      method: 'POST',
      body: {}
    };
    
    res = {
      status: statusMock as any,
      json: jsonMock
    };

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 405 for non-POST requests', async () => {
    req.method = 'GET';

    await handler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(405);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  it('should return 400 if urls array is missing', async () => {
    req.body = { companyName: 'Test Company' };

    await handler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ 
      error: 'Invalid request: urls array is required' 
    });
  });

  it('should return 400 if urls is not an array', async () => {
    req.body = { urls: 'not-an-array', companyName: 'Test Company' };

    await handler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ 
      error: 'Invalid request: urls array is required' 
    });
  });

  it('should return 400 if urls array is empty', async () => {
    req.body = { urls: [], companyName: 'Test Company' };

    await handler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ 
      error: 'Invalid request: urls array is required' 
    });
  });

  it('should return 400 if companyName is missing', async () => {
    req.body = { urls: ['https://twitter.com/user/status/123'] };

    await handler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ 
      error: 'Invalid request: companyName is required' 
    });
  });

  it('should return 400 if companyName is empty string', async () => {
    req.body = { urls: ['https://twitter.com/user/status/123'], companyName: '   ' };

    await handler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ 
      error: 'Invalid request: companyName is required' 
    });
  });

  it('should create new company if not exists', async () => {
    const mockCompany = { id: 'company-1', name: 'Test Company' };
    
    vi.mocked(prisma.company.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.company.create).mockResolvedValue(mockCompany as any);
    vi.mocked(urlParser.parseURL).mockReturnValue({
      platform: 'x',
      postId: '123456789',
      isValid: true
    });
    vi.mocked(prisma.launchPost.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.launchPost.create).mockResolvedValue({
      id: 'post-1',
      companyId: 'company-1',
      platform: 'X',
      url: 'https://twitter.com/user/status/123456789',
      postId: '123456789',
      likes: 0,
      dataSource: 'SCRAPED',
      lastScraped: new Date(),
      scrapeFailed: false,
      scrapeError: null,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any);
    vi.mocked(ycClient.searchYCCompany).mockResolvedValue(null);

    req.body = {
      urls: ['https://twitter.com/user/status/123456789'],
      companyName: 'Test Company'
    };

    await handler(req as Request, res as Response);

    expect(prisma.company.findFirst).toHaveBeenCalledWith({
      where: {
        name: {
          equals: 'Test Company',
          mode: 'insensitive'
        }
      }
    });
    expect(prisma.company.create).toHaveBeenCalledWith({
      data: {
        name: 'Test Company'
      }
    });
  });

  it('should use existing company if found', async () => {
    const mockCompany = { id: 'company-1', name: 'Test Company' };
    
    vi.mocked(prisma.company.findFirst).mockResolvedValue(mockCompany as any);
    vi.mocked(urlParser.parseURL).mockReturnValue({
      platform: 'x',
      postId: '123456789',
      isValid: true
    });
    vi.mocked(prisma.launchPost.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.launchPost.create).mockResolvedValue({
      id: 'post-1',
      companyId: 'company-1'
    } as any);
    vi.mocked(ycClient.searchYCCompany).mockResolvedValue(null);

    req.body = {
      urls: ['https://twitter.com/user/status/123456789'],
      companyName: 'Test Company'
    };

    await handler(req as Request, res as Response);

    expect(prisma.company.findFirst).toHaveBeenCalled();
    expect(prisma.company.create).not.toHaveBeenCalled();
  });

  it('should validate and parse each URL', async () => {
    const mockCompany = { id: 'company-1', name: 'Test Company' };
    
    vi.mocked(prisma.company.findFirst).mockResolvedValue(mockCompany as any);
    vi.mocked(urlParser.parseURL).mockReturnValue({
      platform: 'x',
      postId: '123456789',
      isValid: true
    });
    vi.mocked(prisma.launchPost.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.launchPost.create).mockResolvedValue({
      id: 'post-1',
      companyId: 'company-1'
    } as any);
    vi.mocked(ycClient.searchYCCompany).mockResolvedValue(null);

    req.body = {
      urls: ['https://twitter.com/user/status/123456789'],
      companyName: 'Test Company'
    };

    await handler(req as Request, res as Response);

    expect(urlParser.parseURL).toHaveBeenCalledWith('https://twitter.com/user/status/123456789');
  });

  it('should return error for invalid URL', async () => {
    const mockCompany = { id: 'company-1', name: 'Test Company' };
    
    vi.mocked(prisma.company.findFirst).mockResolvedValue(mockCompany as any);
    vi.mocked(urlParser.parseURL).mockReturnValue({
      platform: 'x',
      postId: '',
      isValid: false,
      error: 'Invalid URL format'
    });
    vi.mocked(ycClient.searchYCCompany).mockResolvedValue(null);

    req.body = {
      urls: ['invalid-url'],
      companyName: 'Test Company'
    };

    await handler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      results: [{
        url: 'invalid-url',
        status: 'failed',
        error: 'Invalid URL format'
      }]
    });
  });

  it('should store URL metadata in database', async () => {
    const mockCompany = { id: 'company-1', name: 'Test Company' };
    
    vi.mocked(prisma.company.findFirst).mockResolvedValue(mockCompany as any);
    vi.mocked(urlParser.parseURL).mockReturnValue({
      platform: 'x',
      postId: '123456789',
      isValid: true
    });
    vi.mocked(prisma.launchPost.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.launchPost.create).mockResolvedValue({
      id: 'post-1',
      companyId: 'company-1'
    } as any);
    vi.mocked(ycClient.searchYCCompany).mockResolvedValue(null);

    req.body = {
      urls: ['https://twitter.com/user/status/123456789'],
      companyName: 'Test Company'
    };

    await handler(req as Request, res as Response);

    expect(prisma.launchPost.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        companyId: 'company-1',
        platform: 'X',
        url: 'https://twitter.com/user/status/123456789',
        postId: '123456789',
        dataSource: 'SCRAPED'
      })
    });
  });

  it('should handle manual metrics when provided', async () => {
    const mockCompany = { id: 'company-1', name: 'Test Company' };
    
    vi.mocked(prisma.company.findFirst).mockResolvedValue(mockCompany as any);
    vi.mocked(urlParser.parseURL).mockReturnValue({
      platform: 'x',
      postId: '123456789',
      isValid: true
    });
    vi.mocked(prisma.launchPost.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.launchPost.create).mockResolvedValue({
      id: 'post-1',
      companyId: 'company-1'
    } as any);
    vi.mocked(ycClient.searchYCCompany).mockResolvedValue(null);

    req.body = {
      urls: ['https://twitter.com/user/status/123456789'],
      companyName: 'Test Company',
      manualMetrics: [{ platform: 'x', likes: 42 }]
    };

    await handler(req as Request, res as Response);

    expect(prisma.launchPost.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        likes: 42,
        dataSource: 'MANUAL',
        lastScraped: null
      })
    });
  });

  it('should return success for valid URLs', async () => {
    const mockCompany = { id: 'company-1', name: 'Test Company' };
    
    vi.mocked(prisma.company.findFirst).mockResolvedValue(mockCompany as any);
    vi.mocked(urlParser.parseURL).mockReturnValue({
      platform: 'x',
      postId: '123456789',
      isValid: true
    });
    vi.mocked(prisma.launchPost.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.launchPost.create).mockResolvedValue({
      id: 'post-1',
      companyId: 'company-1'
    } as any);
    vi.mocked(ycClient.searchYCCompany).mockResolvedValue(null);

    req.body = {
      urls: ['https://twitter.com/user/status/123456789'],
      companyName: 'Test Company'
    };

    await handler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      results: [{
        url: 'https://twitter.com/user/status/123456789',
        status: 'success',
        companyId: 'company-1'
      }]
    });
  });

  it('should process multiple URLs', async () => {
    const mockCompany = { id: 'company-1', name: 'Test Company' };
    
    vi.mocked(prisma.company.findFirst).mockResolvedValue(mockCompany as any);
    vi.mocked(urlParser.parseURL)
      .mockReturnValueOnce({
        platform: 'x',
        postId: '123',
        isValid: true
      })
      .mockReturnValueOnce({
        platform: 'linkedin',
        postId: '456',
        isValid: true
      });
    vi.mocked(prisma.launchPost.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.launchPost.create)
      .mockResolvedValueOnce({ id: 'post-1', companyId: 'company-1' } as any)
      .mockResolvedValueOnce({ id: 'post-2', companyId: 'company-1' } as any);
    vi.mocked(ycClient.searchYCCompany).mockResolvedValue(null);

    req.body = {
      urls: [
        'https://twitter.com/user/status/123',
        'https://linkedin.com/posts/user_activity-456-abcd'
      ],
      companyName: 'Test Company'
    };

    await handler(req as Request, res as Response);

    expect(urlParser.parseURL).toHaveBeenCalledTimes(2);
    expect(prisma.launchPost.create).toHaveBeenCalledTimes(2);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      results: [
        {
          url: 'https://twitter.com/user/status/123',
          status: 'success',
          companyId: 'company-1'
        },
        {
          url: 'https://linkedin.com/posts/user_activity-456-abcd',
          status: 'success',
          companyId: 'company-1'
        }
      ]
    });
  });

  it('should handle duplicate URLs', async () => {
    const mockCompany = { id: 'company-1', name: 'Test Company' };
    
    vi.mocked(prisma.company.findFirst).mockResolvedValue(mockCompany as any);
    vi.mocked(urlParser.parseURL).mockReturnValue({
      platform: 'x',
      postId: '123456789',
      isValid: true
    });
    vi.mocked(prisma.launchPost.findUnique).mockResolvedValue({
      id: 'existing-post',
      companyId: 'company-1'
    } as any);
    vi.mocked(ycClient.searchYCCompany).mockResolvedValue(null);

    req.body = {
      urls: ['https://twitter.com/user/status/123456789'],
      companyName: 'Test Company'
    };

    await handler(req as Request, res as Response);

    expect(prisma.launchPost.create).not.toHaveBeenCalled();
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      results: [{
        url: 'https://twitter.com/user/status/123456789',
        status: 'failed',
        error: 'URL already exists in database',
        companyId: 'company-1'
      }]
    });
  });

  it('should handle mixed success and failure results', async () => {
    const mockCompany = { id: 'company-1', name: 'Test Company' };
    
    vi.mocked(prisma.company.findFirst).mockResolvedValue(mockCompany as any);
    vi.mocked(urlParser.parseURL)
      .mockReturnValueOnce({
        platform: 'x',
        postId: '123',
        isValid: true
      })
      .mockReturnValueOnce({
        platform: 'x',
        postId: '',
        isValid: false,
        error: 'Invalid URL format'
      });
    vi.mocked(prisma.launchPost.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.launchPost.create).mockResolvedValue({
      id: 'post-1',
      companyId: 'company-1'
    } as any);
    vi.mocked(ycClient.searchYCCompany).mockResolvedValue(null);

    req.body = {
      urls: [
        'https://twitter.com/user/status/123',
        'invalid-url'
      ],
      companyName: 'Test Company'
    };

    await handler(req as Request, res as Response);

    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      results: [
        {
          url: 'https://twitter.com/user/status/123',
          status: 'success',
          companyId: 'company-1'
        },
        {
          url: 'invalid-url',
          status: 'failed',
          error: 'Invalid URL format'
        }
      ]
    });
  });
});
