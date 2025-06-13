from datetime import datetime
from typing import List

from sqlalchemy import Column, Integer, String, DateTime, Text, Float
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.associations import video_tags, video_skills, learning_path_video

class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    url = Column(String, unique=True)
    duration = Column(Float)  # in minutes
    thumbnail_url = Column(String)
    category = Column(String, index=True)
    difficulty_level = Column(String)
    transcript = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    learning_paths = relationship("LearningPath", secondary=learning_path_video, back_populates="videos")
    tags = relationship("Tag", secondary=video_tags, back_populates="videos")
    skills = relationship("Skill", secondary=video_skills, back_populates="videos")
    quizzes = relationship("Quiz", back_populates="video") 