import asyncio
import sys
import os
from pathlib import Path

# Add the parent directory to Python path
sys.path.append(str(Path(__file__).parent.parent.parent))

from app.core.elasticsearch_client import es_client
from app.models.video import Video
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings
from sqlalchemy.orm import selectinload

settings = get_settings()

async def setup_elasticsearch():
    # Create async engine
    engine = create_async_engine(
        str(settings.SQLALCHEMY_DATABASE_URI),
        echo=settings.DEBUG,
    )

    # Create async session
    async_session = sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

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
        # Initialize Elasticsearch client
        if not es_client.es_client:
            await es_client.init()
            print("Initialized Elasticsearch client")

        # Create or recreate index
        if await es_client.es_client.indices.exists(index="videos"):
            await es_client.es_client.indices.delete(index="videos")
            print("Deleted existing videos index")

        await es_client.es_client.indices.create(index="videos", **mapping)
        print("Created videos index")

        # Get videos from database with eager loading of relationships
        async with async_session() as session:
            stmt = select(Video).options(
                selectinload(Video.tags),
                selectinload(Video.skills)
            )
            result = await session.execute(stmt)
            videos = result.scalars().all()
            print(f"Found {len(videos)} videos in database")

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
                print(f"Indexed video {video.id}")

        print("Elasticsearch setup complete")

    except Exception as e:
        print(f"Error setting up Elasticsearch: {str(e)}")
        raise
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(setup_elasticsearch()) 