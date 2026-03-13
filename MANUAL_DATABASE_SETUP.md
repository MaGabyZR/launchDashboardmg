# Manual Database Setup - Get Connection String from Vercel

Since `vercel env pull` didn't pull the DATABASE_URL, you need to manually get it from Vercel and add it to your `.env.local` file.

## Step 1: Get Your Database Connection String from Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your project: **launch-dashboardmg**
3. Click the **Storage** tab
4. Click on your **Postgres** database (should be named something like "neon-aureolin-river")
5. Click the **Connect** button
6. Select **Prisma** from the dropdown
7. Copy the entire connection string (it starts with `postgres://`)

The connection string looks like:
```
postgres://user:password@host:port/database?sslmode=require
```

## Step 2: Add to .env.local

1. Open `backend/.env.local` in your editor
2. Add this line (replace with your actual connection string):
```
DATABASE_URL="postgres://your_user:your_password@your_host:5432/your_database?sslmode=require"
```

3. Save the file

## Step 3: Run Migrations

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

When prompted for a migration name, type: `init`

## Step 4: Seed the Database

```bash
npm run seed
```

You should see:
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

## Step 5: Return to Root

```bash
cd ..
```

## Step 6: Verify

Refresh your Vercel dashboard URL in your browser. You should now see 6 companies with their data.

## Troubleshooting

### Connection String Not Working

1. Make sure you copied the ENTIRE connection string from Vercel
2. Check that it includes the `?sslmode=require` at the end
3. Verify there are no extra spaces or line breaks

### Still Getting "Can't reach database server"

1. Double-check the connection string is correct
2. Make sure the database is running in Vercel (check Storage tab)
3. Try deleting `.env.local` and creating it fresh with the connection string

### Seed Script Still Fails

1. Make sure migrations ran successfully first
2. Check that the connection string is in `.env.local`
3. Try running just the migration first:
   ```bash
   npm run prisma:migrate
   ```

## Getting Help

If you're still stuck:
1. Check the Vercel Storage tab to confirm the database exists
2. Verify the connection string format
3. Make sure `.env.local` is in the `backend/` directory (not root)

