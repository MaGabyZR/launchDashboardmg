# Launch Tracker Dashboard

A zero-cost MVP dashboard for tracking company launch videos and fundraise announcements.

## Project Structure

This is a monorepo containing:
- `frontend/` - React + Vite frontend application
- `backend/` - Node.js + Express backend (Vercel serverless functions)

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies for all workspaces
npm install

# Run development servers
npm run dev

# Build for production
npm run build
```

### Development

- Frontend runs on http://localhost:3000
- Backend API runs on http://localhost:3001

## Tech Stack

**Frontend:**
- React 18
- Vite
- TypeScript
- Tailwind CSS
- TanStack Query

**Backend:**
- Node.js
- Express
- TypeScript
- Prisma ORM
- Vercel Postgres

## License

MIT
