# Mono Web IDE - Dockerized Development Environment

A complete out-of-the-box Dockerized web IDE environment with AI code completion capabilities using Code Server and Dyad integration.

## Quick Start

Start the entire environment with a single command:

```bash
cd mono-web-ide
docker-compose up
```

Stop the environment:

```bash
docker-compose down
```

## Features

- 🌐 **Web-based IDE** - Code Server accessible via browser
- 🤖 **AI Code Completion** - Integrated Dyad backend for intelligent code suggestions
- 📦 **Multi-Project Support** - Work on multiple apps simultaneously
- 🔄 **Hot Reload** - Live preview for your applications
- 💾 **Persistent Storage** - All code changes are saved in volumes
- 🔧 **Pre-configured** - Node.js, npm, git, and build tools included
- 🚀 **Multiple Preview Ports** - Run several dev servers at once

## Architecture

```
mono-web-ide/
├── app-code/              # Your projects (persistent volume)
│   ├── app1/             # Example React app
│   ├── app2/             # Example Node.js app
│   └── README.md
├── extensions/ai-completion/  # VS Code AI completion extension
├── scripts/              # Helper scripts
├── docker-compose.yml    # Docker Compose configuration
├── Dockerfile-codeserver # Code Server container
├── Dockerfile-dyad-server # Dyad test server container
└── README.md            # This file
```

## Services

### Code Server (Port 8080)
- Web-based VS Code IDE
- Access: http://localhost:8080
- Default password: `coder` (can be changed via PASSWORD env var)
- Persistent workspace mounted at `/home/coder/project/app-code`

### Dyad Test Server (Port 5000)
- Mock AI completion backend
- Provides intelligent code suggestions
- Drop-in replacement for production Dyad instance
- Health check: http://localhost:5000/health

### App Preview Ports
- Port 3000-3005: Available for running multiple dev servers
- Example: `npm run dev` in app1, `npm start` in app2

## Getting Started

### 1. Start the Environment

```bash
cd mono-web-ide
docker-compose up -d
```

Wait for services to be healthy (check with `docker-compose ps`).

### 2. Open Code Server

Open your browser and navigate to:
```
http://localhost:8080
```

Enter the password (default: `coder`).

### 3. Start Working on Your Apps

Navigate to the app-code directory in the Code Server terminal:

```bash
cd app-code/app1
npm install
npm run dev
```

Your app will be accessible at http://localhost:3000.

### 4. Run Multiple Apps

Open multiple terminals in Code Server:

Terminal 1:
```bash
cd app-code/app1
npm run dev  # Runs on port 3000
```

Terminal 2:
```bash
cd app-code/app2
npm start -- --port 3001  # Runs on port 3001
```

## Configuration

### Environment Variables

Create a `.env` file in the `mono-web-ide` directory:

```env
# Code Server
PASSWORD=your-secure-password

# AI Configuration
API_KEY=your-dyad-api-key
AI_MODEL=dyad-default
SESSION_ID=your-session-id
USER_ID=your-user-id

# Dyad Backend URL (defaults to test server)
DYAD_BACKEND_URL=http://dyad-server:5000/completion
```

### Using Production Dyad Instance

To use a production Dyad instance instead of the test server:

1. Update `docker-compose.yml` to set:
   ```yaml
   environment:
     - DYAD_BACKEND_URL=https://your-dyad-instance.com/api/completions
     - API_KEY=your-production-api-key
   ```

2. Or set environment variables:
   ```bash
   export DYAD_BACKEND_URL=https://your-dyad-instance.com/api/completions
   export API_KEY=your-production-api-key
   docker-compose up
   ```

## Working with Git

### Committing Code

From within Code Server terminal:

```bash
cd app-code
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git init
git add .
git commit -m "Initial commit"
```

### Pushing to GitHub

```bash
git remote add origin https://github.com/yourusername/your-repo.git
git branch -M main
git push -u origin main
```

Note: You may need to configure SSH keys or use personal access tokens for authentication.

## Development Workflow

### Creating a New App

```bash
cd app-code
npx create-react-app app3
cd app3
npm start -- --port 3002
```

### Installing Dependencies

```bash
cd app-code/app1
npm install package-name
```

### Running Tests

```bash
cd app-code/app1
npm test
```

### Building for Production

```bash
cd app-code/app1
npm run build
```

## AI Code Completion

The AI code completion extension is automatically configured to use the Dyad test server.

### Using AI Completions

1. Start typing code in any file
2. AI suggestions will appear inline
3. Press Tab to accept suggestions
4. Press Esc to dismiss

### Extension Configuration

The extension is pre-configured with:
- Backend URL: http://dyad-server:5000/completion
- Model: dyad-default (configurable via AI_MODEL env var)
- Session tracking enabled

## Troubleshooting

### Code Server Not Starting

```bash
# Check logs
docker-compose logs code-server

# Restart service
docker-compose restart code-server
```

### Dyad Server Not Responding

```bash
# Check health
curl http://localhost:5000/health

# Check logs
docker-compose logs dyad-server

# Restart service
docker-compose restart dyad-server
```

### Port Already in Use

```bash
# Stop all services
docker-compose down

# Check what's using the port
lsof -i :8080  # or any other port

# Kill the process or change port in docker-compose.yml
```

### Volume Permissions

```bash
# Fix permissions on mounted volumes
sudo chown -R $USER:$USER app-code/
```

### Rebuilding Containers

```bash
# Rebuild all containers
docker-compose build --no-cache

# Rebuild specific service
docker-compose build --no-cache code-server
```

## Health Checks

Check if services are healthy:

```bash
# All services status
docker-compose ps

# Code Server health
curl http://localhost:8080/healthz

# Dyad Server health
curl http://localhost:5000/health
```

## Data Persistence

All your code in the `app-code` directory is persisted on the host machine. This means:

- ✅ Code survives container restarts
- ✅ Safe to run `docker-compose down`
- ✅ Can backup by copying the `app-code` directory
- ✅ Can edit files from both inside and outside the container

## Advanced Usage

### Running Integration Tests

```bash
cd scripts
./test-dyad-integration.sh
```

### Custom Code Server Extensions

Install additional VS Code extensions:

1. Open Code Server in browser
2. Click Extensions icon
3. Search and install extensions
4. Extensions persist in the volume

### Accessing Containers

```bash
# Access Code Server container
docker-compose exec code-server bash

# Access Dyad Server container
docker-compose exec dyad-server sh
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f code-server
docker-compose logs -f dyad-server
```

### Resource Limits

Add resource limits in `docker-compose.yml`:

```yaml
services:
  code-server:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

## Production Deployment

For production use:

1. Change the default password
2. Enable HTTPS (use a reverse proxy like nginx or Traefik)
3. Use a production Dyad instance
4. Set up proper authentication
5. Configure backups for the app-code volume
6. Set resource limits
7. Enable logging to external systems

## Contributing

Feel free to open issues or submit pull requests to improve this environment.

## License

MIT

## Support

For issues or questions:
1. Check this README
2. Review Docker logs
3. Check the DYAD_INTEGRATION.md in extensions/ai-completion/
4. Open an issue on GitHub
