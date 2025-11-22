# Docker Setup for A2A Inspector

This project includes Docker support for both development and production deployments.

## Quick Start

### Production Build

Build and run both services:

```bash
docker-compose up --build
```

This will:
- Build the backend (FastAPI) on port 8000
- Build the frontend (Nginx) on port 3000
- Start both services

Access the application at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

### Development Mode

For development with hot-reload:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

This will:
- Run backend with auto-reload on code changes
- Run frontend dev server with hot module replacement
- Mount volumes for live code updates

## Individual Services

### Backend Only

```bash
cd backend
docker build -t a2a-inspector-backend .
docker run -p 8000:8000 a2a-inspector-backend
```

### Frontend Only (Production)

```bash
cd frontend
docker build -t a2a-inspector-frontend .
docker run -p 3000:80 a2a-inspector-frontend
```

### Frontend Only (Development)

```bash
cd frontend
docker build -f Dockerfile.dev -t a2a-inspector-frontend-dev .
docker run -p 3000:3000 -v $(pwd):/app a2a-inspector-frontend-dev
```

## Environment Variables

### Backend

- `CORS_ALLOW_ORIGINS`: Comma-separated list of allowed origins (default: "*")
- `LOG_LEVEL`: Logging level (default: "INFO")
- `HTTP_TIMEOUT_AGENT_CARD`: Timeout for agent card requests in seconds (default: 10.0)
- `HTTP_TIMEOUT_MESSAGE`: Timeout for message requests in seconds (default: 30.0)

### Frontend

- `VITE_API_URL`: Backend API URL (default: http://localhost:8000)

## Docker Compose Commands

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild and restart
docker-compose up --build

# Stop and remove volumes
docker-compose down -v
```

## Health Checks

Both services include health checks:
- Backend: http://localhost:8000/
- Frontend: http://localhost:3000/

Check health status:
```bash
docker-compose ps
```

## Troubleshooting

### Port Already in Use

If ports 8000 or 3000 are already in use, modify the port mappings in `docker-compose.yml`:

```yaml
ports:
  - "8001:8000"  # Use 8001 instead of 8000
```

### Permission Issues

On Linux, you may need to use `sudo` or add your user to the docker group:

```bash
sudo usermod -aG docker $USER
```

### Clean Build

To force a clean rebuild:

```bash
docker-compose build --no-cache
docker-compose up
```

## Production Deployment

For production, consider:

1. Using environment-specific docker-compose files
2. Setting up proper secrets management
3. Configuring reverse proxy (Nginx/Traefik)
4. Setting up SSL/TLS certificates
5. Using Docker secrets or environment files for sensitive data
6. Configuring resource limits in docker-compose.yml

Example production overrides:

```yaml
# docker-compose.prod.yml
services:
  backend:
    restart: always
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
  frontend:
    restart: always
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
```

Run with:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

