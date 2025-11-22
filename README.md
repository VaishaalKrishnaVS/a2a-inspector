# A2A Inspector

A powerful web application for inspecting, configuring, and interacting with A2A (Agent-to-Agent) agents in real-time. This tool provides a comprehensive interface to explore agent capabilities, view agent cards, and communicate with agents through a modern chat interface.

![A2A Inspector](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Development](#development)
- [Docker](#docker)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Features

### 🎯 Core Functionality

- **Agent Card Inspection**: Fetch and display detailed agent card information in JSON format
- **Real-time Chat Interface**: Interactive chat interface for communicating with agents
- **Streaming Support**: Real-time streaming message responses with chunk-by-chunk display
- **Metadata Management**: Configure and send custom metadata with messages
- **Beautiful UI**: Modern, responsive interface built with React and Tailwind CSS

### 💡 Key Capabilities

- **Agent Discovery**: Enter an agent URL to fetch and inspect its agent card
- **Message Streaming**: View streaming responses as they arrive, with individual chunk visualization
- **Message History**: Complete chat history with timestamps and metadata
- **Error Handling**: Comprehensive error handling and user-friendly error messages
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### 🎨 UI Features

- **Agent Card Display**: Visual representation of agent information
- **JSON Viewer**: Formatted JSON display with syntax highlighting
- **Chat Interface**: Modern chat UI with message bubbles and metadata
- **Collapsible Sections**: Expandable metadata and raw JSON views
- **State Indicators**: Visual badges showing message state (working, completed, error)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher) or **yarn**
- **Python** (v3.11 or higher)
- **pip** (Python package manager)
- **Docker** (optional, for containerized deployment)

## Installation

### Option 1: Manual Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd a2a-inspector
   ```

2. **Install frontend dependencies**:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

3. **Install backend dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

### Option 2: Using npm Script

```bash
npm run install:all
```

This will install dependencies for both frontend and backend.

## Quick Start

### Development Mode

#### Using npm scripts:

```bash
npm start
```

This starts both backend and frontend servers concurrently.

#### Using shell script:

```bash
./start.sh
```

#### Manual start:

**Terminal 1 - Backend**:
```bash
cd backend
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:3000 (or the port shown in terminal)
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs (Swagger UI)

## Usage

### 1. Fetching an Agent Card

1. Enter the agent URL in the input field (e.g., `https://example.com/agent`)
2. Optionally add metadata key-value pairs
3. Click "Fetch Agent Card" or press Enter
4. The agent card will be displayed on the right side

### 2. Chatting with an Agent

1. After fetching an agent card, the chat interface becomes available
2. Type your message in the input field
3. Press Enter or click "Send"
4. View streaming responses as they arrive
5. Expand metadata sections to view detailed information

### 3. Viewing Agent JSON

- The agent card JSON is displayed in the left panel
- Scroll to view the complete JSON structure
- The JSON is formatted and syntax-highlighted

## Development

### Frontend Development

```bash
cd frontend
npm run dev
```

The frontend uses:
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Radix UI** components
- **Lucide React** for icons

### Backend Development

```bash
cd backend
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The backend uses:
- **FastAPI** for the web framework
- **A2A SDK** for agent communication
- **Pydantic** for data validation
- **httpx** for HTTP client

### Code Structure

- **Frontend**: Component-based architecture in `frontend/src/`
- **Backend**: Modular structure in `backend/` with separate modules for client, config, models, and utilities

## Docker

### Quick Start with Docker

**Production**:
```bash
docker-compose up --build
```

**Development** (with hot-reload):
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Docker Commands

```bash
npm run docker:build    # Build Docker images
npm run docker:up      # Start production containers
npm run docker:dev     # Start development containers
npm run docker:down    # Stop containers
npm run docker:logs    # View container logs
npm run docker:clean   # Clean rebuild
```

For detailed Docker documentation, see [DOCKER.md](./DOCKER.md).

## API Documentation

### Endpoints

#### `GET /`
Health check endpoint.

**Response**:
```json
{
  "status": "working"
}
```

#### `GET /agent-card?url={agent_url}`
Fetch agent card from the specified URL.

**Parameters**:
- `url` (query, required): Base URL of the agent

**Response**: Agent card JSON object

**Example**:
```bash
curl "http://localhost:8000/agent-card?url=https://example.com/agent"
```

#### `POST /chat`
Send a message to the agent.

**Request Body**:
```json
{
  "prompt": "What is the current time?",
  "metadata": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

**Response**: 
- **Non-streaming**: Complete message response
- **Streaming**: Server-Sent Events (SSE) stream

**Example**:
```bash
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello", "metadata": {}}'
```

### Interactive API Documentation

Visit http://localhost:8000/docs for interactive Swagger UI documentation.

## Project Structure

```
a2a-inspector/
├── backend/                 # FastAPI backend
│   ├── client/             # A2A client utilities
│   │   └── a2a_client.py  # Agent card and message handling
│   ├── util/               # Utility modules
│   │   ├── cache.py        # Agent card caching
│   │   └── logging_config.py  # Logging configuration
│   ├── config.py           # Application configuration
│   ├── main.py             # FastAPI application entry point
│   ├── models.py           # Pydantic models
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile          # Backend Docker image
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── AgentCard.tsx
│   │   │   ├── AgentInput.tsx
│   │   │   ├── ChatInterface.tsx
│   │   │   └── ui/         # UI component library
│   │   ├── App.tsx         # Main application component
│   │   └── main.tsx        # Application entry point
│   ├── package.json        # Node.js dependencies
│   ├── vite.config.ts      # Vite configuration
│   └── Dockerfile          # Frontend Docker image
│
├── docker-compose.yml      # Production Docker Compose
├── docker-compose.dev.yml  # Development Docker Compose
├── package.json            # Root package.json with scripts
├── start.sh               # Shell script to start both servers
└── README.md              # This file
```

## Configuration

### Backend Configuration

Environment variables (set in `backend/config.py` or as environment variables):

- `CORS_ALLOW_ORIGINS`: Comma-separated list of allowed origins (default: "*")
- `LOG_LEVEL`: Logging level - DEBUG, INFO, WARNING, ERROR (default: "INFO")
- `HTTP_TIMEOUT_AGENT_CARD`: Timeout for agent card requests in seconds (default: 10.0)
- `HTTP_TIMEOUT_MESSAGE`: Timeout for message requests in seconds (default: 30.0)

### Frontend Configuration

The frontend connects to the backend at `http://127.0.0.1:8000` by default. To change this, modify the API URLs in `frontend/src/App.tsx`.

## Troubleshooting

### Common Issues

#### Port Already in Use

**Error**: `Address already in use`

**Solution**: 
- Change the port in the configuration
- Or stop the process using the port:
  ```bash
  # Find process using port 8000
  lsof -i :8000
  # Kill the process
  kill -9 <PID>
  ```

#### CORS Errors

**Error**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution**: 
- Ensure backend CORS is configured correctly
- Check `CORS_ALLOW_ORIGINS` environment variable
- Verify frontend URL matches allowed origins

#### Module Not Found Errors

**Solution**:
```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && pip install -r requirements.txt
```

#### Docker Build Fails

**Solution**:
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

### Getting Help

1. Check the [API Documentation](#api-documentation)
2. Review the [Docker Documentation](./DOCKER.md)
3. Check existing issues on GitHub
4. Create a new issue with detailed error information

## Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Test your changes**:
   ```bash
   npm start  # Test locally
   ```
5. **Commit your changes**:
   ```bash
   git commit -m "Add your feature description"
   ```
6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request**

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Update documentation as needed
- Write tests for new features
- Ensure all tests pass before submitting

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

Copyright (c) 2025 VaishaalKrishnaVS

## Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- Frontend powered by [React](https://react.dev/) and [Vite](https://vitejs.dev/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Uses [A2A SDK](https://github.com/a2a-protocol/a2a-sdk) for agent communication

## Support

For questions, issues, or feature requests, please open an issue on GitHub.

---

**Made with ❤️ for the A2A Protocol community**

