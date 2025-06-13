from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.skill import SkillBase
from app.schemas.video import Video

# Shared properties
class LearningPathBase(BaseModel):
    title: str
    description: Optional[str] = None
    difficulty_level: Optional[str] = "beginner"
    estimated_hours: Optional[int] = 0

# Properties to receive on item creation
class LearningPathCreate(LearningPathBase):
    user_id: int
    skills: List[SkillBase]

# Properties to receive on item update
class LearningPathUpdate(LearningPathBase):
    skills: Optional[List[SkillBase]] = None

# Properties for learning path generation request
class LearningPathGenerateRequest(BaseModel):
    skills: List[str] = Field(..., description="List of skill names to generate a learning path for")
    difficulty_level: Optional[str] = Field("beginner", description="Desired difficulty level (beginner, intermediate, advanced)")
    max_duration_hours: Optional[int] = Field(None, description="Maximum duration in hours", ge=1, le=100)

# Properties shared by models stored in DB
class LearningPathInDBBase(LearningPathBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Properties to return to client
class LearningPath(LearningPathInDBBase):
    videos: List[Video] = []
    skills: List[SkillBase] = []

    model_config = ConfigDict(from_attributes=True)

# Response model for API endpoints
class LearningPathResponse(LearningPath):
    pass 