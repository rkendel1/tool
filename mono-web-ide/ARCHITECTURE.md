# Architecture - Mono Web IDE

This document explains the architecture and design decisions of the Mono Web IDE environment.

## Overview

The Mono Web IDE is a complete Dockerized development environment that provides:
- A web-based IDE (Code Server)
- AI-powered code completion (Dyad integration)
- Support for multiple concurrent projects
- Persistent storage
- Live preview capabilities

## System Components

### 1. Code Server Container

**Base Image:** `codercom/code-server:latest`

**Purpose:** Provides a browser-based VS Code environment

**Customizations:**
- Node.js 18.x installed
- npm and build tools
- Git pre-installed
- Working directory set to `/home/coder/project`

**Exposed Ports:**
- 8080: Code Server web interface
- 3000-3005: Application preview ports

**Volumes:**
- `./app-code` → `/home/coder/project/app-code` (read-write, persistent)
- `../extensions/ai-completion` → `/home/coder/project/extensions/ai-completion` (read-only)

**Health Check:**
- Endpoint: `http://localhost:8080/healthz`
- Interval: 30 seconds
- Timeout: 10 seconds
- Start period: 40 seconds

### 2. Dyad Test Server Container

**Base Image:** `node:18-alpine`

**Purpose:** Provides mock AI code completions for development/testing

**File:** `dyad-test-server.js` (copied from extensions directory)

**Exposed Ports:**
- 5000: Dyad API endpoint

**Endpoints:**
- `POST /completion` - Returns AI code completions
- `GET /health` - Health check

**Health Check:**
- Endpoint: `http://localhost:5000/health`
- Interval: 30 seconds
- Timeout: 3 seconds
- Start period: 5 seconds

**Environment Variables:**
- `PORT`: Server port (default: 5000)
- `RESPONSE_DELAY`: Artificial delay in ms (default: 100)

### 3. PostgreSQL 15 Container

**Base Image:** `postgres:15-alpine`

**Purpose:** Relational database for application data and auth service

**Exposed Ports:**
- 5432: PostgreSQL server

**Volumes:**
- `postgres-data`: Persistent data storage
- `./postgres-init`: Initialization scripts (read-only)

**Health Check:**
- Command: `pg_isready -U devuser -d devdb`
- Interval: 10 seconds
- Timeout: 5 seconds
- Start period: 10 seconds

**Environment Variables:**
- `POSTGRES_USER`: Database user (default: devuser)
- `POSTGRES_PASSWORD`: Database password (default: devpass)
- `POSTGRES_DB`: Database name (default: devdb)

**Pre-seeded Data:**
- `users` table - Authentication users
- `items` table - Sample data (6 items)
- `sessions` table - Session management

### 4. pgAdmin 4 Container

**Base Image:** `dpage/pgadmin4:latest`

**Purpose:** Web-based PostgreSQL management interface

**Exposed Ports:**
- 5050: pgAdmin web interface (mapped to port 80 in container)

**Volumes:**
- `pgadmin-data`: Persistent settings and configurations
- `./pgadmin-config/servers.json`: Pre-configured server connection

**Environment Variables:**
- `PGADMIN_DEFAULT_EMAIL`: Login email (default: admin@example.com)
- `PGADMIN_DEFAULT_PASSWORD`: Login password (default: admin)
- `PGADMIN_CONFIG_SERVER_MODE`: Server mode setting (False)
- `PGADMIN_CONFIG_MASTER_PASSWORD_REQUIRED`: Master password requirement (False)

**Pre-configured Connection:**
- Server name: "Mono-Web-IDE Postgres"
- Host: postgres
- Port: 5432
- Database: devdb
- Username: devuser

### 5. Auth Service Container

**Base Image:** `node:18-alpine`

**Purpose:** JWT-based authentication service with user management

**File:** `auth-service.js`

**Exposed Ports:**
- 4000: Auth API endpoint

**Endpoints:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/verify` - Verify JWT token
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout (client-side token removal)
- `GET /health` - Health check

**Health Check:**
- Endpoint: `http://localhost:4000/health`
- Interval: 30 seconds
- Timeout: 3 seconds
- Start period: 10 seconds

**Environment Variables:**
- `PORT`: Server port (default: 4000)
- `JWT_SECRET`: Secret key for JWT signing
- `JWT_EXPIRES_IN`: Token expiration time (default: 24h)
- `POSTGRES_HOST`: Database host (default: postgres)
- `POSTGRES_PORT`: Database port (default: 5432)
- `POSTGRES_DB`: Database name (default: devdb)
- `POSTGRES_USER`: Database user (default: devuser)
- `POSTGRES_PASSWORD`: Database password (default: devpass)

