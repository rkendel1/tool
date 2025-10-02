# Production Deployment Guide

This guide covers deploying the Mono Web IDE to production environments.

## Prerequisites

- Linux server with Docker and Docker Compose installed
- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt recommended)
- Firewall configured

## Deployment Steps

### 1. Server Setup

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt-get install docker-compose-plugin

# Create deployment directory
mkdir -p /opt/mono-web-ide
cd /opt/mono-web-ide
```

### 2. Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/server.git
cd server/mono-web-ide

# Run setup
./setup.sh
```

### 3. Configure Environment

Edit `.env` file:

```env
# Security
PASSWORD=YOUR_SECURE_PASSWORD_HERE

# Production Dyad Configuration
DYAD_BACKEND_URL=https://api.your-dyad-instance.com/api/completions
API_KEY=your_production_api_key_here
AI_MODEL=dyad-production-model

# User Configuration
SESSION_ID=production-session
USER_ID=production-user
```

### 4. Configure Reverse Proxy (nginx)

Create `/etc/nginx/sites-available/mono-web-ide`:

```nginx
server {
    listen 80;
    server_name ide.yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ide.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/ide.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ide.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Code Server
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # App previews
    location /preview/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Client max body size
    client_max_body_size 100M;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/mono-web-ide /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d ide.yourdomain.com

# Auto-renewal is configured automatically
```

### 6. Start Services

```bash
# Start in detached mode
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

## Security Hardening

### 1. Firewall Configuration

```bash
# Install UFW
sudo apt-get install ufw

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

### 2. Docker Security

Create `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "userns-remap": "default"
}
```

Restart Docker:
```bash
sudo systemctl restart docker
```

### 3. Regular Updates

Create `/etc/cron.d/docker-updates`:

```cron
# Update Docker images weekly
0 3 * * 0 cd /opt/mono-web-ide && docker compose pull && docker compose up -d
```

## Monitoring

### 1. Health Checks

Create `/opt/mono-web-ide/health-check.sh`:

```bash
#!/bin/bash

# Check Code Server
if ! curl -sf http://localhost:8080/healthz > /dev/null; then
    echo "Code Server is down!" | mail -s "Alert: Code Server Down" admin@yourdomain.com
    docker compose restart code-server
fi

# Check Dyad Server
if ! curl -sf http://localhost:5000/health > /dev/null; then
    echo "Dyad Server is down!" | mail -s "Alert: Dyad Server Down" admin@yourdomain.com
    docker compose restart dyad-server
fi
```

Add to crontab:
```bash
*/5 * * * * /opt/mono-web-ide/health-check.sh
```

### 2. Logging

Configure centralized logging with rsyslog or Loki.

Example docker-compose override for Loki:

```yaml
# docker-compose.override.yml
services:
  code-server:
    logging:
      driver: loki
      options:
        loki-url: "http://localhost:3100/loki/api/v1/push"
        loki-retries: "5"
        loki-batch-size: "400"
```

### 3. Metrics

Add Prometheus monitoring:

```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - mono-web-ide

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-data:/var/lib/grafana
    networks:
      - mono-web-ide

volumes:
  prometheus-data:
  grafana-data:
```

## Backup Strategy

### 1. Automated Backups

Create `/opt/mono-web-ide/backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/backup/mono-web-ide"
DATE=$(date +%Y%m%d-%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup app-code directory
tar -czf "$BACKUP_DIR/app-code-$DATE.tar.gz" app-code/

# Backup .env file
cp .env "$BACKUP_DIR/.env-$DATE"

# Remove old backups (keep last 7 days)
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name ".env-*" -mtime +7 -delete

# Optional: Upload to S3
# aws s3 sync "$BACKUP_DIR" s3://your-backup-bucket/mono-web-ide/
```

Add to crontab:
```bash
0 2 * * * /opt/mono-web-ide/backup.sh
```

### 2. Restore from Backup

```bash
#!/bin/bash

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup-file.tar.gz>"
    exit 1
fi

# Stop services
docker compose down

# Restore app-code
tar -xzf "$BACKUP_FILE" -C ./

# Start services
docker compose up -d
```

## Scaling

### 1. Multiple Instances

For multiple users, run separate instances:

```bash
# Instance 1
cd /opt/mono-web-ide-user1
# Change ports in docker-compose.yml to 8081, 5001, 3010-3015
docker compose up -d

# Instance 2
cd /opt/mono-web-ide-user2
# Change ports in docker-compose.yml to 8082, 5002, 3020-3025
docker compose up -d
```

Update nginx to route by subdomain:

```nginx
# user1.ide.yourdomain.com
server {
    server_name user1.ide.yourdomain.com;
    location / {
        proxy_pass http://localhost:8081;
    }
}

# user2.ide.yourdomain.com
server {
    server_name user2.ide.yourdomain.com;
    location / {
        proxy_pass http://localhost:8082;
    }
}
```

### 2. Load Balancing

For high availability, use multiple servers behind a load balancer:

```nginx
upstream code_server_pool {
    server server1.internal:8080;
    server server2.internal:8080;
    server server3.internal:8080;
}

server {
    listen 443 ssl;
    server_name ide.yourdomain.com;
    
    location / {
        proxy_pass http://code_server_pool;
        # ... other proxy settings
    }
}
```

## Maintenance

### 1. Regular Updates

```bash
# Pull latest changes
git pull

# Rebuild containers
docker compose build --no-cache

# Restart services
docker compose down
docker compose up -d
```

### 2. Log Rotation

Docker handles log rotation, but you can configure:

```json
{
  "log-opts": {
    "max-size": "10m",
    "max-file": "5"
  }
}
```

### 3. Disk Space Management

```bash
# Clean up old images
docker system prune -a

# Clean up old volumes
docker volume prune
```

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker compose logs

# Check Docker daemon
sudo systemctl status docker

# Restart Docker
sudo systemctl restart docker
docker compose up -d
```

### Connection Issues

```bash
# Check nginx
sudo nginx -t
sudo systemctl status nginx

# Check SSL certificate
sudo certbot certificates

# Check firewall
sudo ufw status
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Check system resources
htop
df -h

# Increase resources in docker-compose.yml
```

## Disaster Recovery

### 1. Full System Failure

1. Set up new server
2. Install Docker and dependencies
3. Clone repository
4. Restore from backup
5. Update DNS if needed
6. Start services

### 2. Data Corruption

1. Stop services
2. Restore from last good backup
3. Verify data integrity
4. Start services

### 3. Security Breach

1. Immediately stop services
2. Investigate the breach
3. Restore from clean backup
4. Update passwords and keys
5. Apply security patches
6. Review access logs

## Support Contacts

- Infrastructure: ops@yourdomain.com
- Security: security@yourdomain.com
- Emergency: +1-XXX-XXX-XXXX

## Additional Resources

- [Docker Production Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [nginx Configuration Guide](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Code Server Deployment Guide](https://coder.com/docs/code-server/latest/install)
