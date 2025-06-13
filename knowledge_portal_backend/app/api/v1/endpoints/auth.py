from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Security, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from google.oauth2 import id_token
from google.auth.transport import requests
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
import secrets
import logging

from app.core.config import settings
from app.core.security import create_access_token, verify_password, get_password_hash
from app.core import deps
from app.schemas.auth import Token, UserCreate, UserResponse, GoogleLogin, UserLogin, TokenRefresh
from app.crud.user import user_crud
from app.models.user import User

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")
logger = logging.getLogger(__name__)

@router.post("/login", response_model=Token)
async def login(
    db: AsyncSession = Depends(deps.get_db),
    username: str = Form(...),  # OAuth2 spec uses 'username' for the identifier
    password: str = Form(...),
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    try:
        user = await user_crud.get_by_email(db, email=username)
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        elif not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Inactive user"
            )

        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error for user {username}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during login"
        )

@router.post("/register", response_model=UserResponse)
async def register(
    *,
    db: AsyncSession = Depends(deps.get_db),
    user_in: UserCreate,
) -> Any:
    """
    Create new user.
    """
    user = await user_crud.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    user = await user_crud.create(
        db,
        obj_in={
            **user_in.model_dump(),
            "hashed_password": get_password_hash(user_in.password),
        }
    )
    return user

@router.post("/google/login", response_model=Token)
async def google_login(
    *,
    db: AsyncSession = Depends(deps.get_db),
    google_data: GoogleLogin,
) -> Any:
    """
    Google OAuth2 login endpoint.
    """
    try:
        # Create a Request object for the token verification
        request = requests.Request()

        # Verify the token with Google
        try:
            idinfo = id_token.verify_oauth2_token(
                google_data.token,
                request,
                settings.GOOGLE_CLIENT_ID,
                clock_skew_in_seconds=10
            )
        except ValueError as e:
            logger.error(f"Google token verification failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid Google token: {str(e)}"
            )

        # Get the user's email from the verified token
        email = idinfo.get('email')
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not found in Google token"
            )
        
        # Verify email is verified by Google
        if not idinfo.get('email_verified', False):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email not verified by Google"
            )

        # Get or create user
        user = await user_crud.get_by_email(db, email=email)

        if not user:
            # Create new user if not exists
            try:
                user = await user_crud.create(
                    db,
                    obj_in={
                        "email": email,
                        "username": idinfo.get('name', email.split('@')[0]),
                        "full_name": idinfo.get('name', ''),
                        "hashed_password": get_password_hash(secrets.token_urlsafe(32)),
                        "is_active": True,
                    }
                )
            except Exception as e:
                logger.error(f"Failed to create user: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create user account"
                )
        elif not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Inactive user"
            )

        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": email}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during Google login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during login"
        )

@router.get("/me", response_model=UserResponse)
async def read_users_me(
    current_user: User = Security(deps.get_current_active_user, scopes=[])
) -> Any:
    """
    Get current user.
    """
    return current_user 

@router.post("/refresh", response_model=Token)
async def refresh_token(
    *,
    db: AsyncSession = Depends(deps.get_db),
    refresh_data: TokenRefresh,
) -> Any:
    """
    Refresh access token using refresh token.
    """
    try:
        # Verify the refresh token and get user
        user = await user_crud.get_by_email(db, email=refresh_data.email)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token or inactive user"
            )

        # Create new access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate refresh token"
        ) 