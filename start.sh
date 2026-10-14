#!/usr/bin/env bash
# VeriFact Unified Development Server Launcher
# Launches both FastAPI Backend (port 8000) and Next.js Frontend (port 3000)

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

echo "=========================================================="
echo "   VeriFact AI Intelligence Platform Launcher"
echo "=========================================================="

# Check Python environment
if [ -f "$DIR/backend/venv/bin/uvicorn" ]; then
    UVICORN_EXEC="$DIR/backend/venv/bin/uvicorn"
elif command -v uvicorn >/dev/null 2>&1; then
    UVICORN_EXEC="uvicorn"
else
    echo "Error: uvicorn not found in backend/venv or system PATH."
    echo "Please run: cd backend && source venv/bin/activate"
    exit 1
fi

# Clean up stale processes on port 8000 or 3000 if running
PIDS_8000=$(lsof -ti :8000 2>/dev/null || true)
PIDS_3000=$(lsof -ti :3000 2>/dev/null || true)

if [ -n "$PIDS_8000" ]; then
    echo "Notice: Port 8000 already in use (PID $PIDS_8000). Freeing port..."
    kill -9 $PIDS_8000 2>/dev/null || true
    sleep 1
fi

if [ -n "$PIDS_3000" ]; then
    echo "Notice: Port 3000 already in use (PID $PIDS_3000). Freeing port..."
    kill -9 $PIDS_3000 2>/dev/null || true
    sleep 1
fi

echo "[1/2] Starting VeriFact FastAPI Backend on http://localhost:8000..."
cd "$DIR/backend"
$UVICORN_EXEC app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "[2/2] Starting VeriFact Next.js Frontend on http://127.0.0.1:3000..."
cd "$DIR/frontend"
npm run dev -- -p 3000 &
FRONTEND_PID=$!

cleanup() {
    echo ""
    echo "Shutting down VeriFact services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

echo ""
echo "=========================================================="
echo ">> VeriFact Services Ready:"
echo "   - Web App UI:        http://localhost:3000"
echo "   - API Documentation: http://localhost:8000/docs"
echo "   - Health Check:      http://localhost:8000/api/health"
echo "=========================================================="
echo "Press Ctrl+C to terminate both servers."
echo ""

wait
