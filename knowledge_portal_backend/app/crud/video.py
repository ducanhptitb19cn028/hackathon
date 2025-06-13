from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.crud.base import CRUDBase
from app.models.video import Video
from app.schemas.video import VideoCreate, VideoUpdate

class CRUDVideo(CRUDBase[Video, VideoCreate, VideoUpdate]):
    async def get_by_skill(self, db: AsyncSession, *, skill_name: str) -> List[Video]:
        """
        Get videos by skill name
        """
        stmt = (
            select(Video)
            .join(Video.skills)
            .where(Video.skills.any(name=skill_name))
            .options(selectinload(Video.skills))
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    async def get_by_difficulty(self, db: AsyncSession, *, difficulty_level: str) -> List[Video]:
        """
        Get videos by difficulty level
        """
        stmt = (
            select(Video)
            .where(Video.difficulty_level == difficulty_level)
            .options(selectinload(Video.skills))
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    async def get_by_skills_and_difficulty(
        self,
        db: AsyncSession,
        *,
        skill_names: List[str],
        difficulty_level: Optional[str] = None
    ) -> List[Video]:
        """
        Get videos by skill names and optionally by difficulty level
        """
        stmt = (
            select(Video)
            .join(Video.skills)
            .where(Video.skills.any(name=skill_names[0]))  # Start with first skill
        )

        # Add conditions for other skills
        for skill_name in skill_names[1:]:
            stmt = stmt.where(Video.skills.any(name=skill_name))

        # Add difficulty level filter if specified
        if difficulty_level:
            stmt = stmt.where(Video.difficulty_level == difficulty_level)

        # Load related skills
        stmt = stmt.options(selectinload(Video.skills))

        result = await db.execute(stmt)
        return result.scalars().all()

video_crud = CRUDVideo(Video) 