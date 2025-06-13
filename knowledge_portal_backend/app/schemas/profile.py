from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator

class ProfileUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    skill_level: Optional[str] = Field(None, description="One of: beginner, intermediate, advanced")
    interests: Optional[List[str]] = Field(None, description="List of interest strings", max_length=20)

    @field_validator('skill_level')
    def validate_skill_level(cls, v):
        if v is not None:
            allowed_levels = ['beginner', 'intermediate', 'advanced']
            if v.lower() not in allowed_levels:
                raise ValueError(f"skill_level must be one of: {', '.join(allowed_levels)}")
            return v.lower()
        return v

    @field_validator('interests')
    def validate_interests(cls, v):
        if v is not None:
            if not all(isinstance(i, str) for i in v):
                raise ValueError("all interests must be strings")
            if not all(1 <= len(i) <= 50 for i in v):
                raise ValueError("each interest must be between 1 and 50 characters")
            return v
        return v

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "email": "user@example.com",
                "username": "johndoe",
                "full_name": "John Doe",
                "skill_level": "intermediate",
                "interests": ["python", "web development", "machine learning"]
            }
        }
    } 