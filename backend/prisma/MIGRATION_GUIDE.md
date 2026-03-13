# Database Migration Guide

## Overview

This guide provides step-by-step instructions for running database migrations for the Launch Tracker Dashboard in both local development and production (Vercel Postgres) environments.

## Migration Files

The initial migration (`20240101000000_init`) includes:

### Tables Created
1. **Company** - Core company entity with name, YC batch, and timestamps
2. **Fundraise** - Fundraising data with amount, date, and source
3. **LaunchPost** - Social media posts with platform, URL, likes, and scraping metadata
4. **ContactInfo** - Contact information (email, phone, LinkedIn, X handle)

### Enums Created
- **Platform**: `X`, `LINKEDIN`
- **DataSource**: `MANUAL`, `SCRAPED`, `YC_API`

### Indexes Created
- Company: `name`, `ycBatch`
- Fundraise: `companyId` (unique)
- LaunchPost: `companyId`, `platform`, `dataSource`, `url` (unique)
- ContactInfo: `companyId` (unique)

### Foreign Keys
All relationships use `CASCADE` delete:
- Fundraise → Company
- LaunchPost → Company
- ContactInfo → Company

## Local Development Migration

### Prerequisites
- PostgreSQL 15+ installed and running
- Node.js 20+ installed
- Environment variables configured in `backend/.env`

### Step-by-Step Instructions

