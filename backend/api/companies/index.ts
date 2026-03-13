import type { Request, Response } from 'express';

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
    // TODO: Implement database query with Prisma
    // This will be implemented in later tasks
    
    res.status(200).json({
      companies: []
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
