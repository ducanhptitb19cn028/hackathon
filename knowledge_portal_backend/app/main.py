from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.utils import get_openapi
import os
import logging
import re

from app.core.config import settings
from app.api.v1.api import api_router
from app.core.redis_client import redis_client
from app.core.elasticsearch_client import es_client
from app.core.database import init_db
from app.core.startup import startup_tasks

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

# Custom CORS origin checker for ngrok URLs
def is_allowed_origin(origin: str) -> bool:
    """Check if the origin is allowed, including ngrok URLs."""
    # Allow localhost origins
    localhost_patterns = [
        "http://localhost:3000",
        "http://localhost:8000", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000"
    ]
    
    if origin in localhost_patterns:
        return True
    
    # Allow ngrok URLs
    ngrok_patterns = [
        r"https://.*\.ngrok-free\.app",
        r"https://.*\.ngrok\.io",
        r"https://.*\.ngrok\.app"
    ]
    
    for pattern in ngrok_patterns:
        if re.match(pattern, origin):
            return True
    
    return False

# Set up CORS middleware with custom origin validation
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.ngrok-free\.app|https://.*\.ngrok\.io|https://.*\.ngrok\.app|http://localhost:.*|http://127\.0\.0\.1:.*",
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
        
        # Run startup tasks (including profile field verification)
        logger.info("Running startup tasks...")
        await startup_tasks()
        logger.info("Startup tasks completed")
        
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