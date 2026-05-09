package ru.medmentor.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

@Data
@Component
@ConfigurationProperties(prefix = "medmentor.rag")
public class RagProperties {

    private boolean enabled = true;

    private String sourcePath = "../rag-data";

    private long syncIntervalMs = 30000;

    private int chunkSize = 1200;

    private int chunkOverlap = 200;

    private int minChunkSize = 120;

    private int topK = 5;

    private int maxChunkCharsForPrompt = 700;

    private int maxQueryChars = 4000;

    /**
     * Minimum cosine similarity (0..1, higher = more similar) a chunk must reach
     * to be returned as part of the LLM context. Below this threshold the chunk
     * is dropped, even if it would otherwise be in the top-K. With a properly
     * sized corpus and a strong embedder, 0.5..0.65 is the typical sweet spot.
     */
    private double similarityThreshold = 0.6;

    /**
     * How many times the case's correct diagnosis is repeated at the start of a
     * RAG embedding query. Vector embedders have no native term weights, so
     * repetition is the simplest way to bias the embedding toward the formal
     * diagnosis vocabulary that matches the clinical-recommendations corpus.
     * Range 1..3 — beyond that the diagnosis dominates and drowns the rest of
     * the case context. The diagnosis only feeds the embedder; it never reaches
     * the patient-facing LLM prompt.
     */
    private int diagnosisQueryWeight = 2;

    private List<String> includeExtensions = List.of("txt", "md", "markdown", "json", "csv");
}
