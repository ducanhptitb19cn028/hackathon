from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth_router,
    videos_router,
    learning_paths_router,
    quizzes_router,
    skills_router,
    tags_router,
    users_router
)
from app.api.v1.endpoints.video_content_search import router as video_content_search_router
from app.api.v1.endpoints.video_search import router as video_search_router

api_router = APIRouter()

# Mount all routers
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(videos_router, prefix="/videos", tags=["videos"])
api_router.include_router(learning_paths_router, prefix="/learning-paths", tags=["learning-paths"])
api_router.include_router(quizzes_router, prefix="/quizzes", tags=["quizzes"])
api_router.include_router(skills_router, prefix="/skills", tags=["skills"])
api_router.include_router(tags_router, prefix="/tags", tags=["tags"])
api_router.include_router(video_content_search_router, prefix="/video-content-search", tags=["video content search"])
api_router.include_router(video_search_router, prefix="/video-search", tags=["video search"]) 