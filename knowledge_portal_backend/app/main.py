from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.utils import get_openapi
import os
import logging

from app.core.config import settings
from app.api.v1.api import api_router
from app.core.redis_client import redis_client
from app.core.elasticsearch_client import es_client
from app.core.database import init_db

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=settings.PROJECT_NAME,
        version="1.0.0",
        description="Knowledge Portal API",
        routes=app.routes,
    )
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,  # Cache preflight requests for 10 minutes
)

# Initialize Redis, Elasticsearch, and Database clients
@app.on_event("startup")
async def startup_event():
    try:
        # Initialize database
        logger.info("Initializing database...")
        await init_db()
        logger.info("Database initialized successfully")
        
        # Initialize Redis
        logger.info("Initializing Redis...")
        await redis_client.init()
        logger.info("Redis initialized successfully")
        
        # Initialize Elasticsearch
        logger.info("Initializing Elasticsearch...")
        await es_client.init()
        logger.info("Elasticsearch initialized successfully")
    except Exception as e:
        logger.error(f"Error during startup: {e}")
        raise

# Mount API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return JSONResponse(
        content={
            "message": "Welcome to Knowledge Portal API",
            "version": settings.VERSION,
            "docs_url": "/docs"
        }
    )

# Health check endpoints
@app.get("/health")
@app.get(f"{settings.API_V1_STR}/health")
async def health_check():
    return {
        "status": "healthy",
        "services": {
            "api": "up",
            "redis": redis_client.redis_client is not None,
            "elasticsearch": es_client.es_client is not None
        }
    }

# Shutdown cleanup
@app.on_event("shutdown")
async def shutdown_event():
    await redis_client.close()
    await es_client.close()