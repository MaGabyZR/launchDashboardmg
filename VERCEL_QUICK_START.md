# Vercel Quick Start - 5 Minutes to Deployment

Fast track to get your Launch Tracker Dashboard running on Vercel.

## Step 1: Create Vercel Project (2 minutes)

1. Go to [vercel.com](https://vercel.com)
2. Sign up or log in
3. Click **"Add New..."** → **"Project"**
4. Select your GitHub repository
5. Click **"Import"**
6. Vercel will auto-detect the configuration

## Step 2: Add Vercel Postgres (1 minute)

1. In your Vercel project dashboard, click **"Storage"** tab
2. Click **"Create"** → **"Postgres"**
3. Choose a region
4. Click **"Create"**
5. Wait for database to be created

## Step 3: Configure Environment Variables (1 minute)

1. Click **"Settings"** → **"Environment Variables"**
2. Click **"Add New"**
3. Add these variables:

```
DATABASE_URL = [Copy from Postgres connection string]
NODE_ENV = production
VITE_API_BASE_URL = https://your-project.vercel.app
```

4. Click **"Save"**

## Step 4: Deploy (1 minute)

1. Click **"Deployments"**
2. Click **"Deploy"** button
3. Wait for build to complete (2-3 minutes)
4. Click the deployment URL when ready

## Step 5: Run Migrations

After deployment completes:

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
```

## Done! 🎉

Your dashboard is now live at `https://your-project.vercel.app`

## Verify It Works

1. Open your Vercel project URL
2. You should see the Launch Tracker Dashboard
3. Companies should be populated with seed data
4. Try adding a new company via the UI

## Troubleshooting

### Database Connection Failed

```bash
# Pull latest environment variables
vercel env pull

# Check DATABASE_URL is set
cat .env.local | grep DATABASE_URL
```

### Build Failed

Check the build logs in Vercel dashboard:
1. Go to **Deployments**
2. Click the failed deployment
3. Scroll to see error messages

### Empty Dashboard

Run the seed script:

```bash
vercel env pull
cd backend
npm run seed
```

## Next Steps

- Add a custom domain in Vercel Settings
- Enable Vercel Analytics
- Set up GitHub Actions for CI/CD
- Monitor database usage in Storage tab

## Support

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Prisma Docs: [prisma.io/docs](https://prisma.io/docs)
- GitHub Issues: Create an issue in your repository

