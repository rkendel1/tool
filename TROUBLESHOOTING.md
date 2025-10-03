# Troubleshooting Common Issues

## Services Keep Restarting

Some Supabase services (particularly Auth, Storage, and Kong) may restart initially because they expect specific database schemas that aren't included in the basic setup. This is normal for first-time initialization.

### Quick Fix for Production-Ready Setup

If you need a fully operational Supabase instance immediately, use the official Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase in a directory
supabase init

# Start Supabase
supabase start
```

The official CLI provides a complete, battle-tested setup with all schemas and migrations.

### Working Services in Current Setup

These services work out of the box:

- ✅ **PostgreSQL Database** (Port 54321)
- ✅ **Redis** (Port 6379)  
- ✅ **PostgREST API** (via Kong:8000/rest/v1)
- ✅ **Postgres Meta** (Database management API)
- ✅ **ImgProxy** (Image transformations)
- ✅ **Edge Functions** (Deno runtime)

### Services Requiring Additional Setup

These services need database migrations to run properly:

- ⚠️ **Auth (GoTrue)** - Requires `auth` schema
- ⚠️ **Storage** - Requires `storage` schema  
- ⚠️ **Realtime** - Partially configured
- ⚠️ **Kong** - May restart until all upstream services are healthy
- ⚠️ **Studio** - May show unhealthy until Kong is stable

### Adding Missing Schemas

To enable the Auth and Storage services, you need to add their schemas. The Supabase team provides these migrations:

1. Download the auth schema:
```bash
curl -o volumes/db/05-auth-schema.sql https://raw.githubusercontent.com/supabase/postgres/develop/migrations/db/init-scripts/00100000000000-auth-schema.sql
```

2. Download the storage schema:
```bash
curl -o volumes/db/06-storage-schema.sql https://raw.githubusercontent.com/supabase/postgres/develop/migrations/db/init-scripts/00200000000000-storage-schema.sql
```

3. Restart the stack:
```bash
docker compose down -v
docker compose up -d
```

## Alternative: Minimal Setup

If you only need a PostgreSQL database with PostgREST API (which covers most use cases), you can disable the problematic services:

Edit `docker-compose.yml` and comment out:
- `auth`
- `storage`
- `kong`  
- `realtime`
- `analytics`
- `studio`

This gives you a lightweight, stable setup with:
- PostgreSQL with Supabase extensions
- Automatic REST API generation (PostgREST)
- Redis for caching
- Edge Functions for serverless logic

## Service Health Check Commands

```bash
# Check all services
docker compose ps

# Check database
docker compose exec db pg_isready -U postgres

# Check Redis
docker compose exec redis redis-cli ping

# Test PostgREST API
curl http://localhost:8000/rest/v1/

# View logs for a service
docker compose logs -f auth
docker compose logs -f storage
```

## Network Connectivity Issues

If services can't connect to the database:

1. Ensure database is fully initialized:
```bash
docker compose logs db | grep "database system is ready"
```

2. Check if database accepts connections:
```bash
docker compose exec db psql -U postgres -c "SELECT 1;"
```

3. Verify users exist:
```bash
docker compose exec db psql -U postgres -c "\du"
```

## Clean Slate Restart

If things get stuck:

```bash
# Stop everything and remove volumes
docker compose down -v

# Remove any orphaned containers
docker container prune -f

# Start fresh
docker compose up -d

# Follow logs
docker compose logs -f
```

## Getting Help

- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub Discussions](https://github.com/supabase/supabase/discussions)
- [PostgREST Documentation](https://postgrest.org/en/stable/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
