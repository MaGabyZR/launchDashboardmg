import { beforeAll, afterAll } from 'vitest';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Ensure DATABASE_URL is set for tests
if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL not set, using default test database URL');
  process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/launch_tracker_test';
}

// Global test setup
beforeAll(async () => {
  // Any global setup can go here
  console.log('Running tests with DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
});

// Global test teardown
afterAll(async () => {
  // Any global cleanup can go here
});
