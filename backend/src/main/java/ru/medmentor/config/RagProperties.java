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

    private List<String> includeExtensions = List.of("txt", "md", "markdown", "json", "csv");
}
