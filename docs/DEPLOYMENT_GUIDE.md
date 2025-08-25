# SiNusa Deployment Guide

## Overview

This guide covers deploying the SiNusa application in various environments, from local development to production. The application consists of:

- **Backend API** (Node.js/Express)
- **Web Portal** (React)
- **Mobile App** (Flutter)
- **Database** (PostgreSQL)
- **Cache** (Redis)
- **Reverse Proxy** (Nginx)

## Prerequisites

### System Requirements

- **CPU**: 2+ cores (4+ for production)
- **RAM**: 4GB+ (8GB+ for production)
- **Storage**: 20GB+ available space
- **OS**: Linux (Ubuntu 20.04+ recommended)
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### Software Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js (for development)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL client
sudo apt-get install -y postgresql-client
```

## Environment Configuration

### 1. Environment Variables

Create environment files for different environments:

#### Development (.env.development)
```bash
# Server Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1
BASE_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sinusa_db
DB_USER=sinusa_user
DB_PASSWORD=sinusa_password
DB_SSL=false

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT Configuration
JWT_SECRET=dev-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# OTP Configuration
OTP_SECRET=dev-otp-secret-key
OTP_EXPIRES_IN=300000

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=SiNusa <noreply@sinusa.com>

# SMS Configuration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Payment Gateway
MIDTRANS_SERVER_KEY=your-midtrans-server-key
MIDTRANS_CLIENT_KEY=your-midtrans-client-key
MIDTRANS_MERCHANT_ID=your-midtrans-merchant-id
MIDTRANS_IS_PRODUCTION=false

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=debug
LOG_FILE=./logs/app.log

# WebSocket
WS_PORT=3001
WS_PATH=/socket.io

# Features
ENABLE_OFFLINE_MODE=true
ENABLE_AUDIT_LOG=true
ENABLE_REAL_TIME_NOTIFICATIONS=true
ENABLE_PAYMENT_GATEWAY=true
```

#### Production (.env.production)
```bash
# Server Configuration
NODE_ENV=production
PORT=3000
API_VERSION=v1
BASE_URL=https://api.sinusa.com

# Database Configuration
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=sinusa_db
DB_USER=sinusa_user
DB_PASSWORD=strong-production-password
DB_SSL=true

# Redis Configuration
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=strong-redis-password
REDIS_DB=0

# JWT Configuration
JWT_SECRET=super-secure-jwt-secret-key-256-bits
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# OTP Configuration
OTP_SECRET=super-secure-otp-secret-key
OTP_EXPIRES_IN=300000

# Email Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=SiNusa <noreply@sinusa.com>

# SMS Configuration
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Payment Gateway
MIDTRANS_SERVER_KEY=your-production-midtrans-server-key
MIDTRANS_CLIENT_KEY=your-production-midtrans-client-key
MIDTRANS_MERCHANT_ID=your-production-midtrans-merchant-id
MIDTRANS_IS_PRODUCTION=true

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=sinusa-uploads

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://sinusa.com,https://app.sinusa.com

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# WebSocket
WS_PORT=3001
WS_PATH=/socket.io

# Features
ENABLE_OFFLINE_MODE=true
ENABLE_AUDIT_LOG=true
ENABLE_REAL_TIME_NOTIFICATIONS=true
ENABLE_PAYMENT_GATEWAY=true
```

## Deployment Options

### 1. Local Development

#### Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-org/sinusa.git
cd sinusa

# Copy environment file
cp backend/.env.example backend/.env.development

# Edit environment variables
nano backend/.env.development

# Start all services
docker-compose up -d

# Check services status
docker-compose ps

# View logs
docker-compose logs -f backend
```

#### Manual Setup

```bash
# Install dependencies
cd backend
npm install

# Set up database
npm run migrate
npm run seed

# Start development server
npm run dev
```

### 2. Staging Environment

#### Using Docker Compose

