from typing import List, Optional
from pydantic import BaseModel, Field

class QuizQuestion(BaseModel):
    id: str
    question: str
    options: List[str]
    correct_answer: int
    explanation: str

class QuizBase(BaseModel):
    title: str
    description: str
    video_id: str
    difficulty_level: str
    questions: List[QuizQuestion]
    passing_score: int = Field(default=70, ge=0, le=100)
    time_limit: int = Field(default=30, ge=1)  # in minutes

class QuizCreate(QuizBase):
    pass

class Quiz(QuizBase):
    id: str

    class Config:
        from_attributes = True

class QuizRequest(BaseModel):
    video_id: str
    difficulty_level: str = "medium"
    num_questions: int = Field(default=5, ge=1, le=20) 