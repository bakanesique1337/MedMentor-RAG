# MedMentor-RAG

Medical testing AI chat application where doctors practice diagnostics. The AI emulates a patient, and the doctor must reach a correct diagnosis within 10 messages.

## Project Structure

```text
backend/
├── src/main/java/ru/medmentor/
│   ├── config/              # Spring configuration (security, AI, websocket, properties)
│   ├── controller/          # REST/WebSocket controllers (simulation, auth, RAG, etc.)
│   ├── dto/                 # Request/response DTOs
│   ├── model/               # JPA entities + domain models
│   ├── repository/          # Spring Data repositories
│   └── service/             # Business logic, AI orchestration, streaming, RAG pipeline
├── src/main/resources/
│   ├── application.properties
│   ├── prompts/             # Prompt templates (patient role, opening, score review)
│   └── schema.sql
├── src/test/                # Unit + web-layer tests
├── build.gradle
└── README.md
```

### RAG Paths in Backend

- `src/main/java/ru/medmentor/service/RagIngestionService.java`  
  Startup/scheduled/manual sync orchestration.
- `src/main/java/ru/medmentor/service/RagSourceParserService.java`  
  File parsing for supported source formats.
- `src/main/java/ru/medmentor/service/RagChunkingService.java`  
  Chunk creation before embedding.
- `src/main/java/ru/medmentor/service/RagSearchService.java`  
  Similarity search + prompt context building.
- `src/main/java/ru/medmentor/controller/RagController.java`  
  Authenticated RAG API endpoints.
- `src/main/java/ru/medmentor/model/RagSourceFile.java` and
  `src/main/java/ru/medmentor/repository/RagSourceFileRepository.java`  
  Incremental indexing state storage.

## Current Status

Core simulation backend is implemented, including:
- auth + simulation flow APIs
- AI patient chat + scoring
- RAG ingestion pipeline with pgvector retrieval

## Technology Stack

- **Backend:** Spring Boot 3.5.10-SNAPSHOT
- **AI Integration:** Spring AI 1.1.2 with Google Gemini (gemini-2.5-flash)
- **Embeddings:** Ollama with nomic-embed-text
- **Database:** PostgreSQL 16 with pgvector extension
- **WebSocket:** STOMP over WebSocket with SockJS fallback
- **API Documentation:** Swagger/OpenAPI (springdoc-openapi)
- **Language:** Java 25
- **Build Tool:** Gradle
- **Containerization:** Docker & Docker Compose

## Prerequisites

