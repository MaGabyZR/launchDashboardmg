# Prisma Database Schema

This directory contains the Prisma schema and migrations for the Launch Tracker Dashboard.

## Schema Overview

The database schema consists of four main models:

### Models

1. **Company** - Core entity representing a company
   - `id`: Unique identifier (CUID)
   - `name`: Company name
   - `ycBatch`: YCombinator batch (optional, e.g., "W24", "S24")
   - Relationships: One Fundraise, many LaunchPosts, one ContactInfo

2. **Fundraise** - Fundraising information for a company
   - `amount`: Amount raised (Float)
   - `announcementDate`: Date of fundraise announcement
   - `source`: Data source (MANUAL, SCRAPED, YC_API)
   - One-to-one relationship with Company

3. **LaunchPost** - Social media launch posts
   - `platform`: Platform type (X or LINKEDIN)
   - `url`: Post URL (unique)
   - `postId`: Platform-specific post identifier
   - `likes`: Number of likes/reactions
   - `dataSource`: How data was obtained (MANUAL, SCRAPED, YC_API)
   - `lastScraped`: Timestamp of last scraping attempt
   - `scrapeFailed`: Boolean flag for scraping failures
   - `scrapeError`: Error message if scraping failed
   - Many-to-one relationship with Company

4. **ContactInfo** - Contact information for a company
   - `email`: Email address (optional)
   - `phone`: Phone number (optional)
   - `linkedinUrl`: LinkedIn profile URL (optional)
   - `xHandle`: X (Twitter) handle (optional)
   - One-to-one relationship with Company

### Enums

- **Platform**: `X`, `LINKEDIN`
- **DataSource**: `MANUAL`, `SCRAPED`, `YC_API`

## Database Relationships

```
Company (1) ──── (0..1) Fundraise
   │
   ├──── (0..n) LaunchPost
   │
   └──── (0..1) ContactInfo
```

All relationships use `onDelete: Cascade`, meaning when a Company is deleted, all related records are automatically deleted.

## Indexes

The schema includes indexes on frequently queried fields:
- Company: `name`, `ycBatch`
- Fundraise: `companyId`
- LaunchPost: `companyId`, `platform`, `dataSource`
- ContactInfo: `companyId`

## Usage

### Generate Prisma Client

```bash
npm run prisma:generate
```

### Create Migration

```bash
npm run prisma:migrate
```

### Push Schema to Database (without migration)

```bash
npm run prisma:push
```

### Open Prisma Studio

```bash
npm run prisma:studio
```

## Migration Guide

### Initial Migration

The initial migration (`20240101000000_init`) has been created and includes:
- All four models (Company, Fundraise, LaunchPost, ContactInfo)
- Two enums (Platform, DataSource)
- All indexes for optimized queries
- Foreign key constraints with CASCADE delete

### Local Development Setup

1. **Install PostgreSQL locally** (if not already installed):
   - **macOS**: `brew install postgresql@15`
   - **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - **Linux**: `sudo apt-get install postgresql-15`

2. **Start PostgreSQL service**:
   - **macOS**: `brew services start postgresql@15`
   - **Windows**: PostgreSQL service starts automatically
   - **Linux**: `sudo systemctl start postgresql`

3. **Create the database**:
   ```bash
   createdb launch_tracker_dev
   ```
   
   Or using psql:
   ```bash
   psql -U postgres
   CREATE DATABASE launch_tracker_dev;
   \q
   ```

