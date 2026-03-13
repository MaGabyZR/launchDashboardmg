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

describe('GET /api/export', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let sendMock: any;
  let jsonMock: any;
  let statusMock: any;
  let setHeaderMock: any;

  beforeEach(() => {
    sendMock = vi.fn();
    jsonMock = vi.fn();
    setHeaderMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({
      send: sendMock,
      json: jsonMock,
      setHeader: setHeaderMock,
    });

    mockRequest = {
      method: 'GET',
      query: {},
    };

    mockResponse = {
      status: statusMock,
      send: sendMock,
      json: jsonMock,
      setHeader: setHeaderMock,
    };

    vi.clearAllMocks();
  });

  it('should return 405 for non-GET requests', async () => {
    mockRequest.method = 'POST';

    await handler(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(405);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  it('should return 400 for invalid format', async () => {
    mockRequest.query = { format: 'xml' };

    await handler(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: 'Invalid format: must be csv or json',
    });
  });

  it('should export all companies as CSV', async () => {
    const mockCompanies = [
      {
        id: 'company1',
        name: 'Test Company 1',
        ycBatch: 'W24',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        fundraise: {
          amount: 500000,
          announcementDate: new Date('2024-01-15'),
          source: 'YC_API',
        },
        launchPosts: [
          {
            platform: 'X',
            url: 'https://x.com/test/status/123',
            likes: 150,
            dataSource: 'SCRAPED',
            lastScraped: new Date('2024-01-01'),
          },
          {
            platform: 'LINKEDIN',
            url: 'https://linkedin.com/posts/test_activity-789',
            likes: 200,
            dataSource: 'MANUAL',
            lastScraped: null,
          },
        ],
        contactInfo: {
          email: 'contact@test1.com',
          phone: '+1-555-0001',
          linkedinUrl: 'https://linkedin.com/company/test1',
          xHandle: '@test1',
        },
      },
    ];

    (prisma.company.findMany as any).mockResolvedValue(mockCompanies);
    mockRequest.query = { format: 'csv' };

    await handler(mockRequest as Request, mockResponse as Response);

    expect(setHeaderMock).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
    expect(setHeaderMock).toHaveBeenCalledWith(
      'Content-Disposition',
      expect.stringContaining('launch-tracker-export-')
    );
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(sendMock).toHaveBeenCalled();

    const csvContent = sendMock.mock.calls[0][0];
    expect(csvContent).toContain('Company Name');
    expect(csvContent).toContain('Test Company 1');
    expect(csvContent).toContain('500000');
    expect(csvContent).toContain('150');
    expect(csvContent).toContain('200');
  });

  it('should export all companies as JSON', async () => {
    const mockCompanies = [
      {
        id: 'company1',
        name: 'Test Company 1',
        ycBatch: 'W24',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        fundraise: {
          amount: 500000,
          announcementDate: new Date('2024-01-15'),
          source: 'YC_API',
        },
        launchPosts: [
          {
            platform: 'X',
            url: 'https://x.com/test/status/123',
            likes: 150,
            dataSource: 'SCRAPED',
            lastScraped: new Date('2024-01-01'),
          },
        ],
        contactInfo: {
          email: 'contact@test1.com',
          phone: '+1-555-0001',
          linkedinUrl: 'https://linkedin.com/company/test1',
          xHandle: '@test1',
        },
      },
    ];

    (prisma.company.findMany as any).mockResolvedValue(mockCompanies);
    mockRequest.query = { format: 'json' };

    await handler(mockRequest as Request, mockResponse as Response);

    expect(setHeaderMock).toHaveBeenCalledWith('Content-Type', 'application/json; charset=utf-8');
    expect(setHeaderMock).toHaveBeenCalledWith(
      'Content-Disposition',
      expect.stringContaining('launch-tracker-export-')
    );
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalled();

    const jsonData = jsonMock.mock.calls[0][0];
    expect(jsonData).toHaveProperty('exportDate');
    expect(jsonData).toHaveProperty('totalCompanies');
    expect(jsonData).toHaveProperty('companies');
    expect(jsonData.companies.length).toBe(1);
    expect(jsonData.companies[0].name).toBe('Test Company 1');
  });

  it('should filter by companyIds', async () => {
    const mockCompanies = [
      {
        id: 'company1',
        name: 'Test Company 1',
        ycBatch: 'W24',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        fundraise: null,
        launchPosts: [
          {
            platform: 'X',
            url: 'https://x.com/test/status/123',
            likes: 150,
            dataSource: 'SCRAPED',
            lastScraped: new Date('2024-01-01'),
          },
        ],
        contactInfo: null,
      },
    ];

    (prisma.company.findMany as any).mockResolvedValue(mockCompanies);
    mockRequest.query = { format: 'csv', companyIds: 'company1' };

    await handler(mockRequest as Request, mockResponse as Response);

    expect(prisma.company.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['company1'] } },
      })
    );
    expect(statusMock).toHaveBeenCalledWith(200);
  });

  it('should include all required fields in CSV export', async () => {
    const mockCompanies = [
      {
        id: 'company1',
        name: 'Test Company',
        ycBatch: 'W24',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        fundraise: {
          amount: 500000,
          announcementDate: new Date('2024-01-15'),
          source: 'YC_API',
        },
        launchPosts: [
          {
            platform: 'X',
            url: 'https://x.com/test/status/123',
            likes: 150,
            dataSource: 'SCRAPED',
            lastScraped: new Date('2024-01-01'),
          },
        ],
        contactInfo: {
          email: 'contact@test.com',
          phone: '+1-555-0001',
          linkedinUrl: 'https://linkedin.com/company/test',
          xHandle: '@test',
        },
      },
    ];

    (prisma.company.findMany as any).mockResolvedValue(mockCompanies);
    mockRequest.query = { format: 'csv' };

    await handler(mockRequest as Request, mockResponse as Response);

    const csvContent = sendMock.mock.calls[0][0];
    const headers = csvContent.split('\n')[0];

    expect(headers).toContain('Company Name');
    expect(headers).toContain('YC Batch');
    expect(headers).toContain('Fundraise Amount');
    expect(headers).toContain('Fundraise Date');
    expect(headers).toContain('Fundraise Source');
    expect(headers).toContain('X Likes');
    expect(headers).toContain('X Data Source');
    expect(headers).toContain('LinkedIn Likes');
    expect(headers).toContain('LinkedIn Data Source');
    expect(headers).toContain('Total Engagement');
    expect(headers).toContain('Email');
    expect(headers).toContain('Phone');
    expect(headers).toContain('LinkedIn URL');
    expect(headers).toContain('X Handle');
    expect(headers).toContain('Low Engagement');
    expect(headers).toContain('DM Draft');
    expect(headers).toContain('Created Date');
  });

  it('should include data source indicators in export', async () => {
    const mockCompanies = [
      {
        id: 'company1',
        name: 'Test Company',
        ycBatch: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        fundraise: {
          amount: 500000,
          announcementDate: new Date('2024-01-15'),
          source: 'YC_API',
        },
        launchPosts: [
          {
            platform: 'X',
            url: 'https://x.com/test/status/123',
            likes: 150,
            dataSource: 'SCRAPED',
            lastScraped: new Date('2024-01-01'),
          },
          {
            platform: 'LINKEDIN',
            url: 'https://linkedin.com/posts/test_activity-789',
            likes: 200,
            dataSource: 'MANUAL',
            lastScraped: null,
          },
        ],
        contactInfo: null,
      },
    ];

    (prisma.company.findMany as any).mockResolvedValue(mockCompanies);
    mockRequest.query = { format: 'csv' };

    await handler(mockRequest as Request, mockResponse as Response);

    const csvContent = sendMock.mock.calls[0][0];
    expect(csvContent).toContain('scraped');
    expect(csvContent).toContain('manual');
    expect(csvContent).toContain('yc_api');
  });

  it('should include timestamp in filename', async () => {
    (prisma.company.findMany as any).mockResolvedValue([]);
    mockRequest.query = { format: 'csv' };

    await handler(mockRequest as Request, mockResponse as Response);

    const dispositionCall = setHeaderMock.mock.calls.find(
      (call: any) => call[0] === 'Content-Disposition'
    );
    expect(dispositionCall[1]).toMatch(/launch-tracker-export-\d{4}-\d{2}-\d{2}\.csv/);
  });

  it('should handle CSV escaping for special characters', async () => {
    const mockCompanies = [
      {
        id: 'company1',
        name: 'Company "With" Quotes, Commas',
        ycBatch: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        fundraise: null,
        launchPosts: [
          {
            platform: 'X',
            url: 'https://x.com/test/status/123',
            likes: 10,
            dataSource: 'MANUAL',
            lastScraped: null,
          },
        ],
        contactInfo: null,
      },
    ];

    (prisma.company.findMany as any).mockResolvedValue(mockCompanies);
    mockRequest.query = { format: 'csv' };

    await handler(mockRequest as Request, mockResponse as Response);

    const csvContent = sendMock.mock.calls[0][0];
    // Should properly escape the company name
    expect(csvContent).toContain('"Company ""With"" Quotes, Commas"');
  });

  it('should default to CSV format when not specified', async () => {
    (prisma.company.findMany as any).mockResolvedValue([]);
    mockRequest.query = {};

    await handler(mockRequest as Request, mockResponse as Response);

    expect(setHeaderMock).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
    expect(statusMock).toHaveBeenCalledWith(200);
  });

  it('should handle multiple companyIds filter', async () => {
    const mockCompanies = [
      {
        id: 'company1',
        name: 'Test Company 1',
        ycBatch: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        fundraise: null,
        launchPosts: [],
        contactInfo: null,
      },
      {
        id: 'company2',
        name: 'Test Company 2',
        ycBatch: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        fundraise: null,
        launchPosts: [],
        contactInfo: null,
      },
    ];

    (prisma.company.findMany as any).mockResolvedValue(mockCompanies);
    mockRequest.query = { format: 'json', companyIds: 'company1,company2' };

    await handler(mockRequest as Request, mockResponse as Response);

    expect(prisma.company.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['company1', 'company2'] } },
      })
    );
  });

  it('should handle database errors gracefully', async () => {
    (prisma.company.findMany as any).mockRejectedValue(new Error('Database error'));
    mockRequest.query = { format: 'csv' };

    await handler(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' });
  });

  it('should calculate engagement metrics correctly', async () => {
    const mockCompanies = [
      {
        id: 'company1',
        name: 'Test Company',
        ycBatch: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        fundraise: null,
        launchPosts: [
          {
            platform: 'X',
            url: 'https://x.com/test/status/123',
            likes: 100,
            dataSource: 'SCRAPED',
            lastScraped: new Date('2024-01-01'),
          },
          {
            platform: 'LINKEDIN',
            url: 'https://linkedin.com/posts/test_activity-789',
            likes: 50,
            dataSource: 'MANUAL',
            lastScraped: null,
          },
        ],
        contactInfo: null,
      },
    ];

    (prisma.company.findMany as any).mockResolvedValue(mockCompanies);
    mockRequest.query = { format: 'json' };

    await handler(mockRequest as Request, mockResponse as Response);

    const jsonData = jsonMock.mock.calls[0][0];
    const company = jsonData.companies[0];
    expect(company.xLikes).toBe(100);
    expect(company.linkedinLikes).toBe(50);
    expect(company.totalEngagement).toBe(150);
  });

  it('should handle empty companyIds gracefully', async () => {
    (prisma.company.findMany as any).mockResolvedValue([]);
    mockRequest.query = { format: 'csv', companyIds: '  ,  ' };

    await handler(mockRequest as Request, mockResponse as Response);

    // Should query all companies when companyIds is empty after filtering
    expect(prisma.company.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: undefined,
      })
    );
  });
});
