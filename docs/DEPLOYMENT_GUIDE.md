# Deployment Guide - Dashboard Donasi PABU

## System Requirements

### Minimum Server Requirements

**Backend (Laravel):**
- PHP 8.1 or higher
- MySQL 8.0 or higher
- Composer 2.x
- Web server (Apache/Nginx)
- SSL Certificate (recommended)

**Frontend (React):**
- Node.js 18.x or higher
- npm 9.x or higher
- Web server for static files

**Server Specifications:**
- RAM: 2GB minimum, 4GB recommended
- Storage: 20GB minimum, 50GB recommended
- CPU: 2 cores minimum
- Bandwidth: 100Mbps recommended

## Development Environment Setup

### 1. Local Development with Laragon (Windows)

**Install Laragon:**
1. Download Laragon from https://laragon.org/
2. Install with PHP 8.1+, MySQL 8.0+, Apache
3. Start Laragon services

**Backend Setup:**
```bash
# Navigate to Laragon www directory
cd C:\laragon\www

# Clone repository
git clone <repository-url> Dashboard-Donasi-PABU
cd Dashboard-Donasi-PABU

# Install dependencies
composer install

# Copy environment file
copy .env.example .env

# Generate application key
php artisan key:generate

# Configure database in .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=dashboard_donasi_pabu
DB_USERNAME=root
DB_PASSWORD=

# Create database
mysql -u root -e "CREATE DATABASE dashboard_donasi_pabu;"

# Run migrations and seeders
php artisan migrate:fresh --seed

# Create storage link
php artisan storage:link

# Set permissions (if needed)
chmod -R 775 storage bootstrap/cache
```

**Frontend Setup:**
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Access URLs:**
- Backend API: http://dashboard-donasi-pabu.test/api
- Frontend: http://localhost:5173
- Database: http://localhost/phpmyadmin

### 2. Local Development with XAMPP

**Install XAMPP:**
1. Download XAMPP from https://www.apachefriends.org/
2. Install with PHP 8.1+, MySQL, Apache
3. Start Apache and MySQL services

**Backend Setup:**
```bash
# Navigate to XAMPP htdocs
cd C:\xampp\htdocs

# Clone and setup (same as Laragon)
# Update .env for XAMPP
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=dashboard_donasi_pabu
DB_USERNAME=root
DB_PASSWORD=

APP_URL=http://localhost/Dashboard-Donasi-PABU/public
```

**Access URLs:**
- Backend: http://localhost/Dashboard-Donasi-PABU/public
- Frontend: http://localhost:5173
- Database: http://localhost/phpmyadmin

## Production Deployment

### 1. VPS/Cloud Server Setup

**Recommended Providers:**
- DigitalOcean (Droplet)
- AWS (EC2)
- Google Cloud (Compute Engine)
- Vultr
- Linode

**Server Setup (Ubuntu 22.04):**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nginx mysql-server php8.1-fpm php8.1-mysql php8.1-xml php8.1-gd php8.1-curl php8.1-mbstring php8.1-zip php8.1-bcmath php8.1-tokenizer composer nodejs npm git unzip curl

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Secure MySQL installation
sudo mysql_secure_installation

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 2. Database Setup

```bash
# Login to MySQL
sudo mysql -u root -p

# Create database and user
CREATE DATABASE dashboard_donasi_pabu;
CREATE USER 'pabu_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON dashboard_donasi_pabu.* TO 'pabu_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Backend Deployment

```bash
# Create application directory
sudo mkdir -p /var/www/dashboard-donasi-pabu
sudo chown -R $USER:$USER /var/www/dashboard-donasi-pabu

# Clone repository
cd /var/www/dashboard-donasi-pabu
git clone <repository-url> .

# Install dependencies
composer install --optimize-autoloader --no-dev

# Setup environment
cp .env.example .env
nano .env
```

**Production .env Configuration:**
```env
APP_NAME="Dashboard Donasi PABU"
APP_ENV=production
APP_KEY=base64:your-generated-key-here
APP_DEBUG=false
APP_URL=https://your-domain.com

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=dashboard_donasi_pabu
DB_USERNAME=pabu_user
DB_PASSWORD=strong_password_here

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

