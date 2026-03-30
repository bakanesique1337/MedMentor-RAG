# MedMentor-RAG

Hybrid training system for medical professionals using semantic search and a RAG pipeline.

## Project Structure

```text
MedMentor-RAG/
├── backend/                 # Spring Boot backend (simulation APIs, AI orchestration, RAG services)
│   ├── src/main/java/       # Application source code
│   ├── src/main/resources/  # application.properties, prompts, schema.sql
│   └── src/test/            # Unit and web-layer tests
├── cases/                   # Medical simulation case JSON files (patient scenarios)
├── rag-data/                # RAG source documents (indexed by backend into pgvector)
├── data/                    # Local runtime persistence (e.g., postgres volume data)
├── logs/                    # Runtime logs
├── docker-compose.yml       # Local stack: backend + postgres(pgvector) + ollama
└── .env.example             # Environment variable template
```

## RAG-Related Folders

- `rag-data/`
  Source knowledge base for retrieval. Put `.txt`, `.md`, `.markdown`, `.json`, and `.csv` files here.
  The backend ingestion job monitors this folder, chunks documents, creates embeddings, and updates vectors.

- `backend/src/main/java/ru/medmentor/service/`
  Contains RAG pipeline services:
  - ingestion/sync service (startup + scheduled + manual sync)
  - source parser/chunking services
  - search service used to build prompt context

- `backend/src/main/java/ru/medmentor/controller/RagController.java`
  Exposes authenticated RAG endpoints (search and manual sync trigger).

- `backend/src/main/java/ru/medmentor/model/RagSourceFile.java`
  Tracks indexed file state (hash/metadata) for incremental re-indexing.

- `backend/src/main/java/ru/medmentor/repository/RagSourceFileRepository.java`
  Persistence access for RAG source file index state.

- `data/` (when running local Docker)
  Stores PostgreSQL data on disk, including pgvector records generated from `rag-data/`.

For backend setup, API usage, and runtime details, see `backend/README.md`.