**Default Users:**
- Username: `admin`, Password: `admin123`
- Username: `demo`, Password: `demo123`

**Features:**
- Database-backed user storage with PostgreSQL
- Falls back to in-memory storage if database unavailable
- Password hashing with bcrypt
- JWT token generation and verification
- User registration and login

### 6. Redis Container

**Base Image:** `redis:7-alpine`

**Purpose:** In-memory data store for caching, sessions, and async jobs

**Exposed Ports:**
- 6379: Redis server

**Volumes:**
- `redis-data`: Persistent data with AOF (Append-Only File)

**Health Check:**
- Command: `redis-cli ping`
- Interval: 10 seconds
- Timeout: 3 seconds
- Start period: 5 seconds

**Configuration:**
- AOF persistence enabled
- Optional password protection via `REDIS_PASSWORD` env var

**Use Cases:**
- Session storage
- API response caching
- Rate limiting
- Background job queues

## Network Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            Host System                                   │
│                                                                          │
│  Browser ──────────────────────────────────────────────────────         │
│    │                                                               │      │
│    │ Port 8080 (Code Server)                                      │      │
│    │ Port 5050 (pgAdmin)                                          │      │
│    │ Port 4000 (Auth Service)                                     │      │
│    ↓                                                               │      │
│  ┌────────────────────────────────────────────────────────────┐  │      │
│  │              Code Server Container                         │  │      │
│  │  ┌──────────────────────────────────────────────────────┐  │  │      │
│  │  │  VS Code (Browser)                                   │  │  │      │
│  │  │  - Extensions + AI Completion                        │  │  │      │
│  │  └──────────────────────────────────────────────────────┘  │  │      │
│  │         │                 │                  │              │  │      │
│  │         │ dyad-server:5000│ auth-service:4000│              │  │      │
│  │         │                 │                  │postgres:5432 │  │      │
│  │         ↓                 ↓                  ↓              │  │      │
│  └────────────────────────────────────────────────────────────┘  │      │
│         │                  │                   │                 │      │
│         │                  │                   │                 │      │
│         ↓                  ↓                   ↓                 │      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │      │
│  │ Dyad Server  │  │ Auth Service │  │    PostgreSQL 15     │  │      │
│  │  Port 5000   │  │  Port 4000   │  │      Port 5432       │  │      │
│  │              │  │              │  │                      │  │      │
│  │ /completion  │  │ /api/auth/*  │  │  Tables:             │  │      │
│  │ /health      │  │ /health      │  │  - users             │  │      │
│  │              │  │              │  │  - items             │  │      │
│  │              │  │──────────────┤  │  - sessions          │  │      │
│  │              │  │   JWT Auth   │  │                      │  │      │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │      │
│                                              ↑                  │      │
│                                              │                  │      │
│                                              │ postgres:5432    │      │
│                                      ┌───────────────────────┐  │      │
│                                      │   pgAdmin 4           │  │      │
│                                      │   Port 5050           │  │      │
│                                      │   Pre-configured      │  │      │
│                                      └───────────────────────┘  │      │
│                                                                 │      │
│  ┌──────────────┐  ┌────────────────────────────────────────┐  │      │
│  │    Redis     │  │  Volumes (Persistent)                  │  │      │
│  │  Port 6379   │  │  - app-code/ (host directory)          │  │      │
│  │              │  │  - postgres-data (Docker volume)       │  │      │
│  │  Caching     │  │  - pgadmin-data (Docker volume)        │  │      │
│  │  Sessions    │  │  - redis-data (Docker volume)          │  │      │
│  └──────────────┘  └────────────────────────────────────────┘  │      │
│                                                                 │      │
│  Network: mono-web-ide (bridge)                                │      │
│  All services connected via Docker internal DNS                │      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Service Communication

**Internal Docker Network:**
- Services communicate via service names (e.g., `postgres`, `redis`, `auth-service`)
- Network: `mono-web-ide` (bridge driver)
- DNS resolution handled by Docker

**External Access (from host):**
- Code Server: `http://localhost:8080`
- pgAdmin: `http://localhost:5050`
- Auth Service: `http://localhost:4000`
- Dyad Server: `http://localhost:5000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- App Previews: `http://localhost:3000-3005`

## Data Flow

### 1. Code Completion Flow

```
User types code in editor
       ↓
VS Code AI Extension detects trigger
       ↓
Extension sends request to DYAD_BACKEND_URL
       ↓
Request goes to Dyad Server (http://dyad-server:5000/completion)
       ↓
Dyad Server processes request
       ↓
Returns mock completions based on language
       ↓
Extension displays completions to user
       ↓
User accepts/rejects suggestion
```

### 2. Development Workflow

```
User writes code in Code Server
       ↓
Files saved to /home/coder/project/app-code
       ↓
Volume mount persists to host: ./app-code
       ↓
User runs dev server (npm start)
       ↓
App runs on port 3000-3005
       ↓
Port forwarded to host
       ↓
User accesses app in browser
```

### 3. Authentication Flow

```
User registers/logs in via Auth Service
       ↓
POST /api/auth/register or /api/auth/login
       ↓
Auth Service validates credentials (checks DB)
       ↓
PostgreSQL query: SELECT * FROM users WHERE username = ?
       ↓
Password verified with bcrypt
       ↓
JWT token generated with user payload
       ↓
Token returned to client
       ↓
Client includes token in subsequent requests
       ↓
Backend verifies token: POST /api/auth/verify
       ↓
Token validated and user info extracted
       ↓
Protected resource accessed
```

### 4. Database Integration Flow

```
App connects to PostgreSQL
       ↓
Connection: postgresql://devuser:devpass@postgres:5432/devdb
       ↓
Execute query (SELECT, INSERT, UPDATE, DELETE)
       ↓
PostgreSQL processes query
       ↓
Results returned to app
       ↓
App processes and returns to client
```

**Example from app2:**
```javascript
const { Pool } = require('pg');
const pool = new Pool({
  host: 'postgres',
  port: 5432,
  database: 'devdb',
  user: 'devuser',
  password: 'devpass',
});

// Query items
const result = await pool.query('SELECT * FROM items');
```

## Volume Strategy

### Persistent Volumes

1. **app-code/** (Host Directory - Read-Write)
   - Contains all user projects
   - Mounted from host to container
   - Survives container restarts
   - Can be edited from both host and container
   - Backed up by copying the directory

2. **postgres-data** (Docker Volume)
   - PostgreSQL database files
   - Persistent across container restarts
   - Contains all database tables and data
   - Backed up using `pg_dump` or volume export

3. **pgadmin-data** (Docker Volume)
   - pgAdmin configuration and settings
   - Server connections and preferences
   - Query history

4. **redis-data** (Docker Volume)
   - Redis data with AOF persistence
   - Cached data and session storage
   - Survives container restarts

5. **extensions/ai-completion/** (Host Directory - Read-Only)
   - Contains the AI completion extension
   - Mounted from parent repository
   - Reference only, modifications should be made in source

### Temporary/Ephemeral Data

- Container filesystem (not in volumes)
- Logs (unless redirected to volumes)
- Installed system packages
- npm global packages

### Backup Strategy

**Database Backup:**
```bash
# Backup PostgreSQL
docker compose exec postgres pg_dump -U devuser devdb > backup.sql

# Restore PostgreSQL
docker compose exec -T postgres psql -U devuser devdb < backup.sql
```

**Volume Backup:**
```bash
# Backup all volumes
docker run --rm -v mono-web-ide_postgres-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres-backup.tar.gz -C /data .
```

**Code Backup:**
```bash
# Backup app code
tar czf app-code-backup.tar.gz app-code/
```

## Security Considerations

### Authentication

- **Code Server:** Protected by password (env: `PASSWORD`)
  - Default: `coder` (change in production)
- **pgAdmin:** Protected by email/password
  - Default: admin@example.com / admin (change in production)
- **Auth Service:** JWT-based authentication
  - Secret key: `JWT_SECRET` (change in production)
  - Tokens expire after 24 hours (configurable)
- **PostgreSQL:** Username/password authentication
  - Default: devuser / devpass (change in production)
- **Redis:** Optional password protection
  - Set `REDIS_PASSWORD` for production
- **Dyad Test Server:** No authentication (local dev only)

### Network Isolation

- Services communicate via internal Docker network `mono-web-ide`
- Only necessary ports exposed to host
- Database not directly accessible from outside (except via mapped port)
- Auth service and Dyad server available on localhost for testing

### Data Security

- Passwords hashed with bcrypt (auth service)
- JWT tokens signed with secret key
- Database credentials in environment variables
- Secrets should be rotated in production
- Use `.env` file for configuration (not committed to git)

### File Permissions

- Code Server runs as user `coder` (UID 1000)
- Volume permissions should match host user
- Database files owned by postgres user
- pgAdmin files owned by pgadmin user
- Use `sudo` for system-level operations

## Environment Variables

### Code Server

- `PASSWORD`: Login password (default: coder)
- `DYAD_BACKEND_URL`: Dyad API endpoint (default: http://dyad-server:5000/completion)
- `API_KEY`: API key for production Dyad
- `AI_MODEL`: AI model to use (default: dyad-default)
- `SESSION_ID`: Session identifier
- `USER_ID`: User identifier

### Dyad Test Server

- `PORT`: Server port (default: 5000)
- `RESPONSE_DELAY`: Artificial delay in ms (default: 100)

## Scaling Considerations

### Horizontal Scaling

To run multiple instances:
1. Change port mappings in docker-compose.yml
2. Use different data directories for each instance
3. Consider using a reverse proxy (nginx, Traefik)

### Resource Limits

Current setup uses default Docker limits. For production:

```yaml
services:
  code-server:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

## Production Deployment

### Changes for Production

1. **Use Production Dyad Instance**
   - Set `DYAD_BACKEND_URL` to production endpoint
   - Configure `API_KEY` properly
   - Use appropriate `AI_MODEL`

2. **Enable HTTPS**
   - Use reverse proxy (nginx, Traefik, Caddy)
   - Obtain SSL certificates
   - Redirect HTTP to HTTPS

3. **Improve Security**
   - Change default password
   - Use secrets management (Docker secrets, Vault)
   - Enable firewall rules
   - Use non-root users

4. **Add Monitoring**
   - Prometheus + Grafana for metrics
   - Log aggregation (ELK, Loki)
   - Uptime monitoring
   - Resource usage alerts

5. **Backup Strategy**
   - Regular backups of app-code volume
   - Database backups (if added)
   - Configuration backups
   - Disaster recovery plan

## Technology Stack

### Runtime

- **Docker**: Container platform
- **Docker Compose**: Multi-container orchestration
- **Node.js 18**: JavaScript runtime
- **Alpine Linux**: Minimal base OS (Dyad server)
- **Debian**: Base OS (Code Server)

### Development Tools

- **Code Server**: VS Code in browser
- **npm**: Package manager
- **Git**: Version control
- **Build tools**: gcc, make, etc.

### Languages Supported

- JavaScript/TypeScript (Node.js)
- Python (can be added)
- Go (can be added)
- Any language supported by VS Code

## Extension Architecture

### AI Completion Extension

The AI completion extension integrates with Dyad through:

1. **Extension Configuration**
   - Reads `DYAD_BACKEND_URL` from environment
   - Configures API key and model
   - Sets session/user identifiers

2. **Completion Provider**
   - Registers with VS Code
   - Listens for typing events
   - Triggers on specific patterns

3. **Request Handler**
   - Builds request payload
   - Sends to Dyad backend
   - Parses response
   - Returns completions to VS Code

## Future Enhancements

### Implemented Features ✅

1. **Database Integration** ✅
   - PostgreSQL 15 container
   - pgAdmin 4 for database management
   - Redis for caching
   - Pre-seeded sample data
   - Auth service with database-backed user storage

### Planned Features

1. **Collaboration**
   - Real-time collaborative editing
   - Shared sessions
   - User presence indicators

2. **Additional Databases**
   - MongoDB container
   - Multiple database instances
   - Database migration tools

3. **CI/CD Integration**
   - GitHub Actions integration
   - GitLab CI integration
   - Automated deployments
   - Docker registry integration

4. **Enhanced AI Features**
   - Code review suggestions
   - Automated refactoring
   - Test generation
   - Documentation generation

5. **Development Tools**
   - API testing tools (Postman/Insomnia alternative)
   - Performance profiling
   - Log aggregation
   - Monitoring dashboards

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   - Solution: Change port mappings in docker-compose.yml

2. **Volume Permission Issues**
   - Solution: Ensure host directory is writable by UID 1000

3. **Out of Memory**
   - Solution: Increase Docker memory limit or add resource constraints

4. **Network Issues**
   - Solution: Recreate network: `docker compose down && docker compose up`

## References

- [Code Server Documentation](https://coder.com/docs/code-server)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Node.js Documentation](https://nodejs.org/docs)
