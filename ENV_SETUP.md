# Environment Variables Setup

Quick reference for setting up environment variables for the Launch Tracker Dashboard.

## Local Development

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your local values:**
   ```bash
   # Minimum required for local development
   DATABASE_URL="postgresql://user:password@localhost:5432/launch_tracker_dev"
   VITE_API_BASE_URL="http://localhost:3000"
   ```

3. **Start the development servers:**
   ```bash
   npm run dev
   ```

## Vercel Production Deployment

### Required Environment Variables

Add these in your Vercel project settings (**Settings** > **Environment Variables**):

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `postgres://...` | Vercel Postgres connection string (get from Storage tab) |
| `NODE_ENV` | `production` | Environment identifier |

### How to Add Environment Variables in Vercel

1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **Settings** tab
4. Click **Environment Variables** in the sidebar
5. Add each variable:
   - **Key**: Variable name (e.g., `DATABASE_URL`)
   - **Value**: Variable value
   - **Environments**: Select Production, Preview, and Development as needed
6. Click **Save**
7. Redeploy your project for changes to take effect

### Getting the DATABASE_URL

1. In Vercel Dashboard, go to your project
2. Click **Storage** tab
3. Click **Create Database** > **Postgres**
4. Name your database (e.g., `launch-tracker-db`)
5. Click **Create**
6. Copy the connection string shown
7. Add it as `DATABASE_URL` environment variable

## Optional Environment Variables

These have defaults but can be customized:

```bash
# Scraping Configuration
SCRAPER_MAX_REQUESTS_PER_MINUTE=10
SCRAPER_TIMEOUT_MS=10000
SCRAPER_MAX_RETRIES=3

# YC API Configuration
YC_API_BASE_URL="https://api.ycombinator.com/v0.1"
YC_API_CACHE_TTL_HOURS=24
```

## Environment Variable Reference

### Backend Variables

- **DATABASE_URL** (Required)
  - PostgreSQL connection string
  - Format: `postgres://user:password@host:port/database?sslmode=require`
  - Used by Prisma ORM for database connections

- **NODE_ENV** (Optional, default: "development")
  - Environment identifier
  - Values: `development`, `production`, `test`

- **SCRAPER_MAX_REQUESTS_PER_MINUTE** (Optional, default: 10)
  - Rate limit for web scraping requests
  - Prevents hitting platform rate limits

- **SCRAPER_TIMEOUT_MS** (Optional, default: 10000)
  - Timeout for scraping requests in milliseconds
  - Prevents hanging requests

- **SCRAPER_MAX_RETRIES** (Optional, default: 3)
  - Maximum retry attempts for failed scraping
  - Uses exponential backoff

- **YC_API_BASE_URL** (Optional, default: "https://api.ycombinator.com/v0.1")
  - Base URL for YCombinator API
  - Free API from yc-oss/api repository

- **YC_API_CACHE_TTL_HOURS** (Optional, default: 24)
  - Cache duration for YC API responses in hours
  - Reduces redundant API calls

### Frontend Variables

- **VITE_API_BASE_URL** (Optional, default: relative URLs)
  - Backend API base URL
  - Local: `http://localhost:3000`
  - Production: Leave empty or set to your Vercel domain

- **VITE_NODE_ENV** (Optional, default: "development")
  - Frontend environment identifier

## Security Best Practices

1. **Never commit `.env` files** - They're in `.gitignore` by default
2. **Use different credentials** for development and production
3. **Rotate database passwords** periodically
4. **Use Vercel's secret management** - Variables are encrypted at rest
5. **Limit environment variable access** - Only add to environments that need them

## Troubleshooting

### "DATABASE_URL is not defined" error

- **Local**: Ensure `.env` file exists in project root with `DATABASE_URL` set
- **Vercel**: Check that `DATABASE_URL` is added in project environment variables

### "Cannot connect to database" error

- Verify the connection string format includes `?sslmode=require` for Vercel Postgres
- Check that the database is running and accessible
- Ensure firewall rules allow connections (for local databases)

### Frontend can't reach backend API

- **Local**: Verify `VITE_API_BASE_URL` is set to `http://localhost:3000`
- **Production**: Ensure backend is deployed and routes are configured in `vercel.json`

### Changes not taking effect

- **Local**: Restart development servers after changing `.env`
- **Vercel**: Redeploy the project after adding/changing environment variables