4. **Set up environment variables**:
   Create a `.env` file in the `backend` directory (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```
   
   Update the `DATABASE_URL` with your local credentials:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/launch_tracker_dev"
   ```

5. **Run the migration**:
   ```bash
   cd backend
   npm run prisma:migrate
   ```
   
   This will apply the initial migration and create all tables.

6. **Verify the migration**:
   ```bash
   npm run prisma:studio
   ```
   
   This opens Prisma Studio where you can view the database schema and data.

### Vercel Postgres Setup

1. **Create a Vercel Postgres database**:
   - Go to your Vercel project dashboard
   - Navigate to the "Storage" tab
   - Click "Create Database" and select "Postgres"
   - Choose a name (e.g., `launch-tracker-db`)
   - Select a region close to your users

2. **Get the connection string**:
   - After creation, Vercel provides a `POSTGRES_PRISMA_URL` connection string
   - Copy this connection string

3. **Set environment variable in Vercel**:
   - Go to Project Settings → Environment Variables
   - Add `DATABASE_URL` with the value from step 2
   - Make sure it's available for all environments (Production, Preview, Development)

4. **Run migrations on Vercel Postgres**:
   
   **Option A: Using Vercel CLI (Recommended)**
   ```bash
   # Install Vercel CLI if not already installed
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Link your project
   vercel link
   
   # Pull environment variables
   vercel env pull
   
   # Run migration
   cd backend
   npm run prisma:migrate
   ```
   
   **Option B: Using a deployment script**
   
   Add a `postbuild` script to `backend/package.json`:
   ```json
   {
     "scripts": {
       "postbuild": "prisma migrate deploy"
     }
   }
   ```
   
   This will automatically run migrations on each deployment.
   
   **Option C: Manual migration via Vercel dashboard**
   
   1. Go to your Vercel project
   2. Navigate to Settings → Functions
   3. Add a one-time serverless function to run migrations:
   
   Create `api/migrate.ts`:
   ```typescript
   import { PrismaClient } from '@prisma/client';
   
   export default async function handler(req, res) {
     // Add authentication here in production!
     const prisma = new PrismaClient();
     try {
       // Migrations are applied automatically when Prisma Client connects
       await prisma.$connect();
       res.status(200).json({ message: 'Migration successful' });
     } catch (error) {
       res.status(500).json({ error: error.message });
     } finally {
       await prisma.$disconnect();
     }
   }
   ```
   
   Then visit `https://your-app.vercel.app/api/migrate` once after deployment.

5. **Verify the migration**:
   ```bash
   # Using Vercel CLI
   vercel env pull
   cd backend
   npm run prisma:studio
   ```

### Migration Best Practices

1. **Always generate migrations locally first**:
   ```bash
   npm run prisma:migrate
   ```

2. **Review the generated SQL** in `prisma/migrations/[timestamp]_[name]/migration.sql`

3. **Test migrations on a staging database** before applying to production

4. **Use `prisma migrate deploy`** in production environments (CI/CD):
   ```bash
   npx prisma migrate deploy
   ```
   
   This applies pending migrations without prompting for input.

5. **Never edit migration files manually** after they've been applied

6. **Keep migrations in version control** (Git)

### Troubleshooting

**Error: Can't reach database server**
- Ensure PostgreSQL is running: `pg_isready`
- Check your `DATABASE_URL` in `.env`
- Verify the port (default: 5432)

**Error: Database does not exist**
- Create the database: `createdb launch_tracker_dev`

**Error: Migration failed**
- Check the error message in the console
- Verify your schema syntax
- Ensure no conflicting migrations exist

**Error: P1001 on Vercel**
- Verify the `DATABASE_URL` environment variable is set in Vercel
- Ensure you're using the `POSTGRES_PRISMA_URL` (not `POSTGRES_URL`)
- Check that the database region matches your function region

## Environment Variables

Make sure to set the `DATABASE_URL` environment variable in your `.env` file:

**Local Development:**
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/launch_tracker_dev"
```

**Vercel Postgres:**
```
DATABASE_URL="postgres://user:password@host.postgres.vercel-storage.com:5432/verceldb?sslmode=require"
```

The connection string format is:
```
postgresql://[user]:[password]@[host]:[port]/[database]?[parameters]
```

## Requirements Validation

This schema satisfies the following requirements:
- **7.1**: Schema for companies with name, identifier, and timestamps ✓
- **7.2**: Schema for launch posts with platform, URL, likes, data source, and company reference ✓
- **7.3**: Schema for fundraise announcements with amount, date, source, and company reference ✓
- **7.4**: Schema for contact information with email, phone, LinkedIn URL, X handle, and company reference ✓
- **7.6**: Referential integrity between companies and related data (CASCADE deletes) ✓
- **7.7**: Field to track whether data is manually entered or automatically fetched (dataSource enum) ✓
