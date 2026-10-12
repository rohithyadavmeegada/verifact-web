"""
VeriFact Backend — Main FastAPI Application
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.database import init_db

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
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


# ── Health Check ─────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health_check():
    """Public health check endpoint."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "demo_mode": settings.demo_mode,
    }


@app.get("/api/v1/config/public")
async def public_config():
    """Public configuration for frontend."""
    return {
        "demo_mode": settings.demo_mode,
        "google_oauth_configured": bool(settings.google_client_id),
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
