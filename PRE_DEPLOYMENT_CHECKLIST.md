# ✅ Pre-Deployment Checklist

Checklist để đảm bảo mọi thứ sẵn sàng trước khi push lên Git và deploy lên VPS.

## 📝 Trước Khi Push Lên Git

### 1. Code Quality
- [ ] Đã chạy `npm run lint` - không có lỗi
- [ ] Đã chạy `npm run type-check` - TypeScript OK
- [ ] Đã test các API endpoints chính
- [ ] Đã xóa các `console.log()` debug không cần thiết
- [ ] Đã review code changes

### 2. Environment Files
- [ ] `.env` KHÔNG được commit (đã có trong .gitignore)
- [ ] `env.docker.example` đã cập nhật đầy đủ
- [ ] Các secret keys trong example đã thay bằng placeholder

### 3. Docker Configuration
- [ ] `docker-compose.yml` - version và services đã đúng
- [ ] `Dockerfile` - build steps OK
- [ ] `.dockerignore` - đã loại trừ files không cần thiết
- [ ] `nginx/conf.d/default.conf` - domain là placeholder (yourdomain.com)

### 4. Database
- [ ] Migrations đã được test
- [ ] Seeds (nếu có) đã được test
- [ ] Backup scripts sẵn sàng

### 5. Documentation
- [ ] `README.md` đã cập nhật
- [ ] `DEPLOYMENT.md` có hướng dẫn đầy đủ
- [ ] Comments trong code đã rõ ràng
- [ ] API endpoints đã document

### 6. SSL/Certbot
- [ ] `certbot/conf/.gitkeep` tồn tại (để git track folder)
- [ ] `certbot/webroot/.gitkeep` tồn tại
- [ ] `scripts/init-ssl.sh` có permission executable
- [ ] Nginx config có HTTP-only mode (để get cert lần đầu)

### 7. Security
- [ ] Tất cả secrets đã dùng environment variables
- [ ] Rate limiting đã enable
- [ ] CORS đã config đúng
- [ ] SQL injection protection OK (Sequelize)
- [ ] XSS protection enabled

## 🚀 Chuẩn Bị VPS

### 1. Domain & DNS
- [ ] Đã mua/có domain
- [ ] A record trỏ về IP VPS
- [ ] www subdomain (CNAME hoặc A record)
- [ ] DNS đã propagate (kiểm tra với `dig +short yourdomain.com`)

### 2. VPS Specs
- [ ] **Minimum:** 2 CPU, 2GB RAM, 20GB SSD
- [ ] **Recommended:** 2 CPU, 4GB RAM, 40GB SSD
- [ ] OS: Ubuntu 20.04+ hoặc CentOS 7+

### 3. VPS Setup
- [ ] SSH access đã setup
- [ ] Firewall rules:
  - Port 22 (SSH)
  - Port 80 (HTTP)
  - Port 443 (HTTPS)
  - Port 8000 (API - optional, nếu test)
  - Port 3307 (MySQL - optional, chỉ nếu cần access từ ngoài)
- [ ] Docker đã cài đặt
- [ ] Docker Compose đã cài đặt
- [ ] Git đã cài đặt

### 4. VPS Security
- [ ] SSH key authentication (disable password login)
- [ ] Firewall enabled (ufw hoặc firewalld)
- [ ] Fail2ban installed (optional nhưng recommended)
- [ ] Regular updates setup (`sudo apt update && sudo apt upgrade`)

## 📦 Files Cần Chuẩn Bị Riêng (KHÔNG commit)

### Trên VPS, tạo file `.env` với:

```bash
# Copy từ env.docker.example
cp env.docker.example .env

# Cần thay đổi:
- DB_PASSWORD=<strong-random-password>
- DB_ROOT_PASSWORD=<strong-random-password>
- JWT_ACCESS_SECRET=<64-char-random-string>
- JWT_REFRESH_SECRET=<64-char-random-string>
- ADMIN_API_TOKEN=<your-external-api-token>
- EXTERNAL_API_URL=<your-external-api-url>
- ALLOWED_ORIGINS=https://yourdomain.com
- FRONTEND_URL=https://yourdomain.com
- CLOUDINARY_* (nếu dùng)
- EMAIL_* (SMTP settings)
```

