# Knowledge Portal

A comprehensive knowledge management and learning platform.

## Prerequisites

- Python 3.8+
- Node.js 18+
- PostgreSQL 13+
- Redis
- Docker and Docker Compose (for containerized deployment)

## Getting Started

### Environment Variables Setup

> **Important**: Before starting the application, you need to set up your environment variables. Contact the project maintainer to get the required `.env` files for both backend and frontend.

1. Backend Environment Variables:
   - Contact the project maintainer to get the `knowledge_portal_backend/.env` file
   - This file contains sensitive information like:
     - Database credentials
     - Google OAuth credentials
     - JWT secrets
     - API keys

2. Frontend Environment Variables:
   - Contact the project maintainer to get the `knowledge_portal_frontend/.env` file
   - This file contains:
     - API URL configuration
     - Feature flags
     - Third-party service keys

## Local Development Setup

### Backend Setup

1. Create and activate a virtual environment:
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

2. Install dependencies:
```bash
cd knowledge_portal_backend
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
# Place the .env file in the knowledge_portal_backend directory
# The file should contain all required variables as shown below
```

Required Backend Environment Variables:
```env
# API Settings
PROJECT_NAME=Knowledge Portal API
VERSION=1.0.0
API_V1_STR=/api/v1

# Database
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=knowledge_portal
POSTGRES_PORT=5432

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback

# JWT
SECRET_KEY=your_secret_key
ACCESS_TOKEN_EXPIRE_MINUTES=11520  # 8 days

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# Elasticsearch
ELASTICSEARCH_HOST=localhost
ELASTICSEARCH_PORT=9200
ELASTICSEARCH_USERNAME=
ELASTICSEARCH_PASSWORD=

# Video Search
VIDEO_SEARCH_API_URL=http://109.237.68.137:80/retriever/query
VIDEO_SEARCH_API_KEY=
VIDEO_SEARCH_MOCK_DATA=True
```

4. Initialize the database:
```bash
# Create database
createdb knowledge_portal

# Run migrations
alembic upgrade head
```

5. Run the backend server:
```bash
uvicorn app.main:app --reload --port 8000
```

The backend API will be available at `http://localhost:8000/api/v1`

### Frontend Setup

1. Install dependencies:
```bash
cd knowledge_portal_frontend
npm install
```

2. Set up environment variables:
```bash
# Place the .env file in the knowledge_portal_frontend directory
# The file should contain all required variables as shown below
```

Required Frontend Environment Variables:
```env
# API Configuration
REACT_APP_API_URL=http://localhost:8000

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_ENABLE_FEATURE_X=false

# Third-party Services
REACT_APP_GOOGLE_ANALYTICS_ID=
REACT_APP_SENTRY_DSN=
```

3. Run the development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

## Docker Deployment

### Using Docker Compose

1. Ensure you have the correct `.env` files in both backend and frontend directories

2. Build and start all services:
```bash
docker-compose up --build
```

This will start:
- Frontend at `http://localhost:3000`
- Backend API at `http://localhost:8000/api/v1`
- Nginx reverse proxy at `http://localhost:8080`

### Individual Services

#### Backend Container
```bash
cd knowledge_portal_backend
docker build -t knowledge-portal-backend .
docker run -p 8000:8000 --env-file .env knowledge-portal-backend
```

#### Frontend Container
```bash
cd knowledge_portal_frontend
docker build -t knowledge-portal-frontend .
docker run -p 3000:3000 --env-file .env knowledge-portal-frontend
```

## Environment Variables Guide

### Backend Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `POSTGRES_USER` | PostgreSQL username | Yes | - |
| `POSTGRES_PASSWORD` | PostgreSQL password | Yes | - |
| `POSTGRES_DB` | Database name | Yes | knowledge_portal |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes | - |
| `SECRET_KEY` | JWT signing key | Yes | - |
| `REDIS_HOST` | Redis server host | No | localhost |
| `REDIS_PORT` | Redis server port | No | 6379 |
| `ELASTICSEARCH_HOST` | Elasticsearch host | No | localhost |
| `ELASTICSEARCH_PORT` | Elasticsearch port | No | 9200 |

### Frontend Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `REACT_APP_API_URL` | Backend API URL | Yes | - |
| `REACT_APP_ENABLE_ANALYTICS` | Enable analytics | No | false |
| `REACT_APP_GOOGLE_ANALYTICS_ID` | Google Analytics ID | No | - |

## API Documentation

Once the backend is running, you can access:
- Swagger UI: `http://localhost:8000/api/v1/docs`
- ReDoc: `http://localhost:8000/api/v1/redoc`

## Development Workflow

1. Start the backend server:
```bash
cd knowledge_portal_backend
uvicorn app.main:app --reload
```

2. Start the frontend development server:
```bash
cd knowledge_portal_frontend
npm start
```

3. For database migrations:
```bash
cd knowledge_portal_backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## Troubleshooting

### Common Issues

1. Database Connection Issues:
   - Ensure PostgreSQL is running
   - Check database credentials in .env
   - Verify database exists: `createdb knowledge_portal`

2. Port Conflicts:
   - Backend: Change port in uvicorn command
   - Frontend: Change port in package.json
   - Docker: Modify port mappings in docker-compose.yml

3. CORS Issues:
   - Check BACKEND_CORS_ORIGINS in backend .env
   - Verify frontend API URL configuration

4. Google OAuth Issues:
   - Verify Google Cloud Console configuration
   - Check redirect URI matches Google Console settings
   - Ensure environment variables are set correctly

5. Environment Variable Issues:
   - Verify all required variables are set
   - Check for typos in variable names
   - Ensure .env files are in the correct locations
   - Restart the application after changing environment variables

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run tests and ensure code quality
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 