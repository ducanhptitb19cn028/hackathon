from app.core.settings.base import BaseAppSettings

class TestSettings(BaseAppSettings):
    # Database Settings
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "knowledge_portal_test"
    POSTGRES_DATABASE_URL: str = None

    # Redis Settings
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 1  # Use different DB for testing
    REDIS_PASSWORD: str = None
    
    # Session Settings
    SESSION_SECRET_KEY: str = "test-session-key"
    SESSION_EXPIRE_MINUTES: int = 5  # Short expiry for testing
    
    # Elasticsearch Settings
    ELASTICSEARCH_HOST: str = "http://localhost:9200"
    ELASTICSEARCH_USERNAME: str = None
    ELASTICSEARCH_PASSWORD: str = None
    
    # Test Settings
    DEBUG: bool = True
    TESTING: bool = True
    
    @property
    def get_postgres_url(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    class Config:
        env_file = ".env.test" 