- Docker and Docker Compose installed
- Google Gemini API key (get one at https://makersuite.google.com/app/apikey - free tier available)
- Java 25 (for local development without Docker)

## Environment Variables

Copy the `.env.example` file to `.env` and set your API key:

```bash
cp .env.example .env
# Then edit .env and add your actual API key
```

The same `.env` file also carries single-user local bootstrap values:
`MEDMENTOR_DEFAULT_USERNAME`, `MEDMENTOR_DEFAULT_PASSWORD`, and
`MEDMENTOR_DEFAULT_DISPLAY_NAME`. Startup creates or reuses the
default local user if it does not exist yet, or load the existing one if it was
already bootstrapped in the database.

Or export the environment variable directly:

```bash
export GEMINI_API_KEY=your_gemini_api_key_here
```

## Quick Start with Docker Compose

1. Clone the repository:
```bash
git clone <repository-url>
cd MedMentor-RAG
```

2. Set your Gemini API key:
```bash
cp .env.example .env
# Edit .env and add your actual API key
```

3. Start the services:
```bash
docker-compose up --build
```

This will start:
- PostgreSQL with pgvector on port 5432
- Ollama for embeddings on port 11434
- Backend application on port 8080

Local-first auth direction:
- Keep one local doctor account in `.env` for development.
- On the first authenticated startup, bootstrap that user into PostgreSQL with
  the configured display name.
- On later startups, reuse that same DB user instead of creating duplicates.

4. Access the application:
- **Swagger UI:** http://localhost:8080/swagger-ui.html
- **API Docs:** http://localhost:8080/api-docs
- **Health Check:** http://localhost:8080/actuator/health

## RAG Pipeline Overview

RAG source files live in top-level `rag-data/` and are mounted into backend at `/rag-data`.

Supported extensions:
- `txt`
- `md`
- `markdown`
- `json`
- `csv`

Pipeline behavior:
- startup sync indexes all source files
- scheduled sync updates vectors when files change
- deleted source files are removed from vector store

Main RAG properties:
```properties
medmentor.rag.enabled=true
medmentor.rag.source-path=../rag-data
medmentor.rag.sync-interval-ms=30000
medmentor.rag.top-k=5
```

## Running Locally (Backend only)

If you prefer to run the backend locally while using PostgreSQL in Docker:

1. Start only PostgreSQL:
```bash
docker-compose up postgres
```

2. Build and run the backend:
```bash
cd backend
export GEMINI_API_KEY=your_gemini_api_key_here
./gradlew bootRun
```

## API Usage

The application provides two ways to interact with the AI:
1. **REST API** - Simple request/response (non-streaming)
2. **WebSocket** - Real-time streaming responses (recommended for frontend)

### Option 1: REST API (Non-Streaming)

#### POST /api/ai - Process AI Chat Request

Send a message to the AI patient simulator and receive a complete response.

**Request:**
```bash
curl -X POST http://localhost:8080/api/ai \
  -H "Content-Type: application/json" \
  -d '{
    "userMessage": "What symptoms are you experiencing?"
  }'
```

**Response:**
```json
{
  "aiMessage": "I've been feeling tired and have a persistent cough for the past week...",
  "requestId": "uuid-here",
  "timestamp": 1234567890
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid input (e.g., empty message)
- `500 Internal Server Error` - AI service error

### Option 2: WebSocket (Streaming - Recommended)

The WebSocket endpoint provides real-time streaming of AI responses using STOMP protocol with SockJS fallback.

**WebSocket Endpoint:** `ws://localhost:8080/ws`

**Client sends to:** `/app/ai/chat`

**Client subscribes to:** `/topic/ai/{conversationId}`

#### Message Format

**Request (send to /app/ai/chat):**
```json
{
  "conversationId": "optional-conversation-id",
  "userMessage": "What symptoms are you experiencing?"
}
```

**Response (receive on /topic/ai/{conversationId}):**
```json
{
  "conversationId": "conversation-id",
  "content": "I've been feeling...",
  "type": "chunk",
  "timestamp": 1234567890
}
```

**Message Types:**
- `chunk` - Text chunk from AI response
- `done` - Stream completed successfully
- `error` - An error occurred

#### Using WebSocket from Vue.js Frontend

Install STOMP client libraries:
```bash
npm install @stomp/stompjs sockjs-client
```

**Basic connection example:**

```javascript
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// Connect to WebSocket
const stompClient = new Client({
  webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
  onConnect: () => {
    console.log('Connected');

    // Subscribe to AI responses
    stompClient.subscribe(`/topic/ai/${conversationId}`, (message) => {
      const chunk = JSON.parse(message.body);

      if (chunk.type === 'chunk') {
        currentMessage += chunk.content;
      } else if (chunk.type === 'done') {
        console.log('Stream completed');
      }
    });
  }
});

stompClient.activate();

// Send message
function sendMessage(text) {
  stompClient.publish({
    destination: '/app/ai/chat',
    body: JSON.stringify({
      conversationId: conversationId,
      userMessage: text
    })
  });
}
```

**For complete Vue.js integration examples** (composables, error handling, reconnection logic), see the frontend documentation.

### Testing with Swagger UI

1. Open http://localhost:8080/swagger-ui.html
2. Expand the "AI Chat" section
3. Click "Try it out" on the POST /api/ai endpoint
4. Enter your request body
5. Click "Execute"

**Note:** Swagger UI does not support WebSocket testing. Use the Vue.js examples above or a WebSocket testing tool like Postman or websocat.

### RAG Endpoints (Authenticated)

Login first (cookie session):
```bash
curl -i -c /tmp/medmentor.cookies \
  -H "Content-Type: application/json" \
  -d '{"username":"doctor","password":"change_me"}' \
  http://localhost:8080/api/auth/login
```

Search vectors:
```bash
curl -b /tmp/medmentor.cookies \
  "http://localhost:8080/api/rag/search?query=heart%20failure%20dyspnea&topK=3"
```

Trigger manual reindex:
```bash
curl -X POST -b /tmp/medmentor.cookies \
  http://localhost:8080/api/rag/sync
```

Why these endpoints exist:
- `GET /api/rag/search` is a debug/verification surface to inspect retrieval quality independently from generation.
- `POST /api/rag/sync` is an operational control for immediate reindex after bulk file updates, without waiting for scheduled polling.
- Both endpoints help observability and safe rollout of new medical knowledge files.

## Project Structure

```
MedMentor-RAG/
├── backend/
│   ├── src/main/
│   │   ├── java/ru/medmentor/
│   │   │   ├── MedMentorRAGApplication.java
│   │   │   ├── config/          # Configuration (AI, WebSocket, OpenAPI)
│   │   │   ├── controller/      # REST & WebSocket controllers
│   │   │   ├── service/         # Business logic
│   │   │   ├── model/           # JPA entities
│   │   │   └── dto/             # Data transfer objects
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── schema.sql
│   │       └── logback-spring.xml
│   ├── build.gradle
│   ├── Dockerfile
│   └── logs/                    # Application logs (git-ignored)
├── docker-compose.yml
├── data/                        # PostgreSQL data (git-ignored)
└── README.md
```

## Configuration

Key configuration properties in `application.properties`:

### Database
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/medmentor
spring.datasource.username=medmentor
spring.datasource.password=medmentor123
```

### AI Model (Gemini)
```properties
spring.ai.google.genai.api-key=${GEMINI_API_KEY}
spring.ai.google.genai.chat.options.model=gemini-2.5-flash
spring.ai.google.genai.chat.options.temperature=0.7
spring.ai.google.genai.chat.options.max-output-tokens=2048
```

### Embeddings (Ollama)
```properties
spring.ai.ollama.base-url=http://localhost:11434
spring.ai.ollama.embedding.options.model=nomic-embed-text
spring.ai.ollama.init.pull-model-strategy=when_missing
```

### Custom AI Configuration
```properties
medmentor.ai.provider=gemini
medmentor.ai.model=gemini-2.5-flash
medmentor.ai.system-prompt=You are a helpful medical AI assistant...
medmentor.ai.constant-context=
```

## Logging

Logs are written to both console and file:
- **Console:** Real-time logs
- **File:** `backend/logs/medmentor-rag.log`
- **Rolling Policy:** Daily rotation, 30-day history, 1GB cap

Each request is tracked with a unique `requestId` for easy debugging.

## Health Checks

The application includes Spring Boot Actuator endpoints:

- **Health:** http://localhost:8080/actuator/health
- **Info:** http://localhost:8080/actuator/info

Health check includes database connectivity status.

## Database Schema

The application automatically creates:
- `conversation_log` table - Stores AI chat history
- `rag_source_files` table - Tracks indexed source files and chunk ids
- pgvector extension + `vector_store` table for embeddings retrieval

## Development Notes

### Adding Custom Context

You can add constant context to every AI request by setting:
```properties
medmentor.ai.constant-context=You are simulating a patient with specific symptoms...
```

### Changing AI Model

To use a different Gemini model:
```properties
spring.ai.google.genai.chat.options.model=gemini-3.1-pro-preview
medmentor.ai.model=gemini-3.1-pro-preview
```

### Debugging

Enable detailed logging:
```properties
logging.level.ru.medmentor=DEBUG
logging.level.org.springframework.ai=DEBUG
```

## Troubleshooting

### Database Connection Issues

1. Ensure PostgreSQL is running:
```bash
docker-compose ps
```

2. Check database logs:
```bash
docker-compose logs postgres
```

### AI API Issues

1. Verify your Gemini API key is set correctly in `.env`
2. Check the logs for API errors in `backend/logs/medmentor-rag.log`
3. Ensure you have API quota available (Gemini offers free tier)
4. Test API key: https://makersuite.google.com/

### Ollama Connection Issues

1. Ensure Ollama container is running:
```bash
docker-compose logs ollama
```

2. Verify Ollama is accessible:
```bash
curl http://localhost:11434/api/tags
```

3. Model will auto-download on first request (can take a few minutes)

### Port Already in Use

If port 8080, 5432, or 11434 is already in use, modify `docker-compose.yml`:
```yaml
ports:
  - "8081:8080"  # Change external port
```

### WebSocket Connection Issues

1. Check CORS configuration in `WebSocketConfig.java`
2. Verify SockJS fallback is working (HTTP instead of WS)
3. Test connection with browser console: `new WebSocket('ws://localhost:8080/ws')`

## Future Enhancements

- **Phase 4:** Quiz/testing functionality with medical case scenarios
- **Phase 5:** Vue.js frontend with chat interface

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]