```bash
# Create staging environment file
cp docker-compose.yml docker-compose.staging.yml

# Edit staging configuration
nano docker-compose.staging.yml

# Start staging environment
docker-compose -f docker-compose.staging.yml up -d
```

#### Using Kubernetes

```bash
# Create namespace
kubectl create namespace sinusa-staging

# Apply configurations
kubectl apply -f k8s/staging/

# Check deployment status
kubectl get pods -n sinusa-staging
```

### 3. Production Environment

#### Using Docker Compose (Single Server)

```bash
# Create production environment file
cp docker-compose.yml docker-compose.production.yml

# Edit production configuration
nano docker-compose.production.yml

# Start production environment
docker-compose -f docker-compose.production.yml up -d

# Set up SSL certificates
sudo certbot --nginx -d api.sinusa.com
```

#### Using Kubernetes (Multi-Server)

```bash
# Create namespace
kubectl create namespace sinusa-production

# Apply configurations
kubectl apply -f k8s/production/

# Set up ingress with SSL
kubectl apply -f k8s/production/ingress.yaml

# Check deployment status
kubectl get pods -n sinusa-production
```

#### Using AWS ECS

```bash
# Build and push Docker images
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.ap-southeast-1.amazonaws.com

docker build -t sinusa-backend ./backend
docker tag sinusa-backend:latest your-account.dkr.ecr.ap-southeast-1.amazonaws.com/sinusa-backend:latest
docker push your-account.dkr.ecr.ap-southeast-1.amazonaws.com/sinusa-backend:latest

# Deploy using AWS CLI or console
aws ecs update-service --cluster sinusa-cluster --service sinusa-backend --force-new-deployment
```

## Database Setup

### PostgreSQL Setup

#### Local Development
```bash
# Using Docker
docker run --name sinusa-postgres \
  -e POSTGRES_DB=sinusa_db \
  -e POSTGRES_USER=sinusa_user \
  -e POSTGRES_PASSWORD=sinusa_password \
  -p 5432:5432 \
  -d postgres:14-alpine

# Run migrations
cd backend
npm run migrate

# Seed initial data
npm run seed
```

#### Production Setup
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql

CREATE DATABASE sinusa_db;
CREATE USER sinusa_user WITH PASSWORD 'strong-password';
GRANT ALL PRIVILEGES ON DATABASE sinusa_db TO sinusa_user;
\q

# Run migrations
cd backend
npm run migrate:production
```

### Redis Setup

#### Local Development
```bash
# Using Docker
docker run --name sinusa-redis \
  -p 6379:6379 \
  -d redis:7-alpine
```

#### Production Setup
```bash
# Install Redis
sudo apt-get install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf

# Set password and other security settings
requirepass your-redis-password
bind 127.0.0.1
protected-mode yes

# Restart Redis
sudo systemctl restart redis
sudo systemctl enable redis
```

## SSL/TLS Configuration

### Using Let's Encrypt

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.sinusa.com -d sinusa.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Using Cloudflare

1. Add your domain to Cloudflare
2. Update nameservers
3. Enable SSL/TLS encryption mode to "Full"
4. Configure DNS records

## Monitoring and Logging

### Application Monitoring

#### Using PM2 (Node.js)
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/index.js --name "sinusa-backend"

# Monitor
pm2 monit

# Logs
pm2 logs sinusa-backend
```

#### Using Docker
```bash
# View logs
docker-compose logs -f backend

# Monitor resources
docker stats
```

### Database Monitoring

#### Using pgAdmin
```bash
# Install pgAdmin
sudo apt-get install pgadmin4

# Access at http://your-server/pgadmin4
```

#### Using Grafana
```bash
# Add to docker-compose
grafana:
  image: grafana/grafana:latest
  ports:
    - "3000:3000"
  volumes:
    - grafana_data:/var/lib/grafana
```

### Log Aggregation

