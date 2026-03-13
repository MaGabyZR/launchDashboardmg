# Launch Tracker Dashboard - Backend

Node.js + Express backend for the Launch Tracker Dashboard, designed to run as Vercel serverless functions.

## Structure

```
backend/
├── api/                    # Vercel serverless functions
│   ├── companies/
│   │   ├── index.ts       # GET /api/companies
│   │   └── [id]/
│   │       └── contact.ts # POST /api/companies/:id/contact
│   ├── launch-posts/
│   │   └── index.ts       # POST /api/launch-posts
│   ├── refresh/
│   │   └── [id].ts        # POST /api/refresh/:id
│   └── export/
│       └── index.ts       # GET /api/export
├── src/
│   ├── index.ts           # Express app for local development
│   ├── types/             # TypeScript type definitions
│   └── services/          # Business logic (to be implemented)
└── package.json
```

## API Endpoints

### GET /api/companies
Retrieve all companies with launch data.

**Query Parameters:**
- `sortBy`: Field to sort by (default: 'createdAt')
- `order`: 'asc' | 'desc' (default: 'desc')
- `minEngagement`: Filter by minimum total engagement
- `hasContact`: Filter companies with/without contact info

### POST /api/launch-posts
Add new launch post URL(s).

**Request Body:**
```json
{
  "urls": ["https://twitter.com/..."],
  "companyName": "Example Corp",
  "manualMetrics": [
    { "platform": "x", "likes": 100 }
  ]
}
```

### POST /api/refresh/:id
Refresh engagement metrics for a company.

### POST /api/companies/:id/contact
Add or update contact information.

**Request Body:**
```json
{
  "email": "contact@example.com",
  "phone": "+1234567890",
  "linkedinUrl": "https://linkedin.com/in/...",
  "xHandle": "@example"
}
```

### GET /api/export
Export dashboard data.

**Query Parameters:**
- `format`: 'csv' | 'json' (default: 'csv')
- `companyIds`: Optional comma-separated list of company IDs

## Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

The server will start on `http://localhost:3001`.

### Build
```bash
npm run build
```

## Deployment

This backend is designed to be deployed as Vercel serverless functions. Each file in the `/api` directory becomes a serverless function endpoint.

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (Vercel Postgres)

## Dependencies

- **express**: Web framework
- **axios**: HTTP client for external APIs
- **cheerio**: HTML parsing for web scraping
- **puppeteer-core**: Browser automation for JavaScript-rendered content

## Next Steps

The following will be implemented in subsequent tasks:
- Database layer with Prisma ORM
- URL parser service
- Scraping service with rate limiting
- YCombinator API client
- DM generator service
