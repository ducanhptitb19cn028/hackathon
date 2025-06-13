from typing import AsyncGenerator, Optional
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
from jose import JWTError, jwt
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import async_session
from app.core.security import ALGORITHM
from app.crud.user import user_crud
from app.models.user import User
from app.schemas.token import TokenPayload


reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    scopes={"admin": "Admin access", "user": "User access"}
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency function that yields db sessions
    """
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_current_user(
    security_scopes: SecurityScopes,
    db: AsyncSession = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> User:
    """
    Get the current user based on the JWT token
    """
    if security_scopes.scopes:
        authenticate_value = f'Bearer scope="{security_scopes.scope_str}"'
    else:
        authenticate_value = "Bearer"

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": authenticate_value},
    )

    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY.get_secret_value(), algorithms=[ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        if not token_data.sub:
            raise credentials_exception
    except (JWTError, ValidationError):
        raise credentials_exception

    user = await user_crud.get_by_email(db, email=token_data.sub)
    if not user:
        raise credentials_exception

    # Verify user has required scopes
    for scope in security_scopes.scopes:
        if scope == "admin" and not user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions",
                headers={"WWW-Authenticate": authenticate_value},
            )

    return user


async def get_current_active_user(
    current_user: User = Security(get_current_user, scopes=[])
) -> User:
    """
    Get the current active user
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_current_active_superuser(
    current_user: User = Security(get_current_user, scopes=["admin"])
) -> User:
    """
    Get the current active superuser
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges"
        )
    return current_user 