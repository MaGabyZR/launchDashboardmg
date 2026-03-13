/**
 * Example usage of database connection utilities
 * 
 * This file demonstrates how to use the database utilities in API endpoints
 * and serverless functions.
 */

import { prisma, handleDatabaseError, testDatabaseConnection } from './db';

/**
 * Example 1: Basic query in an API endpoint
 */
export async function getAllCompanies() {
  try {
    const companies = await prisma.company.findMany({
      include: {
        launchPosts: true,
        fundraise: true,
        contactInfo: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return companies;
  } catch (error) {
    handleDatabaseError(error, 'fetching companies');
  }
}

/**
 * Example 2: Creating a record with error handling
 */
export async function createCompany(name: string, ycBatch?: string) {
  try {
    const company = await prisma.company.create({
      data: {
        name,
        ycBatch,
      },
    });
    
    return company;
  } catch (error) {
    handleDatabaseError(error, 'creating company');
  }
}

/**
 * Example 3: Transaction with multiple operations
 */
export async function createCompanyWithLaunchPost(
  companyName: string,
  launchPostUrl: string,
  platform: 'X' | 'LINKEDIN'
) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: companyName,
        },
      });
      
      // Create launch post
      const launchPost = await tx.launchPost.create({
        data: {
          companyId: company.id,
          platform,
          url: launchPostUrl,
          postId: extractPostId(launchPostUrl),
          dataSource: 'MANUAL',
        },
      });
      
      return { company, launchPost };
    });
    
    return result;
  } catch (error) {
    handleDatabaseError(error, 'creating company with launch post');
  }
}

/**
 * Example 4: Health check endpoint
 */
export async function healthCheck() {
  const isConnected = await testDatabaseConnection();
  
  return {
    status: isConnected ? 'healthy' : 'unhealthy',
    database: isConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Example 5: Updating a record
 */
export async function updateLaunchPostMetrics(
  launchPostId: string,
  likes: number
) {
  try {
    const updated = await prisma.launchPost.update({
      where: { id: launchPostId },
      data: {
        likes,
        lastScraped: new Date(),
        dataSource: 'SCRAPED',
      },
    });
    
    return updated;
  } catch (error) {
    handleDatabaseError(error, 'updating launch post metrics');
  }
}

/**
 * Example 6: Deleting with cascade
 */
export async function deleteCompany(companyId: string) {
  try {
    // This will cascade delete all related records (fundraise, launchPosts, contactInfo)
    await prisma.company.delete({
      where: { id: companyId },
    });
    
    return { success: true };
  } catch (error) {
    handleDatabaseError(error, 'deleting company');
  }
}

/**
 * Example 7: Complex query with filtering
 */
export async function getLowEngagementCompanies(threshold: number = 50) {
  try {
    const companies = await prisma.company.findMany({
      where: {
        launchPosts: {
          some: {
            likes: {
              lt: threshold,
            },
          },
        },
      },
      include: {
        launchPosts: {
          where: {
            likes: {
              lt: threshold,
            },
          },
        },
        contactInfo: true,
      },
    });
    
    return companies;
  } catch (error) {
    handleDatabaseError(error, 'fetching low engagement companies');
  }
}

// Helper function
function extractPostId(url: string): string {
  // Simplified extraction - real implementation would be more robust
  const match = url.match(/\/status\/(\d+)|activity-(\d+)/);
  return match ? (match[1] || match[2]) : '';
}
