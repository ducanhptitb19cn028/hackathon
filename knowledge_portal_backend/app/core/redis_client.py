import redis.asyncio as redis
from app.core.config import get_settings
import json
from typing import Optional, Any
import uuid

settings = get_settings()

class RedisClient:
    def __init__(self):
        self.redis_client = None

    async def init(self):
        # Create Redis connection config
        redis_config = {
            "host": settings.REDIS_HOST,
            "port": settings.REDIS_PORT,
            "db": settings.REDIS_DB,
            "decode_responses": True
        }
        
        # Add password only if it's set
        if settings.REDIS_PASSWORD:
            redis_config["password"] = settings.REDIS_PASSWORD

        self.redis_client = redis.Redis(**redis_config)

    async def close(self):
        if self.redis_client:
            await self.redis_client.close()

    # Session Management
    async def create_session(self, user_id: int, data: dict) -> str:
        session_id = str(uuid.uuid4())
        session_key = f"session:{session_id}"
        session_data = {
            "user_id": user_id,
            **data
        }
        await self.set_json(session_key, session_data, expire=settings.SESSION_EXPIRE_MINUTES * 60)
        return session_id

    async def get_session(self, session_id: str) -> Optional[dict]:
        session_key = f"session:{session_id}"
        return await self.get_json(session_key)

    async def update_session(self, session_id: str, data: dict) -> bool:
        session_key = f"session:{session_id}"
        current_session = await self.get_json(session_key)
        if current_session:
            current_session.update(data)
            await self.set_json(session_key, current_session, expire=settings.SESSION_EXPIRE_MINUTES * 60)
            return True
        return False

    async def delete_session(self, session_id: str) -> bool:
        session_key = f"session:{session_id}"
        return await self.delete_data(session_key)

    # Cache Management
    async def set_data(self, key: str, value: str, expire: int = None):
        await self.redis_client.set(key, value, ex=expire)

    async def get_data(self, key: str) -> str:
        return await self.redis_client.get(key)

    async def delete_data(self, key: str) -> bool:
        return await self.redis_client.delete(key) > 0

    async def set_json(self, key: str, value: dict, expire: int = None):
        await self.redis_client.set(key, json.dumps(value), ex=expire)

    async def get_json(self, key: str) -> Optional[dict]:
        data = await self.redis_client.get(key)
        return json.loads(data) if data else None

    # Frequently Accessed Data Caching
    async def cache_video(self, video_id: str, video_data: dict, expire: int = 3600):
        """Cache video data for 1 hour"""
        cache_key = f"video:{video_id}"
        await self.set_json(cache_key, video_data, expire=expire)

    async def get_cached_video(self, video_id: str) -> Optional[dict]:
        cache_key = f"video:{video_id}"
        return await self.get_json(cache_key)

    async def cache_learning_path(self, path_id: str, path_data: dict, expire: int = 3600):
        """Cache learning path data for 1 hour"""
        cache_key = f"learning_path:{path_id}"
        await self.set_json(cache_key, path_data, expire=expire)

    async def get_cached_learning_path(self, path_id: str) -> Optional[dict]:
        cache_key = f"learning_path:{path_id}"
        return await self.get_json(cache_key)

    async def cache_user_progress(self, user_id: str, path_id: str, progress_data: dict):
        """Cache user progress data with no expiration"""
        cache_key = f"progress:{user_id}:{path_id}"
        await self.set_json(cache_key, progress_data)

    async def get_cached_user_progress(self, user_id: str, path_id: str) -> Optional[dict]:
        cache_key = f"progress:{user_id}:{path_id}"
        return await self.get_json(cache_key)

    # Rate Limiting
    async def increment_request_count(self, key: str, window: int = 60) -> int:
        """Increment request count for rate limiting"""
        count = await self.redis_client.incr(key)
        if count == 1:
            await self.redis_client.expire(key, window)
        return count

redis_client = RedisClient() 