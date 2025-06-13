from datetime import datetime
from typing import Optional

from pydantic import BaseModel, HttpUrl, ConfigDict

# Shared properties
class VideoBase(BaseModel):
    title: str
    description: Optional[str] = None
    url: HttpUrl
    duration: float
    thumbnail_url: Optional[HttpUrl] = None

# Properties to receive on item creation
class VideoCreate(VideoBase):
    pass

# Properties to receive on item update
class VideoUpdate(VideoBase):
    pass

# Properties shared by models stored in DB
class VideoInDBBase(VideoBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Properties to return to client
class Video(VideoInDBBase):
    pass 