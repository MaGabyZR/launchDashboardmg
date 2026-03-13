import type { Request, Response } from 'express';

/**
 * POST /api/launch-posts
 * Add new launch post URL(s)
 * 
 * Request Body:
 * - urls: string[] - One or more URLs
 * - companyName: string
 * - manualMetrics?: { platform: 'x' | 'linkedin', likes: number }[]
 */
export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { urls, companyName, manualMetrics: _manualMetrics } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request: urls array is required' 
      });
    }

    if (!companyName || typeof companyName !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid request: companyName is required' 
      });
    }

    // TODO: Implement URL parsing, validation, and storage
    // This will be implemented in later tasks
    
    const results = urls.map(url => ({
      url,
      status: 'success' as const,
      companyId: 'placeholder'
    }));

    res.status(200).json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error adding launch posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
