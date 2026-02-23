.PHONY: help setup install-backend install-frontend start start-backend start-frontend start-all test format clean

help:
	@echo "========================================="
	@echo "MIOS Payroll System - Make Commands"
	@echo "========================================="
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make setup              - Complete setup (backend + frontend)"
	@echo "  make install-backend    - Install Python dependencies"
	@echo "  make install-frontend   - Install Node dependencies"
	@echo ""
	@echo "Development:"
	@echo "  make start-backend      - Start FastAPI server"
	@echo "  make start-frontend     - Start React dev server"
	@echo "  make start-all          - Start backend + frontend (2 terminals)"
	@echo ""
	@echo "Testing & Quality:"
	@echo "  make test               - Run backend tests"
	@echo "  make format             - Format code (Python)"
	@echo ""
	@echo "Database:"
	@echo "  make db-up              - Start PostgreSQL"
	@echo "  make db-down            - Stop PostgreSQL"
	@echo "  make db-migrate         - Run migrations"
	@echo "  make db-reset           - Reset database"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean              - Clean build artifacts"
	@echo ""

setup: install-backend install-frontend db-up db-migrate
	@echo ""
	@echo "✅ Setup complete!"
	@echo ""
	@echo "To start development:"
	@echo "  Terminal 1: make start-backend"
	@echo "  Terminal 2: make start-frontend"
	@echo ""

install-backend:
	@echo "📦 Installing backend dependencies..."
	pip install -r requirements.txt

install-frontend:
	@echo "📦 Installing frontend dependencies..."
	cd frontend && npm install

start-backend:
	@echo "🚀 Starting FastAPI server..."
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

start-frontend:
	@echo "🚀 Starting React dev server..."
	cd frontend && npm start

start-all:
	@echo "🚀 Starting both servers..."
	@echo ""
	@echo "⚠️  Open TWO new terminals and run:"
	@echo "  Terminal 1: make start-backend"
	@echo "  Terminal 2: make start-frontend"
	@echo ""
	@echo "Then open http://localhost:3000 in your browser"

test:
	@echo "🧪 Running backend tests..."
	python test_backend.py

db-up:
	@echo "🐘 Starting PostgreSQL..."
	docker-compose up -d postgres
	@sleep 2
	@echo "✅ PostgreSQL is running"

db-down:
	@echo "🛑 Stopping PostgreSQL..."
	docker-compose down

db-migrate:
	@echo "🔄 Running database migrations..."
	alembic upgrade head

db-reset:
	@echo "⚠️  Resetting database (destructive)..."
	docker-compose down -v
	docker-compose up -d postgres
	sleep 2
	alembic upgrade head
	@echo "✅ Database reset complete"

format:
	@echo "🎨 Formatting Python code..."
	black app/ alembic/
	isort app/ alembic/

clean:
	@echo "🧹 Cleaning up..."
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type d -name .pytest_cache -exec rm -rf {} +
	rm -rf .coverage
	rm -rf build/ dist/ *.egg-info
	cd frontend && rm -rf build
	@echo "✅ Cleanup complete"

.DEFAULT_GOAL := help
