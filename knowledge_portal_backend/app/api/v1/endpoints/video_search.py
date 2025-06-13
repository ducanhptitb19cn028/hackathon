from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.core.redis_client import redis_client
from app.core.elasticsearch_client import es_client
import json

router = APIRouter()

class VideoSearchQuery(BaseModel):
    query: str
    page: int = 1
    per_page: int = 10

class VideoResponse(BaseModel):
    id: str
    title: str
    description: str
    url: str
    duration: int
    category: str
    difficulty_level: str
    tags: List[str]
    skills: List[str]

@router.post("/search", response_model=List[VideoResponse])
async def search_videos(search_query: VideoSearchQuery):
    # Try to get cached results
    cache_key = f"video_search:{search_query.query}:{search_query.page}"
    cached_results = await redis_client.get_json(cache_key)
    
    if cached_results:
        return cached_results
    
    # Prepare Elasticsearch query
    query = {
        "from": (search_query.page - 1) * search_query.per_page,
        "size": search_query.per_page,
        "query": {
            "multi_match": {
                "query": search_query.query,
                "fields": [
                    "title^3",
                    "description^2",
                    "tags^2",
                    "skills^2",
                    "category",
                    "transcript"
                ],
                "type": "most_fields",
                "fuzziness": "AUTO"
            }
        },
        "sort": [
            "_score"
        ]
    }
    
    try:
        # Initialize Elasticsearch client if not already initialized
        if not es_client.es_client:
            await es_client.init()
            
        # Search in Elasticsearch
        search_results = await es_client.search("videos", query)
        
        # Process results
        videos = []
        for hit in search_results["hits"]["hits"]:
            source = hit["_source"]
            video = VideoResponse(
                id=hit["_id"],
                title=source["title"],
                description=source["description"],
                url=source["url"],
                duration=source["duration"],
                category=source["category"],
                difficulty_level=source["difficulty_level"],
                tags=source["tags"],
                skills=source["skills"]
            )
            videos.append(video)
        
        # Cache results for 5 minutes
        await redis_client.set_json(cache_key, [video.dict() for video in videos], expire=300)
        
        return videos
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Index mapping setup endpoint
@router.post("/setup-index")
async def setup_video_index():
    mapping = {
        "properties": {
            "title": {"type": "text", "analyzer": "standard"},
            "description": {"type": "text", "analyzer": "standard"},
            "url": {"type": "keyword"},
            "duration": {"type": "integer"},
            "category": {"type": "keyword"},
            "difficulty_level": {"type": "keyword"},
            "tags": {"type": "keyword"},
            "skills": {"type": "keyword"},
            "transcript": {"type": "text", "analyzer": "standard"},
            "created_at": {"type": "date"},
            "updated_at": {"type": "date"}
        }
    }
    
    try:
        # Initialize Elasticsearch client if not already initialized
        if not es_client.es_client:
            await es_client.init()
            
        await es_client.create_index("videos", mapping)
        return {"message": "Video index created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 