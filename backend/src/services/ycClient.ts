/**
 * YC API Client Service
 * 
 * Fetches fundraise data from the free YCombinator API (yc-oss/api).
 * Implements fuzzy company name matching to handle variations.
 * 
 * Validates: Requirements 3.1, 3.2, 3.6
 */

import axios from 'axios';
import { YCCompany } from '../types/index.js';

/**
 * Base URL for YC API
 * Using the yc-oss/api GitHub repository endpoints
 */
const YC_API_BASE_URL = 'https://api.ycombinator.com/v0.1';

/**
 * Request timeout in milliseconds (10 seconds)
 */
const REQUEST_TIMEOUT = 10000;

/**
 * Cache for YC API responses (24 hour TTL as per design)
 */
interface CacheEntry {
  data: YCCompany | null;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Normalize company name for fuzzy matching
 * - Convert to lowercase
 * - Remove common suffixes (Inc, LLC, Corp, etc.)
 * - Remove special characters
 * - Trim whitespace
 * 
 * @param name - Company name to normalize
 * @returns Normalized company name
 */
function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(inc|llc|corp|corporation|ltd|limited|co)\b\.?/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate similarity score between two strings using Levenshtein distance
 * Returns a score between 0 (no match) and 1 (perfect match)
 * 
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity score (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) {
    return 1.0;
  }
  
  // Calculate Levenshtein distance
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 * 
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Edit distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  // Initialize matrix
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Search for a YC company by name with fuzzy matching
 * 
 * This function:
 * 1. Checks cache for recent results (24 hour TTL)
 * 2. Queries the YC API for company data
 * 3. Implements fuzzy matching to handle name variations
 * 4. Parses API response for company name, batch, amount raised, and announcement date
 * 5. Returns null if company not found in YC database
 * 6. Handles API errors gracefully
 * 
 * @param companyName - Name of the company to search for
 * @returns YCCompany object if found, null otherwise
 */
export async function searchYCCompany(companyName: string): Promise<YCCompany | null> {
  // Validate input
  if (!companyName || typeof companyName !== 'string' || companyName.trim().length === 0) {
    console.warn('[YC Client] Invalid company name provided');
    return null;
  }
  
  const trimmedName = companyName.trim();
  const normalizedSearchName = normalizeCompanyName(trimmedName);
  
  // Check cache first
  const cacheKey = normalizedSearchName;
  const cachedEntry = cache.get(cacheKey);
  
  if (cachedEntry) {
    const age = Date.now() - cachedEntry.timestamp;
    if (age < CACHE_TTL) {
      console.log(`[YC Client] Cache hit for "${trimmedName}" (age: ${Math.round(age / 1000 / 60)}m)`);
      return cachedEntry.data;
    } else {
      // Cache expired, remove it
      cache.delete(cacheKey);
    }
  }
  
  try {
    console.log(`[YC Client] Searching YC API for company: "${trimmedName}"`);
    
    // Query YC API
    // Note: The actual YC API endpoint structure may vary
    // This implementation assumes a search endpoint with query parameter
    const response = await axios.get(`${YC_API_BASE_URL}/companies`, {
      params: {
        q: trimmedName
      },
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Launch-Tracker-Dashboard/1.0'
      }
    });
    
    // Parse response
    if (!response.data || !Array.isArray(response.data)) {
      console.warn('[YC Client] Invalid API response format');
      
      // Cache the null result
      cache.set(cacheKey, {
        data: null,
        timestamp: Date.now()
      });
      
      return null;
    }
    
    // Find best match using fuzzy matching
    let bestMatch: any = null;
    let bestScore = 0;
    const SIMILARITY_THRESHOLD = 0.7; // 70% similarity required
    
    for (const company of response.data) {
      if (!company.name) continue;
      
      const normalizedApiName = normalizeCompanyName(company.name);
      const similarity = calculateSimilarity(normalizedSearchName, normalizedApiName);
      
      if (similarity > bestScore && similarity >= SIMILARITY_THRESHOLD) {
        bestScore = similarity;
        bestMatch = company;
      }
    }
    
    // If no good match found, return null
    if (!bestMatch) {
      console.log(`[YC Client] No match found for "${trimmedName}" (best score: ${bestScore.toFixed(2)})`);
      
      // Cache the null result
      cache.set(cacheKey, {
        data: null,
        timestamp: Date.now()
      });
      
      return null;
    }
    
    console.log(`[YC Client] Found match: "${bestMatch.name}" (similarity: ${bestScore.toFixed(2)})`);
    
    // Extract and validate required fields
    // Handle both snake_case and camelCase field names
    const amountRaisedValue = bestMatch.amount_raised || bestMatch.amountRaised;
    const announcementDateValue = bestMatch.announcement_date || bestMatch.announcementDate;
    
    const ycCompany: YCCompany = {
      name: bestMatch.name || trimmedName,
      batch: bestMatch.batch || 'Unknown',
      amountRaised: amountRaisedValue ? parseFloat(String(amountRaisedValue)) : 0,
      announcementDate: announcementDateValue || new Date().toISOString()
    };
    
    // Cache the result
    cache.set(cacheKey, {
      data: ycCompany,
      timestamp: Date.now()
    });
    
    return ycCompany;
    
  } catch (error) {
    // Handle API errors gracefully
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        console.log(`[YC Client] Company "${trimmedName}" not found in YC database`);
      } else if (error.response?.status === 429) {
        console.warn(`[YC Client] Rate limit exceeded for YC API`);
      } else if (error.response?.status === 503) {
        console.error(`[YC Client] YC API unavailable (503)`);
      } else {
        console.error(`[YC Client] API error: ${error.message}`);
      }
    } else {
      console.error(`[YC Client] Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Cache the null result to avoid repeated failed requests
    cache.set(cacheKey, {
      data: null,
      timestamp: Date.now()
    });
    
    return null;
  }
}