#### Using ELK Stack
```bash
# Add to docker-compose
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:7.17.0
  environment:
    - discovery.type=single-node
  ports:
    - "9200:9200"

kibana:
  image: docker.elastic.co/kibana/kibana:7.17.0
  ports:
    - "5601:5601"
  depends_on:
    - elasticsearch

logstash:
  image: docker.elastic.co/logstash/logstash:7.17.0
  volumes:
    - ./logs:/var/log/sinusa
  depends_on:
    - elasticsearch
```

## Backup and Recovery

### Database Backup

#### Automated Backup Script
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
DB_NAME="sinusa_db"
DB_USER="sinusa_user"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/sinusa_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/sinusa_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "sinusa_*.sql.gz" -mtime +7 -delete

echo "Backup completed: sinusa_$DATE.sql.gz"
```

#### Schedule Backup
```bash
# Add to crontab
sudo crontab -e

# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

### File Uploads Backup

```bash
#!/bin/bash
# uploads-backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/uploads"
UPLOADS_DIR="/var/www/uploads"

# Create backup
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C $UPLOADS_DIR .

# Keep only last 30 days
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +30 -delete
```

## Security Hardening

### Firewall Configuration

```bash
# Install UFW
sudo apt-get install ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp

# Enable firewall
sudo ufw enable
```

### SSL/TLS Hardening

```nginx
# nginx.conf
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_stapling on;
ssl_stapling_verify on;
```

### Application Security

```javascript
// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## Performance Optimization

### Database Optimization

```sql
-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_pocket_money_user_id ON pocket_money(user_id);
CREATE INDEX idx_attendance_user_date ON attendance(user_id, date);

-- Analyze tables
ANALYZE users;
ANALYZE pocket_money;
ANALYZE attendance;
```

### Application Optimization

```javascript
// Enable compression
app.use(compression());

// Cache static files
app.use(express.static('public', {
  maxAge: '1y',
  etag: true
}));

// Database connection pooling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Nginx Optimization

```nginx
# Enable gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Cache static files
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U sinusa_user -d sinusa_db

# Check logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

#### Redis Connection Issues
```bash
# Check Redis status
sudo systemctl status redis

# Test connection
redis-cli ping

# Check logs
sudo tail -f /var/log/redis/redis-server.log
```

#### Application Issues
```bash
# Check application logs
docker-compose logs backend

# Check application status
docker-compose ps

# Restart application
docker-compose restart backend
```

### Performance Issues

#### High CPU Usage
```bash
# Check CPU usage
top
htop

# Check Node.js processes
ps aux | grep node

# Profile application
node --prof dist/index.js
```

#### High Memory Usage
```bash
# Check memory usage
free -h

# Check Node.js memory
node --max-old-space-size=4096 dist/index.js
```

#### Slow Database Queries
```bash
# Enable slow query log
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();

# Check slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

## Maintenance

### Regular Maintenance Tasks

#### Database Maintenance
```bash
# Weekly vacuum
VACUUM ANALYZE;

# Monthly reindex
REINDEX DATABASE sinusa_db;
```

#### Log Rotation
```bash
# Configure logrotate
sudo nano /etc/logrotate.d/sinusa

/var/log/sinusa/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
```

#### Security Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Update Docker images
docker-compose pull
docker-compose up -d

# Update Node.js dependencies
npm audit fix
npm update
```

## Support and Resources

### Documentation
- [API Documentation](./API_DOCUMENTATION.md)
- [Development Guide](./DEVELOPMENT_GUIDE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

### Community
- [GitHub Issues](https://github.com/your-org/sinusa/issues)
- [Discord Community](https://discord.gg/sinusa)
- [Email Support](mailto:support@sinusa.com)

### Monitoring Tools
- [Grafana Dashboards](./monitoring/grafana/)
- [Prometheus Configuration](./monitoring/prometheus/)
- [Alert Rules](./monitoring/alerts/)