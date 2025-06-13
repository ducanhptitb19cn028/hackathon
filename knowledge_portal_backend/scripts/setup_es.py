import sys
import os

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.scripts.setup_elasticsearch import setup_elasticsearch
import asyncio

if __name__ == "__main__":
    asyncio.run(setup_elasticsearch()) 