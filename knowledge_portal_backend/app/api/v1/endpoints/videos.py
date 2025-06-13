from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core import deps
from app.core.elasticsearch_client import es_client
from app.models.video import Video
from sqlalchemy import select
from app.schemas.video import VideoCreate

router = APIRouter()

@router.post("/test-video")
async def create_test_video(db: AsyncSession = Depends(deps.get_db)):
    """
    Create a test video for development purposes.
    """
    # Check if test video already exists
    video_query = select(Video).where(Video.id == 12)
    result = await db.execute(video_query)
    existing_video = result.scalar_one_or_none()
    
    if existing_video:
        return {"message": "Test video already exists", "video_id": existing_video.id}
    
    # Create test video
    test_video = Video(
        id=12,  # Use the ID that was requested
        title="Test Video",
        description="This is a test video for development purposes",
        url="https://example.com/test-video",
        duration=10.0,
        thumbnail_url="https://example.com/thumbnail.jpg",
        category="test",
        difficulty_level="medium",
        transcript="This is a test video transcript."
    )
    
    db.add(test_video)
    await db.commit()
    await db.refresh(test_video)
    
    return {"message": "Test video created", "video_id": test_video.id}

@router.post("/setup-index")
async def setup_video_index(db: AsyncSession = Depends(deps.get_db)):
    """
    Set up Elasticsearch index for videos and populate it with data from the database.
    """
    # Define index mapping
    mapping = {
        "mappings": {
            "properties": {
                "id": {"type": "keyword"},
                "title": {
                    "type": "text",
                    "analyzer": "standard",
                    "fields": {
                        "keyword": {"type": "keyword"}
                    }
                },
                "description": {"type": "text", "analyzer": "standard"},
                "url": {"type": "keyword"},
                "duration": {"type": "float"},
                "thumbnail_url": {"type": "keyword"},
                "category": {"type": "keyword"},
                "difficulty_level": {"type": "keyword"},
                "transcript": {"type": "text", "analyzer": "standard"},
                "tags": {"type": "keyword"},
                "skills": {"type": "keyword"},
                "created_at": {"type": "date"},
                "updated_at": {"type": "date"}
            }
        },
        "settings": {
            "number_of_shards": 1,
            "number_of_replicas": 0,
            "analysis": {
                "analyzer": {
                    "standard": {
                        "type": "standard",
                        "stopwords": "_english_"
                    }
                }
            }
        }
    }

    try:
        # Initialize Elasticsearch client if not already initialized
        if not es_client.es_client:
            await es_client.init()

        # Create or recreate index
        if await es_client.es_client.indices.exists(index="videos"):
            await es_client.es_client.indices.delete(index="videos")
        await es_client.es_client.indices.create(index="videos", **mapping)

        # Get videos from database
        result = await db.execute(select(Video))
        videos = result.scalars().all()

        # Index videos
        for video in videos:
            doc = {
                "id": video.id,
                "title": video.title,
                "description": video.description,
                "url": str(video.url),
                "duration": video.duration,
                "thumbnail_url": str(video.thumbnail_url) if video.thumbnail_url else None,
                "category": video.category,
                "difficulty_level": video.difficulty_level,
                "transcript": video.transcript,
                "tags": [tag.name for tag in video.tags],
                "skills": [skill.name for skill in video.skills],
                "created_at": video.created_at.isoformat(),
                "updated_at": video.updated_at.isoformat()
            }
            await es_client.index_document("videos", doc, str(video.id))

        return {"message": "Video index created and populated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error setting up video index: {str(e)}") 