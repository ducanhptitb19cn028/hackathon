from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.videos import router as videos_router
from app.api.v1.endpoints.learning_paths import router as learning_paths_router
from app.api.v1.endpoints.quizzes import router as quizzes_router
from app.api.v1.endpoints.skills import router as skills_router
from app.api.v1.endpoints.tags import router as tags_router
from app.api.v1.endpoints.users import router as users_router

__all__ = [
    "auth_router",
    "videos_router",
    "learning_paths_router",
    "quizzes_router",
    "skills_router",
    "tags_router",
    "users_router"
] 