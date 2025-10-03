# Supabase-Only Development Workflow

This document describes the complete development workflow using the Supabase-only architecture.

## Architecture Overview

This setup uses a **single Supabase PostgreSQL database** for all services. No standalone PostgreSQL instances are used.

```
┌─────────────────────────────────────────────────────────────┐
│                    Supabase PostgreSQL                      │
│                     (Port 54321)                            │
├─────────────────────────────────────────────────────────────┤
│  Schemas:                                                   │
│  • public          → Your application data                  │
│  • auth            → Authentication (users, sessions)       │
│  • storage         → File storage (buckets, objects)        │
│  • _realtime       → Real-time subscriptions                │
│  • extensions      → PostgreSQL extensions                  │
├─────────────────────────────────────────────────────────────┤
│  Connected Services:                                        │
│  • Auth (GoTrue)   → Uses auth schema                       │
│  • Storage         → Uses storage schema                    │
│  • Realtime        → Uses _realtime schema                  │
│  • PostgREST       → Exposes public schema as REST API      │
│  • Edge Functions  → Connects to all schemas                │
│  • Studio          → Manages all schemas                    │
└─────────────────────────────────────────────────────────────┘
```

## Initial Setup

### 1. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# For local development, defaults are fine
# For production, update these critical values:
# - POSTGRES_PASSWORD
# - JWT_SECRET
# - ANON_KEY and SERVICE_ROLE_KEY
# - SMTP settings
```

### 2. Run Setup Script

```bash
./setup-supabase.sh
```

This script:
- Validates Docker and Docker Compose installation
- Creates `.env` file if missing
- Creates required directories
- **Validates all database migration files are present**

### 3. Start Services

```bash
docker compose up -d
```

On first startup, the database will:
1. Initialize PostgreSQL
2. Run migration scripts in order (01-roles.sql, 02-realtime.sql, etc.)
3. Create all required schemas (`auth`, `storage`, `_realtime`)
4. Create all database users
5. Set up permissions and policies

### 4. Verify Services

```bash
# Check all services are running
docker compose ps

# All services should show "running" status
# Kong and Studio may restart initially - this is normal
```

## Common Development Tasks

### Working with the Database

#### Connect via psql

```bash
# Via Docker
docker compose exec db psql -U postgres

# From host (if psql is installed)
psql postgresql://postgres:your-password@localhost:54321/postgres
```

#### View All Schemas

```sql
-- List all schemas
\dn

-- Expected output:
-- public, auth, storage, _realtime, extensions, pg_catalog, information_schema
```

#### Query Auth Users

```sql
-- Switch to auth schema
SET search_path TO auth;

-- View users table
\d users

-- Query users
SELECT id, email, created_at FROM users;
```

#### Query Storage Objects

```sql
-- Switch to storage schema
SET search_path TO storage;

-- View buckets
SELECT * FROM buckets;

-- View objects
SELECT * FROM objects;
```

### Working with Your Application Data

All your application tables go in the `public` schema:

```sql
-- Create a table in public schema
CREATE TABLE todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own todos
CREATE POLICY "Users can view their own todos"
    ON todos FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy: Users can insert their own todos
CREATE POLICY "Users can insert their own todos"
    ON todos FOR INSERT
    WITH CHECK (auth.uid() = user_id);
```

### Using the REST API

The PostgREST service automatically exposes your `public` schema as a REST API:

```bash
# Get all todos (requires authentication)
curl http://localhost:8000/rest/v1/todos \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Insert a todo
curl -X POST http://localhost:8000/rest/v1/todos \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Learn Supabase", "completed": false}'
```

### Using Authentication

#### Sign Up a User

```bash
curl -X POST http://localhost:8000/auth/v1/signup \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure-password"
  }'
```

#### Sign In

```bash
curl -X POST http://localhost:8000/auth/v1/token?grant_type=password \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure-password"
  }'
```

The response includes an `access_token` (JWT) to use for authenticated requests.

### Using Storage

#### Create a Bucket

```bash
curl -X POST http://localhost:8000/storage/v1/bucket \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "avatars",
    "name": "avatars",
    "public": true
  }'
```

#### Upload a File

```bash
curl -X POST http://localhost:8000/storage/v1/object/avatars/user1.png \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F file=@/path/to/image.png
```

### Using Realtime

Subscribe to database changes using WebSocket:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'http://localhost:8000',
  'YOUR_ANON_KEY'
)

// Subscribe to changes on todos table
const channel = supabase
  .channel('todos-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'todos'
    },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
```

