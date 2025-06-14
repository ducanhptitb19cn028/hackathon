from typing import Optional, List
from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional[dict] = None

class TokenRefresh(BaseModel):
    email: EmailStr
    refresh_token: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None

class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = True
    is_superuser: bool = False
    full_name: Optional[str] = None
    username: Optional[str] = None
    skill_level: Optional[str] = None  # beginner, intermediate, advanced
    interests: Optional[List[str]] = None  # List of user interests

class UserCreate(UserBase):
    email: EmailStr
    password: str
    username: str
    full_name: str

class UserUpdate(UserBase):
    password: Optional[str] = None

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    skill_level: Optional[str] = None
    interests: Optional[List[str]] = None

class UserInDBBase(UserBase):
    id: Optional[int] = None

    class Config:
        from_attributes = True

class User(UserInDBBase):
    pass

class UserInDB(UserInDBBase):
    hashed_password: str

class UserLogin(BaseModel):
    username: str
    password: str

class GoogleLogin(BaseModel):
    token: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    username: str
    full_name: str
    is_active: bool
    is_superuser: bool
    skill_level: Optional[str] = None
    interests: Optional[List[str]] = None

    class Config:
        from_attributes = True 