#### 1. Install PostgreSQL (if not already installed)

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Windows:**
- Download installer from [postgresql.org](https://www.postgresql.org/download/windows/)
- Run installer and follow prompts
- PostgreSQL service starts automatically

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install postgresql-15
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 2. Create Database

```bash
# Using createdb command
createdb launch_tracker_dev

# OR using psql
psql -U postgres
CREATE DATABASE launch_tracker_dev;
\q
```

#### 3. Configure Environment Variables

Create `backend/.env` file (copy from `.env.example`):

```bash
cd backend
cp .env.example .env
```

Update the `DATABASE_URL`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/launch_tracker_dev"
```

**Connection String Format:**
```
postgresql://[username]:[password]@[host]:[port]/[database]
```

Common configurations:
- Default PostgreSQL user: `postgres`
- Default password: `postgres` (or empty on macOS)
- Default host: `localhost`
- Default port: `5432`

#### 4. Generate Prisma Client

```bash
npm run prisma:generate
```

**Expected Output:**
```
✔ Generated Prisma Client (v7.5.0) to ./node_modules/@prisma/client in 140ms
```

#### 5. Run Migration

```bash
npm run prisma:migrate
```

This will:
1. Detect the pending migration (`20240101000000_init`)
2. Apply the migration SQL to your database
3. Update the `_prisma_migrations` table
4. Regenerate Prisma Client

**Expected Output:**
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "launch_tracker_dev" at "localhost:5432"

Applying migration `20240101000000_init`

The following migration(s) have been applied:

migrations/
  └─ 20240101000000_init/
    └─ migration.sql

✔ Generated Prisma Client
```

#### 6. Verify Migration

Open Prisma Studio to inspect the database:

```bash
npm run prisma:studio
```

This opens a browser at `http://localhost:5555` where you can:
- View all tables
- Inspect schema structure
- Add test data
- Run queries

**Expected Tables:**
- Company
- Fundraise
- LaunchPost
- ContactInfo
- _prisma_migrations (Prisma internal)

## Vercel Postgres Migration

### Prerequisites
- Vercel account (free tier)
- Vercel CLI installed: `npm install -g vercel`
- Project deployed to Vercel
- Vercel Postgres database created

### Step-by-Step Instructions

#### 1. Create Vercel Postgres Database

1. Go to [vercel.com](https://vercel.com) and open your project
2. Navigate to **Storage** tab
3. Click **Create Database**
4. Select **Postgres**
5. Choose a name (e.g., `launch-tracker-db`)
6. Select a region (choose closest to your users)
7. Click **Create**

**Free Tier Limits:**
- 1 GB storage
- 60 hours compute time/month
- Unlimited queries

#### 2. Get Connection String

After database creation:

1. Click on your database in the Storage tab
2. Go to **Settings** → **Connection String**
3. Copy the **POSTGRES_PRISMA_URL** (not POSTGRES_URL)

**Format:**
```
postgres://user:password@host.postgres.vercel-storage.com:5432/verceldb?sslmode=require
```

#### 3. Set Environment Variable in Vercel

1. Go to **Settings** → **Environment Variables**
2. Click **Add New**
3. Name: `DATABASE_URL`
4. Value: Paste the connection string from step 2
5. Select all environments: **Production**, **Preview**, **Development**
6. Click **Save**

#### 4. Run Migration

**Option A: Using Vercel CLI (Recommended)**

```bash
# Login to Vercel
vercel login

# Link your project (if not already linked)
vercel link

# Pull environment variables
vercel env pull

# Navigate to backend
cd backend

# Run migration
npm run prisma:migrate
```

**Option B: Automatic Migration on Deployment**

Add to `backend/package.json`:

```json
{
  "scripts": {
    "postbuild": "prisma migrate deploy"
  }
}
```

Then redeploy:

```bash
vercel --prod
```

**Option C: Manual Migration**

```bash
# Set DATABASE_URL locally
export DATABASE_URL="postgres://user:password@host.postgres.vercel-storage.com:5432/verceldb?sslmode=require"

# Run migration
cd backend
npx prisma migrate deploy
```

#### 5. Verify Migration

```bash
# Pull environment variables
vercel env pull

# Open Prisma Studio
cd backend
npm run prisma:studio
```

Or check in Vercel dashboard:
1. Go to **Storage** → Your database
2. Click **Query** tab
3. Run: `SELECT * FROM _prisma_migrations;`

**Expected Result:**
One row with migration name `20240101000000_init` and `finished_at` timestamp.

## Troubleshooting

### Error: Can't reach database server

**Symptoms:**
```
Error: P1001: Can't reach database server at `localhost:5432`
```

**Solutions:**
1. Check if PostgreSQL is running:
   ```bash
   # macOS/Linux
   pg_isready
   
   # Windows
   sc query postgresql-x64-15
   ```

2. Verify DATABASE_URL in `.env`:
   ```bash
   cat backend/.env | grep DATABASE_URL
   ```

3. Test connection manually:
   ```bash
   psql -U postgres -h localhost -p 5432 -d launch_tracker_dev
   ```

### Error: Database does not exist

**Symptoms:**
```
Error: P1003: Database `launch_tracker_dev` does not exist
```

**Solution:**
```bash
createdb launch_tracker_dev
```

### Error: Authentication failed

**Symptoms:**
```
Error: P1001: Authentication failed for user `postgres`
```

**Solutions:**
1. Check username and password in DATABASE_URL
2. Reset PostgreSQL password:
   ```bash
   # macOS/Linux
   sudo -u postgres psql
   ALTER USER postgres PASSWORD 'newpassword';
   \q
   ```

3. Update `.env` with correct credentials

### Error: Migration already applied

**Symptoms:**
```
Error: Migration `20240101000000_init` has already been applied
```

**Solution:**
This is normal if you've already run the migration. To verify:

```bash
npx prisma migrate status
```

### Error: Vercel Postgres connection timeout

**Symptoms:**
```
Error: P1001: Can't reach database server (timeout)
```

**Solutions:**
1. Verify DATABASE_URL includes `?sslmode=require`
2. Check database region matches function region
3. Ensure database is not paused (free tier auto-pauses after inactivity)
4. Wake up database by visiting Vercel dashboard → Storage → Your database

### Error: Schema drift detected

**Symptoms:**
```
Error: Schema drift detected. Your database schema is not in sync with your migration history.
```

**Solution:**
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or create a new migration to fix drift
npx prisma migrate dev --name fix_drift
```

## Migration Best Practices

### 1. Always Test Locally First
```bash
# Test migration on local database
cd backend
npm run prisma:migrate

# Verify schema
npm run prisma:studio
```

### 2. Review Generated SQL
Before applying to production, review:
```bash
cat backend/prisma/migrations/[timestamp]_[name]/migration.sql
```

### 3. Backup Production Database
Before running migrations on Vercel Postgres:
```bash
# Export data
npx prisma db pull
npx prisma db push --force-reset
```

### 4. Use `migrate deploy` in Production
Never use `migrate dev` in production:
```bash
# Development (interactive)
npm run prisma:migrate

# Production (non-interactive)
npx prisma migrate deploy
```

### 5. Keep Migrations in Version Control
Always commit migration files:
```bash
git add backend/prisma/migrations/
git commit -m "Add initial database migration"
```

### 6. Never Edit Applied Migrations
Once a migration is applied, never edit it. Create a new migration instead:
```bash
# Make schema changes in schema.prisma
# Then create new migration
npm run prisma:migrate
```

## Common Commands Reference

### Development
```bash
# Generate Prisma Client
npm run prisma:generate

# Create and apply migration
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio

# Check migration status
npx prisma migrate status

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Production
```bash
# Apply pending migrations (non-interactive)
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Resolve migration issues
npx prisma migrate resolve --applied [migration_name]
npx prisma migrate resolve --rolled-back [migration_name]
```

### Database Management
```bash
# Push schema without migration (development only)
npm run prisma:push

# Pull schema from database
npx prisma db pull

# Seed database (if seed script exists)
npx prisma db seed
```

## Next Steps

After successful migration:

1. **Verify Schema**: Open Prisma Studio and check all tables exist
2. **Test Connections**: Run a simple query to ensure connectivity
3. **Add Test Data**: Insert sample companies to test relationships
4. **Continue Implementation**: Proceed to Task 2.3 (Prisma client setup)

## Support

For more information:
- **Prisma Documentation**: https://www.prisma.io/docs
- **Vercel Postgres Docs**: https://vercel.com/docs/storage/vercel-postgres
- **Project README**: `backend/prisma/README.md`
- **Deployment Guide**: `DEPLOYMENT.md`
- **Quick Start**: `QUICKSTART.md`
