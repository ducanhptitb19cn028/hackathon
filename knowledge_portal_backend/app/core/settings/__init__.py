import os
from functools import lru_cache
from app.core.settings.development import DevelopmentSettings
from app.core.settings.production import ProductionSettings
from app.core.settings.test import TestSettings

environment = os.getenv("ENVIRONMENT", "development")

@lru_cache()
def get_settings():
    if environment == "production":
        return ProductionSettings()
    elif environment == "test":
        return TestSettings()
    return DevelopmentSettings()

settings = get_settings() 