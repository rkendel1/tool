# Code Server with Supabase Integration

Run [VS Code](https://github.com/Microsoft/vscode) on any machine anywhere with integrated Supabase backend services for rapid application development.

## 🚀 Quick Start with Supabase

This repository now includes a complete Supabase stack for local development, featuring all essential backend services in Docker containers.

### Prerequisites

- Docker Engine 20.10.0+
- Docker Compose V2+
- 4GB RAM minimum for Docker

### Get Started in 3 Steps

```bash
# 1. Run the setup script
./setup-supabase.sh

# 2. Start all services
docker compose up -d

# 3. Access Supabase Studio
open http://localhost:3000
```

That's it! You now have a complete backend running locally.

## 📦 What's Included

The Supabase integration provides:

- **Supabase Database** (Port 54321) - PostgreSQL 15 with Supabase extensions and optimizations
- **Supabase Studio** (Port 3000) - Web UI for database and API management
- **Auth Service** (via Kong:8000) - Complete authentication system
- **Storage Service** (via Kong:8000) - Object storage with image transformations
- **Realtime** (via Kong:8000) - WebSocket subscriptions for live data
- **Edge Functions** (via Kong:8000) - Serverless functions (Deno)
- **PostgREST API** (via Kong:8000) - Auto-generated REST API from your database
- **Kong API Gateway** (Port 8000) - Unified API endpoint
- **Redis** (Port 6379) - Caching and session management

## 🎯 Key Features

### Single Command Startup
```bash
docker compose up -d
```

All services start together with proper dependencies and health checks.

### Seamless Environment Switching

Switch from local to production by updating your `.env` file:

```bash
# Local development
SUPABASE_PUBLIC_URL=http://localhost:8000

# Production
SUPABASE_PUBLIC_URL=https://api.yourdomain.com
```

No code changes required!

### Full Supabase Capabilities

- ✅ Authentication (email, OAuth, magic links)
- ✅ Row Level Security (RLS)
- ✅ Real-time subscriptions
- ✅ File storage with transformations
- ✅ Serverless edge functions
- ✅ Auto-generated REST API
- ✅ GraphQL support
- ✅ Full-text search
- ✅ Database migrations

## 📚 Documentation

- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Complete setup and usage guide
- **[.env.example](./.env.example)** - Environment configuration reference

## 🔌 Service Endpoints

| Service | URL | Purpose |
|---------|-----|---------|
| Supabase Studio | http://localhost:3000 | Database management UI |
| API Gateway | http://localhost:8000 | Unified API endpoint |
| Supabase Database | localhost:54321 | Direct database access (PostgreSQL protocol) |
| Redis | localhost:6379 | Cache and sessions |

## 💻 Usage Example

```javascript
import { createClient } from '@supabase/supabase-js'

// Connect to local Supabase
const supabase = createClient(
  'http://localhost:8000',
  'your-anon-key-from-env'
)

// Use authentication
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password'
})

// Query data with real-time subscriptions
const subscription = supabase
  .channel('todos')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'todos' },
    (payload) => console.log('Change received!', payload)
  )
  .subscribe()

// Use storage
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('public/avatar.png', file)
```

## 🛠️ Common Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down

# Stop and remove all data (⚠️ CAUTION)
docker compose down -v

# Check service health
docker compose ps

# Restart a specific service
docker compose restart db
```

## 🔧 Configuration

All configuration is done via the `.env` file. Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

### Important Environment Variables

- `POSTGRES_PASSWORD` - Database password
- `JWT_SECRET` - Secret for JWT tokens
- `ANON_KEY` - Public API key (safe for browsers with RLS)
- `SERVICE_ROLE_KEY` - Admin API key (keep secure!)
- `SUPABASE_PUBLIC_URL` - Your API endpoint URL

## 📊 Database Management

### Using Supabase Studio

Navigate to http://localhost:3000 for a visual interface to:
- Create and modify tables
- Write and run SQL queries
- Manage users and authentication
- Configure storage buckets
- View API documentation

### Using psql

```bash
# Connect via Docker
docker compose exec db psql -U postgres

# Connect from host
psql postgresql://postgres:your-password@localhost:54321/postgres
```

## 🚢 Production Deployment

1. Update `.env` with production values:
   ```env
   SUPABASE_PUBLIC_URL=https://api.yourdomain.com
   POSTGRES_PASSWORD=<strong-unique-password>
   JWT_SECRET=<generate-new-secret>
   ```

2. Generate production API keys using your production `JWT_SECRET`

3. Configure SMTP for email delivery

4. Enable SSL/TLS in Kong

5. Set up automated backups:
   ```bash
   docker compose exec -T db pg_dump -U postgres postgres > backup.sql
   ```

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for complete production deployment guide.

## 🐛 Troubleshooting

### Services won't start
```bash
docker compose logs
```

### Database connection issues
```bash
docker compose exec db pg_isready -U postgres
```

### Port conflicts
Edit `docker-compose.yml` to change port mappings.

### Reset everything
```bash
docker compose down -v  # ⚠️ Deletes all data!
docker compose up -d
```

For more troubleshooting help, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md#troubleshooting).

## 🎓 Learning Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgREST API Reference](https://postgrest.org/en/stable/api.html)
- [Deno Documentation](https://deno.land/manual) (for Edge Functions)

## 🤝 Contributing

Contributions are welcome! Please see the [code-server contribution guide](https://coder.com/docs/code-server/latest/CONTRIBUTING).

## 📝 License

MIT - see [LICENSE](./LICENSE) for details.

## 🆘 Support

- **Supabase Issues:** Check the [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) troubleshooting section
- **Code Server Issues:** See the [code-server documentation](https://coder.com/docs/code-server)
- **Community:** Join the [Supabase Discord](https://discord.supabase.com)

---

**Happy coding! 🚀**
