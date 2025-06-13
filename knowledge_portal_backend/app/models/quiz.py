from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON, Index
from sqlalchemy.orm import relationship

from app.core.database import Base

class Quiz(Base):
    __tablename__ = "quizzes"
    __table_args__ = (
        Index('ix_quizzes_video_difficulty', 'video_id', 'difficulty_level'),  # Composite index for faster lookups
    )

    id = Column(Integer, primary_key=True)
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(String(1000))
    difficulty_level = Column(String(20), nullable=False)
    questions = Column(JSON, nullable=False)  # Store questions as JSON
    passing_score = Column(Integer, nullable=False, default=70)
    time_limit = Column(Integer, nullable=False, default=30)  # in minutes
    created_at = Column(DateTime(timezone=False), nullable=False, default=datetime.utcnow)

    # Relationships with cascade
    video = relationship("Video", back_populates="quizzes")
    quiz_attempts = relationship(
        "QuizAttempt",
        back_populates="quiz",
        cascade="all, delete-orphan"  # Automatically delete related attempts when quiz is deleted
    ) 