MEMCACHED_HOST=127.0.0.1

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
PUSHER_APP_CLUSTER=mt1

VITE_PUSHER_APP_KEY="${PUSHER_APP_KEY}"
VITE_PUSHER_HOST="${PUSHER_HOST}"
VITE_PUSHER_PORT="${PUSHER_PORT}"
VITE_PUSHER_SCHEME="${PUSHER_SCHEME}"
VITE_PUSHER_APP_CLUSTER="${PUSHER_APP_CLUSTER}"
```

**Complete Backend Setup:**
```bash
# Generate application key
php artisan key:generate

# Run migrations and seeders
php artisan migrate:fresh --seed --force

# Create storage link
php artisan storage:link

# Optimize for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set proper permissions
sudo chown -R www-data:www-data /var/www/dashboard-donasi-pabu
sudo chmod -R 755 /var/www/dashboard-donasi-pabu
sudo chmod -R 775 /var/www/dashboard-donasi-pabu/storage
sudo chmod -R 775 /var/www/dashboard-donasi-pabu/bootstrap/cache
```

### 4. Nginx Configuration

**Create Nginx site configuration:**
```bash
sudo nano /etc/nginx/sites-available/dashboard-donasi-pabu
```

**Nginx Configuration File:**
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    root /var/www/dashboard-donasi-pabu/public;

    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    index index.php;

    charset utf-8;

    # Handle Laravel routes
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # Handle API routes
    location /api {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP-FPM configuration
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    # Security: Deny access to sensitive files
    location ~ /\. {
        deny all;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Handle static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # File upload size
    client_max_body_size 100M;

    # Logs
    access_log /var/log/nginx/dashboard-donasi-pabu.access.log;
    error_log /var/log/nginx/dashboard-donasi-pabu.error.log;
}
```

**Enable site and restart Nginx:**
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/dashboard-donasi-pabu /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 5. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run

# Setup auto-renewal cron job
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

### 6. Frontend Deployment

**Build for Production:**
```bash
# Navigate to frontend directory
cd /var/www/dashboard-donasi-pabu/frontend

# Install dependencies
npm ci --only=production

# Build for production
npm run build

# Copy build files to web directory
sudo mkdir -p /var/www/dashboard-donasi-pabu-frontend
sudo cp -r dist/* /var/www/dashboard-donasi-pabu-frontend/
sudo chown -R www-data:www-data /var/www/dashboard-donasi-pabu-frontend
```

**Frontend Nginx Configuration:**
```bash
sudo nano /etc/nginx/sites-available/dashboard-donasi-pabu-frontend
```

```nginx
server {
    listen 80;
    server_name app.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.your-domain.com;
    root /var/www/dashboard-donasi-pabu-frontend;
    index index.html;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/app.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.your-domain.com/privkey.pem;

    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Handle static assets
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

**Enable frontend site:**
```bash
sudo ln -s /etc/nginx/sites-available/dashboard-donasi-pabu-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Docker Deployment (Alternative)

### 1. Docker Compose Setup

**Create docker-compose.yml:**
```yaml
version: '3.8'

services:
  # MySQL Database
  mysql:
    image: mysql:8.0
    container_name: pabu_mysql
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: dashboard_donasi_pabu
      MYSQL_USER: pabu_user
      MYSQL_PASSWORD: strong_password
      MYSQL_ROOT_PASSWORD: root_password
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    networks:
      - pabu_network

  # Laravel Backend
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: pabu_backend
    restart: unless-stopped
    environment:
      - APP_ENV=production
      - DB_HOST=mysql
      - DB_DATABASE=dashboard_donasi_pabu
      - DB_USERNAME=pabu_user
      - DB_PASSWORD=strong_password
    volumes:
      - ./storage:/var/www/html/storage
      - ./bootstrap/cache:/var/www/html/bootstrap/cache
    ports:
      - "8000:80"
    depends_on:
      - mysql
    networks:
      - pabu_network

  # React Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: pabu_frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    networks:
      - pabu_network

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: pabu_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    networks:
      - pabu_network

volumes:
  mysql_data:

networks:
  pabu_network:
    driver: bridge
```

### 2. Backend Dockerfile

