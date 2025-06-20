from datetime import datetime
from typing import Optional, List, Any

from pydantic import BaseModel, EmailStr, ConfigDict

# Shared properties
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    username: str
    is_active: Optional[bool] = True
    is_superuser: bool = False
    full_name: Optional[str] = None
    skill_level: Optional[str] = None  # beginner, intermediate, advanced
    interests: Optional[List[str]] = None  # List of user interests

# Properties to receive via API on creation
class UserCreate(UserBase):
    email: EmailStr
    password: str

# Properties to receive via API on update
class UserUpdate(UserBase):
    password: Optional[str] = None

# Properties for updating user profile specifically
class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    skill_level: Optional[str] = None
    interests: Optional[List[str]] = None

# Properties shared by models stored in DB
class UserInDBBase(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Additional properties to return via API
class User(UserInDBBase):
    pass

# Additional properties stored in DB
class UserInDB(UserInDBBase):
    hashed_password: str 