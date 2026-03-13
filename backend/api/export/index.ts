import type { Request, Response } from 'express';
import { prisma } from '../../src/lib/db.js';
import { classifyEngagement, generateDM } from '../../src/services/dmGenerator.js';
import type { Platform } from '../../src/types/index.js';

/**
 * GET /api/export
 * Export dashboard data in CSV or JSON format
 * 
 * Query Parameters:
 * - format: 'csv' | 'json' (default: 'csv')
 * - companyIds: Optional comma-separated list of company IDs
 */
export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { format = 'csv', companyIds: companyIdsParam } = req.query;

    if (format !== 'csv' && format !== 'json') {
      return res.status(400).json({ 
        error: 'Invalid format: must be csv or json' 
      });
    }

    // Parse company IDs filter if provided
    const companyIds = companyIdsParam
      ? (companyIdsParam as string).split(',').map(id => id.trim()).filter(Boolean)
      : undefined;

    // Query companies with all related data
    const companies = await prisma.company.findMany({
      where: companyIds && companyIds.length > 0
        ? { id: { in: companyIds } }
        : undefined,
      include: {
        fundraise: true,
        launchPosts: true,
        contactInfo: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform and enrich company data
    const enrichedCompanies = companies.map((company) => {
      // Convert Prisma Platform enum to lowercase for dmGenerator
      const launchPostsForDM = company.launchPosts.map((post) => ({
        ...post,
        platform: post.platform.toLowerCase() as Platform,
        dataSource: post.dataSource.toLowerCase() as any,
      }));

      // Calculate total engagement
      const totalEngagement = company.launchPosts.reduce(
        (sum, post) => sum + post.likes,
        0
      );

      // Calculate isLowEngagement
      const isLowEngagement = classifyEngagement(launchPostsForDM);

      // Generate DM draft if low engagement
      const dmDraft = generateDM(company.name, launchPostsForDM);

      return {
        id: company.id,
        name: company.name,
        ycBatch: company.ycBatch || '',
        fundraiseAmount: company.fundraise?.amount || '',
        fundraiseDate: company.fundraise?.announcementDate 
          ? new Date(company.fundraise.announcementDate).toISOString().split('T')[0]
          : '',
        fundraiseSource: company.fundraise?.source.toLowerCase() || '',
        xLikes: company.launchPosts
          .filter(p => p.platform === 'X')
          .reduce((sum, p) => sum + p.likes, 0),
        xDataSource: company.launchPosts
          .filter(p => p.platform === 'X')
          .map(p => p.dataSource.toLowerCase())
          .join('; ') || '',
        linkedinLikes: company.launchPosts
          .filter(p => p.platform === 'LINKEDIN')
          .reduce((sum, p) => sum + p.likes, 0),
        linkedinDataSource: company.launchPosts
          .filter(p => p.platform === 'LINKEDIN')
          .map(p => p.dataSource.toLowerCase())
          .join('; ') || '',
        totalEngagement,
        email: company.contactInfo?.email || '',
        phone: company.contactInfo?.phone || '',
        linkedinUrl: company.contactInfo?.linkedinUrl || '',
        xHandle: company.contactInfo?.xHandle || '',
        isLowEngagement,
        dmDraft: dmDraft ? dmDraft.message : '',
        createdAt: new Date(company.createdAt).toISOString().split('T')[0],
      };
    });

    // Generate timestamp for filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `launch-tracker-export-${timestamp}.${format}`;

    if (format === 'csv') {
      // Generate CSV content
      const csvContent = generateCSV(enrichedCompanies);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csvContent);
    } else {
      // Generate JSON content
      const jsonContent = {
        exportDate: new Date().toISOString(),
        totalCompanies: enrichedCompanies.length,
        companies: enrichedCompanies,
      };
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).json(jsonContent);
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Generate CSV content from enriched company data
 */
function generateCSV(companies: any[]): string {
  // Define CSV headers
  const headers = [
    'Company Name',
    'YC Batch',
    'Fundraise Amount',
    'Fundraise Date',
    'Fundraise Source',
    'X Likes',
    'X Data Source',
    'LinkedIn Likes',
    'LinkedIn Data Source',
    'Total Engagement',
    'Email',
    'Phone',
    'LinkedIn URL',
    'X Handle',
    'Low Engagement',
    'DM Draft',
    'Created Date',
  ];

  // Escape CSV values
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    const stringValue = String(value);
    // Escape quotes and wrap in quotes if contains comma, newline, or quote
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Build CSV rows
  const rows = companies.map((company) => [
    escapeCSV(company.name),
    escapeCSV(company.ycBatch),
    escapeCSV(company.fundraiseAmount),
    escapeCSV(company.fundraiseDate),
    escapeCSV(company.fundraiseSource),
    escapeCSV(company.xLikes),
    escapeCSV(company.xDataSource),
    escapeCSV(company.linkedinLikes),
    escapeCSV(company.linkedinDataSource),
    escapeCSV(company.totalEngagement),
    escapeCSV(company.email),
    escapeCSV(company.phone),
    escapeCSV(company.linkedinUrl),
    escapeCSV(company.xHandle),
    escapeCSV(company.isLowEngagement ? 'Yes' : 'No'),
    escapeCSV(company.dmDraft),
    escapeCSV(company.createdAt),
  ]);

  // Combine headers and rows
  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ];

  return csvLines.join('\n');
}
