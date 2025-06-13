from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.associations import video_skills, learning_path_skill

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    videos = relationship("Video", secondary=video_skills, back_populates="skills")
    learning_paths = relationship("LearningPath", secondary=learning_path_skill, back_populates="skills") 