**Dockerfile.backend:**
```dockerfile
FROM php:8.1-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
    mysql-client

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_mysql gd xml

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy application files
COPY . .

# Install dependencies
RUN composer install --optimize-autoloader --no-dev

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html \
    && chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/bootstrap/cache

# Expose port
EXPOSE 9000

CMD ["php-fpm"]
```

### 3. Frontend Dockerfile

**frontend/Dockerfile:**
```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 4. Deploy with Docker

```bash
# Build and start containers
docker-compose up -d --build

# Run migrations
docker-compose exec backend php artisan migrate:fresh --seed --force

# Generate application key
docker-compose exec backend php artisan key:generate

# Create storage link
docker-compose exec backend php artisan storage:link

# Optimize for production
docker-compose exec backend php artisan config:cache
docker-compose exec backend php artisan route:cache
docker-compose exec backend php artisan view:cache
```

## Monitoring and Maintenance

### 1. Log Management

**Laravel Logs:**
```bash
# View Laravel logs
tail -f /var/www/dashboard-donasi-pabu/storage/logs/laravel.log

# Rotate logs (add to crontab)
0 0 * * * cd /var/www/dashboard-donasi-pabu && php artisan log:clear
```

**Nginx Logs:**
```bash
# View access logs
tail -f /var/log/nginx/dashboard-donasi-pabu.access.log

# View error logs
tail -f /var/log/nginx/dashboard-donasi-pabu.error.log
```

### 2. Database Backup

**Automated Backup Script:**
```bash
#!/bin/bash
# backup.sh

DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/dashboard-donasi-pabu"
DB_NAME="dashboard_donasi_pabu"
DB_USER="pabu_user"
DB_PASS="strong_password"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Create application backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /var/www/dashboard-donasi-pabu

# Remove backups older than 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

**Setup Cron Job:**
```bash
# Add to crontab
sudo crontab -e

# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

### 3. Performance Monitoring

**System Monitoring:**
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Monitor system resources
htop

# Monitor disk I/O
iotop

# Monitor network usage
nethogs
```

**Application Monitoring:**
```bash
# Monitor PHP-FPM status
sudo systemctl status php8.1-fpm

# Monitor Nginx status
sudo systemctl status nginx

# Monitor MySQL status
sudo systemctl status mysql

# Check disk usage
df -h

# Check memory usage
free -h
```

### 4. Security Updates

**Regular Updates:**
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Composer dependencies
cd /var/www/dashboard-donasi-pabu
composer update --no-dev

# Update npm dependencies
cd frontend
npm update

# Clear caches after updates
php artisan config:clear
php artisan cache:clear
php artisan config:cache
php artisan route:cache
```

## Troubleshooting

### Common Issues

**1. Permission Issues:**
```bash
# Fix Laravel permissions
sudo chown -R www-data:www-data /var/www/dashboard-donasi-pabu
sudo chmod -R 755 /var/www/dashboard-donasi-pabu
sudo chmod -R 775 /var/www/dashboard-donasi-pabu/storage
sudo chmod -R 775 /var/www/dashboard-donasi-pabu/bootstrap/cache
```

**2. Database Connection Issues:**
```bash
# Test database connection
php artisan tinker
# In tinker:
DB::connection()->getPdo();
```

**3. SSL Certificate Issues:**
```bash
# Renew SSL certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

**4. High Memory Usage:**
```bash
# Optimize Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize

# Clear unnecessary caches
php artisan cache:clear
php artisan view:clear
```

### Emergency Recovery

**Database Recovery:**
```bash
# Restore from backup
mysql -u pabu_user -p dashboard_donasi_pabu < /var/backups/dashboard-donasi-pabu/db_backup_YYYYMMDD_HHMMSS.sql
```

**Application Recovery:**
```bash
# Restore from backup
cd /var/www
sudo rm -rf dashboard-donasi-pabu
sudo tar -xzf /var/backups/dashboard-donasi-pabu/app_backup_YYYYMMDD_HHMMSS.tar.gz
sudo chown -R www-data:www-data dashboard-donasi-pabu
```

---

**Note:** Selalu test deployment di staging environment sebelum deploy ke production. Pastikan backup tersedia sebelum melakukan update major.