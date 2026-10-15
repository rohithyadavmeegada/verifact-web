# VeriFact FastAPI Backend — Production Dockerfile
# Multi-stage build: deps → runtime
# Target: python:3.11-slim-bookworm

# ── Stage 1: dependency builder ───────────────────────────────────────────────
FROM python:3.11-slim-bookworm AS builder

WORKDIR /build

# Install build tools for compiled packages (numpy, pillow, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gcc libpq-dev libffi-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install --prefix=/install --no-cache-dir -r requirements.txt

# ── Stage 2: slim runtime image ───────────────────────────────────────────────
FROM python:3.11-slim-bookworm AS runtime

WORKDIR /app

# Runtime system libraries only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

# Copy application source
COPY . .

# Non-root user for security
RUN useradd --create-home --shell /bin/bash verifact \
    && chown -R verifact:verifact /app
USER verifact

# Expose API port
EXPOSE 8000

# Production: 2 Uvicorn workers per Render/Railway recommendation
CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "2", \
     "--log-level", "info", \
     "--access-log"]
