package ru.medmentor.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "medmentor.ai")
public class AiProperties {

    /**
     * AI provider (gemini, anthropic, openai, etc.)
     */
    private String provider = "gemini";

    /**
     * Model to use for chat completions
     */
    private String model = "gemini-2.5-flash";

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

    private String promptGlobalSystem = "classpath:prompts/global-system.txt";

    private String promptPatientRole = "classpath:prompts/patient-role.txt";

    private String promptSessionOpening = "classpath:prompts/session-opening.txt";

    private String promptScoreReview = "classpath:prompts/score-review.txt";
}
