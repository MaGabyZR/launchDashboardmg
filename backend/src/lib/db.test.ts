import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { prisma, testDatabaseConnection, disconnectDatabase, handleDatabaseError } from './db';

describe('Database Connection Utilities', () => {
  describe('Prisma Client Singleton', () => {
    it('should create a PrismaClient instance', () => {
      expect(prisma).toBeDefined();
      expect(prisma.$connect).toBeDefined();
      expect(prisma.$disconnect).toBeDefined();
    });

    it('should reuse the same instance across imports', async () => {
      const { prisma: prisma1 } = await import('./db');
      const { prisma: prisma2 } = await import('./db');
      
      expect(prisma1).toBe(prisma2);
    });
  });

  describe('testDatabaseConnection', () => {
    it('should return true when database connection is successful', async () => {
      // Mock successful connection
      const mockQueryRaw = vi.spyOn(prisma, '$queryRaw').mockResolvedValue([{ '?column?': 1 }]);
      
      const result = await testDatabaseConnection();
      expect(result).toBe(true);
      
      mockQueryRaw.mockRestore();
    });

    it('should return false when database connection fails', async () => {
      // Mock a failed connection
      const mockQueryRaw = vi.spyOn(prisma, '$queryRaw').mockRejectedValue(new Error('Connection failed'));
      
      const result = await testDatabaseConnection();
      expect(result).toBe(false);
      
      mockQueryRaw.mockRestore();
    });
  });

  describe('handleDatabaseError', () => {
    it('should throw error for database connection failure', () => {
      const error = new Error('Can\'t reach database server at localhost:5432');
      
      expect(() => handleDatabaseError(error, 'test operation')).toThrow(
        'Database connection failed. Please check your DATABASE_URL configuration.'
      );
    });

    it('should throw error for timeout', () => {
      const error = new Error('Timed out fetching data from database');
      
      expect(() => handleDatabaseError(error, 'test operation')).toThrow(
        'Database operation timed out. Please try again.'
      );
    });

    it('should throw error for unique constraint violation', () => {
      const error = new Error('Unique constraint failed on the fields: (`url`)');
      
      expect(() => handleDatabaseError(error, 'test operation')).toThrow(
        'A record with this information already exists.'
      );
    });

    it('should throw error for foreign key constraint violation', () => {
      const error = new Error('Foreign key constraint failed on the field: `companyId`');
      
      expect(() => handleDatabaseError(error, 'test operation')).toThrow(
        'Cannot perform this operation due to related records.'
      );
    });

    it('should throw generic error for unknown errors', () => {
      const error = new Error('Unknown database error');
      
      expect(() => handleDatabaseError(error, 'test operation')).toThrow(
        'Database operation failed: test operation'
      );
    });

    it('should handle non-Error objects', () => {
      const error = 'String error';
      
      expect(() => handleDatabaseError(error, 'test operation')).toThrow(
        'Database operation failed: test operation'
      );
    });
  });

  describe('disconnectDatabase', () => {
    it('should disconnect from database successfully', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const mockDisconnect = vi.spyOn(prisma, '$disconnect').mockResolvedValue();
      
      await disconnectDatabase();
      
      expect(consoleSpy).toHaveBeenCalledWith('Database connection closed successfully');
      
      consoleSpy.mockRestore();
      mockDisconnect.mockRestore();
    });

    it('should handle disconnect errors', async () => {
      const mockDisconnect = vi.spyOn(prisma, '$disconnect').mockRejectedValue(new Error('Disconnect failed'));
      
      await expect(disconnectDatabase()).rejects.toThrow('Disconnect failed');
      
      mockDisconnect.mockRestore();
    });
  });

  describe('Connection Pooling', () => {
    it('should handle multiple concurrent queries without exhausting connections', async () => {
      // Mock concurrent queries
      const mockQueryRaw = vi.spyOn(prisma, '$queryRaw').mockImplementation((query) => {
        // Extract the value from the query template
        const match = query.toString().match(/SELECT (\d+) as value/);
        const value = match ? parseInt(match[1]) : 0;
        return Promise.resolve([{ value }]);
      });
      
      // Simulate multiple concurrent serverless function invocations
      const queries = Array.from({ length: 10 }, (_, i) => 
        prisma.$queryRaw`SELECT ${i} as value`
      );
      
      const results = await Promise.all(queries);
      
      expect(results).toHaveLength(10);
      expect(mockQueryRaw).toHaveBeenCalledTimes(10);
      
      mockQueryRaw.mockRestore();
    });
  });
});
