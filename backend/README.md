# MedMentor-RAG

Medical testing AI chat application where doctors practice diagnostics. The AI emulates a patient, and the doctor must reach a correct diagnosis within 10 messages.

## Phase 1 - Basic RAG Pipeline Setup

This is the initial MVP phase focused on setting up the backend infrastructure with AI chat capabilities.

## Technology Stack

- **Backend:** Spring Boot 3.5.10-SNAPSHOT
- **AI Integration:** Spring AI 1.1.2 with Anthropic Claude (claude-haiku-4-5-20251001)
- **Database:** PostgreSQL 16 with pgvector extension
- **API Documentation:** Swagger/OpenAPI (springdoc-openapi)
- **Language:** Java 25
- **Build Tool:** Gradle
- **Containerization:** Docker & Docker Compose

## Prerequisites

- Docker and Docker Compose installed
- Anthropic API key (get one at https://console.anthropic.com/)
- Java 25 (for local development without Docker)

## Environment Variables

Copy the `.env.example` file to `.env` and set your API key:

```bash
cp .env.example .env
# Then edit .env and add your actual API key
```

Or export the environment variable directly:

```bash
export ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

## Quick Start with Docker Compose

1. Clone the repository:
```bash
git clone <repository-url>
cd MedMentor-RAG
```

2. Set your Anthropic API key:
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
- Backend application on port 8080

4. Access the application:
- **Swagger UI:** http://localhost:8080/swagger-ui.html
- **API Docs:** http://localhost:8080/api-docs
- **Health Check:** http://localhost:8080/actuator/health

## Running Locally (Backend only)

If you prefer to run the backend locally while using PostgreSQL in Docker:

1. Start only PostgreSQL:
```bash
docker-compose up postgres
```

2. Build and run the backend:
```bash
cd backend
export ANTHROPIC_API_KEY=your_anthropic_api_key_here
./gradlew bootRun
```

## API Usage

### POST /ai - Process AI Chat Request

Send a message to the AI patient simulator.

**Request:**
```bash
curl -X POST http://localhost:8080/ai \
  -H "Content-Type: application/json" \
  -d '{
    "userMessage": "What symptoms are you experiencing?",
    "metadata": {}
  }'
```

**Response:**
```json
{
  "aiMessage": "I've been feeling tired and have a persistent cough for the past week...",
  "requestId": "uuid-here",
  "timestamp": 1234567890,
  "metadata": {}
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid input (e.g., empty message)
- `500 Internal Server Error` - AI service error

### Testing with Swagger UI

1. Open http://localhost:8080/swagger-ui.html
2. Expand the "AI Chat" section
3. Click "Try it out" on the POST /ai endpoint
4. Enter your request body
5. Click "Execute"

## Project Structure

```
MedMentor-RAG/
├── backend/
│   ├── src/main/
│   │   ├── java/ru/medmentor/
│   │   │   ├── MedMentorRAGApplication.java
│   │   │   ├── config/          # Configuration classes
│   │   │   ├── controller/      # REST controllers
│   │   │   ├── service/         # Business logic
│   │   │   ├── model/           # JPA entities
│   │   │   └── dto/             # Data transfer objects
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── schema.sql
│   │       └── logback-spring.xml
│   ├── build.gradle
│   └── Dockerfile
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

### AI Model
```properties
spring.ai.anthropic.api-key=${ANTHROPIC_API_KEY}
spring.ai.anthropic.chat.options.model=claude-haiku-4-5-20251001
spring.ai.anthropic.chat.options.temperature=0.7
spring.ai.anthropic.chat.options.max-tokens=2048
```

### Custom AI Configuration
```properties
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
- pgvector extension - For future RAG functionality
- Vector store tables (auto-created by Spring AI)

## Development Notes

### Adding Custom Context

You can add constant context to every AI request by setting:
```properties
medmentor.ai.constant-context=You are simulating a patient with specific symptoms...
```

### Changing AI Model

To use a different Claude model:
```properties
spring.ai.anthropic.chat.options.model=claude-opus-4-5-20251001
medmentor.ai.model=claude-opus-4-5-20251001
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

1. Verify your API key is set correctly
2. Check the logs for API errors in `backend/logs/medmentor-rag.log`
3. Ensure you have API credits available

### Port Already in Use

If port 8080 or 5432 is already in use, modify `docker-compose.yml`:
```yaml
ports:
  - "8081:8080"  # Change external port
```

## Future Enhancements

- **Phase 2:** RAG pipeline with document ingestion and vector search
- **Phase 3:** Quiz/testing functionality with medical case scenarios
- **Phase 4:** Vue.js frontend with chat interface

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]
