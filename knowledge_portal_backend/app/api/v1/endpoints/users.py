from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Security, Request
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import ValidationError
import logging
from app.core import deps
from app.crud.user import user_crud
from app.models.user import User
from app.schemas.user import UserUpdate, User as UserSchema
from app.schemas.profile import ProfileUpdate
from app.schemas.auth import UserProfileUpdate

router = APIRouter()
logger = logging.getLogger(__name__)

@router.put("/{user_id}/profile", response_model=UserSchema)
async def update_user_profile(
    user_id: int,
    profile_in: ProfileUpdate,
    request: Request,
    current_user: User = Security(deps.get_current_active_user, scopes=[]),
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Update user profile.
    """
    try:
        # Log request data for debugging
        body = await request.json()
        logger.info(f"Profile update request for user {user_id}. Data: {body}")

        # Check if the user is updating their own profile or is a superuser
        if current_user.id != user_id and not current_user.is_superuser:
            raise HTTPException(
                status_code=403,
                detail="Not enough permissions to update this profile"
            )
        
        user = await user_crud.get(db, id=user_id)
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        # Convert ProfileUpdate to UserProfileUpdate for CRUD
        profile_update = UserProfileUpdate(
            full_name=profile_in.full_name,
            skill_level=profile_in.skill_level,
            interests=profile_in.interests
        )
        
        logger.info(f"Processed update data for user {user_id}: {profile_update.model_dump(exclude_unset=True)}")
        
        updated_user = await user_crud.update_profile(
            db,
            db_obj=user,
            profile_in=profile_update
        )
        logger.info(f"Successfully updated profile for user {user_id}")
        return updated_user

    except ValidationError as e:
        logger.error(f"Validation error for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=422,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error updating profile for user {user_id}: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while updating the profile"
        )

@router.get("/{user_id}/profile", response_model=UserSchema)
async def get_user_profile(
    user_id: int,
    current_user: User = Security(deps.get_current_active_user, scopes=[]),
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Get user profile.
    """
    user = await user_crud.get(db, id=user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    # Check if the user is accessing their own profile or is a superuser
    if current_user.id != user_id and not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to access this profile"
        )
    
    return user

@router.get("/admin/verify-profile-columns", response_model=Dict[str, bool])
async def verify_profile_columns(
    current_user: User = Security(deps.get_current_active_user, scopes=[]),
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Verify that profile columns exist in the users table.
    Admin only endpoint.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions. Admin access required."
        )
    
    try:
        result = await user_crud.verify_profile_columns(db)
        logger.info(f"Profile columns verification result: {result}")
        return result
    except Exception as e:
        logger.error(f"Error verifying profile columns: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to verify profile columns"
        )

@router.post("/admin/ensure-profile-columns", response_model=Dict[str, str])
async def ensure_profile_columns(
    current_user: User = Security(deps.get_current_active_user, scopes=[]),
    db: AsyncSession = Depends(deps.get_db),
) -> Any:
    """
    Ensure profile columns exist in the users table, create them if they don't.
    Admin only endpoint.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions. Admin access required."
        )
    
    try:
        result = await user_crud.ensure_profile_columns(db)
        logger.info(f"Profile columns ensure result: {result}")
        
        if 'error' in result:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to ensure profile columns: {result['error']}"
            )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error ensuring profile columns: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to ensure profile columns"
        ) 