# Quick Start Guide - Mono Web IDE

Get up and running with the Dockerized Web IDE in 5 minutes.

## Step 1: Prerequisites

Ensure you have Docker installed:
```bash
docker --version
docker compose version
```

## Step 2: Setup

Navigate to the mono-web-ide directory and run setup:
```bash
cd mono-web-ide
./setup.sh
```

## Step 3: Start the Environment

Start all services:
```bash
docker compose up -d
```

Wait for services to become healthy (about 30-60 seconds):
```bash
docker compose ps
```

You should see all services healthy:
- `mono-web-ide-codeserver` - healthy
- `mono-web-ide-dyad-server` - healthy
- `mono-web-ide-postgres` - healthy
- `mono-web-ide-auth-service` - healthy
- `mono-web-ide-redis` - healthy
- `mono-web-ide-pgadmin` - running

## Step 4: Access Services

### Code Server (Web IDE)
Open your browser and go to:
```
http://localhost:8080
```
Enter the password (default: `coder`)

### pgAdmin (Database GUI)
Open your browser and go to:
```
http://localhost:5050
```
Login with:
- Email: `admin@example.com`
- Password: `admin`

The Postgres server is pre-configured and ready to use!

## Step 5: Test Auth Service

Try logging in with a default user:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'
```

You'll receive a JWT token for authenticated requests.

## Step 6: Start Your First App

In the Code Server terminal:

```bash
# Navigate to app1
cd app-code/app1

# Install dependencies
npm install

# Start the dev server
npm start
```

The app will be available at http://localhost:3000

## Step 7: Try the Database-Integrated App

In a new Code Server terminal:

```bash
# Navigate to app2
cd app-code/app2

# Install dependencies
npm install

# Use the enhanced version with database
mv index.js index-simple.js
mv index-with-db.js index.js

# Start the server
npm start
```

The API will be available at http://localhost:3001

Try it:
```bash
# Get items from database
curl http://localhost:3001/api/items

# Add a new item
curl -X POST http://localhost:3001/api/items \
  -H "Content-Type: application/json" \
  -d '{"name":"My Item","description":"Test","value":100}'
```

## Step 8: Try AI Code Completion

1. Create a new JavaScript file in Code Server
2. Start typing: `const x = `
3. Wait for AI suggestions to appear
4. Press Tab to accept

## Next Steps

- Explore database in pgAdmin: http://localhost:5050
- Test authentication: http://localhost:4000
- Create your own apps in `app-code/`
- Configure environment variables in `.env`
- Read the full README for advanced features

## All Available Services

- **Code Server**: http://localhost:8080 (password: `coder`)
- **pgAdmin**: http://localhost:5050 (admin@example.com / admin)
- **Auth Service**: http://localhost:4000
- **Dyad Server**: http://localhost:5000
- **PostgreSQL**: localhost:5432 (devuser / devpass)
- **Redis**: localhost:6379
- **App Previews**: Ports 3000-3005

## Common Commands

```bash
# View logs
docker compose logs -f

# Stop services
docker compose down

# Restart services
docker compose restart

# Access container shell
docker compose exec code-server bash
```

## Troubleshooting

### Services not healthy?
```bash
docker compose ps
docker compose logs
```

### Port already in use?
Edit `docker-compose.yml` to use different ports

### Need to rebuild?
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

## Support

For more help, see:
- Full README.md
- Scripts documentation in `scripts/README.md`
- Dyad integration docs in `extensions/ai-completion/`
