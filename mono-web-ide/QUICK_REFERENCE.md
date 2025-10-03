# Mono Web IDE - Quick Reference Card

## 🚀 Getting Started (3 steps)

```bash
# 1. Setup
cd mono-web-ide
./setup.sh

# 2. Start all services
docker compose up -d

# 3. Open your browser
# Code Server: http://localhost:8080 (password: coder)
# pgAdmin: http://localhost:5050 (admin@example.com / admin)
```

## 📦 Services Overview

| Service | URL | Default Credentials | Purpose |
|---------|-----|---------------------|---------|
| **Code Server** | http://localhost:8080 | password: `coder` | Web-based VS Code IDE |
| **pgAdmin** | http://localhost:5050 | admin@example.com / `admin` | PostgreSQL GUI |
| **Auth Service** | http://localhost:4000 | admin / `admin123`<br>demo / `demo123` | JWT Authentication |
| **Dyad Server** | http://localhost:5000 | None | AI Code Completion |
| **PostgreSQL** | localhost:5432 | devuser / `devpass` | Database |
| **Redis** | localhost:6379 | None | Cache/Sessions |

## 🛠️ Common Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f [service-name]

# Check service health
docker compose ps

# Rebuild a service
docker compose build --no-cache [service-name]

# Restart a service
docker compose restart [service-name]

# Run validation
./validate-setup.sh

# Run integration tests
cd scripts && ./test-dyad-integration.sh
```

## 📁 Example Apps

### App1 - React Application
```bash
# In Code Server terminal
cd app-code/app1
npm install
npm start
# Access: http://localhost:3000
```

### App2 - Express API (with Database)
```bash
# In Code Server terminal
cd app-code/app2

# Option 1: Simple version (in-memory)
npm install
npm start

# Option 2: Database-integrated version
npm install
mv index.js index-simple.js
mv index-with-db.js index.js
npm start

# Access: http://localhost:3001
```

## 🗄️ Database Quick Start

### Connect from Code Server
```javascript
const { Pool } = require('pg');
const pool = new Pool({
  host: 'postgres',
  port: 5432,
  database: 'devdb',
  user: 'devuser',
  password: 'devpass',
});
```

### Using pgAdmin
1. Open http://localhost:5050
2. Login: admin@example.com / admin
3. Server "Mono-Web-IDE Postgres" is pre-configured
4. Browse tables: users, items, sessions

### Sample Queries
```sql
-- View all items
SELECT * FROM items;

-- Add new item
INSERT INTO items (name, description, value) 
VALUES ('My Item', 'Description', 100);

-- View users
SELECT id, username, email FROM users;
```

## 🔐 Authentication Quick Start

### Login with Default User
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'
```

### Register New User
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"newuser","email":"user@example.com","password":"password123"}'
```

### Use Token in Requests
```bash
# Get token from login response
TOKEN="your-jwt-token-here"

# Make authenticated request
curl http://localhost:3001/api/auth/test \
  -H "Authorization: Bearer $TOKEN"
```

## 💾 Backup & Restore

### Backup Database
```bash
docker compose exec postgres pg_dump -U devuser devdb > backup.sql
```

### Restore Database
```bash
docker compose exec -T postgres psql -U devuser devdb < backup.sql
```

### Backup App Code
```bash
tar -czf app-code-backup.tar.gz app-code/
```

## 🔧 Troubleshooting

### Service won't start
```bash
docker compose logs [service-name]
docker compose restart [service-name]
```

### Can't connect to database
```bash
# Check if Postgres is healthy
docker compose ps postgres

# Test connection
docker compose exec code-server \
  psql -h postgres -U devuser -d devdb -c "SELECT 1"
```

### Port already in use
```bash
# Stop all services
docker compose down

# Check what's using the port
lsof -i :8080  # or any other port

# Or change port in docker-compose.yml
```

### Reset everything (WARNING: deletes all data)
```bash
docker compose down -v
docker compose up -d
```

## 📚 Documentation

- **README.md** - Complete reference guide
- **QUICKSTART.md** - 5-minute setup guide
- **ARCHITECTURE.md** - System architecture
- **FEATURE_CHECKLIST.md** - All features implemented
- **DEPLOYMENT.md** - Production deployment

## 🎯 Environment Variables

Key variables in `.env`:
```bash
# Code Server
PASSWORD=coder

# Database
POSTGRES_USER=devuser
POSTGRES_PASSWORD=devpass
POSTGRES_DB=devdb

# pgAdmin
PGADMIN_EMAIL=admin@example.com
PGADMIN_PASSWORD=admin

# Auth Service
JWT_SECRET=your-secret-key-change-in-production

# Redis
REDIS_PASSWORD=  # Leave empty or set for production
```

## ✅ Health Checks

```bash
# All services
docker compose ps

# Individual service health endpoints
curl http://localhost:8080/healthz  # Code Server
curl http://localhost:5000/health   # Dyad Server
curl http://localhost:4000/health   # Auth Service

# Database
docker compose exec postgres pg_isready -U devuser

# Redis
docker compose exec redis redis-cli ping
```

## 🌐 Port Reference

| Port | Service | Purpose |
|------|---------|---------|
| 8080 | Code Server | Web IDE |
| 5050 | pgAdmin | Database GUI |
| 4000 | Auth Service | Authentication API |
| 5000 | Dyad Server | AI Completion API |
| 5432 | PostgreSQL | Database |
| 6379 | Redis | Cache/Sessions |
| 3000-3005 | App Previews | Your applications |

## 💡 Pro Tips

1. **Use tmux for multiple apps**: Run `scripts/start-all-apps.sh`
2. **Enable hot reload**: Most frameworks support it by default
3. **Check logs regularly**: `docker compose logs -f`
4. **Backup before experiments**: Database and code
5. **Use .env files**: Don't hardcode credentials
6. **Test locally first**: Before deploying to production

## 🆘 Support

- Check troubleshooting in README.md
- Run validation: `./validate-setup.sh`
- Run tests: `scripts/test-dyad-integration.sh`
- Review logs: `docker compose logs`
