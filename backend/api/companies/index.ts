import type { Request, Response } from 'express';
import { prisma } from '../../src/lib/db.js';
import { classifyEngagement, generateDM } from '../../src/services/dmGenerator.js';
import type { Platform } from '../../src/types/index.js';

/**
 * GET /api/companies
 * Retrieve all companies with launch data
 * 
 * Query Parameters:
 * - sortBy: Field to sort by (default: 'createdAt')
 * - order: 'asc' | 'desc' (default: 'desc')
 * - minEngagement: Filter by minimum total engagement
 * - hasContact: Filter companies with/without contact info
 */
export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse query parameters
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const order = (req.query.order as 'asc' | 'desc') || 'desc';
    const minEngagement = req.query.minEngagement 
      ? parseInt(req.query.minEngagement as string, 10) 
      : undefined;
    const hasContact = req.query.hasContact 
      ? req.query.hasContact === 'true' 
      : undefined;

    // Build where clause for filtering
    const where: any = {};
    
    if (hasContact !== undefined) {
      if (hasContact) {
        where.contactInfo = { isNot: null };
      } else {
        where.contactInfo = null;
      }
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'name') {
      orderBy[sortBy] = order;
    } else {
      orderBy.createdAt = order;
    }

    // Query companies with all related data
    const companies = await prisma.company.findMany({
      where,
      include: {
        fundraise: true,
        launchPosts: true,
        contactInfo: true,
      },
      orderBy,
    });

    // Transform and enrich company data
    const enrichedCompanies = companies
      .map((company) => {
        // Convert Prisma Platform enum to lowercase for dmGenerator
        const launchPostsForDM = company.launchPosts.map((post) => ({
          ...post,
          platform: post.platform.toLowerCase() as Platform,
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
          ycBatch: company.ycBatch,
          createdAt: company.createdAt,
          updatedAt: company.updatedAt,
          fundraise: company.fundraise
            ? {
                amount: company.fundraise.amount,
                announcementDate: company.fundraise.announcementDate,
                source: company.fundraise.source.toLowerCase(),
              }
            : null,
          launchPosts: company.launchPosts.map((post) => ({
            platform: post.platform.toLowerCase(),
            url: post.url,
            likes: post.likes,
            dataSource: post.dataSource.toLowerCase(),
            lastScraped: post.lastScraped,
          })),
          contactInfo: company.contactInfo
            ? {
                email: company.contactInfo.email,
                phone: company.contactInfo.phone,
                linkedinUrl: company.contactInfo.linkedinUrl,
                xHandle: company.contactInfo.xHandle,
              }
            : null,
          dmDraft: dmDraft ? dmDraft.message : null,
          isLowEngagement,
          totalEngagement,
        };
      })
      .filter((company) => {
        // Apply minEngagement filter after enrichment
        if (minEngagement !== undefined) {
          return company.totalEngagement >= minEngagement;
        }
        return true;
      });

    res.status(200).json({
      companies: enrichedCompanies,
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
