"""
FastAPI application factory and startup/shutdown handlers.
"""
from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from .core.config import settings
from .core.logging import setup_logging
from .db.base import init_db
from .api.V1.routes import auth, health, stocks, news, risks, refresh, seed

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    logger.info("Starting up Stock Predictor API...")
    await init_db()
    logger.info("Database initialized")
    yield
    logger.info("Shutting down Stock Predictor API...")


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title="Stock Predictor API",
        description="Full-stack stock prediction and analysis platform",
        version="1.0.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        lifespan=lifespan,
    )

    # Add middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS,
    )

    # Include routers
    app.include_router(health.router, prefix="/api/v1", tags=["Health"])
    app.include_router(auth.router, prefix="/api/v1", tags=["Auth"])
    app.include_router(stocks.router, prefix="/api/v1", tags=["Stocks"])
    app.include_router(news.router, prefix="/api/v1", tags=["News"])
    app.include_router(risks.router, prefix="/api/v1", tags=["Risks"])
    app.include_router(refresh.router, prefix="/api/v1", tags=["Data Refresh"])
    app.include_router(seed.router, prefix="/api/v1", tags=["Seeding"])

    logger.info("FastAPI application created successfully")
    return app


app = create_app()
