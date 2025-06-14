from typing import Any, Dict, Optional, Union, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.auth import UserCreate, UserResponse, UserProfileUpdate

class CRUDUser(CRUDBase[User, UserCreate, UserResponse]):
    async def get_by_email(self, db: AsyncSession, *, email: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_by_username(self, db: AsyncSession, *, username: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, *, obj_in: Dict[str, Any]) -> User:
        db_obj = User(**obj_in)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self,
        db: AsyncSession,
        *,
        db_obj: User,
        obj_in: Union[Dict[str, Any], UserResponse]
    ) -> User:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        return await super().update(db, db_obj=db_obj, obj_in=update_data)

    async def update_profile(
        self,
        db: AsyncSession,
        *,
        db_obj: User,
        profile_in: UserProfileUpdate
    ) -> User:
        """Update user profile fields (skill_level, interests, full_name)."""
        update_data = profile_in.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def verify_profile_columns(self, db: AsyncSession) -> Dict[str, bool]:
        """Verify that profile columns exist in the users table."""
        columns_to_check = ['skill_level', 'interests']
        result = {}
        
        for column in columns_to_check:
            try:
                query = text("""
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name = 'users' 
                    AND column_name = :column_name
                """)
                db_result = await db.execute(query, {"column_name": column})
                result[column] = db_result.scalar() is not None
            except Exception:
                result[column] = False
        
        return result

    async def ensure_profile_columns(self, db: AsyncSession) -> Dict[str, str]:
        """Ensure profile columns exist, create them if they don't."""
        results = {}
        
        try:
            # Add skill_level column if it doesn't exist
            await db.execute(text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'users' AND column_name = 'skill_level'
                    ) THEN
                        ALTER TABLE users ADD COLUMN skill_level VARCHAR;
                    END IF;
                END $$;
            """))
            results['skill_level'] = 'checked/added'
            
            # Add interests column if it doesn't exist
            await db.execute(text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'users' AND column_name = 'interests'
                    ) THEN
                        ALTER TABLE users ADD COLUMN interests JSONB;
                    END IF;
                END $$;
            """))
            results['interests'] = 'checked/added'
            
            await db.commit()
            
        except Exception as e:
            await db.rollback()
            results['error'] = str(e)
        
        return results

    async def is_active(self, user: User) -> bool:
        return user.is_active

    async def is_superuser(self, user: User) -> bool:
        return user.is_superuser


user_crud = CRUDUser(User) 