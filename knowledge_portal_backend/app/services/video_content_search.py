from typing import List
import httpx
import logging
from app.core.config import settings
from app.schemas.video_content_search import VideoSearchResult, VideoSearchResponse

logger = logging.getLogger(__name__)

class VideoContentSearchService:
    def __init__(self):
        self.base_url = settings.VIDEO_SEARCH_API_URL.rstrip('/')  # Remove trailing slash if present
        self.api_key = settings.VIDEO_SEARCH_API_KEY
        logger.info(f"Initialized VideoContentSearchService with base_url: {self.base_url}")

    async def search_content(self, query: str) -> VideoSearchResponse:
        """
        Search video content using the video content search API
        """
        headers = {
            "Content-Type": "application/json"
        }
        
        # Only add Authorization header if API key exists
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
            logger.info("Added Authorization header")
        else:
            logger.warning("No API key provided, proceeding without Authorization header")

        try:
            # Construct the full URL
            url = f"{self.base_url}/retriever/query"
            logger.info(f"Making request to {url} with query: {query}")
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    json={"query": query},
                    headers=headers,
                    timeout=30.0  # Add timeout
                )
                
                logger.info(f"Received response with status code: {response.status_code}")
                
                if response.status_code != 200:
                    error_msg = f"Video search API error: Status {response.status_code}, Response: {response.text}"
                    logger.error(error_msg)
                    raise Exception(error_msg)
                
                data = response.json()
                logger.info(f"Successfully parsed response JSON: {data}")
                
                # Transform API response to our schema
                results = []
                for item in data["results"]:
                    try:
                        result = VideoSearchResult(
                            id=item["id"],
                            type=item["type"],
                            similarity=item["similarity"],
                            text=item["text"],
                            start_time=item.get("start_time"),
                            end_time=item.get("end_time"),
                            speaker=item.get("speaker")
                        )
                        results.append(result)
                    except Exception as e:
                        logger.error(f"Error processing result item: {item}, Error: {str(e)}")
                        continue
                
                logger.info(f"Successfully processed {len(results)} results")
                return VideoSearchResponse(results=results)
                
        except httpx.RequestError as e:
            error_msg = f"Request error: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)

video_content_search_service = VideoContentSearchService() 