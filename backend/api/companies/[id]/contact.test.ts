import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import handler from './contact.js';
import { prisma } from '../../../src/lib/db.js';

// Mock Prisma
vi.mock('../../../src/lib/db.js', () => ({
  prisma: {
    company: {
      findUnique: vi.fn(),
    },
    contactInfo: {
      upsert: vi.fn(),
    },
  },
}));

describe('POST /api/companies/:id/contact', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let statusSpy: any;
  let jsonSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup response mocks
    statusSpy = vi.fn().mockReturnThis();
    jsonSpy = vi.fn().mockReturnThis();

    mockRes = {
      status: statusSpy,
      json: jsonSpy,
    };

    mockReq = {
      method: 'POST',
      query: { id: 'company-123' },
      body: {},
    };
  });

  describe('Method validation', () => {
    it('should return 405 for non-POST requests', async () => {
      mockReq.method = 'GET';
      await handler(mockReq as Request, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(405);
      expect(jsonSpy).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });
  });

  describe('Input validation', () => {
    it('should return 400 if no company ID provided', async () => {
      mockReq.query = {};
      await handler(mockReq as Request, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({ error: 'Invalid company ID' });
    });

    it('should return 400 if no contact fields provided', async () => {
      mockReq.body = {};
      await handler(mockReq as Request, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: 'At least one contact field must be provided',
      });
    });

    it('should return 400 for invalid email format', async () => {
      mockReq.body = { email: 'invalid-email' };
      await handler(mockReq as Request, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({ error: 'Invalid email format' });
    });

    it('should accept valid email formats', async () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.co.uk',
        'first+last@example.com',
      ];

      for (const email of validEmails) {
        vi.clearAllMocks();
        statusSpy = vi.fn().mockReturnThis();
        jsonSpy = vi.fn().mockReturnThis();
        mockRes = { status: statusSpy, json: jsonSpy };

        vi.mocked(prisma.company.findUnique).mockResolvedValue({
          id: 'company-123',
          name: 'Test Company',
          ycBatch: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);

        vi.mocked(prisma.contactInfo.upsert).mockResolvedValue({
          id: 'contact-1',
          companyId: 'company-123',
          email,
          phone: null,
          linkedinUrl: null,
          xHandle: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);

        mockReq.body = { email };
        await handler(mockReq as Request, mockRes as Response);

        expect(statusSpy).toHaveBeenCalledWith(200);
      }
    });
  });

  describe('Company validation', () => {
    it('should return 404 if company not found', async () => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue(null);

      mockReq.body = { email: 'test@example.com' };
      await handler(mockReq as Request, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({ error: 'Company not found' });
    });
  });

  describe('Phone number formatting', () => {
    beforeEach(() => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue({
        id: 'company-123',
        name: 'Test Company',
        ycBatch: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
    });

    it('should format 10-digit phone numbers as (XXX) XXX-XXXX', async () => {
      vi.mocked(prisma.contactInfo.upsert).mockResolvedValue({
        id: 'contact-1',
        companyId: 'company-123',
        email: null,
        phone: '(555) 123-4567',
        linkedinUrl: null,
        xHandle: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      mockReq.body = { phone: '5551234567' };
      await handler(mockReq as Request, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        contactInfo: {
          email: null,
          phone: '(555) 123-4567',
          linkedinUrl: null,
          xHandle: null,
        },
      });
    });

    it('should format 11-digit phone numbers starting with 1 as +1 (XXX) XXX-XXXX', async () => {
      vi.mocked(prisma.contactInfo.upsert).mockResolvedValue({
        id: 'contact-1',
        companyId: 'company-123',
        email: null,
        phone: '+1 (555) 123-4567',
        linkedinUrl: null,
        xHandle: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      mockReq.body = { phone: '15551234567' };
      await handler(mockReq as Request, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        contactInfo: {
          email: null,
          phone: '+1 (555) 123-4567',
          linkedinUrl: null,
          xHandle: null,
        },
      });
    });

    it('should handle phone numbers with formatting characters', async () => {
      vi.mocked(prisma.contactInfo.upsert).mockResolvedValue({
        id: 'contact-1',
        companyId: 'company-123',
        email: null,
        phone: '(555) 123-4567',
        linkedinUrl: null,
        xHandle: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      mockReq.body = { phone: '(555) 123-4567' };
      await handler(mockReq as Request, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(200);
    });

    it('should return original phone if not standard format', async () => {
      const originalPhone = '123456';
      vi.mocked(prisma.contactInfo.upsert).mockResolvedValue({
        id: 'contact-1',
        companyId: 'company-123',
        email: null,
        phone: originalPhone,
        linkedinUrl: null,
        xHandle: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      mockReq.body = { phone: originalPhone };
      await handler(mockReq as Request, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(200);
    });
  });

  describe('Contact creation and updates', () => {
    beforeEach(() => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue({
        id: 'company-123',
        name: 'Test Company',
        ycBatch: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
    });

    it('should create new contact info', async () => {
      const contactData = {
        email: 'test@example.com',
        phone: '5551234567',
        linkedinUrl: 'https://linkedin.com/company/test',
        xHandle: '@testcompany',
      };

      vi.mocked(prisma.contactInfo.upsert).mockResolvedValue({
        id: 'contact-1',
        companyId: 'company-123',
        email: contactData.email,
        phone: '(555) 123-4567',
        linkedinUrl: contactData.linkedinUrl,
        xHandle: contactData.xHandle,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      mockReq.body = contactData;
      await handler(mockReq as Request, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        contactInfo: {
          email: contactData.email,
          phone: '(555) 123-4567',
          linkedinUrl: contactData.linkedinUrl,
          xHandle: contactData.xHandle,
        },
      });
    });

    it('should update existing contact info', async () => {
      const updatedEmail = 'newemail@example.com';

      vi.mocked(prisma.contactInfo.upsert).mockResolvedValue({
        id: 'contact-1',
        companyId: 'company-123',
        email: updatedEmail,
        phone: null,
        linkedinUrl: null,
        xHandle: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      mockReq.body = { email: updatedEmail };
      await handler(mockReq as Request, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        contactInfo: {
          email: updatedEmail,
          phone: null,
          linkedinUrl: null,
          xHandle: null,
        },
      });
    });

    it('should handle partial data updates', async () => {
      vi.mocked(prisma.contactInfo.upsert).mockResolvedValue({
        id: 'contact-1',
        companyId: 'company-123',
        email: 'test@example.com',
        phone: null,
        linkedinUrl: 'https://linkedin.com/company/test',
        xHandle: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      mockReq.body = { linkedinUrl: 'https://linkedin.com/company/test' };
      await handler(mockReq as Request, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        contactInfo: {
          email: 'test@example.com',
          phone: null,
          linkedinUrl: 'https://linkedin.com/company/test',
          xHandle: null,
        },
      });
    });
  });

  describe('Error handling', () => {
    it('should return 500 on database error', async () => {
      vi.mocked(prisma.company.findUnique).mockRejectedValue(
        new Error('Database connection failed')
      );

      mockReq.body = { email: 'test@example.com' };
      await handler(mockReq as Request, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
});
