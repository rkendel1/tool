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

## Network Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Host System                          │
│                                                              │
│  Browser ───────────────────────────────────────────────    │
│       │                                                  │   │
│       │ Port 8080                                        │   │
│       ↓                                                  │   │
│  ┌──────────────────────────────────────────────────┐   │   │
│  │         Code Server Container                    │   │   │
│  │  ┌────────────────────────────────────────────┐  │   │   │
│  │  │  VS Code (Browser)                         │  │   │   │
│  │  │  - Extensions                              │  │   │   │
│  │  │  - AI Completion Extension                 │  │   │   │
│  │  └────────────────────────────────────────────┘  │   │   │
│  │                  │                                │   │   │
│  │                  │ HTTP                           │   │   │
│  │                  ↓                                │   │   │
│  │         Dyad Backend Adapter                     │   │   │
│  │         (Environment: DYAD_BACKEND_URL)          │   │   │
│  │                  │                                │   │   │
│  │                  │ Internal network               │   │   │
│  └──────────────────┼────────────────────────────────┘   │   │
│                     │                                     │   │
│                     │ http://dyad-server:5000             │   │
│                     ↓                                     │   │
│  ┌──────────────────────────────────────────────────┐   │   │
│  │      Dyad Test Server Container                  │   │   │
│  │  ┌────────────────────────────────────────────┐  │   │   │
│  │  │  Node.js Server                            │  │   │   │
│  │  │  - /completion endpoint                    │  │   │   │
│  │  │  - /health endpoint                        │  │   │   │
│  │  │  - Mock completions by language            │  │   │   │
│  │  └────────────────────────────────────────────┘  │   │   │
│  └──────────────────────────────────────────────────┘   │   │
│                                                          │   │
│  ┌──────────────────────────────────────────────────┐   │   │
│  │          Volume: app-code (Persistent)           │   │   │
│  │  - app1/ (React)                                 │   │   │
│  │  - app2/ (Express)                               │   │   │
│  │  - app3/ (Your projects)                         │   │   │
│  └──────────────────────────────────────────────────┘   │   │
│                                                          │   │
└──────────────────────────────────────────────────────────────┘
```

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

## Volume Strategy

### Persistent Volumes

1. **app-code/** (Read-Write)
   - Contains all user projects
   - Mounted from host to container
   - Survives container restarts
   - Can be edited from both host and container
   - Backed up by copying the directory

2. **extensions/ai-completion/** (Read-Only)
   - Contains the AI completion extension
   - Mounted from parent repository
   - Reference only, modifications should be made in source

### Temporary/Ephemeral Data

- Container filesystem (not in volumes)
- Logs (unless redirected to volumes)
- Installed system packages
- npm global packages

## Security Considerations

### Authentication

- Code Server protected by password (env: `PASSWORD`)
- Default password: `coder` (should be changed in production)
- No authentication on Dyad test server (local use only)

### Network Isolation

- Services communicate via internal Docker network `mono-web-ide`
- Only necessary ports exposed to host
- Dyad server not directly accessible from outside (only via Code Server)

### File Permissions

- Code Server runs as user `coder` (UID 1000)
- Volume permissions should match host user
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

### Planned Features

1. **Collaboration**
   - Real-time collaborative editing
   - Shared sessions
   - User presence indicators

2. **Database Integration**
   - PostgreSQL container
   - MongoDB container
   - Redis for caching

3. **CI/CD Integration**
   - GitHub Actions integration
   - GitLab CI integration
   - Automated deployments

4. **Enhanced AI Features**
   - Code review suggestions
   - Automated refactoring
   - Test generation

5. **Development Tools**
   - Database management UI
   - API testing tools
   - Performance profiling

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
