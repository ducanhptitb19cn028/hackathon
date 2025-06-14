"""
Startup functions for the Knowledge Portal backend.
"""
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.crud.user import user_crud

logger = logging.getLogger(__name__)


async def ensure_user_profile_fields():
    """
    Ensure user profile fields exist in the database.
    This function is called during application startup.
    """
    try:
        # Get database session
        async for db in get_db():
            logger.info("Checking user profile fields...")
            
            # Verify columns exist
            verification_result = await user_crud.verify_profile_columns(db)
            logger.info(f"Profile columns verification: {verification_result}")
            
            # Check if any columns are missing
            missing_columns = [col for col, exists in verification_result.items() if not exists]
            
            if missing_columns:
                logger.warning(f"Missing profile columns: {missing_columns}")
                logger.info("Attempting to add missing profile columns...")
                
                # Ensure columns exist
                ensure_result = await user_crud.ensure_profile_columns(db)
                logger.info(f"Profile columns ensure result: {ensure_result}")
                
                if 'error' in ensure_result:
                    logger.error(f"Failed to ensure profile columns: {ensure_result['error']}")
                else:
                    logger.info("Successfully ensured all profile columns exist")
            else:
                logger.info("All profile columns are present")
            
            break  # Exit after first iteration
            
    except Exception as e:
        logger.error(f"Error during profile fields setup: {str(e)}")
        # Don't raise the exception to prevent app startup failure
        # The admin can manually run the ensure endpoint if needed


async def startup_tasks():
    """
    Run all startup tasks.
    """
    logger.info("Running startup tasks...")
    
    try:
        await ensure_user_profile_fields()
        logger.info("Startup tasks completed successfully")
    except Exception as e:
        logger.error(f"Error during startup tasks: {str(e)}")
        # Log but don't fail startup 