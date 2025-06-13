from fastapi import APIRouter, HTTPException
from app.core.redis_client import redis_client
from app.schemas.video_content_search import VideoContentSearchQuery, VideoSearchResponse
from app.services.video_content_search import video_content_search_service
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/query", response_model=VideoSearchResponse)
async def search_video_content(search_query: VideoContentSearchQuery):
    """
    Search video content using the video content search service.
    """
    try:
        logger.info(f"Received search query: {search_query.query}")

        # Initialize Redis if not already initialized
        if not redis_client.redis_client:
            logger.info("Initializing Redis client")
            await redis_client.init()
            logger.info("Redis client initialized")

        # Try to get cached results
        cache_key = f"video_content_search:{search_query.query}"
        logger.info(f"Checking cache for key: {cache_key}")
        cached_results = await redis_client.get_json(cache_key)
        
        if cached_results:
            logger.info(f"Cache hit for query: {search_query.query}")
            return VideoSearchResponse(results=cached_results)
        
        logger.info("Cache miss, calling video content search service")
        
        # Call video content search API through our service
        try:
            response = await video_content_search_service.search_content(search_query.query)
            
            # Cache results for 5 minutes
            logger.info("Caching search results")
            await redis_client.set_json(cache_key, response.dict()["results"], expire=300)
            logger.info(f"Cached results for query: {search_query.query}")
            
            return response
            
        except Exception as e:
            error_msg = f"Video search API error: {str(e)}"
            logger.error(error_msg)
            raise HTTPException(
                status_code=503,
                detail=error_msg
            )
            
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Unexpected error in video content search: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(
            status_code=500,
            detail=error_msg
        ) 