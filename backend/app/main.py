"""
VeriFact Backend — Main FastAPI Application
"""

import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.core.config import get_settings
from app.core.database import init_db, engine
from app.core.rate_limit import RateLimitMiddleware

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown."""
    # Startup
    print(f"🚀 Starting VeriFact API v1.0.0 ({settings.app_env})")
    print(f"   Demo mode: {settings.demo_mode}")
    print(f"   Real AI: {settings.enable_real_ai}")
    print(f"   Local AI: {settings.enable_local_ai}")

    # Initialize database tables (dev only)
    if settings.app_env == "development":
        try:
            await init_db()
            print("   ✅ Database initialized")
        except Exception as e:
            print(f"   ⚠️  Database initialization failed: {e}")
            print("   ℹ️  Start PostgreSQL with: docker-compose up -d postgres")

    yield

    # Shutdown
    print("🛑 Shutting down VeriFact API")


app = FastAPI(
    title="VeriFact API",
    description="Multimodal Deep Learning Framework for Real-Time, Explainable Fake News and Deepfake Detection",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

@app.api_route("/api/docs", methods=["GET", "HEAD"], include_in_schema=False)
async def api_docs_redirect():
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/docs")

# ── CORS ─────────────────────────────────────────────────────────────────────
allowed_origins = list(set(settings.cors_origins + [settings.app_url, "http://localhost:3000", "http://127.0.0.1:3000"]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Rate Limiting ────────────────────────────────────────────────────────────
app.add_middleware(
    RateLimitMiddleware,
    max_requests=max(60, settings.rate_limit_requests_per_minute * 4),
    window_seconds=60,
)


# ── Global Exception Handler ────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unhandled exceptions with structured error responses."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.app_debug else "An unexpected error occurred",
        },
    )


# ── Routes ───────────────────────────────────────────────────────────────────
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.analysis import router as analysis_router
from app.api.v1.endpoints.research import (
    history_router,
    research_router,
    admin_router,
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(analysis_router, prefix="/api/v1")
app.include_router(history_router, prefix="/api/v1")
app.include_router(research_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")


# ── Health & Readiness Probes ───────────────────────────────────────────────
@app.get("/api/health")
async def health_check():
    """Public health check endpoint reporting real database status and latency."""
    db_connected = False
    db_latency_ms = None
    try:
        t0 = time.time()
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        db_latency_ms = round((time.time() - t0) * 1000, 2)
        db_connected = True
    except Exception:
        db_connected = False

    status_code = status.HTTP_200_OK if db_connected else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "healthy" if db_connected else "degraded",
            "version": "1.0.0",
            "environment": settings.app_env,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "database": {
                "status": "connected" if db_connected else "disconnected",
                "latency_ms": db_latency_ms,
            },
            "providers": {
                "gemini": settings.is_provider_configured("gemini"),
                "groq": settings.is_provider_configured("groq"),
                "fact_check": settings.is_provider_configured("fact_check"),
                "news": settings.is_provider_configured("news"),
            },
        },
    )


@app.get("/api/ready")
async def readiness_check():
    """Readiness probe for zero-downtime deployments."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "ready", "ready": True}
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unready", "ready": False, "error": "Database is unreachable"},
        )


@app.get("/api/v1/config/public")
async def public_config():
    """Public configuration for frontend."""
    return {
        "demo_mode": settings.demo_mode,
        "google_oauth_configured": bool(settings.google_client_id),
        "google_client_id": settings.google_client_id if settings.google_client_id else None,
        "providers": {
            "gemini": settings.is_provider_configured("gemini"),
            "groq": settings.is_provider_configured("groq"),
            "fact_check": settings.is_provider_configured("fact_check"),
            "news": settings.is_provider_configured("news"),
        },
        "features": {
            "text_analysis": True,
            "image_analysis": True,
            "url_analysis": True,
            "social_analysis": False,  # Not yet implemented
            "research_lab": True,
        },
    }
