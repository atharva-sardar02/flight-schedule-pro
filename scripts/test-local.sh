#!/bin/bash
# Local Testing Script for Flight Schedule Pro
# Tests backend, frontend, and their connection

echo "=========================================="
echo "Flight Schedule Pro - Local Testing"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "Creating .env from template..."
    cp env.template .env
    echo "✅ .env created. Please update it with your values."
    echo ""
fi

# Check Node.js
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js: $NODE_VERSION"
else
    echo "❌ Node.js not found! Please install Node.js 18+"
    exit 1
fi

# Check npm
echo "Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm: $NPM_VERSION"
else
    echo "❌ npm not found!"
    exit 1
fi

echo ""
echo "=========================================="
echo "Checking Dependencies"
echo "=========================================="

# Check backend dependencies
if [ ! -d "backend/node_modules" ]; then
    echo "⚠️  Backend dependencies not installed"
    echo "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    echo "✅ Backend dependencies installed"
else
    echo "✅ Backend dependencies installed"
fi

# Check frontend dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo "⚠️  Frontend dependencies not installed"
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    echo "✅ Frontend dependencies installed"
else
    echo "✅ Frontend dependencies installed"
fi

echo ""
echo "=========================================="
echo "Environment Check"
echo "=========================================="

# Load .env file
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Check critical environment variables
REQUIRED_VARS=(
    "DATABASE_HOST"
    "DATABASE_NAME"
    "DATABASE_USER"
    "COGNITO_USER_POOL_ID"
    "COGNITO_CLIENT_ID"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "⚠️  $var is not set"
        MISSING_VARS+=("$var")
    else
        echo "✅ $var is set"
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo ""
    echo "⚠️  Some environment variables are missing. Please update .env file."
fi

echo ""
echo "=========================================="
echo "Ready to Test!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Start Backend (Terminal 1):"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "2. Start Frontend (Terminal 2):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "3. Test Backend Health:"
echo "   Open: http://localhost:3001/health"
echo ""
echo "4. Test Frontend:"
echo "   Open: http://localhost:3000"
echo ""
echo "5. Test CORS (from browser console on localhost:3000):"
echo "   fetch('http://localhost:3001/health').then(r => r.json()).then(console.log)"
echo ""

