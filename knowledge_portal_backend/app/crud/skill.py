from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.skill import Skill
from app.schemas.skill import SkillCreate, SkillUpdate


class CRUDSkill(CRUDBase[Skill, SkillCreate, SkillUpdate]):
    async def get_by_name(
        self,
        db: AsyncSession,
        *,
        name: str
    ) -> Optional[Skill]:
        """
        Get a skill by name
        """
        stmt = select(self.model).where(self.model.name == name)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()


skill_crud = CRUDSkill(Skill) 