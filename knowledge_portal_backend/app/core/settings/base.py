from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, PostgresDsn

class BaseAppSettings(BaseSettings):
    # API Settings
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Knowledge Portal"
    VERSION: str = "1.0.0"
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []
    
    # Security
    SECRET_KEY: str = "your-secret-key-here"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    class Config:
        case_sensitive = True 