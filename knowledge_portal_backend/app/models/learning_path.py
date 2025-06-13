from datetime import datetime
from typing import List

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.associations import learning_path_video, learning_path_skill

class LearningPath(Base):
    __tablename__ = "learning_paths"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    difficulty_level = Column(String, default="beginner")  # beginner, intermediate, advanced
    estimated_hours = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))

    # Relationships
    videos = relationship("Video", secondary=learning_path_video, back_populates="learning_paths")
    skills = relationship("Skill", secondary=learning_path_skill, back_populates="learning_paths")
    user = relationship("User", back_populates="learning_paths") 