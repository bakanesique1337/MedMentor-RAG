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

-- Backfill the exam_revealed flag for existing simulation_sessions rows.
-- Hibernate ddl-auto=update cannot add a NOT NULL column without a DEFAULT
-- on a table that already has rows. With spring.jpa.defer-datasource-initialization=true,
-- Hibernate creates/updates the table first, so this ALTER always sees an existing table.
ALTER TABLE simulation_sessions ADD COLUMN IF NOT EXISTS exam_revealed boolean NOT NULL DEFAULT false;

-- Free-text diagnosis fields submitted alongside the selected diagnosis.
-- Both are nullable: legacy sessions and DiagnosisPanel submissions leave them NULL.
ALTER TABLE simulation_sessions ADD COLUMN IF NOT EXISTS selected_diagnosis_rationale TEXT;
ALTER TABLE simulation_sessions ADD COLUMN IF NOT EXISTS selected_diagnosis_confidence SMALLINT;
ALTER TABLE simulation_sessions DROP CONSTRAINT IF EXISTS simulation_sessions_confidence_range;
ALTER TABLE simulation_sessions ADD CONSTRAINT simulation_sessions_confidence_range
    CHECK (selected_diagnosis_confidence IS NULL OR (selected_diagnosis_confidence BETWEEN 0 AND 100));

-- Rich case-result fields produced by the LLM during scoring. Stored as JSONB to keep the
-- schema flexible and avoid a separate notes table for what is essentially a single result blob.
ALTER TABLE simulation_results ADD COLUMN IF NOT EXISTS criterion_notes jsonb;
ALTER TABLE simulation_results ADD COLUMN IF NOT EXISTS key_turns jsonb;
ALTER TABLE simulation_results ADD COLUMN IF NOT EXISTS missed_findings jsonb;

-- Composite score (mean of the five criteria, 0-1) persisted per session so the
-- profile stats overview and the cases-list "Average score" stat can read it
-- directly instead of recomputing from criterion fields on every request.
ALTER TABLE user_scores ADD COLUMN IF NOT EXISTS total_score DOUBLE PRECISION NOT NULL DEFAULT 0.0;
UPDATE user_scores
   SET total_score = ROUND(((politeness + questioning_structure + thoroughness + empathy + diagnosis_correct) / 5.0)::numeric, 2)
   WHERE total_score = 0.0;

-- Refresh the CHECK constraint that pins simulation_sessions.state to the enum values.
-- Hibernate ddl-auto=update creates this constraint on initial schema generation but never
-- regenerates it when the enum gains new values (e.g. ABANDONED). Drop the legacy
-- constraint if present and recreate it with the current enum set.
ALTER TABLE simulation_sessions DROP CONSTRAINT IF EXISTS simulation_sessions_state_check;
ALTER TABLE simulation_sessions ADD CONSTRAINT simulation_sessions_state_check
    CHECK (state IN (
        'CASE_BROWSE',
        'CASE_SELECTED',
        'CASE_STARTED',
        'IN_PROGRESS',
        'DIAGNOSIS_SELECT',
        'SCORING',
        'COMPLETED',
        'ABANDONED'
    ));

-- Spring AI vector store table (will be auto-created by Spring AI, but defining here for reference)
-- CREATE TABLE IF NOT EXISTS vector_store (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     content TEXT,
--     metadata JSONB,
--     embedding vector(1536)
-- );
