#!/bin/bash
set -e

echo "=========================================="
echo "  VayuMitra 2.0 AWS EC2 Automated Deploy  "
echo "=========================================="

# 1. System packages
echo " [1/6] Updating system and installing base dependencies..."
sudo apt-get update -y
sudo apt-get install -y git curl wget build-essential python3-pip python3-venv libpq-dev

# 2. Node.js 20 LTS
if ! command -v node &> /dev/null; then
    echo " [2/6] Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
sudo npm install -g pm2

# 3. Python Virtualenv & Dependencies
echo " [3/6] Setting up Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
pip install -r ml-api/requirements.txt

# 4. Environment Check
echo " [4/6] Verifying environment configurations..."
if [ ! -f "backend/.env" ]; then
    echo "backend/.env not found! Creating from .env.example..."
    cp backend/.env.example backend/.env
    echo "Please edit backend/.env with your RDS and API credentials: nano backend/.env"
fi

if [ ! -f "ml-api/.env" ]; then
    echo "ml-api/.env not found! Creating from .env.example..."
    cp ml-api/.env.example ml-api/.env
fi

# 5. Database Migrations & Seeds
echo " [5/6] Running database migrations on AWS RDS..."
venv/bin/python backend/manage.py migrate --noinput
venv/bin/python backend/manage.py seed_drives || true

# 6. Build Frontends
echo " [6/6] Installing frontend dependencies and building production bundles..."
for app in landing citizen policymaker; do
    echo "Building $app..."
    cd $app
    npm install
    npm run build
    cd ..
done

# 7. Start PM2 Services
echo "Launching all services with PM2..."
pm2 start ecosystem.config.js || pm2 restart ecosystem.config.js
pm2 save

PUBLIC_IP=$(curl -s http://checkip.amazonaws.com || curl -s https://ifconfig.me || echo "YOUR-EC2-PUBLIC-IP")

echo ""
echo "=========================================="
echo " VayuMitra 2.0 is LIVE ON AWS EC2!"
echo "=========================================="
echo " Landing Portal:     http://${PUBLIC_IP}:5173"
echo " Citizen Dashboard:  http://${PUBLIC_IP}:5174"
echo " Policymaker Portal: http://${PUBLIC_IP}:5175"
echo " Django Backend API: http://${PUBLIC_IP}:8000"
echo " ML Forecasting API: http://${PUBLIC_IP}:8001"
echo "=========================================="
echo "Useful Commands:"
echo "  pm2 status          -> Check server statuses"
echo "  pm2 logs            -> View real-time logs"
echo "  pm2 restart all     -> Restart all services"
echo "=========================================="
