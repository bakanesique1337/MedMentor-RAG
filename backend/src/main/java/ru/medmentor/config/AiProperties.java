package ru.medmentor.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "medmentor.ai")
public class AiProperties {

    /**
     * AI provider (anthropic, openai, etc.)
     */
    private String provider = "anthropic";

    /**
     * Model to use for chat completions
     */
    private String model = "claude-haiku-4-5-20251001";

    /**
     * Temperature for response generation (0.0 - 1.0)
     */
    private Double temperature = 0.7;

    /**
     * Maximum tokens in response
     */
    private Integer maxTokens = 2048;

    /**
     * System prompt that provides context to the AI
     */
    private String systemPrompt = "You are a helpful medical AI assistant for the MedMentor application.";

    /**
     * Constant context text to be added to every request
     */
    private String constantContext = "";
}
