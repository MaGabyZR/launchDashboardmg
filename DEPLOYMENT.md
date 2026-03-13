# Deployment Guide - Launch Tracker Dashboard

This guide covers deploying the Launch Tracker Dashboard to Vercel's free tier.

## Prerequisites

- Vercel account (free tier)
- GitHub repository connected to Vercel
- Node.js 20.x or later installed locally

## Environment Variables

### Required Variables

The following environment variable **must** be configured in your Vercel project:

#### `DATABASE_URL`
- **Description**: PostgreSQL connection string for Vercel Postgres
- **Format**: `postgres://user:password@host:port/database?sslmode=require`
- **How to get it**: 
  1. Go to your Vercel project dashboard
  2. Navigate to Storage > Postgres
  3. Create a new Postgres database (free tier: 1GB storage)
  4. Copy the connection string from the database settings
  5. Add it as an environment variable named `DATABASE_URL`

### Optional Variables

These variables have sensible defaults but can be customized:

- `SCRAPER_MAX_REQUESTS_PER_MINUTE`: Rate limit for web scraping (default: 10)
- `SCRAPER_TIMEOUT_MS`: Timeout for scraping requests in milliseconds (default: 10000)
- `SCRAPER_MAX_RETRIES`: Maximum retry attempts for failed scraping (default: 3)
- `YC_API_BASE_URL`: YCombinator API base URL (default: https://api.ycombinator.com/v0.1)
- `YC_API_CACHE_TTL_HOURS`: Cache duration for YC API responses (default: 24)

## Vercel Configuration

The `vercel.json` file is pre-configured with:

### Build Settings
- **Build Command**: `npm run build` (builds both frontend and backend)
- **Output Directory**: `frontend/dist` (static frontend assets)
- **Install Command**: `npm install` (installs all workspace dependencies)
- **Framework**: None (custom monorepo setup)

### Serverless Functions
- **Runtime**: Node.js 20.x
- **Location**: `backend/api/**/*.ts`
- **Max Duration**: 60 seconds (Vercel free tier limit)

### Routing
1. `/api/*` routes to serverless functions in `backend/api/`
2. All other routes serve static frontend from `frontend/dist/`

## Deployment Steps

### 1. Local Development Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd launch-tracker-dashboard

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your local database credentials
# For local development, you can use a local PostgreSQL instance
nano .env

# Run database migrations (after setting up Prisma in task 2.1)
# npm run prisma:migrate

# Start development servers
npm run dev
```

### 2. Deploy to Vercel

#### Option A: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

#### Option B: Deploy via GitHub Integration

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the configuration from `vercel.json`
5. Add the `DATABASE_URL` environment variable in project settings
6. Click "Deploy"

### 3. Configure Vercel Postgres

1. In your Vercel project dashboard, go to **Storage** tab
2. Click **Create Database** > **Postgres**
3. Choose a database name (e.g., `launch-tracker-db`)
4. Click **Create**
5. Copy the connection string
6. Go to **Settings** > **Environment Variables**
7. Add `DATABASE_URL` with the connection string
8. Redeploy the project to apply the new environment variable

### 4. Run Database Migrations

After deploying and setting up the database, you need to apply the database schema:

#### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Pull environment variables (includes DATABASE_URL)
vercel env pull

# Navigate to backend directory
cd backend

# Run migrations
npm run prisma:migrate
```

#### Option B: Automatic Migrations on Deployment

Add a `postbuild` script to `backend/package.json`:

```json
{
  "scripts": {
    "postbuild": "prisma migrate deploy"
  }
}
```

Then update the root `package.json` build script:

```json
{
  "scripts": {
    "build": "npm run build --workspace=frontend && npm run build --workspace=backend && cd backend && npx prisma migrate deploy"
  }
}
```

This will automatically apply pending migrations on each deployment.

#### Option C: Manual Migration via Database Client

If you prefer to run migrations manually:

1. Get your Vercel Postgres connection string from the Vercel dashboard
2. Set it locally:
   ```bash
   export DATABASE_URL="<your-vercel-postgres-connection-string>"
   ```
3. Run migrations:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

#### Verify Migration Success

After running migrations, verify the schema:

```bash
# Using Vercel CLI
vercel env pull
cd backend
npm run prisma:studio
```

This opens Prisma Studio where you can view the database schema and data.

**Expected Tables:**
- `Company` - Core company entity
- `Fundraise` - Fundraising information
- `LaunchPost` - Social media launch posts
- `ContactInfo` - Contact information
- `_prisma_migrations` - Migration history (created by Prisma)

**Expected Enums:**
- `Platform` - X, LINKEDIN
- `DataSource` - MANUAL, SCRAPED, YC_API

## Vercel Free Tier Limits

The application is designed to stay within Vercel's free tier constraints:

- **Bandwidth**: 100 GB/month
- **Serverless Function Invocations**: 100 per day per function
- **Function Timeout**: 60 seconds max
- **Postgres Storage**: 1 GB
- **Compute Time**: 60 hours/month

### Optimization Strategies

To stay within limits:
1. Frontend caching with 5-minute TTL reduces API calls
2. Batch scraping operations to minimize function invocations
3. Request debouncing on refresh actions
4. Static generation for dashboard shell
5. Lazy loading of company details

## Monitoring

Monitor your usage in the Vercel dashboard:
- **Analytics**: Track bandwidth and function invocations
- **Logs**: View serverless function logs for debugging
- **Postgres**: Monitor database storage and query performance

## Troubleshooting

### Build Failures

If the build fails:
1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json` (not devDependencies for production code)
3. Verify TypeScript compilation succeeds locally: `npm run build`

### Database Connection Issues

If serverless functions can't connect to the database:
1. Verify `DATABASE_URL` is set in Vercel environment variables
2. Check the connection string format includes `?sslmode=require`
3. Ensure the database is in the same region as your Vercel project (for lower latency)

### Function Timeout Errors

If functions timeout (60s limit):
1. Optimize scraping operations (reduce retries, increase timeout thresholds)
2. Consider breaking large operations into smaller batches
3. Use async processing for non-critical operations

## Security Notes

- Never commit `.env` files to version control
- Use Vercel's environment variable encryption for sensitive data
- Rotate database credentials periodically
- Monitor function logs for suspicious activity

## Next Steps

After deployment:
1. Test all API endpoints with production URLs
2. Verify scraping functionality works in serverless environment
3. Monitor free tier usage for the first week
4. Set up alerts for approaching usage limits (if available)
