# Setup Instructions - Launch Tracker Dashboard

Follow these steps to get the dashboard running with sample data.

## Prerequisites

- Node.js 20.x or later
- PostgreSQL (local or Vercel Postgres)
- npm or yarn

## Step 1: Install Dependencies

```bash
npm install
```

This installs dependencies for both frontend and backend.

## Step 2: Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/launch_tracker_dev"
VITE_API_BASE_URL="http://localhost:3000"
```

### For Local PostgreSQL:

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
createdb launch_tracker_dev
```

**Windows:**
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

**Linux:**
```bash
sudo apt-get install postgresql-15
sudo systemctl start postgresql
createdb launch_tracker_dev
```

## Step 3: Set Up Database

```bash
cd backend

# Generate Prisma Client
npm run prisma:generate

# Run migrations to create tables
npm run prisma:migrate

# Seed database with sample data
npm run seed
```

Expected output:
```
✨ Seed completed successfully!
```

## Step 4: Start Development Servers

From the root directory:

```bash
npm run dev
```

This starts:
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend**: http://localhost:3000 (Express server)

## Step 5: View the Dashboard

Open your browser and navigate to:
```
http://localhost:5173
```

You should see the dashboard populated with 6 sample YC companies:
- Stripe
- Airbnb
- Dropbox
- Twitch
- Figma
- Notion

Each company has:
- Launch posts with engagement metrics
- Fundraise information
- Contact information
- Data source badges

## Features to Try

### 1. Filter & Sort
- Sort by Date Added, Engagement, or Fundraise Amount
- Toggle between ascending/descending order
- Filter by minimum engagement
- Filter by contact info availability

### 2. Add New Companies
- Click "➕ Add Launch Post" to add new company URLs
- Supports X (Twitter) and LinkedIn URLs
- Can add manual metrics if scraping fails

### 3. Edit Contact Info
- Click "✏️ Edit Contact" on any company card
- Add email, phone, LinkedIn URL, or X handle

### 4. Refresh Metrics
- Click "🔄 Refresh" to update engagement metrics
- Fetches latest data from social platforms

### 5. Export Data
- Click "📥 Export" to download data
- Choose CSV or JSON format

## Troubleshooting

### Database Connection Failed

```bash
# Check if PostgreSQL is running
pg_isready

# Verify DATABASE_URL in .env
# Format: postgresql://user:password@host:port/database
```

### Port Already in Use

```bash
# Kill process on port 3000 (backend)
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Prisma Client Issues

```bash
# Regenerate Prisma Client
npm run prisma:generate --workspace=backend
```

## Next Steps

- Customize the sample data in `backend/src/seed.ts`
- Add your own company URLs via the UI
- Deploy to Vercel (see DEPLOYMENT.md)
- Configure environment variables for production

## Database Schema

The application uses PostgreSQL with the following tables:

- **Company** - Core company entity
- **Fundraise** - Fundraising information (amount, date, source)
- **LaunchPost** - Social media posts (platform, URL, engagement metrics)
- **ContactInfo** - Contact details (email, phone, LinkedIn, X handle)

See `backend/prisma/schema.prisma` for full schema details.

## API Endpoints

- `GET /api/companies` - List all companies with filters
- `POST /api/launch-posts` - Add new launch post
- `POST /api/refresh/:id` - Refresh engagement metrics
- `POST /api/companies/:id/contact` - Update contact info
- `GET /api/export` - Export data as CSV/JSON

## Support

For issues or questions:
- Check `.kiro/specs/launch-tracker-dashboard/` for design and requirements
- Review `backend/README.md` for backend details
- See `DEPLOYMENT.md` for production setup
