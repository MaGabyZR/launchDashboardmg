import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import handler from './index.js';
import { prisma } from '../../src/lib/db.js';

// Mock the database
vi.mock('../../src/lib/db.js', () => ({
  prisma: {
    company: {
      findMany: vi.fn(),
    },
  },
}));

// Mock the dmGenerator service
vi.mock('../../src/services/dmGenerator.js', () => ({
  classifyEngagement: vi.fn((launchPosts) => {
    // Simple mock: low engagement if any post has < 50 likes
    return launchPosts.some((post: any) => post.likes < 50);
  }),
  generateDM: vi.fn((companyName, launchPosts) => {
    const isLow = launchPosts.some((post: any) => post.likes < 50);
    if (!isLow) return null;
    return {
      message: `Hi ${companyName} team, test message`,
      companyName,
      reason: 'Low engagement',
    };
  }),
}));

describe('GET /api/companies', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: any;
  let statusMock: any;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    
    mockRequest = {
      method: 'GET',
      query: {},
    };
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    vi.clearAllMocks();
  });

  it('should return 405 for non-GET requests', async () => {
    mockRequest.method = 'POST';

    await handler(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(405);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  it('should return empty array when no companies exist', async () => {
    (prisma.company.findMany as any).mockResolvedValue([]);

    await handler(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({ companies: [] });
  });

  it('should return companies with all related data', async () => {
    const mockCompanies = [
      {
        id: 'company1',
        name: 'Test Company',
        ycBatch: 'W24',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        fundraise: {
          amount: 1000000,
          announcementDate: new Date('2024-01-01'),
          source: 'YC_API',
        },
        launchPosts: [
          {
            platform: 'X',
            url: 'https://x.com/test/status/123',
            likes: 100,
            dataSource: 'SCRAPED',
            lastScraped: new Date('2024-01-01'),
          },
        ],
        contactInfo: {
          email: 'test@example.com',
          phone: '123-456-7890',
          linkedinUrl: 'https://linkedin.com/company/test',
          xHandle: '@test',
        },
      },
    ];

    (prisma.company.findMany as any).mockResolvedValue(mockCompanies);

    await handler(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    const response = jsonMock.mock.calls[0][0];
    expect(response.companies).toHaveLength(1);
    expect(response.companies[0]).toMatchObject({
      id: 'company1',
      name: 'Test Company',
      ycBatch: 'W24',
      isLowEngagement: false,
      totalEngagement: 100,
    });
  });

  it('should calculate isLowEngagement correctly', async () => {
    const mockCompanies = [
      {
        id: 'company1',
        name: 'Low Engagement Co',
        ycBatch: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        fundraise: null,
        launchPosts: [
          {
            platform: 'X',
            url: 'https://x.com/test/status/123',
            likes: 30, // Below threshold
            dataSource: 'SCRAPED',
            lastScraped: new Date(),
          },
        ],
        contactInfo: null,
      },
    ];

    (prisma.company.findMany as any).mockResolvedValue(mockCompanies);

    await handler(mockRequest as Request, mockResponse as Response);

    const response = jsonMock.mock.calls[0][0];
    expect(response.companies[0].isLowEngagement).toBe(true);
    expect(response.companies[0].dmDraft).toBeTruthy();
  });

  it('should support sortBy and order query parameters', async () => {
    mockRequest.query = { sortBy: 'name', order: 'asc' };
    (prisma.company.findMany as any).mockResolvedValue([]);

    await handler(mockRequest as Request, mockResponse as Response);

    expect(prisma.company.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { name: 'asc' },
      })
    );
  });

  it('should filter by hasContact=true', async () => {
    mockRequest.query = { hasContact: 'true' };
    (prisma.company.findMany as any).mockResolvedValue([]);

    await handler(mockRequest as Request, mockResponse as Response);

    expect(prisma.company.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { contactInfo: { isNot: null } },
      })
    );
  });

  it('should filter by hasContact=false', async () => {
    mockRequest.query = { hasContact: 'false' };
    (prisma.company.findMany as any).mockResolvedValue([]);

    await handler(mockRequest as Request, mockResponse as Response);

    expect(prisma.company.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { contactInfo: null },
      })
    );
  });

  it('should filter by minEngagement', async () => {
    const mockCompanies = [
      {
        id: 'company1',
        name: 'High Engagement',
        ycBatch: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        fundraise: null,
        launchPosts: [
          { platform: 'X', url: 'url1', likes: 100, dataSource: 'SCRAPED', lastScraped: new Date() },
        ],
        contactInfo: null,
      },
      {
        id: 'company2',
        name: 'Low Engagement',
        ycBatch: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        fundraise: null,
        launchPosts: [
          { platform: 'X', url: 'url2', likes: 10, dataSource: 'SCRAPED', lastScraped: new Date() },
        ],
        contactInfo: null,
      },
    ];

    mockRequest.query = { minEngagement: '50' };
    (prisma.company.findMany as any).mockResolvedValue(mockCompanies);

    await handler(mockRequest as Request, mockResponse as Response);

    const response = jsonMock.mock.calls[0][0];
    expect(response.companies).toHaveLength(1);
    expect(response.companies[0].name).toBe('High Engagement');
  });

  it('should handle database errors gracefully', async () => {
    (prisma.company.findMany as any).mockRejectedValue(new Error('Database error'));

    await handler(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' });
  });

  it('should convert enum values to lowercase', async () => {
    const mockCompanies = [
      {
        id: 'company1',
        name: 'Test',
        ycBatch: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        fundraise: {
          amount: 1000000,
          announcementDate: new Date(),
          source: 'YC_API',
        },
        launchPosts: [
          {
            platform: 'X',
            url: 'url',
            likes: 100,
            dataSource: 'SCRAPED',
            lastScraped: new Date(),
          },
        ],
        contactInfo: null,
      },
    ];

    (prisma.company.findMany as any).mockResolvedValue(mockCompanies);

    await handler(mockRequest as Request, mockResponse as Response);

    const response = jsonMock.mock.calls[0][0];
    expect(response.companies[0].fundraise.source).toBe('yc_api');
    expect(response.companies[0].launchPosts[0].platform).toBe('x');
    expect(response.companies[0].launchPosts[0].dataSource).toBe('scraped');
  });
});
