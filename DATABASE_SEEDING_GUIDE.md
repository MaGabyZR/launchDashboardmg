# Database Seeding Guide

This guide explains how to populate your Launch Tracker Dashboard database with sample data.

## Overview

The Launch Tracker Dashboard comes with a seed script that populates your database with 6 sample YCombinator companies:

1. **Stripe** - S10 batch, $20M fundraise
2. **Airbnb** - S09 batch, $25M fundraise
3. **Dropbox** - S07 batch, $15M fundraise
4. **Twitch** - S11 batch, $20M fundraise
5. **Figma** - S12 batch, $14M fundraise
6. **Notion** - S16 batch, $10M fundraise

Each company includes:
- YCombinator batch information
- Fundraise amount and announcement date
- Sample launch post URLs (X/Twitter and LinkedIn)
- Sample engagement metrics (likes)
- Contact information (email, LinkedIn, X handle)

## Prerequisites

- Vercel project deployed and running
- Vercel Postgres database created
- Vercel CLI installed: `npm install -g vercel`
- Node.js 20.x installed locally

## Step-by-Step Instructions

### Step 1: Link Your Vercel Project

```bash
vercel link
```

When prompted:
- Select your Vercel account
- Select your project
- Answer "N" to "Link to existing project?"

### Step 2: Pull Environment Variables

```bash
vercel env pull
```

This creates a `.env.local` file with your production database connection string.

**Verify it worked:**
```bash
cat .env.local | grep DATABASE_URL
```

You should see a connection string starting with `postgres://`

### Step 3: Navigate to Backend Directory

```bash
cd backend
```

### Step 4: Generate Prisma Client

```bash
npm run prisma:generate
```

This generates the Prisma client based on your database schema.

### Step 5: Run Database Migrations

```bash
npm run prisma:migrate
```

When prompted:
- Enter a migration name (e.g., "init" or "initial_schema")
- Wait for the migration to complete

This creates all the necessary database tables.

### Step 6: Run the Seed Script

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

### Step 7: Verify the Data

Return to your Vercel dashboard URL and refresh the page. You should now see all 6 companies with their data displayed.

### Step 8: Return to Root Directory

```bash
cd ..
```

## What the Seed Script Does

The seed script (`backend/src/seed.ts`):

1. **Clears existing data** - Removes all companies, fundraises, launch posts, and contact info
2. **Creates 6 sample companies** - Adds Stripe, Airbnb, Dropbox, Twitch, Figma, and Notion
3. **Adds fundraise data** - Includes amount and announcement date for each company
4. **Adds launch posts** - Includes sample X and LinkedIn URLs with engagement metrics
5. **Adds contact info** - Includes email, LinkedIn URL, and X handle for each company

## Troubleshooting

### Error: "Can't reach database server at `localhost:5432`"

**Cause**: The script is trying to connect to your local database instead of Vercel's.

**Solution**:
1. Make sure you ran `vercel env pull` first
2. Check that `.env.local` exists:
   ```bash
   ls -la .env.local
   ```
3. Verify it contains DATABASE_URL:
   ```bash
   cat .env.local | grep DATABASE_URL
   ```
4. If `.env.local` is missing or empty, run `vercel env pull` again

### Error: "P1002: The provided database string is invalid"

**Cause**: The DATABASE_URL environment variable is malformed.

**Solution**:
1. Delete `.env.local`:
   ```bash
   rm .env.local
   ```
2. Pull fresh environment variables:
   ```bash
   vercel env pull
   ```
3. Try seeding again:
   ```bash
   cd backend
   npm run seed
   ```

### Error: "relation \"Company\" does not exist"

**Cause**: The database tables haven't been created yet.

**Solution**: Run migrations first:
```bash
npm run prisma:migrate
```

Then run the seed script:
```bash
npm run seed
```

### Dashboard Still Shows No Data

**Cause**: The seed script ran but the frontend isn't showing the data.

**Solution**:
1. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Check browser console for errors (F12 → Console tab)
3. Verify the API is responding:
   ```bash
   curl https://your-project.vercel.app/api/companies
   ```
   You should see JSON data with the 6 companies

### Seed Script Runs But Shows No Output

**Cause**: The script might be running but output isn't visible.

**Solution**: Run with verbose output:
```bash
npm run seed -- --verbose
```

Or check the database directly using Prisma Studio:
```bash
npm run prisma:studio
```

This opens a web interface where you can browse the database tables.

## Customizing Seed Data

To modify the sample data, edit `backend/src/seed.ts`:

1. Open the file in your editor
2. Modify the `sampleCompanies` array
3. Add or remove companies as needed
4. Save the file
5. Run the seed script again:
   ```bash
   npm run seed
   ```

The script will clear existing data and create the new sample data.

## Adding More Data Later

After seeding, you can add more companies through the dashboard UI:

1. Open your dashboard
2. Click "Add Company" or "Add Launch Post"
3. Enter company name and URLs
4. The system will scrape engagement metrics or allow manual entry
5. Data is automatically saved to the database

## Resetting the Database

To clear all data and start fresh:

```bash
cd backend
npm run seed
```

The seed script automatically clears all existing data before creating new sample data.

To completely reset the database schema:

```bash
npm run prisma:migrate reset
```

**Warning**: This will delete all data and recreate the schema from scratch.

## Next Steps

After seeding:

1. **Explore the dashboard** - View all companies and their metrics
2. **Add more companies** - Use the UI to add additional companies
3. **Test refresh** - Click the refresh button on a company card to update metrics
4. **Export data** - Use the export button to download data as CSV or JSON
5. **Add contact info** - Click on a company to add contact information

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Vercel logs: Go to Deployments → Click failed deployment → View logs
3. Check Prisma documentation: https://prisma.io/docs
4. Open an issue in your GitHub repository

