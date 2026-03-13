# Quick Start Guide - Launch Tracker Dashboard

Get the Launch Tracker Dashboard running locally in 5 minutes.

## Prerequisites

- Node.js 20.x or later
- PostgreSQL (local instance or Vercel Postgres)
- npm or yarn

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

This installs dependencies for both frontend and backend workspaces.

### 2. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your database credentials
nano .env
```

**Minimum required configuration:**

```env
DATABASE_URL="postgresql://user:password@localhost:5432/launch_tracker_dev"
VITE_API_BASE_URL="http://localhost:3000"
```

### 3. Set Up Database

#### Step 1: Install and Start PostgreSQL

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Windows:**
Download and install from [postgresql.org](https://www.postgresql.org/download/windows/)

**Linux:**
```bash
sudo apt-get install postgresql-15
sudo systemctl start postgresql
```

#### Step 2: Create Database

```bash
# Create the database
createdb launch_tracker_dev

# Or using psql
psql -U postgres
CREATE DATABASE launch_tracker_dev;
\q
```

#### Step 3: Run Migrations

```bash
cd backend

# Generate Prisma Client
npm run prisma:generate

# Run migrations to create tables
npm run prisma:migrate

# Verify with Prisma Studio (optional)
npm run prisma:studio
```

This will create all necessary tables:
- `Company` - Core company entity
- `Fundraise` - Fundraising information
- `LaunchPost` - Social media launch posts
- `ContactInfo` - Contact information

**Expected Output:**
```
✔ Generated Prisma Client
✔ Applied migration 20240101000000_init
```

### 4. Start Development Servers

```bash
npm run dev
```

This starts:
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Backend**: http://localhost:3000 (Express server)

## Project Structure

```
launch-tracker-dashboard/
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   └── main.tsx       # Entry point
│   ├── dist/              # Build output
│   └── package.json
├── backend/               # Node.js + Express backend
│   ├── api/               # Serverless function endpoints
│   ├── src/
│   │   ├── services/      # Business logic services
│   │   └── types/         # TypeScript types
│   └── package.json
├── .env.example           # Environment variable template
├── vercel.json            # Vercel deployment configuration
└── package.json           # Root workspace configuration
```

## Available Scripts

### Root Level

```bash
npm run dev        # Start both frontend and backend dev servers
npm run build      # Build both frontend and backend for production
npm run lint       # Run ESLint on all TypeScript files
npm run format     # Format code with Prettier
```

### Frontend Only

```bash
npm run dev --workspace=frontend      # Start frontend dev server
npm run build --workspace=frontend    # Build frontend for production
npm run preview --workspace=frontend  # Preview production build
```

### Backend Only

```bash
npm run dev --workspace=backend       # Start backend dev server
npm run build --workspace=backend     # Build backend for production
npm run start --workspace=backend     # Start production backend
```

## Vercel Deployment

### Quick Deploy

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
vercel --prod
```

### Configuration

The project is pre-configured for Vercel deployment:

- **Build Command**: `npm run build`
- **Output Directory**: `frontend/dist`
- **Serverless Functions**: `backend/api/**/*.ts`
- **Runtime**: Node.js 20.x

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Environment Variables

### Required

- `DATABASE_URL`: PostgreSQL connection string

### Optional

- `SCRAPER_MAX_REQUESTS_PER_MINUTE`: Rate limit for scraping (default: 10)
- `SCRAPER_TIMEOUT_MS`: Scraping timeout in ms (default: 10000)
- `SCRAPER_MAX_RETRIES`: Max retry attempts (default: 3)
- `YC_API_BASE_URL`: YC API base URL
- `YC_API_CACHE_TTL_HOURS`: YC API cache duration (default: 24)

See [ENV_SETUP.md](./ENV_SETUP.md) for complete environment variable reference.

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

Edit files in `frontend/` or `backend/` directories.

### 3. Test Locally

```bash
npm run dev
```

Visit http://localhost:5173 to test your changes.

### 4. Lint and Format

```bash
npm run lint
npm run format
```

### 5. Commit and Push

```bash
git add .
git commit -m "Description of changes"
git push origin feature/your-feature-name
```

### 6. Deploy Preview

Push to GitHub to trigger automatic Vercel preview deployment.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, TanStack Query, React Hook Form
- **Backend**: Node.js, Express, Axios, Cheerio, Puppeteer
- **Database**: PostgreSQL (Vercel Postgres), Prisma ORM
- **Deployment**: Vercel (serverless functions + static hosting)
- **Testing**: Vitest, fast-check (property-based testing)

## Next Steps

1. **Task 2.1**: Set up Prisma and define database schema
2. **Task 3.1**: Implement URL parser service
3. **Task 4.1**: Implement scraping service
4. **Task 5.1**: Implement YC API client
5. **Task 7.1**: Build API endpoints

See [tasks.md](./.kiro/specs/launch-tracker-dashboard/tasks.md) for the complete implementation plan.

## Troubleshooting

### Port Already in Use

If port 3000 or 5173 is already in use:

```bash
# Kill process on port 3000 (backend)
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### Database Connection Failed

- Verify PostgreSQL is running: `pg_isready`
- Check `DATABASE_URL` in `.env` is correct
- Ensure database exists: `createdb launch_tracker_dev`

### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Rebuild TypeScript
npm run build
```

## Getting Help

- **Design Document**: `.kiro/specs/launch-tracker-dashboard/design.md`
- **Requirements**: `.kiro/specs/launch-tracker-dashboard/requirements.md`
- **Tasks**: `.kiro/specs/launch-tracker-dashboard/tasks.md`
- **Deployment Guide**: `DEPLOYMENT.md`
- **Environment Setup**: `ENV_SETUP.md`

## Free Tier Limits (Vercel)

- Bandwidth: 100 GB/month
- Function Invocations: 100/day per function
- Function Timeout: 60 seconds
- Postgres Storage: 1 GB
- Compute Time: 60 hours/month

The application is optimized to stay within these limits.
