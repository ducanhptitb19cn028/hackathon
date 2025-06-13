import asyncio
import logging
import sys
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_postgres_connection():
    """Test connection to PostgreSQL server"""
    try:
        # Try connecting to default postgres database
        engine = create_async_engine(
            f"postgresql+asyncpg://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/postgres",
            echo=True
        )
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("Successfully connected to PostgreSQL server")
        return True
    except Exception as e:
        logger.error(f"Failed to connect to PostgreSQL server: {e}")
        logger.error("Please check if:")
        logger.error("1. PostgreSQL is installed and running")
        logger.error("2. The credentials in config.py are correct")
        logger.error("3. PostgreSQL is listening on port 5432")
        return False

async def create_database():
    """Create the database if it doesn't exist"""
    try:
        # First test connection
        if not await test_postgres_connection():
            return False

        # Create engine without database name
        engine = create_async_engine(
            f"postgresql+asyncpg://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/postgres",
            echo=True
        )
        
        async with engine.begin() as conn:
            # Check if database exists
            result = await conn.execute(
                text(f"SELECT 1 FROM pg_database WHERE datname = '{settings.POSTGRES_DB}'")
            )
            database_exists = result.scalar() is not None
            
            if not database_exists:
                # Create database
                await conn.execute(text(f'CREATE DATABASE "{settings.POSTGRES_DB}"'))
                logger.info(f"Database '{settings.POSTGRES_DB}' created successfully")
            else:
                logger.info(f"Database '{settings.POSTGRES_DB}' already exists")
                
        return True
                
    except Exception as e:
        logger.error(f"Error creating database: {e}")
        return False
    finally:
        await engine.dispose()

def main():
    try:
        logger.info("Starting database setup...")
        success = asyncio.run(create_database())
        if success:
            logger.info("Database setup completed successfully")
            logger.info("You can now run: python -m app.core.init_db")
        else:
            logger.error("Database setup failed")
            sys.exit(1)
    except Exception as e:
        logger.error(f"Database setup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 