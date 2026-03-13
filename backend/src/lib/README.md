# Database Connection Utilities

This directory contains database connection utilities optimized for Vercel serverless functions.

## Overview

The `db.ts` module provides a singleton PrismaClient instance that prevents connection pool exhaustion in serverless environments. This is critical for Vercel deployments where each function invocation could potentially create new database connections.

## Usage

### Basic Usage

```typescript
import { prisma } from './lib/db';

// Query the database
const companies = await prisma.company.findMany({
  include: {
    launchPosts: true,
    fundraise: true,
  }
});
```

### Error Handling

```typescript
import { prisma, handleDatabaseError } from './lib/db';

try {
  const company = await prisma.company.create({
    data: {
      name: 'Example Corp',
    }
  });
} catch (error) {
  handleDatabaseError(error, 'creating company');
}
```

### Health Checks

```typescript
import { testDatabaseConnection } from './lib/db';

const isConnected = await testDatabaseConnection();
if (!isConnected) {
  console.error('Database connection failed');
}
```

### Graceful Shutdown

```typescript
import { disconnectDatabase } from './lib/db';

// In your shutdown handler
process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});
```

## How It Works

### Singleton Pattern

The module uses a singleton pattern to ensure only one PrismaClient instance exists:

- **Development**: The client is stored in `global.prisma` to survive hot-reloads
- **Production**: The module cache persists across warm serverless invocations

### Connection Pooling

Prisma automatically manages connection pooling. The default pool size is calculated based on:

```
pool_size = (num_physical_cpus * 2) + 1
```

For Vercel serverless functions (typically 1 vCPU), this means ~3 connections per instance.

### Connection Reuse

When a serverless function is "warm" (recently invoked), the execution context persists, allowing connection reuse. This significantly reduces:

- Connection overhead
- Database load
- Function cold start time

## Configuration

Database connection is configured via environment variables:

```env
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
```

### Vercel Postgres

For Vercel Postgres, the connection string is automatically provided:

1. Create a Postgres database in Vercel dashboard
2. Link it to your project
3. Vercel automatically sets `DATABASE_URL`

### Connection String Parameters

Recommended parameters for Vercel Postgres:

```
?sslmode=require&connection_limit=1&pool_timeout=0
```

- `sslmode=require`: Enforce SSL connections
- `connection_limit=1`: Limit connections per Prisma Client instance
- `pool_timeout=0`: Don't wait for connections (fail fast)

## Error Handling

The `handleDatabaseError` function provides consistent error handling:

| Error Type | User-Friendly Message |
|------------|----------------------|
| Connection failure | "Database connection failed. Please check your DATABASE_URL configuration." |
| Timeout | "Database operation timed out. Please try again." |
| Unique constraint | "A record with this information already exists." |
| Foreign key constraint | "Cannot perform this operation due to related records." |
| Unknown | "Database operation failed: {operation}" |

## Testing

Tests are located in `db.test.ts` and cover:

- Singleton instance creation
- Connection testing
- Error handling
- Concurrent query handling

Run tests:

```bash
npm test
```

## Best Practices

### DO

✅ Import the singleton instance:
```typescript
import { prisma } from './lib/db';
```

✅ Use error handling:
```typescript
try {
  await prisma.company.create({ data });
} catch (error) {
  handleDatabaseError(error, 'operation name');
}
```

✅ Close connections in long-running processes:
```typescript
await disconnectDatabase();
```

### DON'T

❌ Create new PrismaClient instances:
```typescript
// BAD - creates multiple connections
const prisma = new PrismaClient();
```

❌ Disconnect in serverless functions:
```typescript
// BAD - breaks connection reuse
await prisma.$disconnect();
```

❌ Ignore connection errors:
```typescript
// BAD - no error handling
await prisma.company.create({ data });
```

## Monitoring

Monitor database connections in production:

1. **Vercel Dashboard**: Check function logs for connection errors
2. **Database Dashboard**: Monitor active connections and pool usage
3. **Application Logs**: Track `handleDatabaseError` calls

## Troubleshooting

### "Can't reach database server"

- Verify `DATABASE_URL` is set correctly
- Check database is running and accessible
- Verify SSL mode matches database requirements

### "Too many connections"

- Ensure you're using the singleton instance
- Check for connection leaks (missing error handling)
- Consider increasing database connection limit

### "Connection timeout"

- Check network connectivity
- Verify database is not overloaded
- Consider increasing `pool_timeout` parameter

## References

- [Prisma Connection Management](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [Vercel Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
