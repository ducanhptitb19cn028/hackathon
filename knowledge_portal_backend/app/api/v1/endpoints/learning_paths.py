from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Security, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core import deps
from app.crud.learning_path import learning_path_crud
from app.crud.skill import skill_crud
from app.crud.video import video_crud
from app.models.user import User
from app.schemas.learning_path import (
    LearningPathCreate,
    LearningPathResponse,
    LearningPathUpdate,
    LearningPathGenerateRequest
)
from app.schemas.skill import SkillBase
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/", response_model=LearningPathResponse)
async def create_learning_path(
    learning_path: LearningPathCreate,
    current_user: User = Security(deps.get_current_active_user, scopes=[]),
    db: AsyncSession = Depends(deps.get_db)
) -> LearningPathResponse:
    """
    Create a new learning path.
    """
    learning_path.user_id = current_user.id
    return await learning_path_crud.create(db, obj_in=learning_path)

@router.get("/", response_model=List[LearningPathResponse])
async def list_learning_paths(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Security(deps.get_current_active_user, scopes=[]),
    db: AsyncSession = Depends(deps.get_db)
) -> List[LearningPathResponse]:
    """
    Retrieve all learning paths with pagination.
    """
    return await learning_path_crud.get_multi(db, skip=skip, limit=limit)

@router.get("/{learning_path_id}", response_model=LearningPathResponse)
async def get_learning_path(
    learning_path_id: int,
    current_user: User = Security(deps.get_current_active_user, scopes=[]),
    db: AsyncSession = Depends(deps.get_db)
) -> LearningPathResponse:
    """
    Get a specific learning path by ID.
    """
    learning_path = await learning_path_crud.get(db, id=learning_path_id)
    if not learning_path:
        raise HTTPException(status_code=404, detail="Learning path not found")
    return learning_path

@router.put("/{learning_path_id}", response_model=LearningPathResponse)
async def update_learning_path(
    learning_path_id: int,
    learning_path_update: LearningPathUpdate,
    current_user: User = Security(deps.get_current_active_user, scopes=[]),
    db: AsyncSession = Depends(deps.get_db)
) -> LearningPathResponse:
    """
    Update a learning path.
    """
    learning_path = await learning_path_crud.get(db, id=learning_path_id)
    if not learning_path:
        raise HTTPException(status_code=404, detail="Learning path not found")
    if learning_path.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return await learning_path_crud.update(db, db_obj=learning_path, obj_in=learning_path_update)

@router.delete("/{learning_path_id}")
async def delete_learning_path(
    learning_path_id: int,
    current_user: User = Security(deps.get_current_active_user, scopes=[]),
    db: AsyncSession = Depends(deps.get_db)
) -> dict:
    """
    Delete a learning path.
    """
    learning_path = await learning_path_crud.get(db, id=learning_path_id)
    if not learning_path:
        raise HTTPException(status_code=404, detail="Learning path not found")
    if learning_path.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    await learning_path_crud.remove(db, id=learning_path_id)
    return {"message": "Learning path deleted successfully"}

@router.post("/generate", response_model=LearningPathResponse)
async def generate_learning_path(
    request: LearningPathGenerateRequest,
    current_user: User = Security(deps.get_current_active_user, scopes=[]),
    db: AsyncSession = Depends(deps.get_db)
) -> LearningPathResponse:
    """
    Generate a personalized learning path based on selected skills.
    """
    try:
        logger.info(f"Generating learning path for user {current_user.id} with skills: {request.skills}")
        
        # Verify all skills exist and get skill objects
        skills = []
        for skill_name in request.skills:
            db_skill = await skill_crud.get_by_name(db, name=skill_name)
            if not db_skill:
                raise HTTPException(
                    status_code=404,
                    detail=f"Skill '{skill_name}' not found"
                )
            skills.append(SkillBase(name=db_skill.name))
        
        # Find relevant videos based on skills and difficulty level
        videos = await video_crud.get_by_skills_and_difficulty(
            db,
            skill_names=request.skills,
            difficulty_level=request.difficulty_level
        )
        
        if not videos:
            logger.warning(f"No videos found for skills {request.skills} and difficulty {request.difficulty_level}")
            # Try finding videos without difficulty constraint if none found
            if request.difficulty_level:
                videos = await video_crud.get_by_skills_and_difficulty(
                    db,
                    skill_names=request.skills,
                    difficulty_level=None
                )
        
        # Create learning path title and description
        title = f"Learning Path: {', '.join(request.skills)}"
        description = (
            f"Personalized learning path for {current_user.username} focusing on: {', '.join(request.skills)}. "
            f"Difficulty level: {request.difficulty_level or 'any'}. "
            f"Contains {len(videos)} relevant videos."
        )
        
        # Create learning path
        learning_path_in = LearningPathCreate(
            user_id=current_user.id,
            title=title,
            description=description,
            difficulty_level=request.difficulty_level,
            estimated_hours=request.max_duration_hours or sum(v.duration for v in videos) / 60,  # Convert minutes to hours
            skills=skills
        )
        
        # Create learning path with skills and videos
        learning_path = await learning_path_crud.create_with_skills_and_videos(
            db=db,
            obj_in=learning_path_in,
            skills=skills,
            videos=videos
        )
        
        logger.info(f"Successfully generated learning path {learning_path.id} for user {current_user.id} with {len(videos)} videos")
        return learning_path
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating learning path: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate learning path: {str(e)}"
        ) 