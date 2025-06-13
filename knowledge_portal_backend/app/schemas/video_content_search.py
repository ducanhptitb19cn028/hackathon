from typing import List, Optional
from pydantic import BaseModel

class VideoSearchResult(BaseModel):
    id: str
    type: str
    similarity: float
    text: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    speaker: Optional[str] = None

class VideoSearchResponse(BaseModel):
    results: List[VideoSearchResult]

class VideoContentSearchQuery(BaseModel):
    query: str 