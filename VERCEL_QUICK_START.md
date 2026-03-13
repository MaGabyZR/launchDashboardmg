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

## Step 5: Populate Database with Seed Data

After deployment completes, you need to run migrations and seed the database:

### 5.1 Install Vercel CLI (if not already installed)

```bash
npm install -g vercel
```

### 5.2 Link Your Project

```bash
vercel link
```

When prompted:
- Select your Vercel account
- Select your project
- Answer "N" to "Link to existing project?" (unless you want to link to a different project)

### 5.3 Pull Environment Variables

```bash
vercel env pull
```

This creates a `.env.local` file with your production database connection string.

### 5.4 Generate Prisma Client

```bash
cd backend
npm run prisma:generate
```

### 5.5 Run Database Migrations

```bash
npm run prisma:migrate
```

When prompted, give the migration a name (e.g., "init").

### 5.6 Seed the Database with Sample Data

```bash
npm run seed
```

You should see output like:
```
🌱 Starting database seed...
🗑️  Clearing existing data...
📝 Creating companies...
✅ Created: Stripe
✅ Created: Airbnb
✅ Created: Dropbox
✅ Created: Twitch
✅ Created: Figma
✅ Created: Notion
✨ Seed completed successfully!
```

### 5.7 Return to Root Directory

```bash
cd ..
```

## Done! 🎉

Your dashboard is now live at `https://your-project.vercel.app`

## Verify It Works

1. Open your Vercel project URL
2. You should see the Launch Tracker Dashboard
3. Companies should be populated with seed data
4. Try adding a new company via the UI

## Troubleshooting

### Empty Dashboard After Deployment

**Problem**: You deployed successfully but the dashboard shows no companies.

**Solution**: You need to run the seed script on your production database.

```bash
# Pull latest environment variables
vercel env pull

# Navigate to backend
cd backend

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed the database
npm run seed

# Return to root
cd ..
```

After running these commands, refresh your Vercel dashboard URL in the browser. You should now see 6 sample companies (Stripe, Airbnb, Dropbox, Twitch, Figma, Notion) with launch data.

### Database Connection Failed

**Problem**: You get an error like "Can't reach database server"

**Solution**:
1. Make sure you've set `DATABASE_URL` in Vercel Settings → Environment Variables
2. Pull the latest environment variables:
   ```bash
   vercel env pull
   ```
3. Check that `.env.local` contains a valid connection string:
   ```bash
   cat .env.local | grep DATABASE_URL
   ```
4. The connection string should start with `postgres://` and contain your database credentials

### Build Failed

**Problem**: Deployment failed with TypeScript or build errors.

**Solution**: Check the build logs in Vercel dashboard:
1. Go to **Deployments**
2. Click the failed deployment
3. Scroll down to see error messages
4. Common issues:
   - Missing environment variables → Add them in Settings → Environment Variables
   - TypeScript errors → Run `npm run build` locally to debug
   - Prisma Client not generated → Run `npm run prisma:generate` locally

### Seed Script Fails with "P1001" Error

**Problem**: Running `npm run seed` gives error: "Can't reach database server at `localhost:5432`"

**Solution**: This means the script is trying to connect to your local database instead of Vercel's.

1. Make sure you ran `vercel env pull` first
2. Check that `.env.local` exists and contains `DATABASE_URL`
3. Run the seed script again:
   ```bash
   npm run seed
   ```

If it still fails, the `.env.local` file might not have the correct connection string. Try:
```bash
# Delete the old .env.local
rm .env.local

# Pull fresh environment variables
vercel env pull

# Try seeding again
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

