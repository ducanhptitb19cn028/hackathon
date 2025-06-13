import logging
import asyncio
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import init_db, engine
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def init() -> None:
    try:
        logger.info("Creating initial database tables...")
        await init_db()
        logger.info("Database tables created successfully")
    except SQLAlchemyError as e:
        logger.error(f"Error creating database tables: {e}")
        raise
    finally:
        await engine.dispose()

def main() -> None:
    logger.info("Initializing database...")
    asyncio.run(init())
    logger.info("Database initialization completed")

if __name__ == "__main__":
    main() 