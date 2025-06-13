from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

# Shared properties
class SkillBase(BaseModel):
    name: str
    description: Optional[str] = None

# Properties to receive on item creation
class SkillCreate(SkillBase):
    pass

# Properties to receive on item update
class SkillUpdate(SkillBase):
    pass

# Properties shared by models stored in DB
class SkillInDBBase(SkillBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Properties to return to client
class Skill(SkillInDBBase):
    pass 