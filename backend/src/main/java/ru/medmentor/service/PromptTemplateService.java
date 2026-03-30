package ru.medmentor.service;

public interface PromptTemplateService {

    String getGlobalSystemPrompt();

    String getPatientRolePrompt();

    String getSessionOpeningPrompt();

    String getScoreReviewPrompt();
}
