# Knowledge Portal Backend

A FastAPI-based backend service for the Knowledge Portal, featuring video search with natural language processing, Redis caching, and Elasticsearch integration.

## Features

- Natural language video search using Elasticsearch
- Personalized learning paths generation
- Automated quiz generation and assessment
- Redis caching for improved performance
- Scalable FastAPI architecture
- Async support throughout the application

## Prerequisites

1. PostgreSQL installed locally and running
2. Docker and Docker Compose (if using Docker for Redis and Elasticsearch)
3. Python 3.11+ (if using venv)

## Project Setup

This project can be run either using Docker or a virtual environment (venv). The project uses a local PostgreSQL database and containerized Redis and Elasticsearch services.

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration (Local PostgreSQL)
POSTGRES_HOST=localhost  # Use 'host.docker.internal' when running API in Docker
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=knowledge_portal

# Application Settings
DEBUG=True
RELOAD=True
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=11520

# Redis Configuration
REDIS_HOST=localhost  # Use 'redis' when running API in Docker
REDIS_PORT=6379
REDIS_DB=0

# Session Settings
SESSION_SECRET_KEY=your-super-secret-key
SESSION_EXPIRE_MINUTES=60

# Elasticsearch Configuration
ELASTICSEARCH_HOST=http://localhost:9200  # Use 'http://elasticsearch:9200' when running API in Docker

# Video Search API Configuration
VIDEO_SEARCH_API_URL=https://api.example.com/video-search
VIDEO_SEARCH_API_KEY=your-api-key-here
```

### Option 1: Running with Docker (Redis and Elasticsearch)

1. Make sure you have:
   - PostgreSQL running locally
   - Docker and Docker Compose installed

2. Create the `.env` file as shown above, using the Docker-specific host values for Redis and Elasticsearch

3. Start Redis and Elasticsearch services:
   ```bash
   docker-compose up -d redis elasticsearch
   ```

4. Start the API service:
   ```bash
   docker-compose up api
   ```

The API will be available at http://localhost:8000

### Option 2: Running with Virtual Environment

1. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows
   .\venv\Scripts\activate
   # On Unix or MacOS
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create the `.env` file as shown above, using localhost values

4. Start the required services:
   - PostgreSQL (should be running locally)
   - Redis and Elasticsearch (using Docker):
     ```bash
     docker-compose up -d redis elasticsearch
     ```

5. Run database migrations:
   ```bash
   alembic upgrade head
   ```

6. Start the application:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## API Documentation

Once the server is running, you can access:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Video Search

- `POST /api/v1/videos/search`
  - Search videos using natural language queries
  - Supports pagination
  - Returns relevant videos with metadata

- `POST /api/v1/videos/setup-index`
  - Admin endpoint to set up Elasticsearch index
  - Creates proper mapping for video documents

### Learning Paths

- `POST /api/v1/learning-paths/generate`
  - Generate personalized learning paths
  - Input: Learning goals, current level, interests
  - Returns: Structured learning path with video recommendations

- `GET /api/v1/learning-paths/{path_id}`
  - Retrieve a specific learning path
  - Returns: Complete learning path with all steps

### Quizzes

- `POST /api/v1/quizzes/generate`
  - Generate quiz for a specific video
  - Customizable difficulty and number of questions
  - Returns: Quiz with multiple-choice questions

- `POST /api/v1/quizzes/submit`
  - Submit quiz answers
  - Returns: Score, pass/fail status, and explanations

## Development

### Project Structure

```
knowledge_portal_backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── api.py
│   │       └── endpoints/
│   │           ├── video_search.py
│   │           ├── learning_path.py
│   │           └── quiz.py
│   ├── core/
│   │   ├── config.py
│   │   ├── redis_client.py
│   │   └── elasticsearch_client.py
│   └── main.py
├── requirements.txt
└── .env
```

### Adding New Features

1. Create new endpoint modules in `app/api/v1/endpoints/`
2. Add routes to `app/api/v1/api.py`
3. Update dependencies in `requirements.txt` if needed

### Pre-commit Hooks

The project uses pre-commit hooks for code quality. Install them with:
```bash
pre-commit install
```

### Running Tests

```bash
pytest
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 