#!/bin/bash
# EC2 Setup Script for Flight Schedule Pro Backend
# Run this on your EC2 instance after connecting via SSH

set -e  # Exit on error

echo "=========================================="
echo "Flight Schedule Pro - EC2 Setup"
echo "=========================================="

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "Cannot detect OS. Exiting."
    exit 1
fi

echo "Detected OS: $OS"

# Install Node.js 20
echo ""
echo "📦 Installing Node.js 20..."
if [ "$OS" == "amzn" ] || [ "$OS" == "rhel" ] || [ "$OS" == "centos" ]; then
    # Amazon Linux / RHEL / CentOS
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo yum install -y nodejs git
elif [ "$OS" == "ubuntu" ] || [ "$OS" == "debian" ]; then
    # Ubuntu / Debian
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs git
else
    echo "Unsupported OS. Please install Node.js 20 manually."
    exit 1
fi

# Verify Node.js installation
node_version=$(node --version)
npm_version=$(npm --version)
echo "✅ Node.js installed: $node_version"
echo "✅ npm installed: $npm_version"

# Install PM2 globally
echo ""
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install TypeScript and ts-node globally (for running TypeScript directly)
echo ""
echo "📦 Installing TypeScript tools..."
sudo npm install -g typescript ts-node

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo ""
    echo "⚠️  Warning: package.json not found in current directory"
    echo "Please navigate to the backend directory first:"
    echo "  cd flight-schedule-pro/backend"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Install project dependencies
echo ""
echo "📦 Installing project dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
NODE_ENV=production
PORT=3001
AWS_REGION=us-east-1

# Database - UPDATE THESE VALUES
DATABASE_HOST=flight-schedule-pro-staging-db.crws0amqe1e3.us-east-1.rds.amazonaws.com
DATABASE_NAME=flight_schedule_pro
DATABASE_USER=postgres
DATABASE_PASSWORD=Databasemaster2000

# Cognito - UPDATE IF NEEDED
COGNITO_USER_POOL_ID=us-east-1_f6h1XdY8u
COGNITO_CLIENT_ID=28tqtmpt1s0mrkcj4p5divnlh8

# Secrets Manager ARNs - UPDATE IF NEEDED
OPENAI_API_KEY_SECRET_ARN=arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/openai-api-key-2Si5nA
WEATHERAPI_API_KEY_SECRET_ARN=arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/weatherapi-com-key-a5RNBd
OPENWEATHERMAP_API_KEY_SECRET_ARN=arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/openweathermap-api-key-0pDF8m
DATABASE_PASSWORD_SECRET_ARN=arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/database-credentials-gYqeBF

# SES
SES_REGION=us-east-1

# Logging
LOG_LEVEL=info
EOF
    echo "✅ .env file created. Please review and update values if needed."
    echo "   Edit with: nano .env"
else
    echo "✅ .env file already exists"
fi

# Setup PM2
echo ""
echo "🚀 Setting up PM2..."
pm2 startup
echo ""
echo "⚠️  IMPORTANT: Run the command shown above to enable PM2 on boot"

# Summary
echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Review and update .env file: nano .env"
echo "2. Start the backend:"
echo "   pm2 start src/dev-server.ts --name flight-api --interpreter ts-node"
echo "   OR if you build first:"
echo "   npm run build"
echo "   pm2 start dist/dev-server.js --name flight-api"
echo ""
echo "3. Save PM2 configuration:"
echo "   pm2 save"
echo ""
echo "4. View logs:"
echo "   pm2 logs flight-api"
echo ""
echo "5. Test health endpoint:"
echo "   curl http://localhost:3001/health"
echo ""

