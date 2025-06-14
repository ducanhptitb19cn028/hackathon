# Knowledge Portal

A comprehensive knowledge management system with video content search, quizzes, and learning paths.

## Features

- 🔍 **Video Content Search**: AI-powered search through video transcripts and content
- 📝 **Interactive Quizzes**: Generate and take quizzes based on video content
- 🎯 **Learning Paths**: Structured learning experiences
- 🔐 **Google OAuth Authentication**: Secure login with Google accounts
- 📊 **Progress Tracking**: Monitor learning progress and quiz history

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **PostgreSQL**: Primary database
- **Redis**: Caching and session storage
- **Elasticsearch**: Full-text search capabilities
- **SQLAlchemy**: ORM for database operations

### Frontend
- **React**: User interface framework
- **TypeScript**: Type-safe JavaScript
- **Material-UI**: Component library
- **Redux Toolkit**: State management

## Prerequisites

- Docker and Docker Compose
- Google OAuth 2.0 credentials (for authentication)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd knowledge-portal
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit the `.env` file with your actual values:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/knowledge_portal
POSTGRES_USER=knowledge_portal_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=knowledge_portal

# Google OAuth Configuration (REQUIRED)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# JWT Configuration
SECRET_KEY=your_very_secure_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API Configuration
REACT_APP_API_URL=http://localhost:8000
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here

# Video Search API Configuration
VIDEO_SEARCH_API_URL=http://109.237.68.137:80
VIDEO_SEARCH_API_KEY=

# Environment
ENVIRONMENT=development
```

### 3. Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create OAuth 2.0 Client IDs
5. Add authorized origins:
   - `http://localhost:3000` (frontend)
   - `http://localhost:8000` (backend)
6. Add authorized redirect URIs:
   - `http://localhost:8000/api/v1/auth/google/callback`
7. Copy the Client ID and Client Secret to your `.env` file

### 4. Start the Application

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Development

### Running Individual Services

```bash
# Backend only
docker-compose up -d backend postgres redis elasticsearch

# Frontend only (development mode)
docker-compose up -d frontend-dev

# View service logs
docker-compose logs -f backend
docker-compose logs -f frontend-dev
```

### Database Management

```bash
# Run database migrations
docker-compose exec backend alembic upgrade head

# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "Description"
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/google/login` - Google OAuth login
- `POST /api/v1/auth/logout` - Logout

### Video Content Search
- `POST /api/v1/video-content-search/query` - Search video content

### Quizzes
- `GET /api/v1/quizzes/available` - Get available quizzes
- `GET /api/v1/quizzes/{quiz_id}` - Get specific quiz
- `POST /api/v1/quizzes/generate` - Generate quiz for video
- `POST /api/v1/quizzes/{quiz_id}/submit` - Submit quiz answers

### Health Check
- `GET /api/v1/health` - System health status

## Troubleshooting

### Common Issues

1. **Google OAuth Error**: Ensure your Google Client ID and Secret are correctly set in the `.env` file
2. **Database Connection Error**: Check PostgreSQL credentials and ensure the database is running
3. **Redis Connection Error**: Verify Redis is running and accessible
4. **Frontend Build Errors**: Clear Docker cache and rebuild: `docker-compose build --no-cache frontend-dev`

### Logs

```bash
# View all service logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend-dev
docker-compose logs postgres
docker-compose logs redis
docker-compose logs elasticsearch
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all tests pass
5. Submit a pull request

## Security Notes

- Never commit `.env` files or any files containing sensitive credentials
- Use strong, unique passwords for all services
- Regularly rotate API keys and secrets
- Keep dependencies updated

## License

This project is licensed under the MIT License - see the LICENSE file for details. 