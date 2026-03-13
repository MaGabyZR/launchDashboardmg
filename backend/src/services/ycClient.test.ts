/**
 * Unit tests for YC API Client Service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { searchYCCompany } from './ycClient.js';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('YC API Client Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear console to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Clear cache by searching with unique timestamp to avoid cache hits
    // This is a workaround since we can't directly access the cache
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchYCCompany', () => {
    it('should return null for empty company name', async () => {
      const result = await searchYCCompany('');
      expect(result).toBeNull();
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should return null for whitespace-only company name', async () => {
      const result = await searchYCCompany('   ');
      expect(result).toBeNull();
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should return null for invalid input types', async () => {
      // @ts-expect-error Testing invalid input
      const result = await searchYCCompany(null);
      expect(result).toBeNull();
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should successfully fetch and parse YC company data', async () => {
      const mockResponse = {
        data: [
          {
            name: 'Acme Corp',
            batch: 'W24',
            amount_raised: '1000000',
            announcement_date: '2024-01-15'
          }
        ]
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await searchYCCompany('Acme Corp');

      expect(result).toEqual({
        name: 'Acme Corp',
        batch: 'W24',
        amountRaised: 1000000,
        announcementDate: '2024-01-15'
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/companies'),
        expect.objectContaining({
          params: { q: 'Acme Corp' },
          timeout: 10000
        })
      );
    });

    it('should handle fuzzy matching for company names with variations', async () => {
      const mockResponse = {
        data: [
          {
            name: 'FuzzyMatch Corporation',
            batch: 'S23',
            amount_raised: '500000',
            announcement_date: '2023-06-01'
          }
        ]
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      // Search with slightly different name - should match and return API name
      const result = await searchYCCompany('FuzzyMatch Corp Inc');

      expect(result).not.toBeNull();
      // Should return the name from the API, not the search term
      expect(result?.name).toBe('FuzzyMatch Corporation');
      expect(result?.batch).toBe('S23');
    });

    it('should normalize company names by removing common suffixes', async () => {
      const mockResponse = {
        data: [
          {
            name: 'TechStart',
            batch: 'W23',
            amount_raised: '750000',
            announcement_date: '2023-01-20'
          }
        ]
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      // Search with Inc suffix
      const result = await searchYCCompany('TechStart Inc');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('TechStart');
    });

    it('should return null when no match found in YC database', async () => {
      const mockResponse = {
        data: []
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await searchYCCompany('NonExistent Company');

      expect(result).toBeNull();
    });

    it('should return null when similarity score is below threshold', async () => {
      const mockResponse = {
        data: [
          {
            name: 'Zebra Wildlife Photography Services',
            batch: 'W24',
            amount_raised: '1000000',
            announcement_date: '2024-01-15'
          }
        ]
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      // Search for completely different company
      const result = await searchYCCompany('Acme Technology Solutions');

      expect(result).toBeNull();
    });

    it('should handle 404 error gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 404 }
      });

      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

      const result = await searchYCCompany('Unknown Company');

      expect(result).toBeNull();
    });

    it('should handle 429 rate limit error gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 429 }
      });

      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

      const result = await searchYCCompany('Test Company');

      expect(result).toBeNull();
    });

    it('should handle 503 service unavailable error gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 503 }
      });

      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

      const result = await searchYCCompany('Test Company');

      expect(result).toBeNull();
    });

    it('should handle network errors gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(false);

      const result = await searchYCCompany('Test Company');

      expect(result).toBeNull();
    });

    it('should handle invalid API response format', async () => {
      const mockResponse = {
        data: 'invalid response'
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await searchYCCompany('Test Company');

      expect(result).toBeNull();
    });

    it('should handle missing required fields in API response', async () => {
      const mockResponse = {
        data: [
          {
            name: 'Incomplete Company'
            // Missing batch, amount_raised, announcement_date
          }
        ]
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await searchYCCompany('Incomplete Company');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Incomplete Company');
      expect(result?.batch).toBe('Unknown');
      expect(result?.amountRaised).toBe(0);
      expect(result?.announcementDate).toBeDefined();
    });

    it('should parse amount_raised as float', async () => {
      const mockResponse = {
        data: [
          {
            name: 'Float Test Company',
            batch: 'W24',
            amount_raised: '1500000.50',
            announcement_date: '2024-01-15'
          }
        ]
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await searchYCCompany('Float Test Company');

      expect(result?.amountRaised).toBe(1500000.50);
    });

    it('should handle alternative field names (camelCase)', async () => {
      const mockResponse = {
        data: [
          {
            name: 'CamelCase Test Company',
            batch: 'W24',
            amountRaised: '1000000',
            announcementDate: '2024-01-15'
          }
        ]
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await searchYCCompany('CamelCase Test Company');

      expect(result).toEqual({
        name: 'CamelCase Test Company',
        batch: 'W24',
        amountRaised: 1000000,
        announcementDate: '2024-01-15'
      });
    });

    it('should select best match when multiple similar companies exist', async () => {
      const mockResponse = {
        data: [
          {
            name: 'Acme Solutions',
            batch: 'W23',
            amount_raised: '500000',
            announcement_date: '2023-01-15'
          },
          {
            name: 'Acme Corp',
            batch: 'W24',
            amount_raised: '1000000',
            announcement_date: '2024-01-15'
          },
          {
            name: 'Acme Industries',
            batch: 'S23',
            amount_raised: '750000',
            announcement_date: '2023-06-15'
          }
        ]
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await searchYCCompany('Acme Corp');

      // Should match exact name
      expect(result?.name).toBe('Acme Corp');
      expect(result?.batch).toBe('W24');
    });

    it('should trim whitespace from company name', async () => {
      const mockResponse = {
        data: [
          {
            name: 'Whitespace Test Company',
            batch: 'W24',
            amount_raised: '1000000',
            announcement_date: '2024-01-15'
          }
        ]
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await searchYCCompany('  Whitespace Test Company  ');

      expect(result).not.toBeNull();
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: { q: 'Whitespace Test Company' }
        })
      );
    });
  });
});
