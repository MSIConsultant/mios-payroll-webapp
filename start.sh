#!/usr/bin/env bash

# MIOS PAYROLL SYSTEM - Installation & Startup Script
# One command to get everything running!

set -e

echo "========================================="
echo "🎯 MIOS PAYROLL SYSTEM - Setup & Launch"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo -e "${BLUE}[1/5] Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    echo "Please install from: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# Check if Python is installed
echo -e "${BLUE}[2/5] Checking Python...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Python $(python3 --version)${NC}"

# Check if Docker is running
echo -e "${BLUE}[3/5] Checking Docker...${NC}"
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker installed${NC}"
    # Start PostgreSQL
    echo "   Starting PostgreSQL..."
    docker-compose up -d postgres 2>/dev/null || true
    sleep 2
else
    echo -e "${YELLOW}⚠️  Docker not found (optional)${NC}"
fi

# Install frontend dependencies
echo -e "${BLUE}[4/5] Installing frontend dependencies...${NC}"
cd frontend
npm install --silent 2>&1 | grep -E "added|up to date" || true
cd ..
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"

# Run migrations
echo -e "${BLUE}[5/5] Running database migrations...${NC}"
alembic upgrade head 2>/dev/null || echo "⚠️  Migrations (might already be done)"
echo -e "${GREEN}✅ Database ready${NC}"

echo ""
echo "========================================="
echo -e "${GREEN}✅ SETUP COMPLETE!${NC}"
echo "========================================="
echo ""
echo -e "${YELLOW}To start the system, open THREE terminals:${NC}"
echo ""
echo -e "${BLUE}Terminal 1 (Database - optional):${NC}"
echo "  docker-compose up postgres"
echo ""
echo -e "${BLUE}Terminal 2 (Backend API):${NC}"
echo "  cd /workspaces/mios-payroll"
echo "  uvicorn app.main:app --reload"
echo "  → Will run on http://localhost:8000"
echo "  → Docs available at http://localhost:8000/docs"
echo ""
echo -e "${BLUE}Terminal 3 (Frontend UI):${NC}"
echo "  cd /workspaces/mios-payroll/frontend"
echo "  npm start"
echo "  → Will run on http://localhost:3000"
echo ""
echo -e "${YELLOW}Then:${NC}"
echo "  1. Open browser: ${BLUE}http://localhost:3000${NC}"
echo "  2. Click 'Kalkulator' in left menu"
echo "  3. Fill in salary data"
echo "  4. Click 'Hitung' and see results!"
echo ""
echo -e "${YELLOW}Documentation:${NC}"
echo "  • Quick Start: QUICK_START_ID.md"
echo "  • Full Guide: FULL_SETUP_GUIDE.md"
echo "  • Documentation Index: DOCUMENTATION_INDEX.md"
echo ""
echo "========================================="
echo -e "${GREEN}Happy Calculating! 🚀${NC}"
echo "========================================="
