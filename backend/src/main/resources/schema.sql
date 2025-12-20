-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Conversation log table for storing AI chat history
CREATE TABLE IF NOT EXISTS conversation_log (
    id BIGSERIAL PRIMARY KEY,
    request_id VARCHAR(255) NOT NULL,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    model_used VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups by request_id
CREATE INDEX IF NOT EXISTS idx_conversation_log_request_id ON conversation_log(request_id);

-- Index for timestamp-based queries
CREATE INDEX IF NOT EXISTS idx_conversation_log_timestamp ON conversation_log(timestamp);

-- Spring AI vector store table (will be auto-created by Spring AI, but defining here for reference)
-- CREATE TABLE IF NOT EXISTS vector_store (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     content TEXT,
--     metadata JSONB,
--     embedding vector(1536)
-- );
