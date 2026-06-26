"""
SmartSupply AI — Backend API Entry Point

Multi-tenant B2B SaaS platform for retail supply chain management.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from app.core.config import settings
from app.core.middleware import TenantMiddleware, RequestIDMiddleware, AuditMiddleware
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management."""
    # Startup
    print(f"🚀 SmartSupply AI Backend starting on {settings.ENVIRONMENT}")
    yield
    # Shutdown
    print("🛑 SmartSupply AI Backend shutting down")


app = FastAPI(
    title="SmartSupply AI",
    description="Multi-tenant B2B SaaS platform for retail supply chain management",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
    lifespan=lifespan,
)

# --- Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(TenantMiddleware)
app.add_middleware(AuditMiddleware)

# --- Prometheus Metrics ---
Instrumentator().instrument(app).expose(app)

# --- API Routes ---
app.include_router(api_router, prefix="/api/v1")


# --- Health Check ---
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "smartsupply-backend",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "SmartSupply AI API",
        "version": "1.0.0",
        "docs": "/docs",
    }
