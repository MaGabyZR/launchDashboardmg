# PostgreSQL Setup for Windows

Your error indicates PostgreSQL is not running. Follow these steps to set it up on Windows.

## Option 1: Using PostgreSQL Installer (Recommended)

### Step 1: Download PostgreSQL

1. Go to [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
2. Download PostgreSQL 15 or later
3. Run the installer

### Step 2: Installation Steps

1. **Choose Installation Directory**: Default is fine (`C:\Program Files\PostgreSQL\15`)
2. **Select Components**: Make sure these are checked:
   - PostgreSQL Server ✓
   - pgAdmin 4 ✓
   - Command Line Tools ✓
3. **Data Directory**: Default is fine (`C:\Program Files\PostgreSQL\15\data`)
4. **Password**: Set a password for the `postgres` user (remember this!)
5. **Port**: Keep default `5432`
6. **Locale**: Keep default
7. **Finish Installation**

### Step 3: Verify Installation

Open Command Prompt and run:

```cmd
psql --version
```

You should see: `psql (PostgreSQL) 15.x`

## Option 2: Using Windows Subsystem for Linux (WSL)

If you have WSL2 installed:

```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
```

## Option 3: Using Docker

If you have Docker installed:

```bash
docker run --name postgres-launch-tracker -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=launch_tracker_dev -p 5432:5432 -d postgres:15
```

## Step 4: Create Database

### Using pgAdmin (GUI):

1. Open pgAdmin 4 (installed with PostgreSQL)
2. Right-click "Databases" → "Create" → "Database"
3. Name: `launch_tracker_dev`
4. Click "Save"

### Using Command Line:

Open Command Prompt and run:

```cmd
psql -U postgres -c "CREATE DATABASE launch_tracker_dev;"
```

When prompted, enter the password you set during installation.

## Step 5: Create .env File

In your project root directory, create a `.env` file:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/launch_tracker_dev"
VITE_API_BASE_URL="http://localhost:3000"
```

Replace `YOUR_PASSWORD` with the password you set during PostgreSQL installation.

## Step 6: Verify Connection

Test the connection:

```cmd
psql -U postgres -d launch_tracker_dev -c "SELECT 1;"
```

If successful, you'll see:
```
 ?column?
----------
        1
(1 row)
```

## Step 7: Run Migrations

Now you can run the migrations:

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

## Troubleshooting

### PostgreSQL Service Not Running

**Check if service is running:**
```cmd
sc query postgresql-x64-15
```

**Start the service:**
```cmd
net start postgresql-x64-15
```

**Stop the service:**
```cmd
net stop postgresql-x64-15
```

### Connection Refused

1. Verify PostgreSQL is running: `sc query postgresql-x64-15`
2. Check port 5432 is listening:
   ```cmd
   netstat -ano | findstr :5432
   ```
3. Verify DATABASE_URL in `.env` is correct
4. Check firewall isn't blocking port 5432

### Wrong Password

If you forgot the password, you can reset it:

1. Open pgAdmin 4
2. Right-click "postgres" user → "Properties"
3. Set a new password in the "Definition" tab

### Port Already in Use

If port 5432 is already in use:

```cmd
netstat -ano | findstr :5432
```

Find the PID and kill it:
```cmd
taskkill /PID <PID> /F
```

Or configure PostgreSQL to use a different port and update DATABASE_URL.

## Next Steps

Once PostgreSQL is running and the database is created:

```bash
# From project root
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run seed
cd ..
npm run dev
```

Then open http://localhost:5173 in your browser.

## Quick Reference

| Task | Command |
|------|---------|
| Check PostgreSQL version | `psql --version` |
| Connect to database | `psql -U postgres -d launch_tracker_dev` |
| List databases | `psql -U postgres -l` |
| Create database | `psql -U postgres -c "CREATE DATABASE launch_tracker_dev;"` |
| Start service | `net start postgresql-x64-15` |
| Stop service | `net stop postgresql-x64-15` |
| Check service status | `sc query postgresql-x64-15` |

