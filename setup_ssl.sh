#!/bin/bash
set -e

DOMAIN=${1:-"16.171.68.213.sslip.io"}
EMAIL=${2:-"utkarshpansare957@gmail.com"}

echo "=========================================="
echo "  Setting up Nginx Reverse Proxy & HTTPS  "
echo "  Domain: $DOMAIN"
echo "=========================================="

# 1. Ensure Nginx and Certbot are installed
sudo apt-get update -y
sudo apt-get install -y nginx certbot python3-certbot-nginx

# 2. Write Nginx Configuration
cat << EOF | sudo tee /etc/nginx/sites-available/vayumitra
server {
    listen 80;
    server_name $DOMAIN;

    # Landing Portal
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Citizen Portal
    location /citizen {
        proxy_pass http://127.0.0.1:5174;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Policymaker Portal
    location /policymaker {
        proxy_pass http://127.0.0.1:5175;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Django Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# 3. Enable Site
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/vayumitra /etc/nginx/sites-enabled/vayumitra
sudo nginx -t
sudo systemctl reload nginx

# 4. Obtain SSL Certificate via Certbot
echo "Requesting SSL Certificate from Let's Encrypt..."
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL --redirect || {
    echo "Certbot automated request finished with code $?. Running interactive check if needed: sudo certbot --nginx -d $DOMAIN"
}

echo ""
echo "=========================================="
echo "  HTTPS & Nginx Setup Complete!           "
echo "  https://$DOMAIN                         "
echo "=========================================="
