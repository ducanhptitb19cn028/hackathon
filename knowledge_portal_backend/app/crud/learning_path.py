from typing import List, Optional, Union, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select

from app.crud.base import CRUDBase
from app.models.learning_path import LearningPath
from app.models.skill import Skill
from app.models.video import Video
from app.schemas.learning_path import LearningPathCreate, LearningPathUpdate
from app.schemas.skill import SkillBase


class CRUDLearningPath(CRUDBase[LearningPath, LearningPathCreate, LearningPathUpdate]):
    async def create_with_skills(
        self,
        db: AsyncSession,
        *,
        obj_in: LearningPathCreate,
        skills: List[SkillBase]
    ) -> LearningPath:
        """
        Create a new learning path with associated skills
        """
        # Get skill objects
        skill_names = [skill.name for skill in skills]
        stmt = select(Skill).where(Skill.name.in_(skill_names))
        result = await db.execute(stmt)
        db_skills = result.scalars().all()

        # Create learning path object
        db_obj = LearningPath(
            title=obj_in.title,
            description=obj_in.description,
            difficulty_level=obj_in.difficulty_level,
            estimated_hours=obj_in.estimated_hours,
            user_id=obj_in.user_id,
            skills=db_skills
        )
        
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def create_with_skills_and_videos(
        self,
        db: AsyncSession,
        *,
        obj_in: LearningPathCreate,
        skills: List[SkillBase],
        videos: List[Video]
    ) -> LearningPath:
        """
        Create a new learning path with associated skills and videos
        """
        # Get skill objects
        skill_names = [skill.name for skill in skills]
        stmt = select(Skill).where(Skill.name.in_(skill_names))
        result = await db.execute(stmt)
        db_skills = result.scalars().all()

        # Create learning path object
        db_obj = LearningPath(
            title=obj_in.title,
            description=obj_in.description,
            difficulty_level=obj_in.difficulty_level,
            estimated_hours=obj_in.estimated_hours,
            user_id=obj_in.user_id,
            skills=db_skills,
            videos=videos
        )
        
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_multi_by_user(
        self,
        db: AsyncSession,
        *,
        user_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[LearningPath]:
        """
        Get multiple learning paths by user ID
        """
        stmt = (
            select(self.model)
            .where(self.model.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .options(
                selectinload(self.model.skills),
                selectinload(self.model.videos)
            )
        )
        result = await db.execute(stmt)
        return result.scalars().all()


learning_path_crud = CRUDLearningPath(LearningPath) 