### Generate Strong Secrets

```bash
# JWT secrets (64 chars)
openssl rand -base64 64

# Database passwords
openssl rand -base64 32
```

## 🔧 Files Cần Sửa Trên VPS (Sau Khi Clone)

### 1. Nginx Config
File: `nginx/conf.d/default.conf`
```nginx
# Thay yourdomain.com thành domain thật
server_name yourdomain.com www.yourdomain.com;
```

### 2. SSL Init Script
File: `scripts/init-ssl.sh`
```bash
DOMAIN="yourdomain.com"  # ← Thay domain thật
EMAIL="your-email@example.com"  # ← Thay email thật
```

## 🎯 Deployment Steps Overview

### Stage 1: Initial Deploy (HTTP Only)
```bash
1. Clone repo
2. Copy và edit .env
3. Update nginx config (domain)
4. docker-compose up -d
5. Test: http://yourdomain.com/api/health
```

### Stage 2: SSL Setup
```bash
1. Verify DNS: dig +short yourdomain.com
2. Edit scripts/init-ssl.sh (domain & email)
3. chmod +x scripts/init-ssl.sh
4. ./scripts/init-ssl.sh
5. Test: https://yourdomain.com/api/health
```

### Stage 3: Final Config
```bash
1. Enable HTTPS redirect trong nginx config
2. Comment out temporary HTTP routes
3. docker-compose exec nginx nginx -s reload
4. Test all endpoints
```

## 🧪 Testing Before Go Live

### API Tests
```bash
# Health check
curl http://localhost:8000/api/health

# Register
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","username":"testuser"}'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### SSL Tests (After SSL Setup)
```bash
# SSL certificate info
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# SSL Labs test
https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com

# HTTPS redirect
curl -I http://yourdomain.com
# Should see: Location: https://yourdomain.com
```

## 🚨 Important Warnings

### ⚠️ SECURITY
- [ ] **NEVER** commit `.env` files
- [ ] **NEVER** commit real secrets in example files
- [ ] **NEVER** use default passwords in production
- [ ] **ALWAYS** use strong random passwords
- [ ] **ALWAYS** enable firewall on VPS

### ⚠️ SSL
- [ ] Domain PHẢI trỏ về VPS trước khi chạy `init-ssl.sh`
- [ ] Let's Encrypt có rate limit: 5 cert/week/domain
- [ ] Test với `--dry-run` trước nếu không chắc chắn

### ⚠️ DATABASE
- [ ] Backup database thường xuyên
- [ ] Không expose MySQL port ra internet (comment port 3307)
- [ ] Use strong DB passwords

### ⚠️ DOCKER
- [ ] Không dùng `docker-compose down -v` nếu không muốn mất data
- [ ] Volume `mysql_data` chứa tất cả database data
- [ ] Logs sẽ tốn disk space, cần cleanup thường xuyên

## ✅ Final Checklist

- [ ] Code đã push lên Git
- [ ] VPS đã setup xong
- [ ] Domain đã trỏ về VPS
- [ ] .env file đã tạo trên VPS
- [ ] Nginx config đã update domain
- [ ] Docker containers đang chạy
- [ ] SSL certificate đã được cấp
- [ ] HTTPS redirect đã enable
- [ ] All API endpoints đã test
- [ ] Database migrations đã chạy
- [ ] Backup strategy đã setup
- [ ] Monitoring tools đã setup (optional)

## 🎉 Go Live!

Sau khi tất cả checklist trên đã hoàn thành:

```bash
# Final test
curl https://yourdomain.com/api/health

# Should return:
# {"success":true,"message":"Server is running"}
```

**🚀 Congratulations! Your app is now live!**

---

## 📞 Support

Nếu gặp vấn đề, check:
1. `DEPLOYMENT.md` - Troubleshooting section
2. Docker logs: `docker-compose logs -f`
3. Nginx logs: `docker-compose logs -f nginx`
4. Application logs: `./logs/app.log`

