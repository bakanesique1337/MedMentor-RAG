package ru.medmentor.service;

import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import ru.medmentor.config.RagProperties;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class RagSearchService {

    private final RagProperties ragProperties;
    private final VectorStore vectorStore;

    public RagSearchService(RagProperties ragProperties, VectorStore vectorStore) {
        this.ragProperties = ragProperties;
        this.vectorStore = vectorStore;
    }

    public List<Document> search(String query, Integer topKOverride) {
        if (!ragProperties.isEnabled()) {
            return List.of();
        }
        if (query == null || query.isBlank()) {
            throw new IllegalArgumentException("RAG query must not be blank");
        }

        final int topK = resolveTopK(topKOverride);
        final SearchRequest searchRequest = SearchRequest.builder()
                .query(query.trim())
                .topK(topK)
                .similarityThresholdAll()
                .build();
        return vectorStore.similaritySearch(searchRequest);
    }

    public String buildPromptContext(String query) {
        final List<Document> documents = search(query, null);
        if (documents.isEmpty()) {
            return "";
        }

        return documents.stream()
                .map(this::toPromptSnippet)
                .collect(Collectors.joining("\n\n"));
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
