# Troubleshooting Common Issues

## Architecture Overview

This setup uses a **Supabase-only database architecture** where all services connect to a single Supabase PostgreSQL database. Each service uses its own schema:
- Auth → `auth` schema
- Storage → `storage` schema  
- Realtime → `_realtime` schema
- Your app → `public` schema

All required schemas are automatically created on first startup via migration scripts in `volumes/db/`.

## Clean Startup Process

On first startup, the following happens in order:

1. **PostgreSQL starts** and runs initialization scripts from `volumes/db/`
2. **Roles are created** (anon, authenticated, service_role, etc.)
3. **Schemas are created** (auth, storage, _realtime, extensions)
4. **Database users are created** (authenticator, supabase_auth_admin, etc.)
5. **Services connect** to the database using their respective users and schemas

This process should complete successfully without manual intervention.

## Services Status

All services should start successfully:

- ✅ **Supabase Database** (Port 54321) - PostgreSQL 15 with all required schemas
- ✅ **Redis** (Port 6379)  
- ✅ **PostgREST API** (via Kong:8000/rest/v1) - REST API from `public` schema
- ✅ **Auth (GoTrue)** (via Kong:8000/auth/v1) - Authentication using `auth` schema
- ✅ **Storage** (via Kong:8000/storage/v1) - File storage using `storage` schema
- ✅ **Realtime** (via Kong:8000/realtime/v1) - WebSocket subscriptions using `_realtime` schema
- ✅ **Postgres Meta** - Database management API
- ✅ **ImgProxy** - Image transformations for Storage
- ✅ **Edge Functions** - Deno runtime for serverless functions
- ✅ **Kong** - API Gateway (may restart initially until all services are healthy)
- ✅ **Studio** - Web UI (may show unhealthy until Kong is stable)

## Service Health Check Commands

```bash
# Check all services
docker compose ps

# Check database is ready
docker compose exec db pg_isready -U postgres

# Check database schemas
docker compose exec db psql -U postgres -c "\dn"

# List database users
docker compose exec db psql -U postgres -c "\du"

# Check Redis
docker compose exec redis redis-cli ping

# Test Auth service
curl http://localhost:8000/auth/v1/health

# Test Storage service  
curl http://localhost:8000/storage/v1/status

# Test PostgREST API
curl http://localhost:8000/rest/v1/

# View logs for specific service
docker compose logs -f db
docker compose logs -f auth
docker compose logs -f storage
docker compose logs -f kong
```

## Common Issues

### Services Keep Restarting

**Symptom:** Some services (especially Kong, Auth, Storage) restart repeatedly.

**Cause:** Usually related to database initialization timing or missing schemas.

**Solution:**
1. Verify all migration files exist:
```bash
ls -la volumes/db/
# Should show: roles.sql, realtime.sql, 99-create-users.sh, jwt.sql, 05-auth-schema.sql, 06-storage-schema.sql
```

2. Check database is fully initialized:
```bash
docker compose logs db | grep "database system is ready"
```

3. Verify schemas were created:
```bash
docker compose exec db psql -U postgres -c "\dn"
# Should show: auth, storage, _realtime, public, extensions schemas
```

4. If issues persist, clean restart:
```bash
docker compose down -v
docker compose up -d
docker compose logs -f
```

### Database Connection Refused

**Symptom:** Services can't connect to database.

**Solution:**
1. Ensure database is healthy:
```bash
docker compose ps db
docker compose exec db pg_isready -U postgres
```

2. Check if database accepts connections:
```bash
docker compose exec db psql -U postgres -c "SELECT 1;"
```

3. Verify network connectivity:
```bash
docker compose exec auth ping -c 3 db
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
