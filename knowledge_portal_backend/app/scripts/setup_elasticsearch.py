import asyncio
import json
from sqlalchemy import select
from app.core.elasticsearch_client import es_client
from app.models.video import Video
from app.core.database import SessionLocal

async def setup_elasticsearch():
    # Initialize Elasticsearch client
    await es_client.init()
    
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

    # Create index
    try:
        if await es_client.es_client.indices.exists(index="videos"):
            await es_client.es_client.indices.delete(index="videos")
        await es_client.es_client.indices.create(index="videos", **mapping)
        print("Created videos index")
    except Exception as e:
        print(f"Error creating index: {e}")
        return

    # Get videos from database
    async with SessionLocal() as db:
        result = await db.execute(select(Video))
        videos = result.scalars().all()

        # Index videos
        for video in videos:
            try:
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
                print(f"Indexed video {video.id}")
            except Exception as e:
                print(f"Error indexing video {video.id}: {e}")

    print("Elasticsearch setup complete")

if __name__ == "__main__":
    asyncio.run(setup_elasticsearch()) 