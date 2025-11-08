#!/bin/bash
# ==============================================================================
# Flight Schedule Pro - Local Development Setup
# ==============================================================================
# This script sets up the local development environment
# ==============================================================================

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_info "========================================="
log_info "Flight Schedule Pro - Local Setup"
log_info "========================================="
echo ""

# Check prerequisites
log_info "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    log_warn "Node.js not found. Please install Node.js 18+ first."
    exit 1
fi
log_info "Node.js version: $(node --version)"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    log_warn "PostgreSQL not found. Please install PostgreSQL 14+ first."
    exit 1
fi
log_info "PostgreSQL version: $(psql --version)"

# Check AWS CLI (optional for local dev)
if command -v aws &> /dev/null; then
    log_info "AWS CLI version: $(aws --version)"
else
    log_warn "AWS CLI not found (optional for local development)"
fi

echo ""
log_info "Installing dependencies..."

# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install backend dependencies
cd backend && npm install && cd ..

log_info "Dependencies installed successfully!"

echo ""
log_info "Setting up environment variables..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    log_info "Creating .env file from template..."
    cp env.template .env
    log_warn "Please edit .env file and add your API keys and database credentials"
else
    log_info ".env file already exists"
fi

echo ""
log_info "Setting up database..."

# Check if database exists
if psql -lqt | cut -d \| -f 1 | grep -qw flight_schedule_pro; then
    log_info "Database 'flight_schedule_pro' already exists"
else
    log_info "Creating database..."
    createdb flight_schedule_pro
    log_info "Database created successfully!"
fi

# Run migrations
log_info "Running database migrations..."
psql -d flight_schedule_pro -f database/migrations/001_create_users_table.sql
psql -d flight_schedule_pro -f database/migrations/002_create_bookings_table.sql
psql -d flight_schedule_pro -f database/migrations/003_create_availability_tables.sql
psql -d flight_schedule_pro -f database/migrations/004_create_notifications_table.sql
psql -d flight_schedule_pro -f database/migrations/005_create_audit_log_table.sql
psql -d flight_schedule_pro -f database/migrations/006_create_indexes.sql
log_info "Migrations completed!"

# Load seed data
log_info "Loading seed data..."
psql -d flight_schedule_pro -f database/seeds/dev_users.sql
psql -d flight_schedule_pro -f database/seeds/dev_bookings.sql
psql -d flight_schedule_pro -f database/seeds/dev_availability.sql
log_info "Seed data loaded!"

echo ""
log_info "========================================="
log_info "Setup completed successfully!"
log_info "========================================="
log_info ""
log_info "To start development:"
log_info "1. Edit .env file with your API keys"
log_info "2. Start frontend: npm run dev:frontend"
log_info "3. Start backend: npm run dev:backend"
log_info ""
log_info "Useful commands:"
log_info "- npm run lint    # Check code quality"
log_info "- npm run test    # Run tests"
log_info "- npm run format  # Format code"


