package ru.medmentor.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import ru.medmentor.config.RagProperties;

import java.util.List;
import java.util.Map;
import java.util.function.Consumer;
import java.util.stream.Collectors;

@Service
public class RagSearchService {

    private static final Logger log = LoggerFactory.getLogger(RagSearchService.class);

    /**
     * Audit logger for the exact text that flows in and out of the vector store
     * for each prompt build. Toggle to DEBUG via
     * `logging.level.ru.medmentor.audit.rag=DEBUG` (or the grouped
     * `ru.medmentor.audit` family).
     */
    private static final Logger ragAudit = LoggerFactory.getLogger("ru.medmentor.audit.rag");

    private final RagProperties ragProperties;
    private final VectorStore vectorStore;

    public RagSearchService(RagProperties ragProperties, VectorStore vectorStore) {
        this.ragProperties = ragProperties;
        this.vectorStore = vectorStore;
    }

    public List<Document> search(String query, Integer topKOverride) {
        return search(query, topKOverride, ragProperties.getSimilarityThreshold());
    }

    /**
     * Variant that lets the caller override the similarity threshold. Used by the
     * diagnostic re-query in {@link #buildPromptContext(String, String, Consumer)}
     * to surface near-misses when the configured threshold rejects everything.
     */
    private List<Document> search(String query, Integer topKOverride, double threshold) {
        if (!ragProperties.isEnabled()) {
            return List.of();
        }
        if (query == null || query.isBlank()) {
            throw new IllegalArgumentException("RAG query must not be blank");
        }

        final int topK = resolveTopK(topKOverride);
        final SearchRequest searchRequest = SearchRequest.builder()
                .query(truncateQuery(query.trim()))
                .topK(topK)
                .similarityThreshold(threshold)
                .build();
        return vectorStore.similaritySearch(searchRequest);
    }

    private String truncateQuery(String query) {
        final int maxChars = Math.max(200, ragProperties.getMaxQueryChars());
        if (query.length() <= maxChars) {
            return query;
        }
        log.warn("RAG query truncated from {} to {} chars to fit embedding context", query.length(), maxChars);
        return query.substring(0, maxChars);
    }

    public String buildPromptContext(String promptKind, String query) {
        return buildPromptContext(promptKind, query, warning -> { });
    }

    /**
     * Run a RAG search and render the retrieved chunks as a single prompt-ready
     * context string. Both the query text and the rendered context are emitted
     * at DEBUG on the {@code ru.medmentor.audit.rag} logger, so enabling that
     * logger gives a 1:1 view of what the LLM ends up seeing in the
     * `Relevant clinical recommendations` block.
     *
     * @param promptKind short label distinguishing where this call comes from
     *                   (e.g. "opening", "reply", "score-review"). Only used
     *                   in audit logs to correlate with the LLM prompt audit.
     */
    public String buildPromptContext(String promptKind, String query, Consumer<String> warningSink) {
        final double threshold = ragProperties.getSimilarityThreshold();
        if (ragAudit.isDebugEnabled()) {
            ragAudit.debug("RAG query [{}] (threshold={}):\n{}", promptKind, threshold, query);
        }
        try {
            final List<Document> documents = search(query, null, threshold);
            if (documents.isEmpty()) {
                logEmptyResultDiagnostics(promptKind, query, threshold);
                return "";
            }

            final String rendered = documents.stream()
                    .map(this::toPromptSnippet)
                    .collect(Collectors.joining("\n\n"));
            if (ragAudit.isDebugEnabled()) {
                ragAudit.debug("RAG retrieval [{}] returned {} document(s) above threshold={}:\n{}",
                        promptKind, documents.size(), threshold, rendered);
            }
            return rendered;
        } catch (RuntimeException exception) {
            final String reason = exception.getMessage();
            log.warn("RAG search failed, continuing without retrieved context: {}", reason);
            warningSink.accept("RAG search failed: " + reason);
            return "";
        }
    }

    /**
     * When the configured threshold rejects every chunk, repeat the search with
     * threshold=0 so the audit log shows "what almost made it" together with the
     * actual scores. This is the cheapest way to tell whether the threshold is
     * too strict, the query is poor, or the corpus genuinely lacks the topic —
     * without changing application config.
     */
    private void logEmptyResultDiagnostics(String promptKind, String query, double threshold) {
        if (!ragAudit.isDebugEnabled()) {
            return;
        }
        try {
            final List<Document> nearMisses = search(query, null, 0.0);
            if (nearMisses.isEmpty()) {
                ragAudit.debug("RAG retrieval [{}] returned 0 documents and diagnostic re-query (threshold=0) also returned 0 — corpus may be empty or query empty", promptKind);
                return;
            }
            final String rendered = nearMisses.stream()
                    .map(this::toPromptSnippetWithScore)
                    .collect(Collectors.joining("\n\n"));
            ragAudit.debug("RAG retrieval [{}] returned 0 documents above threshold={}. Diagnostic top-{} (threshold=0):\n{}",
                    promptKind, threshold, nearMisses.size(), rendered);
        } catch (RuntimeException diagnosticException) {
            ragAudit.debug("RAG retrieval [{}] returned 0 documents and diagnostic re-query failed: {}",
                    promptKind, diagnosticException.getMessage());
        }
    }

    private int resolveTopK(Integer topKOverride) {
        if (topKOverride == null) {
            return ragProperties.getTopK();
        }
        final int normalized = Math.max(1, topKOverride);
        return Math.min(normalized, 20);
    }

    private String toPromptSnippet(Document document) {
        final Map<String, Object> metadata = document.getMetadata();
        final String sourcePath = String.valueOf(metadata.getOrDefault("sourcePath", "unknown"));
        final String chunkIndex = String.valueOf(metadata.getOrDefault("chunkIndex", "?"));
        final String chunkText = trimForPrompt(document.getText());
        return "[source=%s chunk=%s]\n%s".formatted(sourcePath, chunkIndex, chunkText);
    }

    /**
     * Snippet renderer for diagnostic logs. Same as {@link #toPromptSnippet} but
     * also surfaces the cosine similarity (derived from the `distance` metadata
     * key Spring AI's pgvector store sets after `similaritySearch`). Helps
     * eyeballing whether the configured threshold is in the right ballpark.
     */
    private String toPromptSnippetWithScore(Document document) {
        final Map<String, Object> metadata = document.getMetadata();
        final String sourcePath = String.valueOf(metadata.getOrDefault("sourcePath", "unknown"));
        final String chunkIndex = String.valueOf(metadata.getOrDefault("chunkIndex", "?"));
        final Object distanceRaw = metadata.get("distance");
        final String scoreLabel;
        if (distanceRaw instanceof Number distance) {
            final double similarity = 1.0 - distance.doubleValue();
            scoreLabel = String.format("similarity=%.3f", similarity);
        } else {
            scoreLabel = "similarity=n/a";
        }
        final String chunkText = trimForPrompt(document.getText());
        return "[%s source=%s chunk=%s]\n%s".formatted(scoreLabel, sourcePath, chunkIndex, chunkText);
    }

    private String trimForPrompt(String value) {
        if (value == null) {
            return "";
        }
        final int maxChars = Math.max(100, ragProperties.getMaxChunkCharsForPrompt());
        final String normalized = value.trim();
        if (normalized.length() <= maxChars) {
            return normalized;
        }
        return normalized.substring(0, maxChars) + "...";
    }
}
