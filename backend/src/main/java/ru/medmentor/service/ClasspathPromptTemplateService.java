package ru.medmentor.service;

import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import ru.medmentor.config.AiProperties;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;

@Service
public class ClasspathPromptTemplateService implements PromptTemplateService {

    private final ResourceLoader resourceLoader;
    private final AiProperties aiProperties;

    private String globalSystemPrompt;
    private String patientRolePrompt;
    private String sessionOpeningPrompt;
    private String scoreReviewPrompt;

    public ClasspathPromptTemplateService(ResourceLoader resourceLoader, AiProperties aiProperties) {
        this.resourceLoader = resourceLoader;
        this.aiProperties = aiProperties;
    }

    @PostConstruct
    public void loadPrompts() {
        globalSystemPrompt = readRequiredPrompt(aiProperties.getPromptGlobalSystem());
        patientRolePrompt = readRequiredPrompt(aiProperties.getPromptPatientRole());
        sessionOpeningPrompt = readRequiredPrompt(aiProperties.getPromptSessionOpening());
        scoreReviewPrompt = readRequiredPrompt(aiProperties.getPromptScoreReview());
    }

    @Override
    public String getGlobalSystemPrompt() {
        return globalSystemPrompt;
    }

    @Override
    public String getPatientRolePrompt() {
        return patientRolePrompt;
    }

    @Override
    public String getSessionOpeningPrompt() {
        return sessionOpeningPrompt;
    }

    @Override
    public String getScoreReviewPrompt() {
        return scoreReviewPrompt;
    }

    private String readRequiredPrompt(String location) {
        try (InputStream inputStream = resourceLoader.getResource(location).getInputStream()) {
            final String prompt = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8).trim();
            if (prompt.isEmpty()) {
                throw new IllegalStateException("Prompt file is empty: " + location);
            }
            return prompt;
        } catch (IOException exception) {
            throw new UncheckedIOException("Failed to load prompt file: " + location, exception);
        }
    }
}
