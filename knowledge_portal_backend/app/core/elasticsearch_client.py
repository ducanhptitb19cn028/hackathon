from elasticsearch import AsyncElasticsearch
from elasticsearch.exceptions import ConnectionError, ConnectionTimeout, NotFoundError
from app.core.config import get_settings
import asyncio
import logging

settings = get_settings()
logger = logging.getLogger(__name__)

class ElasticsearchClient:
    def __init__(self):
        self.es_client = None
        self.max_retries = 5
        self.retry_delay = 5  # seconds

    async def init(self):
        # Convert the host URL to a list as required by the client
        hosts = [str(settings.ELASTICSEARCH_HOST)]
        
        # Create the client with proper configuration
        self.es_client = AsyncElasticsearch(
            hosts=hosts,
            verify_certs=False,  # For development only
            request_timeout=30,
            retry_on_timeout=True,
            max_retries=3,
            sniff_on_start=True,
            sniff_on_connection_fail=True,
            sniffer_timeout=60
        )
        
        # Test the connection with retries
        for attempt in range(self.max_retries):
            try:
                info = await self.es_client.info()
                logger.info(f"Successfully connected to Elasticsearch cluster: {info['cluster_name']}")
                
                # Wait for yellow status
                health = await self.es_client.cluster.health(wait_for_status="yellow", timeout="30s")
                logger.info(f"Cluster health: {health['status']}")
                return
            except (ConnectionError, ConnectionTimeout) as e:
                if attempt == self.max_retries - 1:
                    logger.error(f"Failed to connect to Elasticsearch after {self.max_retries} attempts: {e}")
                    raise
                logger.warning(f"Failed to connect to Elasticsearch (attempt {attempt + 1}/{self.max_retries}). Retrying in {self.retry_delay} seconds...")
                await asyncio.sleep(self.retry_delay)
            except Exception as e:
                logger.error(f"Unexpected error connecting to Elasticsearch: {e}")
                raise

    async def close(self):
        if self.es_client:
            await self.es_client.close()

    async def create_index(self, index_name: str, mappings: dict):
        if not self.es_client:
            await self.init()
            
        try:
            if not await self.es_client.indices.exists(index=index_name):
                await self.es_client.indices.create(
                    index=index_name,
                    mappings=mappings,
                    settings={
                        "number_of_shards": 1,
                        "number_of_replicas": 0
                    }
                )
                logger.info(f"Created index: {index_name}")
                
                # Wait for yellow status
                await self.es_client.cluster.health(
                    index=index_name,
                    wait_for_status="yellow",
                    timeout="30s"
                )
        except Exception as e:
            logger.error(f"Error creating index {index_name}: {e}")
            raise

    async def index_document(self, index_name: str, document: dict, doc_id: str = None):
        if not self.es_client:
            await self.init()
            
        try:
            result = await self.es_client.index(
                index=index_name,
                document=document,
                id=doc_id,
                refresh=True  # Make the document immediately searchable
            )
            logger.debug(f"Indexed document in {index_name}: {result}")
            return result
        except Exception as e:
            logger.error(f"Error indexing document in {index_name}: {e}")
            raise

    async def search(self, index_name: str, query: dict):
        if not self.es_client:
            await self.init()
            
        try:
            result = await self.es_client.search(
                index=index_name,
                body=query,
                allow_partial_search_results=True  # Allow partial results if some shards fail
            )
            logger.debug(f"Search in {index_name} returned {len(result['hits']['hits'])} results")
            return result
        except NotFoundError:
            logger.warning(f"Index {index_name} not found")
            return {"hits": {"total": {"value": 0}, "hits": []}}
        except Exception as e:
            logger.error(f"Error searching in {index_name}: {e}")
            raise

    async def delete_document(self, index_name: str, doc_id: str):
        if not self.es_client:
            await self.init()
            
        try:
            result = await self.es_client.delete(
                index=index_name,
                id=doc_id,
                refresh=True  # Make the deletion immediately visible
            )
            logger.debug(f"Deleted document {doc_id} from {index_name}")
            return result
        except NotFoundError:
            logger.warning(f"Document {doc_id} not found in {index_name}")
            return None
        except Exception as e:
            logger.error(f"Error deleting document {doc_id} from {index_name}: {e}")
            raise

# Create a singleton instance
es_client = ElasticsearchClient() 