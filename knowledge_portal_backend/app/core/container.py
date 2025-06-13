from dependency_injector import containers, providers
from app.core.database import get_db
from app.core.redis_client import redis_client
from app.core.elasticsearch_client import es_client
from app.repositories.base import BaseRepository
from app.services.base import BaseService

class Container(containers.DeclarativeContainer):
    # Configuration
    wiring_config = containers.WiringConfiguration(
        modules=[
            "app.api.v1.endpoints.video_search",
            "app.api.v1.endpoints.learning_path",
            "app.api.v1.endpoints.quiz"
        ]
    )
    
    # Core Dependencies
    db = providers.Resource(get_db)
    redis = providers.Singleton(redis_client.init)
    elasticsearch = providers.Singleton(es_client.init)
    
    # Repositories
    video_repository = providers.Factory(
        BaseRepository,
        model=providers.Object("Video"),
        db=db
    )
    
    learning_path_repository = providers.Factory(
        BaseRepository,
        model=providers.Object("LearningPath"),
        db=db
    )
    
    quiz_repository = providers.Factory(
        BaseRepository,
        model=providers.Object("Quiz"),
        db=db
    )
    
    # Services
    video_service = providers.Factory(
        BaseService,
        repository=video_repository,
        cache_prefix="video"
    )
    
    learning_path_service = providers.Factory(
        BaseService,
        repository=learning_path_repository,
        cache_prefix="learning_path"
    )
    
    quiz_service = providers.Factory(
        BaseService,
        repository=quiz_repository,
        cache_prefix="quiz"
    ) 