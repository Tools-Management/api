# 🚀 Deployment Guide

Hướng dẫn deploy ứng dụng lên VPS với Docker, Nginx, và SSL (Let's Encrypt).

## 📋 Yêu Cầu

- VPS với Ubuntu 20.04+ hoặc CentOS 7+
- Docker & Docker Compose đã cài đặt
- Domain đã trỏ A record về IP của VPS
- Ports 80, 443, 8000, 3307 mở

## 🔧 Setup VPS

### 1. Cài đặt Docker & Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

### 2. Clone Repository

```bash
cd /var/www
git clone <your-repo-url> nova-sites
cd nova-sites/api
```

### 3. Cấu Hình Environment

```bash
# Copy file example
cp env.docker.example .env

# Chỉnh sửa thông tin
nano .env
```

**Cần sửa:**
```env
# Database
DB_PASSWORD=<strong-password>
DB_ROOT_PASSWORD=<strong-root-password>

# JWT
JWT_ACCESS_SECRET=<random-secret-64-chars>
JWT_REFRESH_SECRET=<random-secret-64-chars>

# API
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Admin API Token (để sync license keys)
ADMIN_API_TOKEN=your-external-api-token
EXTERNAL_API_URL=https://your-external-api.com/api/v1
```

### 4. Cập Nhật Nginx Config

```bash
nano nginx/conf.d/default.conf
```

Thay `yourdomain.com` thành domain thật của bạn.

## 🚀 Deployment Steps

### Stage 1: Deploy với HTTP (Chưa có SSL)

```bash
# Build và start containers
docker-compose up -d

# Kiểm tra logs
docker-compose logs -f

# Kiểm tra services đang chạy
docker-compose ps
```

**Truy cập:** `http://yourdomain.com/api/health`

### Stage 2: Setup SSL Certificate

**Trước khi chạy:** Đảm bảo domain đã trỏ về VPS!

```bash
# Kiểm tra DNS
dig +short yourdomain.com

# Chỉnh sửa script init-ssl.sh
nano scripts/init-ssl.sh

# Thay đổi:
# DOMAIN="yourdomain.com"
# EMAIL="your-email@example.com"

# Cấp quyền thực thi
chmod +x scripts/init-ssl.sh

# Chạy script khởi tạo SSL
./scripts/init-ssl.sh
```

Script sẽ:
1. ✅ Kiểm tra DNS resolution
2. ✅ Tạo dummy certificate tạm
3. ✅ Cập nhật nginx config (enable HTTPS)
4. ✅ Request real certificate từ Let's Encrypt
5. ✅ Reload nginx với certificate thật

### Stage 3: Enable HTTPS Redirect

Sau khi có SSL certificate thành công:

```bash
nano nginx/conf.d/default.conf
```

Uncomment dòng redirect trong HTTP block:
```nginx
# Tìm dòng này trong HTTP block
# return 301 https://$server_name$request_uri;

# Uncomment thành:
return 301 https://$server_name$request_uri;
```

Comment out temporary routes:
```nginx
# Comment 2 location này trong HTTP block:
# location /api { ... }
# location / { ... }
```

Reload nginx:
```bash
docker-compose exec nginx nginx -s reload
```

## 🔄 Database Migrations

```bash
# Chạy migrations
docker-compose exec api npm run migrate

# Tạo admin user (nếu cần)
docker-compose exec api npm run seed
```

## 📊 Monitoring

### Xem Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f nginx
docker-compose logs -f mysql
```

### Kiểm Tra Health

```bash
# API health
curl https://yourdomain.com/api/health

# Database
docker-compose exec mysql mysqladmin -u root -p ping
```

## 🔐 SSL Certificate Renewal

Certificate tự động renew mỗi 12 giờ thông qua Certbot container.

Kiểm tra:
```bash
docker-compose logs certbot
```

Test renewal:
```bash
docker-compose run --rm certbot renew --dry-run
```

## 🛠️ Maintenance

### Update Code

```bash
cd /var/www/nova-sites
git pull origin main

cd api
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Backup Database

```bash
# Export
docker-compose exec mysql mysqldump -u root -p nova_sites_db > backup.sql

# Import
docker-compose exec -T mysql mysql -u root -p nova_sites_db < backup.sql
```

### View Resource Usage

```bash
docker stats
```

## 🐛 Troubleshooting

### Nginx không start

```bash
# Check config
docker-compose exec nginx nginx -t

# View logs
docker-compose logs nginx
```

### Database connection failed

```bash
# Check MySQL status
docker-compose exec mysql mysqladmin -u root -p ping

# Restart MySQL
docker-compose restart mysql
```

### SSL Certificate failed

```bash
# Check certbot logs
docker-compose logs certbot

# Test SSL
curl -vI https://yourdomain.com

# Verify certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

## 🔥 Emergency Commands

```bash
# Stop all
docker-compose down

# Stop and remove volumes (CAUTION: xóa data!)
docker-compose down -v

# Rebuild everything
docker-compose build --no-cache
docker-compose up -d

# View disk usage
docker system df

# Clean up unused resources
docker system prune -a
```

## 📝 Notes

- ✅ Certbot auto-renew mỗi 12h
- ✅ MySQL data persist trong volume `mysql_data`
- ✅ Logs được lưu trong `./logs`
- ✅ CORS đã config cho domain
- ✅ Rate limiting enabled
- ⚠️  Backup database thường xuyên!
- ⚠️  Monitor disk space (MySQL logs, app logs)
- ⚠️  Update `.env` secrets trên production

## 🔗 Useful Links

- [Docker Docs](https://docs.docker.com/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Nginx Docs](https://nginx.org/en/docs/)

