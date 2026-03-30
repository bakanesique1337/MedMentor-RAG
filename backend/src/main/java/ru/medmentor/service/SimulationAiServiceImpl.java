package ru.medmentor.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import ru.medmentor.model.ConversationMessage;
import ru.medmentor.model.MedicalCase;
import ru.medmentor.model.MedicalCaseFacts;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SimulationAiServiceImpl implements SimulationAiService {

    private final ChatClient chatClient;
    private final PromptTemplateService promptTemplateService;
    private final RagSearchService ragSearchService;
    private final ObjectMapper objectMapper;

    public SimulationAiServiceImpl(
            ChatClient chatClient,
            PromptTemplateService promptTemplateService,
            RagSearchService ragSearchService,
            ObjectMapper objectMapper
    ) {
        this.chatClient = chatClient;
        this.promptTemplateService = promptTemplateService;
        this.ragSearchService = ragSearchService;
        this.objectMapper = objectMapper;
    }

    @Override
    public String generateOpeningMessage(MedicalCase medicalCase) {
        return callText(buildOpeningPrompt(medicalCase));
    }

    @Override
    public Flux<String> streamOpeningMessage(MedicalCase medicalCase) {
        return streamText(buildOpeningPrompt(medicalCase));
    }

    @Override
    public String generatePatientReply(
            MedicalCase medicalCase,
            List<ConversationMessage> conversationHistory,
            String doctorMessage
    ) {
        return callText(buildReplyPrompt(medicalCase, conversationHistory, doctorMessage));
    }

    @Override
    public Flux<String> streamPatientReply(
            MedicalCase medicalCase,
            List<ConversationMessage> conversationHistory,
            String doctorMessage
    ) {
        return streamText(buildReplyPrompt(medicalCase, conversationHistory, doctorMessage));
    }

    @Override
    public ScoreReviewPayload generateScoreReview(
            MedicalCase medicalCase,
            List<ConversationMessage> conversationHistory,
            String selectedDiagnosis
    ) {
        final String ragContext = ragSearchService.buildPromptContext(
                buildScoreRagQuery(medicalCase, conversationHistory, selectedDiagnosis)
        );
        final String prompt = """
                %s

                Case data:
                %s

                Relevant clinical recommendations:
                %s

                Selected diagnosis:
                %s

                Conversation:
                %s
                """.formatted(
                promptTemplateService.getScoreReviewPrompt(),
                formatCase(medicalCase),
                ragContext.isBlank() ? "(none)" : ragContext,
                selectedDiagnosis,
                formatConversation(conversationHistory)
        );
        final String rawResponse = callText(prompt);
        return parseScorePayload(rawResponse);
    }

    private String callText(String prompt) {
        final String response = chatClient.prompt()
                .user(prompt)
                .call()
                .content();
        if (response == null || response.isBlank()) {
            throw new IllegalStateException("AI returned an empty response");
        }
        return response.trim();
    }

    private Flux<String> streamText(String prompt) {
        return chatClient.prompt()
                .user(prompt)
                .stream()
                .content()
                .filter(chunk -> chunk != null && !chunk.isEmpty());
    }

    private ScoreReviewPayload parseScorePayload(String rawResponse) {
        final String json = extractJsonObject(rawResponse);
        try {
            final ScoreReviewPayload payload = objectMapper.readValue(json, ScoreReviewPayload.class);
            if (payload.score() == null || payload.summary() == null || payload.summary().isBlank()) {
                throw new IllegalStateException("Score response is missing required fields");
            }
            return payload;
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to parse score response: " + rawResponse, exception);
        }
    }

    private String extractJsonObject(String rawResponse) {
        final String trimmed = rawResponse.trim();
        final int fencedStart = trimmed.indexOf("```");
        if (fencedStart >= 0) {
            final int firstBrace = trimmed.indexOf('{', fencedStart);
            final int lastBrace = trimmed.lastIndexOf('}');
            if (firstBrace >= 0 && lastBrace > firstBrace) {
                return trimmed.substring(firstBrace, lastBrace + 1);
            }
        }
        final int firstBrace = trimmed.indexOf('{');
        final int lastBrace = trimmed.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return trimmed.substring(firstBrace, lastBrace + 1);
        }
        throw new IllegalStateException("No JSON object found in score response: " + rawResponse);
    }

    private String formatCase(MedicalCase medicalCase) {
        final MedicalCaseFacts facts = medicalCase.facts();
        return """
                id: %s
                category: %s
                difficulty: %s
                patientName: %s
                patientAge: %d
                patientSex: %s
                patientBrief: %s
                openingComplaint: %s
                authorNote: %s
                symptoms: %s
                history: %s
                negatives: %s
                diagnosisOptions: %s
                correctDiagnosis: %s
                """.formatted(
                medicalCase.id(),
                medicalCase.category(),
                medicalCase.difficulty(),
                medicalCase.patientName(),
                medicalCase.patientAge(),
                medicalCase.patientSex(),
                medicalCase.patientBrief(),
                medicalCase.openingComplaint(),
                medicalCase.authorNote(),
                String.join(", ", facts.symptoms()),
                String.join(", ", facts.history()),
                String.join(", ", facts.negatives()),
                String.join(", ", medicalCase.diagnosisOptions()),
                medicalCase.correctDiagnosis()
        );
    }

    private String buildOpeningPrompt(MedicalCase medicalCase) {
        final String ragContext = ragSearchService.buildPromptContext(buildOpeningRagQuery(medicalCase));
        return """
                %s

                Case data:
                %s

                Relevant clinical recommendations:
                %s

                Instructions:
                %s
                """.formatted(
                promptTemplateService.getPatientRolePrompt(),
                formatCase(medicalCase),
                ragContext.isBlank() ? "(none)" : ragContext,
                promptTemplateService.getSessionOpeningPrompt()
        );
    }

    private String buildReplyPrompt(
            MedicalCase medicalCase,
            List<ConversationMessage> conversationHistory,
            String doctorMessage
    ) {
        final String ragContext = ragSearchService.buildPromptContext(
                buildReplyRagQuery(medicalCase, conversationHistory, doctorMessage)
        );
        return """
                %s

                Case data:
                %s

                Relevant clinical recommendations:
                %s

                Conversation so far:
                %s

                Latest doctor message:
                %s
                """.formatted(
                promptTemplateService.getPatientRolePrompt(),
                formatCase(medicalCase),
                ragContext.isBlank() ? "(none)" : ragContext,
                formatConversation(conversationHistory),
                doctorMessage
        );
    }

    private String buildOpeningRagQuery(MedicalCase medicalCase) {
        final MedicalCaseFacts facts = medicalCase.facts();
        return """
                opening patient interaction
                patient age: %d
                patient sex: %s
                complaint: %s
                symptoms: %s
                history: %s
                negatives: %s
                possible diagnoses: %s
                """.formatted(
                medicalCase.patientAge(),
                medicalCase.patientSex(),
                medicalCase.openingComplaint(),
                String.join(", ", facts.symptoms()),
                String.join(", ", facts.history()),
                String.join(", ", facts.negatives()),
                String.join(", ", medicalCase.diagnosisOptions())
        );
    }

    private String buildReplyRagQuery(
            MedicalCase medicalCase,
            List<ConversationMessage> conversationHistory,
            String doctorMessage
    ) {
        final MedicalCaseFacts facts = medicalCase.facts();
        return """
                patient follow-up interaction
                patient age: %d
                patient sex: %s
                symptoms: %s
                history: %s
                negatives: %s
                doctor message: %s
                conversation summary:
                %s
                """.formatted(
                medicalCase.patientAge(),
                medicalCase.patientSex(),
                String.join(", ", facts.symptoms()),
                String.join(", ", facts.history()),
                String.join(", ", facts.negatives()),
                doctorMessage,
                formatConversation(conversationHistory)
        );
    }

    private String buildScoreRagQuery(
            MedicalCase medicalCase,
            List<ConversationMessage> conversationHistory,
            String selectedDiagnosis
    ) {
        final MedicalCaseFacts facts = medicalCase.facts();
        return """
                scoring medical interview
                patient age: %d
                patient sex: %s
                symptoms: %s
                history: %s
                negatives: %s
                selected diagnosis: %s
                correct diagnosis: %s
                conversation:
                %s
                """.formatted(
                medicalCase.patientAge(),
                medicalCase.patientSex(),
                String.join(", ", facts.symptoms()),
                String.join(", ", facts.history()),
                String.join(", ", facts.negatives()),
                selectedDiagnosis,
                medicalCase.correctDiagnosis(),
                formatConversation(conversationHistory)
        );
    }

    private String formatConversation(List<ConversationMessage> conversationHistory) {
        if (conversationHistory.isEmpty()) {
            return "(no conversation yet)";
        }
        return conversationHistory.stream()
                .map(message -> message.getRole().name().toLowerCase() + ": " + message.getContent())
                .collect(Collectors.joining("\n"));
    }
}
