from app.core.settings.base import BaseAppSettings

class ProductionSettings(BaseAppSettings):
    # Database Settings
    POSTGRES_HOST: str
    POSTGRES_PORT: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_DATABASE_URL: str = None

    # Redis Settings
    REDIS_HOST: str
    REDIS_PORT: int
    REDIS_DB: int = 0
    REDIS_PASSWORD: str
    
    # Session Settings
    SESSION_SECRET_KEY: str
    SESSION_EXPIRE_MINUTES: int = 30  # Shorter session in production
    
    # Elasticsearch Settings
    ELASTICSEARCH_HOST: str
    ELASTICSEARCH_USERNAME: str
    ELASTICSEARCH_PASSWORD: str
    
    # Security Settings
    DEBUG: bool = False
    RELOAD: bool = False
    
    @property
    def get_postgres_url(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    class Config:
        env_file = ".env.production" 