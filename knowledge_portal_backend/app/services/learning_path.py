from typing import List, Optional, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.learning_path import LearningPath
from app.models.user import User
from app.models.video import Video
from app.models.skill import Skill
from app.schemas.learning_path import LearningPathCreate, LearningPathUpdate

class LearningPathService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get(self, learning_path_id: int) -> Optional[LearningPath]:
        """Get a learning path by ID."""
        query = select(LearningPath).where(LearningPath.id == learning_path_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_multi(self, skip: int = 0, limit: int = 10) -> List[LearningPath]:
        """Get multiple learning paths with pagination."""
        query = select(LearningPath).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def create(self, learning_path_in: LearningPathCreate) -> LearningPath:
        """Create a new learning path."""
        # Get videos and skills
        video_query = select(Video).where(Video.id.in_(learning_path_in.video_ids))
        skill_query = select(Skill).where(Skill.id.in_(learning_path_in.skill_ids))
        
        videos = (await self.db.execute(video_query)).scalars().all()
        skills = (await self.db.execute(skill_query)).scalars().all()

        # Create learning path
        db_obj = LearningPath(
            title=learning_path_in.title,
            description=learning_path_in.description,
            difficulty_level=learning_path_in.difficulty_level,
            estimated_hours=learning_path_in.estimated_hours,
            videos=videos,
            skills=skills,
        )
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def update(self, learning_path_id: int, learning_path_in: LearningPathUpdate) -> Optional[LearningPath]:
        """Update a learning path."""
        db_obj = await self.get(learning_path_id)
        if not db_obj:
            return None

        # Update basic fields
        update_data = learning_path_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field not in ["video_ids", "skill_ids"]:
                setattr(db_obj, field, value)

        # Update relationships if provided
        if learning_path_in.video_ids is not None:
            video_query = select(Video).where(Video.id.in_(learning_path_in.video_ids))
            videos = (await self.db.execute(video_query)).scalars().all()
            db_obj.videos = videos

        if learning_path_in.skill_ids is not None:
            skill_query = select(Skill).where(Skill.id.in_(learning_path_in.skill_ids))
            skills = (await self.db.execute(skill_query)).scalars().all()
            db_obj.skills = skills

        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj

    async def delete(self, learning_path_id: int) -> None:
        """Delete a learning path."""
        db_obj = await self.get(learning_path_id)
        if db_obj:
            await self.db.delete(db_obj)
            await self.db.commit()

    async def get_user(self, user_id: int) -> Optional[User]:
        """Get a user by ID."""
        query = select(User).where(User.id == user_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def generate_personalized_path(
        self,
        user_id: int,
        target_skills: List[str],
        duration_minutes: Optional[int] = None,
        difficulty_level: Optional[str] = None,
    ) -> LearningPath:
        """Generate a personalized learning path."""
        try:
            # Get user to check their skill level
            user_query = select(User).where(User.id == user_id)
            user_result = await self.db.execute(user_query)
            user = user_result.scalar_one_or_none()
            if not user:
                raise ValueError(f"User {user_id} not found")

            # Get videos matching the target skills and difficulty level
            video_query = select(Video).where(
                Video.skill_level == (difficulty_level or user.skill_level or 'beginner')
            )
            if target_skills:
                video_query = video_query.join(Video.skills).where(Skill.name.in_(target_skills))
            
            video_result = await self.db.execute(video_query)
            videos = video_result.scalars().all()

            if not videos:
                raise ValueError(f"No videos found for skills {target_skills} at level {difficulty_level}")

            # Calculate total duration and filter videos if needed
            total_duration = sum(v.duration for v in videos)
            if duration_minutes and total_duration > duration_minutes:
                # Filter videos to fit within time limit while maintaining skill coverage
                videos = sorted(videos, key=lambda v: v.duration)
                filtered_videos = []
                current_duration = 0
                for video in videos:
                    if current_duration + video.duration <= duration_minutes:
                        filtered_videos.append(video)
                        current_duration += video.duration
                videos = filtered_videos

            # Create learning path
            learning_path = LearningPath(
                user_id=user_id,
                title=f"Personalized Path: {', '.join(target_skills)}",
                description=f"Custom learning path for {user.username} focusing on {', '.join(target_skills)}",
                difficulty_level=difficulty_level or user.skill_level or 'beginner',
                estimated_hours=sum(v.duration for v in videos) / 60,  # Convert minutes to hours
                videos=videos
            )

            # Add to database
            self.db.add(learning_path)
            await self.db.commit()
            await self.db.refresh(learning_path)

            return learning_path

        except Exception as e:
            await self.db.rollback()
            raise ValueError(f"Failed to generate learning path: {str(e)}")

    async def get_user_progress(self, user_id: int, learning_path_id: int) -> Dict[str, Any]:
        """Get user's progress in a learning path."""
        # This is a placeholder implementation
        # In a real application, this would track user's progress through videos
        return {
            "completed_videos": 0,
            "percentage": 0,
            "estimated_remaining_time": 0,
        }

    async def enroll_user(self, user_id: int, learning_path_id: int) -> None:
        """Enroll a user in a learning path."""
        # This is a placeholder implementation
        # In a real application, this would create an enrollment record
        pass

    async def mark_video_completed(self, user_id: int, learning_path_id: int, video_id: int) -> None:
        """Mark a video as completed for a user in a learning path."""
        # This is a placeholder implementation
        # In a real application, this would track video completion
        pass 