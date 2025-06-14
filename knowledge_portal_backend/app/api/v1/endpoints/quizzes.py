from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.redis_client import redis_client
from app.core.elasticsearch_client import es_client
from app.core.deps import get_db
from app.models.quiz import Quiz as QuizModel
from app.models.quiz_attempt import QuizAttempt
from datetime import datetime
import logging
import json
from app.schemas.quiz import Quiz, QuizRequest, QuizQuestion
from app.models.video import Video

router = APIRouter()
logger = logging.getLogger(__name__)

def datetime_handler(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

class QuizQuestion(BaseModel):
    id: str
    question: str
    options: List[str]
    correct_answer: int
    explanation: str

class Quiz(BaseModel):
    id: str
    title: str
    description: str
    video_id: str
    difficulty_level: str
    questions: List[QuizQuestion]
    passing_score: int
    time_limit: int  # in minutes

class QuizRequest(BaseModel):
    video_id: str
    difficulty_level: Optional[str] = "medium"
    num_questions: Optional[int] = 5

class QuizSubmission(BaseModel):
    quiz_id: str
    answers: List[int]
    user_id: str
    submitted_at: Optional[datetime] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class QuizResult(BaseModel):
    quiz_id: str
    user_id: str
    score: int
    passed: bool
    correct_answers: List[bool]
    explanations: List[str]
    submitted_at: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class QuizListResponse(BaseModel):
    id: int
    title: str
    description: str
    video_id: int
    difficulty_level: str
    passing_score: int
    time_limit: int

@router.get("/available", response_model=List[QuizListResponse])
async def list_available_quizzes(
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
) -> List[QuizListResponse]:
    """
    List all available quizzes with pagination.
    """
    # Try to get cached quizzes
    cache_key = f"available_quizzes:{skip}:{limit}"
    cached_quizzes = await redis_client.get_json(cache_key)
    
    if cached_quizzes:
        return cached_quizzes
    
    try:
        # Query all quizzes with pagination
        query = select(QuizModel).offset(skip).limit(limit)
        result = await db.execute(query)
        quizzes = result.scalars().all()
        
        # Convert to response model
        quiz_list = [
            QuizListResponse(
                id=quiz.id,
                title=quiz.title,
                description=quiz.description,
                video_id=quiz.video_id,
                difficulty_level=quiz.difficulty_level,
                passing_score=quiz.passing_score,
                time_limit=quiz.time_limit
            )
            for quiz in quizzes
        ]
        
        # Cache the results for 5 minutes
        await redis_client.set_json(cache_key, [quiz.dict() for quiz in quiz_list], expire=300)
        
        return quiz_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{quiz_id}", response_model=Quiz)
async def get_quiz_by_id(quiz_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get a specific quiz by its ID.
    """
    logger.info(f"Fetching quiz with ID: {quiz_id}")
    
    # Try to get cached quiz first
    cache_key = f"quiz:{quiz_id}"
    cached_quiz = await redis_client.get_json(cache_key)
    
    if cached_quiz:
        logger.info(f"Found cached quiz with ID: {quiz_id}")
        return Quiz(**cached_quiz)
    
    try:
        # Query quiz from database
        query = select(QuizModel).where(QuizModel.id == quiz_id)
        result = await db.execute(query)
        quiz_db = result.scalar_one_or_none()
        
        if not quiz_db:
            logger.error(f"Quiz with ID {quiz_id} not found")
            raise HTTPException(
                status_code=404,
                detail=f"Quiz with ID {quiz_id} not found"
            )
        
        # Convert database model to response type
        quiz = Quiz(
            id=str(quiz_db.id),
            title=quiz_db.title,
            description=quiz_db.description,
            video_id=str(quiz_db.video_id),
            difficulty_level=quiz_db.difficulty_level,
            questions=[QuizQuestion(**q) for q in quiz_db.questions],
            passing_score=quiz_db.passing_score,
            time_limit=quiz_db.time_limit
        )
        
        # Cache the quiz for 1 hour
        await redis_client.set_json(cache_key, quiz.dict(), expire=3600)
        logger.info(f"Cached quiz with ID: {quiz_id}")
        
        return quiz
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching quiz {quiz_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching quiz: {str(e)}"
        )

@router.post("/generate", response_model=Quiz)
async def generate_quiz(request: QuizRequest, db: AsyncSession = Depends(get_db)):
    """
    Generate a quiz for a specific video.
    """
    logger.info(f"Generating quiz for video_id: {request.video_id}, difficulty: {request.difficulty_level}")
    
    try:
        # Check if quiz already exists in database
        try:
            video_id_int = int(request.video_id)
            logger.info(f"Converted video_id to integer: {video_id_int}")
        except ValueError:
            logger.error(f"Invalid video_id format: {request.video_id}")
            raise HTTPException(
                status_code=400,
                detail="video_id must be an integer"
            )
        
        # Check if video exists
        video_query = select(Video).where(Video.id == video_id_int)
        video_result = await db.execute(video_query)
        video = video_result.scalar_one_or_none()
        
        if not video:
            logger.error(f"Video with ID {video_id_int} not found")
            raise HTTPException(
                status_code=404,
                detail=f"Video with ID {video_id_int} not found"
            )
        
        existing_quiz_query = select(QuizModel).where(
            (QuizModel.video_id == video_id_int) &
            (QuizModel.difficulty_level == request.difficulty_level)
        )
        logger.info(f"Checking for existing quiz with video_id={video_id_int} and difficulty={request.difficulty_level}")
        
        try:
            existing_quiz = await db.execute(existing_quiz_query)
            db_quiz = existing_quiz.scalar_one_or_none()
            
            if db_quiz:
                logger.info(f"Found existing quiz in database with ID: {db_quiz.id}")
                # Convert database model to response type
                quiz = Quiz(
                    id=str(db_quiz.id),
                    title=db_quiz.title,
                    description=db_quiz.description,
                    video_id=str(db_quiz.video_id),
                    difficulty_level=db_quiz.difficulty_level,
                    questions=[QuizQuestion(**q) for q in db_quiz.questions],  # Convert dict to QuizQuestion objects
                    passing_score=db_quiz.passing_score,
                    time_limit=db_quiz.time_limit
                )
                return quiz
        except Exception as e:
            logger.error(f"Error checking for existing quiz: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Database error while checking for existing quiz: {str(e)}"
            )
        
        logger.info("No existing quiz found, generating new quiz")
        
        # Generate quiz questions (simplified version)
        questions = []
        for i in range(request.num_questions):
            question = QuizQuestion(
                id=f"q_{i+1}",
                question=f"Question {i+1} about video {video_id_int}",
                options=[
                    f"Option 1 for question {i+1}",
                    f"Option 2 for question {i+1}",
                    f"Option 3 for question {i+1}",
                    f"Option 4 for question {i+1}"
                ],
                correct_answer=0,
                explanation=f"Explanation for question {i+1}"
            )
            questions.append(question)
        
        logger.info(f"Generated {len(questions)} questions")
        
        # Create quiz in database
        try:
            # Convert questions to JSON format - use dict() method to convert Pydantic models to dictionaries
            questions_json = [q.dict() for q in questions]
            
            # Create the quiz model
            new_quiz = QuizModel(
                video_id=video_id_int,
                title=f"Quiz for Video {video_id_int}",
                description=f"Test your knowledge of Video {video_id_int}",
                difficulty_level=request.difficulty_level,
                questions=questions_json,  # Store as JSON-compatible dictionaries
                passing_score=70,
                time_limit=30
            )
            
            logger.info("Created new quiz model, attempting to save to database")
            
            # Add and commit to database
            db.add(new_quiz)
            await db.commit()
            await db.refresh(new_quiz)
            
            logger.info(f"Successfully saved quiz to database with ID: {new_quiz.id}")
            
            # Create response quiz object - use the original QuizQuestion objects
            quiz = Quiz(
                id=str(new_quiz.id),
                title=new_quiz.title,
                description=new_quiz.description,
                video_id=str(new_quiz.video_id),
                difficulty_level=new_quiz.difficulty_level,
                questions=questions,  # Use the original QuizQuestion objects
                passing_score=new_quiz.passing_score,
                time_limit=new_quiz.time_limit
            )
            
            # Cache the quiz
            cache_key = f"quiz:{new_quiz.id}"
            await redis_client.set_json(cache_key, quiz.dict(), expire=86400)
            logger.info(f"Cached quiz with ID: {new_quiz.id}")
            
            return quiz
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to save quiz to database: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save quiz to database: {str(e)}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate quiz: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate quiz: {str(e)}"
        )

@router.post("/submit")
async def submit_quiz(submission: QuizSubmission, db: AsyncSession = Depends(get_db)):
    """
    Submit a quiz attempt and get the results.
    """
    logger.info(f"Processing quiz submission for quiz_id: {submission.quiz_id}")
    
    try:
        # Try to get quiz directly from database first
        try:
            quiz_id_int = int(submission.quiz_id)
            logger.info(f"Looking up quiz by ID: {quiz_id_int}")
            quiz_query = select(QuizModel).where(QuizModel.id == quiz_id_int)
        except ValueError:
            logger.info(f"Quiz ID {submission.quiz_id} is not an integer, trying video_id lookup")
            # Handle old format ID (quiz_video_id_difficulty)
            if submission.quiz_id.startswith('quiz_'):
                parts = submission.quiz_id.split('_')
                if len(parts) >= 3:
                    try:
                        video_id = int(parts[1])
                        difficulty = parts[2]
                        logger.info(f"Looking up quiz by video_id: {video_id} and difficulty: {difficulty}")
                        quiz_query = select(QuizModel).where(
                            (QuizModel.video_id == video_id) &
                            (QuizModel.difficulty_level == difficulty)
                        )
                    except ValueError:
                        logger.error(f"Failed to parse video_id from quiz_id: {submission.quiz_id}")
                        raise HTTPException(
                            status_code=400,
                            detail="Invalid quiz ID format: video_id must be an integer"
                        )
                else:
                    logger.error(f"Invalid quiz ID format: {submission.quiz_id}")
                    raise HTTPException(
                        status_code=400,
                        detail="Invalid quiz ID format"
                    )
            else:
                logger.error(f"Invalid quiz ID format: {submission.quiz_id}")
                raise HTTPException(
                    status_code=400,
                    detail="Invalid quiz ID format"
                )
        
        # Execute query
        try:
            quiz_result = await db.execute(quiz_query)
            quiz_db = quiz_result.scalar_one_or_none()
            
            if not quiz_db:
                logger.error(f"Quiz not found in database: {submission.quiz_id}")
                raise HTTPException(
                    status_code=404,
                    detail="Quiz not found"
                )
            
            logger.info(f"Found quiz in database with ID: {quiz_db.id}")
            
        except Exception as e:
            logger.error(f"Database error while looking up quiz: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Database error: {str(e)}"
            )
        
        # Convert database model to Quiz type
        quiz = Quiz(
            id=str(quiz_db.id),
            title=quiz_db.title,
            description=quiz_db.description,
            video_id=str(quiz_db.video_id),
            difficulty_level=quiz_db.difficulty_level,
            questions=[QuizQuestion(**q) for q in quiz_db.questions],  # Convert dict to QuizQuestion objects
            passing_score=quiz_db.passing_score,
            time_limit=quiz_db.time_limit
        )
        
        if len(submission.answers) != len(quiz.questions):
            logger.error(f"Answer count mismatch. Expected {len(quiz.questions)}, got {len(submission.answers)}")
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid number of answers. Expected {len(quiz.questions)}, got {len(submission.answers)}"
            )
        
        # Calculate results
        correct_answers = []
        explanations = []
        score = 0
        
        for i, (answer, question) in enumerate(zip(submission.answers, quiz.questions)):
            is_correct = answer == question.correct_answer  # Use object attribute access
            correct_answers.append(is_correct)
            explanations.append(question.explanation)  # Use object attribute access
            if is_correct:
                score += 100 / len(quiz.questions)
        
        score = int(score)
        passed = score >= quiz.passing_score
        submitted_at = datetime.utcnow()  # Use naive datetime for database
        
        # Try to convert user_id to integer
        try:
            user_id = int(submission.user_id)
        except ValueError:
            logger.error(f"Invalid user_id format: {submission.user_id}")
            raise HTTPException(
                status_code=400,
                detail="Invalid user ID format. Expected an integer."
            )
        
        # Create quiz attempt record
        try:
            # Convert answers to a format that can be stored in JSON
            answers_json = [int(answer) for answer in submission.answers]
            
            # Create the quiz attempt
            quiz_attempt = QuizAttempt(
                quiz_id=quiz_db.id,
                user_id=user_id,
                answers=answers_json,  # Store as a simple array of integers
                score=score,
                completed=True,
                started_at=submitted_at,  # Use naive datetime
                completed_at=submitted_at  # Use naive datetime
            )
            
            # Add and commit to database
            db.add(quiz_attempt)
            await db.commit()
            await db.refresh(quiz_attempt)
            logger.info(f"Saved quiz attempt for quiz {quiz_db.id}, user {user_id}, score {score}")
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Failed to save quiz attempt: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save quiz attempt: {str(e)}"
            )
        
        result = QuizResult(
            quiz_id=str(quiz_db.id),
            user_id=str(user_id),
            score=score,
            passed=passed,
            correct_answers=correct_answers,
            explanations=explanations,
            submitted_at=submitted_at
        )
        
        # Cache result
        result_cache_key = f"quiz_result:{quiz_db.id}:{user_id}:{quiz_attempt.id}"
        result_dict = result.dict()
        await redis_client.set_json(result_cache_key, json.dumps(result_dict, default=datetime_handler), expire=86400)
        logger.info(f"Cached quiz result for quiz {quiz_db.id}, user {user_id}, attempt {quiz_attempt.id}")
        
        # Return JSON response with properly serialized datetime
        return JSONResponse(content=json.loads(json.dumps(result_dict, default=datetime_handler)))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing quiz submission: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 