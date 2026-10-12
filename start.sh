#!/usr/bin/env bash
# VeriFact Unified Development Server Launcher
# Launches both FastAPI Backend (port 8000) and Next.js Frontend (port 3000)

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

echo "=========================================================="
echo "   VeriFact AI Intelligence Platform Launcher"
echo "=========================================================="

# Check Python environment
if [ -d "$DIR/backend/venv" ]; then
    PYTHON_EXEC="$DIR/backend/venv/bin/python"
    UVICORN_EXEC="$DIR/backend/venv/bin/uvicorn"
else
    PYTHON_EXEC="python3"
    UVICORN_EXEC="uvicorn"
fi

echo "[1/2] Starting VeriFact FastAPI Backend on http://localhost:8000..."
cd "$DIR/backend"
$UVICORN_EXEC app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "[2/2] Starting VeriFact Next.js Frontend on http://localhost:3000..."
cd "$DIR/frontend"
npm run dev -- -p 3000 &
FRONTEND_PID=$!

trap "echo 'Shutting down VeriFact services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

echo ""
echo ">> VeriFact Services Running:"
echo "   - Frontend UI: http://localhost:3000"
echo "   - Backend API Docs: http://localhost:8000/docs"
echo "   - Press Ctrl+C to terminate both servers."
echo ""

wait
