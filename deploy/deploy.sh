#!/usr/bin/env bash
set -euo pipefail

# MetaPitch monolith deployment script for Ubuntu 22.04+ (GCP / DigitalOcean)
# Usage: scp this repo to the VM, then run: sudo bash deploy/deploy.sh

APP_DIR="/home/metapitch/metapitch"
APP_USER="metapitch"

echo "=== 1. System packages ==="
apt-get update
apt-get install -y curl build-essential python3 python3-pip

echo "=== 2. Install Node 20 ==="
if ! command -v node &>/dev/null || [[ "$(node -v)" != v20* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "Node $(node -v), npm $(npm -v)"

echo "=== 3. Create app user ==="
if ! id "$APP_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$APP_USER"
fi

echo "=== 4. Copy project files ==="
# Assumes repo is in the current directory (where you ran the script from)
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
if [ "$SCRIPT_DIR" != "$APP_DIR" ]; then
  mkdir -p "$APP_DIR"
  rsync -a --exclude node_modules --exclude .git "$SCRIPT_DIR/" "$APP_DIR/"
  chown -R "$APP_USER:$APP_USER" "$APP_DIR"
fi

echo "=== 5. Install dependencies ==="
sudo -u "$APP_USER" bash -c "cd $APP_DIR && npm install"
sudo -u "$APP_USER" bash -c "cd $APP_DIR/server && npm install"
sudo -u "$APP_USER" bash -c "cd $APP_DIR/frontend && npm install"

echo "=== 6. Build ==="
# Build shared services (root tsconfig)
sudo -u "$APP_USER" bash -c "cd $APP_DIR && npm run build"
# Build server
sudo -u "$APP_USER" bash -c "cd $APP_DIR/server && npm run build"
# Build frontend with same-origin API
sudo -u "$APP_USER" bash -c "cd $APP_DIR/frontend && VITE_API_URL='' npm run build"

echo "=== 7. Check database ==="
if [ ! -f "$APP_DIR/data/metapitch.db" ]; then
  echo ""
  echo "WARNING: data/metapitch.db not found!"
  echo "SCP it from your local machine:"
  echo "  scp data/metapitch.db $APP_USER@<VM_IP>:$APP_DIR/data/"
  echo ""
fi

echo "=== 8. Check .env ==="
if [ ! -f "$APP_DIR/.env" ]; then
  echo "GEMINI_API_KEY=your-key-here" > "$APP_DIR/.env"
  chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
  echo "Created .env — edit $APP_DIR/.env with your GEMINI_API_KEY"
fi

echo "=== 9. Install systemd service ==="
cp "$APP_DIR/deploy/metapitch.service" /etc/systemd/system/metapitch.service
systemctl daemon-reload
systemctl enable metapitch
systemctl restart metapitch

echo "=== Done ==="
echo "Status: sudo systemctl status metapitch"
echo "Logs:   sudo journalctl -u metapitch -f"
echo "Access: http://<VM_IP>:3000"
