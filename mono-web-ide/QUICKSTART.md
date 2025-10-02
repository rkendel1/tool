# Quick Start Guide - Mono Web IDE

Get up and running with the Dockerized Web IDE in 5 minutes.

## Step 1: Prerequisites

Ensure you have Docker installed:
```bash
docker --version
docker compose version
```

## Step 2: Setup

Navigate to the mono-web-ide directory and run setup:
```bash
cd mono-web-ide
./setup.sh
```

## Step 3: Start the Environment

Start all services:
```bash
docker compose up -d
```

Wait for services to become healthy (about 30-60 seconds):
```bash
docker compose ps
```

You should see:
- `mono-web-ide-codeserver` - healthy
- `mono-web-ide-dyad-server` - healthy

## Step 4: Access Code Server

Open your browser and go to:
```
http://localhost:8080
```

Enter the password (default: `coder`)

## Step 5: Start Your First App

In the Code Server terminal:

```bash
# Navigate to app1
cd app-code/app1

# Install dependencies
npm install

# Start the dev server
npm start
```

The app will be available at http://localhost:3000

## Step 6: Try AI Code Completion

1. Create a new JavaScript file in Code Server
2. Start typing: `const x = `
3. Wait for AI suggestions to appear
4. Press Tab to accept

## Next Steps

- Explore app2 (Express API): `cd app-code/app2`
- Create your own apps in `app-code/`
- Configure AI settings in `.env`
- Read the full README for advanced features

## Common Commands

```bash
# View logs
docker compose logs -f

# Stop services
docker compose down

# Restart services
docker compose restart

# Access container shell
docker compose exec code-server bash
```

## Troubleshooting

### Services not healthy?
```bash
docker compose ps
docker compose logs
```

### Port already in use?
Edit `docker-compose.yml` to use different ports

### Need to rebuild?
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

## Support

For more help, see:
- Full README.md
- Scripts documentation in `scripts/README.md`
- Dyad integration docs in `extensions/ai-completion/`
