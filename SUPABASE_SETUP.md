# Supabase Setup Guide

> **Architecture Note:** This setup uses a **Supabase-only database architecture**. All services (Auth, Storage, Realtime, etc.) connect to a single Supabase PostgreSQL database using separate schemas. There is no standalone PostgreSQL instance.

This guide will help you set up and use Supabase in your local development environment and prepare for production deployment.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Services Overview](#services-overview)
- [Configuration](#configuration)
- [Accessing Services](#accessing-services)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

## Overview

This Docker Compose setup provides a complete **Supabase-only stack** with all services connecting to a single Supabase PostgreSQL database:

- **Supabase Database** - PostgreSQL 15 with Supabase extensions (single database for all services)
  - `public` schema - Your application data
  - `auth` schema - Authentication data (users, sessions, etc.)
  - `storage` schema - File storage metadata
  - `_realtime` schema - Realtime subscriptions
- **Auth Service (GoTrue)** - User authentication using `auth` schema
- **Storage Service** - File uploads and management using `storage` schema
- **Realtime Service** - WebSocket subscriptions using `_realtime` schema
- **Edge Functions** - Serverless functions (Deno-based)
- **Kong API Gateway** - Routing and API management
- **Supabase Studio** - Database management UI
- **PostgREST** - Automatic REST API generation from `public` schema
- **Redis** - Caching and session management

## Prerequisites

- Docker Engine 20.10.0 or higher
- Docker Compose V2 or higher
- At least 4GB of RAM available for Docker
- Ports available: 3000, 4000, 6379, 8000, 8443, 54321

### Check Prerequisites

```bash
# Check Docker version
docker --version

# Check Docker Compose version
docker compose version

# Check available ports
lsof -i :3000 -i :4000 -i :6379 -i :8000 -i :8443 -i :54321
```

## Quick Start

### 1. Environment Setup

Copy the example environment file and customize it:

```bash
cp .env.example .env
```

**Important:** For local development, the default values in `.env.example` are sufficient. For production, you **must** change all secrets and passwords.

### 2. Generate Secrets (Optional for Local Dev)

For production or if you want unique local secrets:

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate Realtime secret
openssl rand -base64 32

# Generate Logflare API key
openssl rand -base64 32
```

Update these values in your `.env` file.

### 3. Start the Stack

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f db
docker compose logs -f auth
```

### 4. Verify Services are Running

```bash
# Check service status
docker compose ps

# All services should show as "Up" and "healthy"
```

## Services Overview

### Supabase Studio (Port 3000)

Web-based UI for managing your Supabase project.

- **URL:** http://localhost:3000
- **Features:**
  - Database schema editor
  - SQL editor
  - Table data viewer
  - Authentication user management
  - Storage bucket management
  - API documentation

### Kong API Gateway (Port 8000)

Routes all API requests to the appropriate Supabase services.

- **HTTP URL:** http://localhost:8000
- **HTTPS URL:** https://localhost:8443
- **Routes:**
  - `/auth/v1/*` → Auth service
  - `/rest/v1/*` → PostgREST API
  - `/realtime/v1/*` → Realtime subscriptions
  - `/storage/v1/*` → Storage API
  - `/functions/v1/*` → Edge Functions

### Supabase Database (Port 54321)

PostgreSQL 15 with Supabase extensions and optimizations. This is the **single database instance** for all Supabase services and your application data.

- **Host:** localhost
- **Port:** 54321 (exposed on host port 54321 to avoid conflicts with existing PostgreSQL installations)
- **Database:** postgres (or as configured in `.env`)
- **User:** postgres
- **Password:** See `POSTGRES_PASSWORD` in `.env`

**Connection String:**
```
postgresql://postgres:your-password@localhost:54321/postgres
```

**Database Schemas:**
- `public` - Your application tables and data
- `auth` - Authentication data (users, sessions, tokens, etc.)
- `storage` - Storage metadata (buckets, objects)
- `_realtime` - Realtime publication configuration
- `extensions` - PostgreSQL extensions

**Important:** This is a **Supabase-optimized PostgreSQL database**, not a standalone PostgreSQL instance. All Supabase services (Auth, Storage, Realtime, etc.) connect to this same database using different schemas. This architecture:
- Ensures consistency across all services
- Simplifies deployment and management
- Matches production Supabase architecture
- Eliminates need for multiple database instances

### Auth Service (GoTrue)

Handles user authentication and authorization using the `auth` schema in the Supabase database.

- **Features:**
  - Email/password authentication
  - OAuth providers (Google, GitHub, etc.)
  - Magic links
  - JWT token management
  - Row Level Security (RLS) integration
- **Database Schema:** `auth` (automatically created on first startup)

### Storage Service

Object storage for files and media using the `storage` schema in the Supabase database.

- **Features:**
  - File uploads/downloads
  - Image transformations
  - Access control via RLS
  - CDN-ready
- **Database Schema:** `storage` (automatically created on first startup)

### Realtime Service

WebSocket server for real-time subscriptions.

- **Features:**
  - Database change subscriptions
  - Presence tracking
  - Broadcast messages
  - Postgres changes streaming

### Edge Functions

Serverless functions powered by Deno.

- **Runtime:** Deno
- **Location:** `./volumes/functions/`
- **Example function:** `./volumes/functions/main/index.ts`

### Redis (Port 6379)

In-memory data store for caching and sessions.

- **Host:** localhost
- **Port:** 6379
- **Use cases:**
  - Session storage
  - Rate limiting
  - Caching API responses

## Configuration

### Environment Variables

All configuration is done via the `.env` file. Key variables:

#### Core Settings

```env
POSTGRES_PASSWORD=your-super-secret-password
JWT_SECRET=your-jwt-secret
SUPABASE_PUBLIC_URL=http://localhost:8000
```

#### API Keys

```env
ANON_KEY=your-anon-key
SERVICE_ROLE_KEY=your-service-role-key
```

The `ANON_KEY` is safe to use in browsers with RLS enabled.
The `SERVICE_ROLE_KEY` bypasses RLS - **never expose in client code**.

#### Authentication

```env
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=true
DISABLE_SIGNUP=false
SITE_URL=http://localhost:3000
```

#### SMTP Configuration

For email functionality (password reset, confirmations):

```env
SMTP_ADMIN_EMAIL=admin@example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
```

For local development, consider using:
- [Mailhog](https://github.com/mailhog/MailHog)
- [Mailtrap](https://mailtrap.io/)
- [Ethereal](https://ethereal.email/)

## Accessing Services

### Using Supabase Studio

1. Open http://localhost:3000
2. Create tables, manage data, and configure auth
3. All changes are reflected immediately in your local database

### Using the API

#### JavaScript/TypeScript Client

```bash
npm install @supabase/supabase-js
```

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'http://localhost:8000',
  'your-anon-key'
)

// Example: Fetch data
const { data, error } = await supabase
  .from('your_table')
  .select('*')

// Example: Insert data
const { data, error } = await supabase
  .from('your_table')
  .insert({ name: 'John Doe' })

// Example: Realtime subscription
const subscription = supabase
  .channel('table-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'your_table' },
    (payload) => console.log(payload)
  )
  .subscribe()
```

#### Direct API Calls

```bash
# List tables
curl http://localhost:8000/rest/v1/ \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key"

# Query data
curl http://localhost:8000/rest/v1/your_table \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key"

# Insert data
curl -X POST http://localhost:8000/rest/v1/your_table \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe"}'
```

### Database Access

#### Using psql

```bash
# Connect via Docker
docker compose exec db psql -U postgres

# Connect from host
psql postgresql://postgres:your-password@localhost:54321/postgres
```

#### Using a GUI Client

Connect using tools like:
- pgAdmin
- DBeaver
- TablePlus
- DataGrip

**Connection details:**
- Host: localhost
- Port: 54321
- Database: postgres
- User: postgres
- Password: (from `.env`)

## Development Workflow

### 1. Create a Table

Using Supabase Studio:
1. Go to http://localhost:3000
2. Navigate to Table Editor
3. Click "New table"
4. Define your schema
5. Enable Row Level Security (RLS)

Or using SQL:

```sql
CREATE TABLE todos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  task TEXT NOT NULL,
  is_complete BOOLEAN DEFAULT false,
  inserted_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own todos"
  ON todos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own todos"
  ON todos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todos"
  ON todos FOR UPDATE
  USING (auth.uid() = user_id);
```

### 2. Enable Realtime

```sql
-- Enable realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE todos;
```

### 3. Create an Edge Function

```bash
# Create function directory
mkdir -p volumes/functions/hello-world

# Create function file
cat > volumes/functions/hello-world/index.ts << 'EOF'
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

serve(async (req) => {
  const { name } = await req.json()
  return new Response(
    JSON.stringify({ message: `Hello ${name}!` }),
    { headers: { "Content-Type": "application/json" } }
  )
})
EOF

# Restart functions service
docker compose restart functions
```

### 4. Test Your Function

```bash
curl -i --location --request POST 'http://localhost:8000/functions/v1/hello-world' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'Content-Type: application/json' \
  --data '{"name":"World"}'
```

### 5. Use Storage

```javascript
// Upload a file
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('public/avatar.png', file)

// Get public URL
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl('public/avatar.png')

// Download file
const { data, error } = await supabase.storage
  .from('avatars')
  .download('public/avatar.png')
```

## Testing

### Health Checks

```bash
# Check all services
docker compose ps

# Test database connection
docker compose exec db pg_isready -U postgres

# Test Redis
docker compose exec redis redis-cli ping

# Test Auth service
curl http://localhost:8000/auth/v1/health

# Test Storage
curl http://localhost:8000/storage/v1/status
```

### Integration Testing

Create a test script:

```javascript
// test-supabase.js
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://localhost:8000',
  process.env.ANON_KEY
)

async function testSupabase() {
  // Test auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'test-password-123'
  })
  
  console.log('Auth test:', authError ? 'FAILED' : 'PASSED')
  
  // Test database
  const { data: dbData, error: dbError } = await supabase
    .from('test_table')
    .select('*')
  
  console.log('Database test:', dbError ? 'FAILED' : 'PASSED')
}

testSupabase()
```

## Production Deployment

### Switching from Local to Production

1. **Update Environment Variables:**

```env
# Production URLs
SUPABASE_PUBLIC_URL=https://api.yourdomain.com
API_EXTERNAL_URL=https://api.yourdomain.com
SITE_URL=https://yourdomain.com

# Generate new secrets
JWT_SECRET=<new-production-secret>
POSTGRES_PASSWORD=<strong-production-password>
ANON_KEY=<new-anon-key>
SERVICE_ROLE_KEY=<new-service-role-key>

# Production SMTP
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<your-sendgrid-api-key>

# Disable auto-confirm in production
ENABLE_EMAIL_AUTOCONFIRM=false
ENABLE_PHONE_AUTOCONFIRM=false
```

2. **Generate Production API Keys:**

Use the Supabase CLI or online tools to generate JWT tokens with your production `JWT_SECRET`.

3. **Enable SSL/TLS:**

Update Kong configuration to use SSL certificates. Consider using Let's Encrypt.

4. **Set Up Backups:**

```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker compose exec -T db pg_dump -U postgres postgres > backup_$DATE.sql

# Compress
gzip backup_$DATE.sql

# Upload to S3 or backup storage
aws s3 cp backup_$DATE.sql.gz s3://your-backup-bucket/
```

5. **Configure Reverse Proxy:**

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

6. **Enable Monitoring:**

- Set up health check monitoring
- Configure log aggregation
- Set up alerts for service failures

### Production Checklist

- [ ] Change all default passwords and secrets
- [ ] Generate production API keys with proper JWT_SECRET
- [ ] Update all URLs to production domains
- [ ] Configure proper SMTP for email delivery
- [ ] Enable SSL/TLS encryption
- [ ] Set up database backups
- [ ] Configure monitoring and alerting
- [ ] Review and test Row Level Security policies
- [ ] Set up rate limiting
- [ ] Configure CORS properly
- [ ] Review and harden security settings
- [ ] Set up log rotation
- [ ] Configure firewall rules
- [ ] Test disaster recovery procedures

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker compose logs

# Check specific service
docker compose logs db
docker compose logs auth

# Restart services
docker compose restart

# Full restart
docker compose down
docker compose up -d
```

### Database Connection Issues

```bash
# Check if database is ready
docker compose exec db pg_isready -U postgres

# Check database logs
docker compose logs db

# Connect to database
docker compose exec db psql -U postgres

# Check connections
SELECT * FROM pg_stat_activity;
```

### Auth Service Issues

```bash
# Check auth logs
docker compose logs auth

# Verify JWT secret is set correctly
docker compose exec auth env | grep JWT

# Test auth endpoint
curl http://localhost:8000/auth/v1/health
```

### Storage Issues

```bash
# Check storage logs
docker compose logs storage

# Verify storage directory permissions
ls -la volumes/storage/

# Check storage health
curl http://localhost:8000/storage/v1/status
```

### Kong/API Gateway Issues

```bash
# Check Kong logs
docker compose logs kong

# Verify Kong configuration
docker compose exec kong kong config parse /home/kong/kong.yml

# Test Kong health
curl http://localhost:8000
```

### Port Conflicts

```bash
# Check what's using a port
lsof -i :8000
lsof -i :54321

# Change port in docker-compose.yml
# For example, change postgres port mapping:
ports:
  - "54322:5432"  # Changed from 54321
```

### Reset Everything

⚠️ **Warning:** This will delete all data!

```bash
# Stop and remove all containers, networks, and volumes
docker compose down -v

# Remove volume directories
rm -rf volumes/storage/*

# Start fresh
docker compose up -d
```

### Common Errors

#### "database is starting up"

Wait a few seconds for PostgreSQL to fully initialize. Check with:

```bash
docker compose logs db | tail -20
```

#### "relation does not exist"

Tables may not be created yet. Run migrations or create tables manually.

#### "JWT expired"

Generate a new JWT token or check your JWT_SECRET configuration.

#### "Permission denied"

Check Row Level Security policies and ensure the user has proper permissions.

## API Reference

### Quick Links

- **REST API:** http://localhost:8000/rest/v1/
- **Auth API:** http://localhost:8000/auth/v1/
- **Storage API:** http://localhost:8000/storage/v1/
- **Realtime:** ws://localhost:8000/realtime/v1/

### Common Endpoints

#### Auth

```bash
# Sign up
POST /auth/v1/signup
Body: { "email": "user@example.com", "password": "password" }

# Sign in
POST /auth/v1/token?grant_type=password
Body: { "email": "user@example.com", "password": "password" }

# Sign out
POST /auth/v1/logout
Header: Authorization: Bearer <token>

# Get user
GET /auth/v1/user
Header: Authorization: Bearer <token>
```

#### Database (PostgREST)

```bash
# Select all
GET /rest/v1/table_name

# Select with filter
GET /rest/v1/table_name?column=eq.value

# Insert
POST /rest/v1/table_name
Body: { "column1": "value1", "column2": "value2" }

# Update
PATCH /rest/v1/table_name?id=eq.1
Body: { "column": "new_value" }

# Delete
DELETE /rest/v1/table_name?id=eq.1
```

#### Storage

```bash
# List buckets
GET /storage/v1/bucket

# Create bucket
POST /storage/v1/bucket
Body: { "name": "my-bucket", "public": false }

# Upload file
POST /storage/v1/object/{bucket}/{path}
Body: FormData with file

# Download file
GET /storage/v1/object/{bucket}/{path}
```

### Documentation

- [Supabase Documentation](https://supabase.com/docs)
- [PostgREST API Reference](https://postgrest.org/en/stable/api.html)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

## Additional Resources

- **Supabase GitHub:** https://github.com/supabase/supabase
- **Community Discord:** https://discord.supabase.com
- **Example Apps:** https://github.com/supabase/supabase/tree/master/examples

## Support

For issues and questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review Supabase documentation
3. Check Docker logs for specific services
4. Visit Supabase community forums

---

**Happy coding with Supabase! 🚀**
