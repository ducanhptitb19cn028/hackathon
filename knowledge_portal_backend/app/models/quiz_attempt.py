from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON, Boolean, Index
from sqlalchemy.orm import relationship

from app.core.database import Base

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    __table_args__ = (
        Index('ix_quiz_attempts_user', 'user_id'),  # Index for user lookups
        Index('ix_quiz_attempts_quiz_user', 'quiz_id', 'user_id'),  # Composite index for quiz+user lookups
    )

    id = Column(Integer, primary_key=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    answers = Column(JSON, nullable=False)  # Store answers as JSON array of integers
    score = Column(Integer, nullable=False, default=0)
    completed = Column(Boolean, nullable=False, default=False)
    started_at = Column(DateTime(timezone=False), nullable=False, default=datetime.utcnow)
    completed_at = Column(DateTime(timezone=False))

    # Relationships
    quiz = relationship("Quiz", back_populates="quiz_attempts")
    user = relationship("User", back_populates="quiz_attempts") 