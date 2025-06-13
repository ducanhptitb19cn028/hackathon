from typing import Generic, TypeVar, Type, Optional, List, Union, Dict, Any
from pydantic import BaseModel
from app.repositories.base import BaseRepository
from app.core.redis_client import redis_client

ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

class BaseService(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(
        self,
        repository: BaseRepository[ModelType, CreateSchemaType, UpdateSchemaType],
        cache_prefix: str = None
    ):
        self.repository = repository
        self.cache_prefix = cache_prefix

    async def get(self, id: Any) -> Optional[ModelType]:
        if self.cache_prefix:
            # Try to get from cache
            cache_key = f"{self.cache_prefix}:{id}"
            cached_data = await redis_client.get_json(cache_key)
            if cached_data:
                return self.repository.model(**cached_data)

        # Get from database
        db_obj = await self.repository.get(id)
        
        if db_obj and self.cache_prefix:
            # Cache the result
            await redis_client.set_json(
                f"{self.cache_prefix}:{id}",
                {k: v for k, v in db_obj.__dict__.items() if not k.startswith('_')},
                expire=3600  # 1 hour cache
            )
        
        return db_obj

    async def get_multi(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        filters: Dict[str, Any] = None
    ) -> List[ModelType]:
        return await self.repository.get_multi(skip=skip, limit=limit, filters=filters)

    async def create(self, *, obj_in: CreateSchemaType) -> ModelType:
        return await self.repository.create(obj_in=obj_in)

    async def update(
        self,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]]
    ) -> ModelType:
        updated_obj = await self.repository.update(db_obj=db_obj, obj_in=obj_in)
        
        if self.cache_prefix:
            # Invalidate cache
            cache_key = f"{self.cache_prefix}:{updated_obj.id}"
            await redis_client.delete_data(cache_key)
            
        return updated_obj

    async def delete(self, *, id: int) -> ModelType:
        obj = await self.repository.delete(id=id)
        
        if obj and self.cache_prefix:
            # Invalidate cache
            cache_key = f"{self.cache_prefix}:{id}"
            await redis_client.delete_data(cache_key)
            
        return obj

    async def count(self, filters: Dict[str, Any] = None) -> int:
        return await self.repository.count(filters=filters) 