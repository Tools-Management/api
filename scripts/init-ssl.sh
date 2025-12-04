#!/bin/bash

# Script để khởi tạo SSL certificate lần đầu
# Chạy trên VPS sau khi docker-compose up

set -e

DOMAIN="yourdomain.com"
EMAIL="your-email@example.com"

echo "🔐 Initializing SSL Certificate for $DOMAIN"
echo "================================================"

# 1. Kiểm tra domain đã trỏ về server chưa
echo "📡 Checking DNS resolution..."
DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)
SERVER_IP=$(curl -s ifconfig.me)

if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
    echo "⚠️  WARNING: Domain $DOMAIN resolves to $DOMAIN_IP"
    echo "⚠️  But server IP is $SERVER_IP"
    echo "⚠️  Please update DNS A record before continuing"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 2. Tạo dummy certificate để nginx khởi động được
echo "📝 Creating dummy certificate..."
mkdir -p certbot/conf/live/$DOMAIN
openssl req -x509 -nodes -newkey rsa:4096 -days 1 \
    -keyout certbot/conf/live/$DOMAIN/privkey.pem \
    -out certbot/conf/live/$DOMAIN/fullchain.pem \
    -subj "/CN=$DOMAIN"

# 3. Uncomment HTTPS block trong nginx config
echo "⚙️  Updating nginx configuration..."
sed -i 's/# server {/server {/g' nginx/conf.d/default.conf
sed -i 's/#     /    /g' nginx/conf.d/default.conf
sed -i 's/#}/}/g' nginx/conf.d/default.conf

# Comment out temporary HTTP routes
sed -i 's/location \/api {/# location \/api {/g' nginx/conf.d/default.conf
sed -i 's/location \/ {/# location \/ {/g' nginx/conf.d/default.conf

# 4. Reload nginx
echo "🔄 Reloading nginx..."
docker-compose exec nginx nginx -s reload

# 5. Xóa dummy certificate
echo "🗑️  Removing dummy certificate..."
rm -rf certbot/conf/live/$DOMAIN

# 6. Request real certificate
echo "🎫 Requesting real certificate from Let's Encrypt..."
docker-compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN

# 7. Final reload
echo "✅ Reloading nginx with real certificate..."
docker-compose exec nginx nginx -s reload

echo ""
echo "================================================"
echo "✅ SSL Certificate installed successfully!"
echo "🔐 Your site is now accessible via HTTPS"
echo "🔄 Certificate will auto-renew every 12 hours"
echo "================================================"

