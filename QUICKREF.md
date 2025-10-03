# Supabase Quick Reference

Quick command reference for common Supabase operations.

## 🚀 Getting Started

```bash
# Initial setup
./setup-supabase.sh

# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

## 🔍 Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Supabase Studio** | http://localhost:3000 | Database management UI |
| **API Gateway** | http://localhost:8000 | All API endpoints |
| **Database** | localhost:54321 | Direct PostgreSQL access |
| **Redis** | localhost:6379 | Cache and sessions |
| **Analytics** | http://localhost:4000 | Logs and analytics |

## 🗄️ Database Access

```bash
# Connect via psql (Docker)
docker compose exec db psql -U postgres

# Connect via psql (host)
psql postgresql://postgres:your-password@localhost:54321/postgres

# List schemas
docker compose exec db psql -U postgres -c "\dn"

# List tables in public schema
docker compose exec db psql -U postgres -c "\dt"

# List auth users
docker compose exec db psql -U postgres -c "SELECT email FROM auth.users;"

# List storage buckets
docker compose exec db psql -U postgres -c "SELECT * FROM storage.buckets;"
```

## 🔐 API Keys

Get from `.env` file:

```bash
# View ANON_KEY (safe for client-side)
grep ANON_KEY .env

# View SERVICE_ROLE_KEY (server-side only!)
grep SERVICE_ROLE_KEY .env
```

## 📡 API Endpoints

### Authentication

```bash
# Sign up
curl -X POST http://localhost:8000/auth/v1/signup \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Sign in
curl -X POST http://localhost:8000/auth/v1/token?grant_type=password \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get user info
curl http://localhost:8000/auth/v1/user \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

### Database (REST API)

```bash
# Get all records from a table
curl http://localhost:8000/rest/v1/your_table \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${JWT_TOKEN}"

# Insert a record
curl -X POST http://localhost:8000/rest/v1/your_table \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"column1":"value1","column2":"value2"}'

# Update a record
curl -X PATCH http://localhost:8000/rest/v1/your_table?id=eq.1 \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"column1":"new_value"}'

# Delete a record
curl -X DELETE http://localhost:8000/rest/v1/your_table?id=eq.1 \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

### Storage

```bash
# Create a bucket
curl -X POST http://localhost:8000/storage/v1/bucket \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"id":"my-bucket","name":"my-bucket","public":true}'

# Upload a file
curl -X POST http://localhost:8000/storage/v1/object/my-bucket/file.jpg \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -F file=@/path/to/file.jpg

# Get file URL (public bucket)
echo "http://localhost:8000/storage/v1/object/public/my-bucket/file.jpg"

# Delete a file
curl -X DELETE http://localhost:8000/storage/v1/object/my-bucket/file.jpg \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

## 🔄 Common SQL Operations

### Create a Table

```sql
-- Connect to database first
docker compose exec db psql -U postgres

-- Create table
CREATE TABLE todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users see own todos"
    ON todos FOR SELECT
    USING (auth.uid() = user_id);
```

### Insert Sample Data

```sql
-- Insert a record
INSERT INTO todos (user_id, title, completed)
VALUES ('00000000-0000-0000-0000-000000000000', 'Learn Supabase', false);
```

### Query Data

```sql
-- Get all todos
SELECT * FROM todos;

-- Get incomplete todos
SELECT * FROM todos WHERE completed = false;

-- Get todos created today
SELECT * FROM todos WHERE created_at::date = CURRENT_DATE;
```

## 🔧 Maintenance

### Backups

```bash
# Full database backup
docker compose exec -T db pg_dump -U postgres postgres > backup_$(date +%Y%m%d).sql

# Restore from backup
cat backup_20240101.sql | docker compose exec -T db psql -U postgres postgres

# Backup specific schema
docker compose exec -T db pg_dump -U postgres -n public postgres > public_backup.sql
```

### Health Checks

```bash
# Database
docker compose exec db pg_isready -U postgres

# Redis
docker compose exec redis redis-cli ping

# Auth
curl http://localhost:8000/auth/v1/health

# Storage
curl http://localhost:8000/storage/v1/status

# All services
docker compose ps
```

### Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f db
docker compose logs -f auth
docker compose logs -f storage
docker compose logs -f kong

# Last 100 lines
docker compose logs --tail=100 db

# Follow new logs only
docker compose logs -f --tail=0
```

### Restart Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart db
docker compose restart auth
docker compose restart storage

# Restart with fresh logs
docker compose restart kong && docker compose logs -f kong
```

## 🧹 Cleanup

```bash
# Stop services (keep data)
docker compose down

# Stop and remove data
docker compose down -v

# Remove unused Docker resources
docker system prune -f

# Complete reset
docker compose down -v
docker system prune -af
./setup-supabase.sh
docker compose up -d
```

## 🐛 Troubleshooting

### Service won't start

```bash
# Check logs
docker compose logs <service-name>

# Check dependencies
docker compose ps

# Restart
docker compose restart <service-name>
```

### Database connection issues

```bash
# Verify database is running
docker compose ps db

# Test connection
docker compose exec db psql -U postgres -c "SELECT 1;"

# Check users exist
docker compose exec db psql -U postgres -c "\du"

# Check schemas exist
docker compose exec db psql -U postgres -c "\dn"
```

### Kong returns 404

```bash
# Wait a moment, then check Kong
docker compose logs kong | tail -20

# Verify upstream services are running
docker compose ps auth rest storage realtime

# Restart Kong
docker compose restart kong
```

### Port conflicts

```bash
# Find what's using a port
lsof -i :8000
lsof -i :54321
lsof -i :3000

# Change port in docker-compose.yml
# Edit the ports section for the conflicting service
```

## 📚 Additional Help

- Full documentation: [WORKFLOW.md](./WORKFLOW.md)
- Setup guide: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- Troubleshooting: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Implementation: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- Official docs: https://supabase.com/docs

## 💡 Tips

1. **Always use environment variables** for API keys and secrets
2. **Enable RLS** on all tables containing user data
3. **Test policies** thoroughly before deploying to production
4. **Backup regularly** - automate with cron jobs
5. **Monitor logs** during development to catch issues early
6. **Use the service_role key only on the server** - never expose it in client code
7. **Start small** - test one service at a time when debugging
8. **Check health endpoints** before assuming a service is broken
