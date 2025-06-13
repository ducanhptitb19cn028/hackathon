from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Security, Request
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import ValidationError
import logging
from app.core import deps
from app.crud.user import user_crud
from app.models.user import User
from app.schemas.user import UserUpdate, User as UserSchema
from app.schemas.profile import ProfileUpdate

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
        
        update_data = profile_in.model_dump(exclude_unset=True)
        logger.info(f"Processed update data for user {user_id}: {update_data}")
        
        updated_user = await user_crud.update(
            db,
            db_obj=user,
            obj_in=update_data
        )
        await db.commit()
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