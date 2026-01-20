#!/bin/bash
# Setup system Nginx as reverse proxy for Docker containers

set -e

echo "Setting up system Nginx for boats2026..."

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "Nginx is not installed. Installing..."
    sudo apt-get update
    sudo apt-get install -y nginx
fi

# Find project directory
PROJECT_DIR="/opt/boats2026"
if [ ! -d "$PROJECT_DIR" ]; then
    # Try to find it
    PROJECT_DIR=$(find /opt /home -name "boats2026" -type d 2>/dev/null | head -1)
    if [ -z "$PROJECT_DIR" ]; then
        echo "Error: Cannot find boats2026 directory. Please run this script from the project root."
        exit 1
    fi
fi

# Stop Docker nginx to free port 80
echo "Stopping Docker nginx container..."
cd "$PROJECT_DIR" || exit 1
docker compose stop nginx || true

# Copy configuration
echo "Copying Nginx configuration..."
sudo cp "$PROJECT_DIR/nginx/system-nginx.conf" /etc/nginx/sites-available/boats2026

# Create symlink
echo "Creating symlink..."
sudo ln -sf /etc/nginx/sites-available/boats2026 /etc/nginx/sites-enabled/boats2026

# Remove default nginx site if exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    echo "Removing default nginx site..."
    sudo rm /etc/nginx/sites-enabled/default
fi

# Test nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

# Reload nginx
echo "Reloading Nginx..."
sudo systemctl reload nginx

# Enable nginx to start on boot
sudo systemctl enable nginx

# Check status
echo "Checking Nginx status..."
sudo systemctl status nginx --no-pager

echo ""
echo "System Nginx is now configured!"
echo "Docker nginx is stopped. You can remove it from docker-compose.yml if needed."
echo ""
echo "To check logs: sudo tail -f /var/log/nginx/access.log"
echo "To check errors: sudo tail -f /var/log/nginx/error.log"
