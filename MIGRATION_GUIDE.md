# Migration Guide: Standalone PostgreSQL to Supabase-Only

This guide explains the migration from a standalone PostgreSQL setup to the Supabase-only architecture.

## What Changed

### Before (Hypothetical Old Setup)
```
┌──────────────┐     ┌──────────────┐
│  PostgreSQL  │     │   Supabase   │
│ (Standalone) │     │   Services   │
└──────────────┘     └──────────────┘
       ↓                    ↓
   App Data         Auth, Storage, etc.
```

### After (Current Supabase-Only Setup)
```
┌─────────────────────────────────────┐
│      Supabase PostgreSQL            │
├─────────────────────────────────────┤
│  • public schema → App Data         │
│  • auth schema → Auth Service       │
│  • storage schema → Storage Service │
│  • _realtime schema → Realtime      │
└─────────────────────────────────────┘
```

## Key Changes

### 1. Database Architecture ✅
- **Single PostgreSQL instance** for all services
- **Schema-based isolation** instead of separate databases
- **Automatic schema creation** via migration scripts

### 2. Migration Files Added ✅
- `05-auth-schema.sql` - Complete Auth service schema
- `06-storage-schema.sql` - Complete Storage service schema

### 3. Configuration Updates ✅
- `docker-compose.yml` - Added new migration file mounts
- `setup-supabase.sh` - Added validation for all required files

### 4. Documentation ✅
- **WORKFLOW.md** - Complete development workflow guide
- **QUICKREF.md** - Quick reference for common tasks
- **README.md** - Architecture diagram and clearer setup
- **SUPABASE_SETUP.md** - Enhanced with schema details
- **TROUBLESHOOTING.md** - Better diagnostics and solutions

## Migration Steps (If Coming from Old Setup)

### Step 1: Backup Existing Data
```bash
# If you had a standalone PostgreSQL, back it up first
pg_dump -U postgres your_database > old_database_backup.sql
```

### Step 2: Pull Latest Changes
```bash
git pull origin main
```

### Step 3: Clean Existing Setup
```bash
# Stop and remove old containers
docker compose down -v
```

### Step 4: Run New Setup
```bash
# Run updated setup script
./setup-supabase.sh

# Start new Supabase-only stack
docker compose up -d

# Watch logs to ensure clean startup
docker compose logs -f
```

### Step 5: Verify All Services
```bash
# Check all services are running
docker compose ps

# Verify schemas were created
docker compose exec db psql -U postgres -c "\dn"

# Should show: public, auth, storage, _realtime, extensions
```

### Step 6: Migrate Your Data (if applicable)
```bash
# If you had application data in old database
# Import to public schema in new Supabase database
cat old_database_backup.sql | docker compose exec -T db psql -U postgres postgres
```

## Benefits of New Architecture

### 🎯 Production Parity
- Exactly matches production Supabase architecture
- No surprises when deploying to production

### 🔧 Simplified Management
- One database to backup, monitor, and scale
- Single connection pool for all services

### 🚀 Better Performance
- Reduced connection overhead
- Shared cache and resources

### 🛡️ Enhanced Security
- Schema-level isolation
- Row Level Security (RLS) works seamlessly
- Consistent permission model

### �� Resource Efficiency
- No overhead from multiple database instances
- Better memory utilization
- Faster cross-schema queries

## What Stays the Same

✅ All API endpoints remain the same
✅ Environment variables unchanged (except values)
✅ Docker commands remain the same
✅ Client code continues to work
✅ Supabase JavaScript client usage unchanged

## Troubleshooting Migration Issues

### Services Keep Restarting
**Solution:** Ensure all migration files are present:
```bash
./setup-supabase.sh  # Will validate files
```

### Missing Schemas
**Solution:** Check migration files were applied:
```bash
docker compose exec db psql -U postgres -c "\dn"
```

### Data Loss Concern
**Solution:** Data is persistent in Docker volumes:
```bash
# Check volumes
docker volume ls | grep tool

# Backup before any changes
docker compose exec -T db pg_dump -U postgres postgres > pre_migration_backup.sql
```

## Rollback Plan

If you need to rollback:

```bash
# 1. Stop new setup
docker compose down

# 2. Checkout previous version
git checkout <previous-commit>

# 3. Start old setup
docker compose up -d

# 4. Restore data if needed
cat backup.sql | docker compose exec -T db psql -U postgres postgres
```

## Validation Checklist

After migration, verify:

- [ ] All services show "running" in `docker compose ps`
- [ ] Database has all schemas: `docker compose exec db psql -U postgres -c "\dn"`
- [ ] Auth service is healthy: `curl http://localhost:8000/auth/v1/health`
- [ ] Storage service is healthy: `curl http://localhost:8000/storage/v1/status`
- [ ] PostgREST API works: `curl http://localhost:8000/rest/v1/`
- [ ] Supabase Studio accessible: `http://localhost:3000`
- [ ] Your application data is intact (if migrated)

## Questions?

Refer to:
- [WORKFLOW.md](./WORKFLOW.md) - For development workflows
- [QUICKREF.md](./QUICKREF.md) - For quick commands
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - For common issues
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - For detailed setup

## Support

If you encounter issues:
1. Check logs: `docker compose logs -f`
2. Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
3. Ensure all prerequisites are met
4. Verify Docker and Docker Compose versions
