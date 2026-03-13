# Vercel Deployment Guide

Complete guide to deploy the Launch Tracker Dashboard to Vercel with Vercel Postgres.

## Prerequisites

- Vercel account (free tier available at [vercel.com](https://vercel.com))
- GitHub account with your repository pushed
- Node.js 20.x installed locally

## Step 1: Set Up Vercel Postgres

### 1.1 Create Vercel Project

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Click "Import"

### 1.2 Add Postgres Database

1. In your Vercel project dashboard, go to **Storage** tab
2. Click **"Create"** → **"Postgres"**
3. Choose a region (closest to your users)
4. Click **"Create"**
5. Wait for database to be created (1-2 minutes)

### 1.3 Get Connection String

1. In the Postgres database card, click **"Connect"**
2. Select **"Prisma"** from the dropdown
3. Copy the connection string (starts with `postgres://`)
4. This will be your `DATABASE_URL`

## Step 2: Configure Environment Variables

### 2.1 Add to Vercel

1. In your Vercel project, go to **Settings** → **Environment Variables**
2. Add the following variables:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Vercel Postgres connection string |
| `NODE_ENV` | `production` |
| `VITE_API_BASE_URL` | `https://your-project.vercel.app` (replace with your domain) |

3. Click **"Save"**

### 2.2 Update Local .env

For local testing before deployment:

```env
DATABASE_URL="your_vercel_postgres_connection_string"
VITE_API_BASE_URL="http://localhost:3000"
NODE_ENV="development"
```

## Step 3: Run Migrations on Vercel

### 3.1 Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Link your project
vercel link

# Pull environment variables
vercel env pull

# Run migrations
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run seed
cd ..
```

### 3.2 Or Using Vercel Dashboard

1. Go to your Vercel project dashboard
2. Click **"Deployments"**
3. Click the latest deployment
4. Go to **"Functions"** tab
5. Manually trigger a migration by calling an API endpoint

## Step 4: Deploy

### 4.1 Automatic Deployment (Recommended)

Push to your main branch:

```bash
git add .
git commit -m "Deploy to Vercel"
git push origin main
```

Vercel will automatically:
1. Build your project
2. Run `npm run build`
3. Deploy frontend to CDN
4. Deploy backend as serverless functions

### 4.2 Manual Deployment

```bash
vercel --prod
```

## Step 5: Verify Deployment

1. Visit your Vercel project URL (e.g., `https://your-project.vercel.app`)
2. You should see the Launch Tracker Dashboard
3. Check that data is loading from the database

## Troubleshooting

### Database Connection Failed

**Error**: `Can't reach database server`

**Solution**:
1. Verify `DATABASE_URL` is set in Vercel environment variables
2. Check the connection string format: `postgres://user:password@host:port/database?sslmode=require`
3. Ensure Vercel Postgres is in the same region as your functions

### Migrations Not Running

**Error**: `Migration failed`

**Solution**:
```bash
# Pull latest env vars
vercel env pull

# Run migrations locally with Vercel DB
cd backend
npm run prisma:migrate
npm run seed
```

### Build Fails

**Error**: `Build failed`

**Solution**:
1. Check build logs in Vercel dashboard
2. Ensure all dependencies are installed: `npm install`
3. Verify TypeScript compiles: `npm run build`
4. Check for missing environment variables

### Seed Data Not Appearing

**Error**: Dashboard is empty

**Solution**:
```bash
# Verify seed ran successfully
vercel env pull
cd backend
npm run seed
```

## Project Structure for Vercel

```
project/
├── backend/
│   ├── api/                    # Serverless functions
│   │   ├── companies/
│   │   ├── launch-posts/
│   │   ├── refresh/
│   │   └── export/
│   ├── src/
│   │   ├── services/
│   │   └── types/
│   └── prisma/
├── frontend/
│   ├── src/
│   ├── dist/                   # Built frontend
│   └── vite.config.ts
├── vercel.json                 # Vercel configuration
└── package.json
```

## Vercel Configuration

The `vercel.json` file configures:
- Build command: `npm run build`
- Output directory: `frontend/dist`
- Serverless functions: `backend/api/**/*.ts`
- Environment: Node.js 20.x

## Performance Tips

1. **Database**: Vercel Postgres is optimized for serverless
2. **Caching**: YC API responses are cached for 24 hours
3. **Rate Limiting**: Scraper is rate-limited to 10 requests/minute
4. **Cold Starts**: First request may take 1-2 seconds

## Monitoring

### View Logs

```bash
vercel logs
```

### Monitor Database

1. Go to Vercel dashboard → Storage → Postgres
2. Click your database
3. View query metrics and usage

### Check Function Performance

1. Go to Vercel dashboard → Functions
2. View invocation count and duration

## Scaling

Vercel automatically scales your application:
- **Free tier**: 100 function invocations/day
- **Pro tier**: Unlimited invocations
- **Database**: Scales with your usage

## Next Steps

1. **Custom Domain**: Add your domain in Vercel Settings
2. **Analytics**: Enable Vercel Analytics
3. **Monitoring**: Set up error tracking with Sentry
4. **CI/CD**: Configure GitHub Actions for automated testing

## Support

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Prisma Docs: [prisma.io/docs](https://prisma.io/docs)
- GitHub Issues: Create an issue in your repository

