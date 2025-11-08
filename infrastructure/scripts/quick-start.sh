#!/bin/bash
# Quick Start Script for Local Development
# This script helps you get started quickly

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_info "========================================="
log_info "Flight Schedule Pro - Quick Start"
log_info "========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    log_warn ".env file not found. Creating from template..."
    cp env.template .env
    log_info ".env file created. Please edit it with your values."
    echo ""
    log_warn "MINIMUM required values for local dev:"
    echo "  - DATABASE_PASSWORD"
    echo "  - COGNITO_USER_POOL_ID (after Cognito deployment)"
    echo "  - COGNITO_CLIENT_ID (after Cognito deployment)"
    echo ""
    read -p "Press Enter to continue after editing .env..."
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi
log_info "Node.js version: $(node --version)"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    log_error "PostgreSQL is not installed. Please install PostgreSQL 14+ first."
    exit 1
fi
log_info "PostgreSQL version: $(psql --version)"

echo ""
log_info "Step 1: Installing dependencies..."
npm run install:all

echo ""
log_info "Step 2: Setting up database..."

# Check if database exists
if psql -lqt | cut -d \| -f 1 | grep -qw flight_schedule_pro; then
    log_info "Database 'flight_schedule_pro' already exists"
    read -p "Do you want to recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        dropdb flight_schedule_pro
        npm run db:setup
    fi
else
    npm run db:setup
fi

echo ""
log_info "========================================="
log_info "Setup Complete!"
log_info "========================================="
echo ""
log_info "Next steps:"
echo ""
echo "1. Configure AWS Cognito (if not using mock auth):"
echo "   See docs/LOCAL_DEVELOPMENT_GUIDE.md for AWS deployment"
echo ""
echo "2. Start backend server (Terminal 1):"
echo "   ${GREEN}npm run dev:backend${NC}"
echo ""
echo "3. Start frontend server (Terminal 2):"
echo "   ${GREEN}npm run dev:frontend${NC}"
echo ""
echo "4. Visit http://localhost:3000"
echo ""
log_warn "Note: Authentication requires Cognito deployment or mock mode"
log_info "See docs/LOCAL_DEVELOPMENT_GUIDE.md for full instructions"


