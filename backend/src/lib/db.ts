import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { config } from 'dotenv';

// Load environment variables
config();

/**
 * Database connection singleton for serverless functions
 * 
 * This implementation prevents connection pool exhaustion in Vercel serverless
 * environments by reusing a single PrismaClient instance across function invocations.
 * 
 * In serverless environments, each function invocation may create a new connection
 * if not properly managed. This singleton pattern ensures we reuse connections
 * when the execution context is warm.
 */

// Extend the global namespace to include our prisma instance and pool
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var pool: Pool | undefined;
}

/**
 * Create a connection pool for PostgreSQL
 * 
 * The pool is reused across function invocations in serverless environments.
 * Connection pooling is essential for:
 * - Reducing connection overhead
 * - Managing database load
 * - Improving performance
 */
const pool = global.pool || new Pool({
  connectionString: process.env.DATABASE_URL,
  // Optimize for serverless: single connection per instance
  max: 1,
  // Don't wait for connections - fail fast
  connectionTimeoutMillis: 5000,
  // Close idle connections quickly
  idleTimeoutMillis: 30000,
});

// Store pool in global scope in development
if (process.env.NODE_ENV !== 'production') {
  global.pool = pool;
}

/**
 * Create Prisma adapter for PostgreSQL
 */
const adapter = new PrismaPg(pool);

/**
 * Get or create a PrismaClient instance
 * 
 * In development, we use global.prisma to prevent hot-reload from creating
 * new connections on every file change.
 * 
 * In production (serverless), the module cache persists across warm invocations,
 * so we can safely reuse the same client instance.
 * 
 * For Prisma 7, we use the PostgreSQL adapter for direct database connections.
 */
export const prisma = global.prisma || new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Store the client in global scope in development to prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Gracefully disconnect from the database
 * 
 * This should be called when the application is shutting down.
 * In serverless environments, this is typically not needed as the runtime
 * handles cleanup, but it's useful for local development and testing.
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    await pool.end();
    console.log('Database connection closed successfully');
  } catch (error) {
    console.error('Error disconnecting from database:', error);
    throw error;
  }
}

/**
 * Test database connection
 * 
 * Useful for health checks and startup validation.
 * Returns true if connection is successful, false otherwise.
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

/**
 * Handle database connection errors
 * 
 * Provides consistent error handling and logging for database operations.
 * Throws a standardized error that can be caught by API error handlers.
 */
export function handleDatabaseError(error: unknown, operation: string): never {
  console.error(`Database error during ${operation}:`, error);
  
  // Check for common Prisma errors
  if (error instanceof Error) {
    // Connection errors
    if (error.message.includes('Can\'t reach database server')) {
      throw new Error('Database connection failed. Please check your DATABASE_URL configuration.');
    }
    
    // Timeout errors
    if (error.message.includes('Timed out')) {
      throw new Error('Database operation timed out. Please try again.');
    }
    
    // Constraint violations
    if (error.message.includes('Unique constraint')) {
      throw new Error('A record with this information already exists.');
    }
    
    // Foreign key violations
    if (error.message.includes('Foreign key constraint')) {
      throw new Error('Cannot perform this operation due to related records.');
    }
  }
  
  // Generic database error
  throw new Error(`Database operation failed: ${operation}`);
}

// Export the PrismaClient type for use in other modules
export type { PrismaClient } from '@prisma/client';