## Database Backups and Migrations

### Backup Database

```bash
# Backup entire database
docker compose exec -T db pg_dump -U postgres postgres > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup specific schema
docker compose exec -T db pg_dump -U postgres -n public postgres > public_schema_backup.sql
docker compose exec -T db pg_dump -U postgres -n auth postgres > auth_schema_backup.sql
```

### Restore Database

```bash
# Restore from backup
cat backup.sql | docker compose exec -T db psql -U postgres postgres

# Restore specific schema
cat public_schema_backup.sql | docker compose exec -T db psql -U postgres postgres
```

### Migration Best Practices

1. **Create migration files** in `volumes/db/` following naming convention:
   - `01-`, `02-`, etc. for order
   - Use descriptive names: `07-add-user-profiles.sql`

2. **Test migrations** in development first:
```bash
# Apply a new migration
docker compose exec db psql -U postgres -f /docker-entrypoint-initdb.d/07-add-user-profiles.sql

# Verify
docker compose exec db psql -U postgres -c "\d your_new_table"
```

3. **Include in docker-compose.yml** for automatic application on fresh setups:
```yaml
volumes:
  - ./volumes/db/07-add-user-profiles.sql:/docker-entrypoint-initdb.d/07-add-user-profiles.sql:Z
```

## Monitoring and Debugging

### Check Service Health

```bash
# All services
docker compose ps

# Database health
docker compose exec db pg_isready -U postgres

# Redis health
docker compose exec redis redis-cli ping

# Auth health
curl http://localhost:8000/auth/v1/health

# Storage health
curl http://localhost:8000/storage/v1/status
```

### View Logs

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
```

### Common Issues and Solutions

#### Service Keeps Restarting

```bash
# Check logs
docker compose logs <service-name>

# Verify database is ready
docker compose exec db pg_isready -U postgres

# Verify schemas exist
docker compose exec db psql -U postgres -c "\dn"
```

#### Cannot Connect to Database

```bash
# Check database status
docker compose ps db

# Test connection
docker compose exec db psql -U postgres -c "SELECT 1;"

# Check network
docker compose exec auth ping -c 3 db
```

#### Kong Returns 404

Kong may take a few moments to become healthy after startup. Check:

```bash
# Kong status
docker compose ps kong

# Kong logs
docker compose logs kong

# Verify upstream services
docker compose ps auth rest storage realtime
```

## Cleanup and Reset

### Stop Services (Keep Data)

```bash
docker compose down
```

### Stop Services and Remove Data

```bash
# ⚠️ WARNING: This deletes all data!
docker compose down -v
```

### Fresh Start

```bash
# Complete cleanup
docker compose down -v
docker container prune -f

# Start fresh
./setup-supabase.sh
docker compose up -d
```

## Production Deployment

### Environment Variables

Update `.env` with production values:

```env
# Database
POSTGRES_PASSWORD=<strong-unique-password>

# JWT
JWT_SECRET=<generate-with-openssl-rand-base64-32>

# API Keys (generate using production JWT_SECRET)
ANON_KEY=<generate-new-anon-key>
SERVICE_ROLE_KEY=<generate-new-service-role-key>

# URLs
SUPABASE_PUBLIC_URL=https://api.yourdomain.com
API_EXTERNAL_URL=https://api.yourdomain.com
SITE_URL=https://yourdomain.com

# SMTP (for production emails)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<your-sendgrid-api-key>
SMTP_ADMIN_EMAIL=admin@yourdomain.com
```

### SSL/TLS Configuration

Enable SSL in Kong by updating `volumes/api/kong.yml` and mounting SSL certificates.

### Automated Backups

Set up cron job for regular backups:

```bash
# Daily backup at 2 AM
0 2 * * * docker compose -f /path/to/docker-compose.yml exec -T db pg_dump -U postgres postgres | gzip > /backups/supabase_$(date +\%Y\%m\%d).sql.gz
```

### Monitoring

Set up monitoring for:
- Database connections: `SELECT count(*) FROM pg_stat_activity;`
- Database size: `SELECT pg_size_pretty(pg_database_size('postgres'));`
- Service health endpoints
- Log aggregation (Logflare is included)

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgREST API Reference](https://postgrest.org/en/stable/api.html)
- [Kong API Gateway](https://docs.konghq.com/)
- [Deno Edge Functions](https://deno.land/manual)

## Support

For issues specific to this setup:
1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
3. Check service logs: `docker compose logs -f`

For Supabase-specific questions:
- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub Discussions](https://github.com/supabase/supabase/discussions)
