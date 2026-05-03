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
import java.util.Locale;
import java.util.function.Consumer;
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
        return callText(buildOpeningPrompt(medicalCase, warning -> { }));
    }

    @Override
    public Flux<String> streamOpeningMessage(MedicalCase medicalCase) {
        return streamOpeningMessage(medicalCase, warning -> { });
    }

    @Override
    public Flux<String> streamOpeningMessage(MedicalCase medicalCase, Consumer<String> warningSink) {
        return streamText(buildOpeningPrompt(medicalCase, warningSink));
    }

    @Override
    public String generatePatientReply(
            MedicalCase medicalCase,
            List<ConversationMessage> conversationHistory,
            String doctorMessage
    ) {
        return callText(buildReplyPrompt(medicalCase, conversationHistory, doctorMessage, warning -> { }));
    }

    @Override
    public Flux<String> streamPatientReply(
            MedicalCase medicalCase,
            List<ConversationMessage> conversationHistory,
            String doctorMessage
    ) {
        return streamPatientReply(medicalCase, conversationHistory, doctorMessage, warning -> { });
    }

    @Override
    public Flux<String> streamPatientReply(
            MedicalCase medicalCase,
            List<ConversationMessage> conversationHistory,
            String doctorMessage,
            Consumer<String> warningSink
    ) {
        return streamText(buildReplyPrompt(medicalCase, conversationHistory, doctorMessage, warningSink));
    }

    @Override
    public Flux<String> streamExaminationFinding(
            MedicalCase medicalCase,
            List<ConversationMessage> conversationHistory,
            String doctorMessage,
            Consumer<String> warningSink
    ) {
        return streamText(buildExaminationFindingPrompt(medicalCase, conversationHistory, doctorMessage, warningSink));
    }

    @Override
    public ScoreReviewPayload generateScoreReview(
            MedicalCase medicalCase,
            List<ConversationMessage> conversationHistory,
            String selectedDiagnosis,
            String selectedDiagnosisRationale,
            Integer selectedDiagnosisConfidence
    ) {
        final String ragContext = ragSearchService.buildPromptContext(
                buildScoreRagQuery(medicalCase, conversationHistory, selectedDiagnosis)
        );
        final String rationaleSection = selectedDiagnosisRationale == null || selectedDiagnosisRationale.isBlank()
                ? "(not provided)"
                : selectedDiagnosisRationale.trim();
        final String confidenceSection = selectedDiagnosisConfidence == null
                ? "(not provided)"
                : selectedDiagnosisConfidence + "%";
        final String prompt = """
                %s

                Case data:
                %s

                Relevant clinical recommendations:
                %s

                Selected diagnosis:
                %s

                Doctor's rationale:
                %s

                Doctor's self-reported confidence:
                %s

                Conversation (each doctor message is labelled with its 1-based `doctor turn N`
                index; reference these N values verbatim in the `turn` field of `keyTurns`):
                %s
                """.formatted(
                promptTemplateService.getScoreReviewPrompt(),
                formatCase(medicalCase),
                ragContext.isBlank() ? "(none)" : ragContext,
                selectedDiagnosis,
                rationaleSection,
                confidenceSection,
                formatConversationWithTurnIndex(conversationHistory)
        );
        final String rawResponse = callText(prompt);
        return parseScorePayload(rawResponse);
    }

    /**
     * Formats the conversation labelling each doctor message with its 1-based index. The score
     * review prompt asks the model to cite the same indices in `keyTurns.turn`, so explicit
     * numbering removes the need for the model to count messages itself.
     */
    private String formatConversationWithTurnIndex(List<ConversationMessage> conversationHistory) {
        if (conversationHistory.isEmpty()) {
            return "(no conversation yet)";
        }
        final StringBuilder builder = new StringBuilder();
        int doctorTurn = 0;
        for (ConversationMessage message : conversationHistory) {
            if (builder.length() > 0) {
                builder.append('\n');
            }
            switch (message.getRole()) {
                case DOCTOR -> {
                    doctorTurn += 1;
                    builder.append(String.format("doctor turn %d: %s", doctorTurn, message.getContent()));
                }
                case PATIENT -> builder.append("patient: ").append(message.getContent());
                default -> builder.append(message.getRole().name().toLowerCase(Locale.ROOT))
                        .append(": ").append(message.getContent());
            }
        }
        return builder.toString();
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

    private String buildOpeningPrompt(MedicalCase medicalCase, Consumer<String> warningSink) {
        final String ragContext = ragSearchService.buildPromptContext(buildOpeningRagQuery(medicalCase), warningSink);
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
            String doctorMessage,
            Consumer<String> warningSink
    ) {
        final String ragContext = ragSearchService.buildPromptContext(
                buildReplyRagQuery(medicalCase, conversationHistory, doctorMessage),
                warningSink
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

    private String buildExaminationFindingPrompt(
            MedicalCase medicalCase,
            List<ConversationMessage> conversationHistory,
            String doctorMessage,
            Consumer<String> warningSink
    ) {
        final String ragContext = ragSearchService.buildPromptContext(
                buildExaminationFindingRagQuery(medicalCase, conversationHistory, doctorMessage),
                warningSink
        );
        return """
                %s

                Case data:
                %s

                Relevant clinical recommendations:
                %s

                Conversation so far:
                %s

                Targeted maneuver requested by the doctor:
                %s
                """.formatted(
                promptTemplateService.getExaminationFindingPrompt(),
                formatCase(medicalCase),
                ragContext.isBlank() ? "(none)" : ragContext,
                formatConversation(conversationHistory),
                doctorMessage
        );
    }

    private String buildExaminationFindingRagQuery(
            MedicalCase medicalCase,
            List<ConversationMessage> conversationHistory,
            String doctorMessage
    ) {
        final MedicalCaseFacts facts = medicalCase.facts();
        return """
                targeted physical examination finding
                patient age: %d
                patient sex: %s
                symptoms: %s
                history: %s
                negatives: %s
                possible diagnoses: %s
                doctor maneuver: %s
                conversation summary:
                %s
                """.formatted(
                medicalCase.patientAge(),
                medicalCase.patientSex(),
                String.join(", ", facts.symptoms()),
                String.join(", ", facts.history()),
                String.join(", ", facts.negatives()),
                String.join(", ", medicalCase.diagnosisOptions()),
                doctorMessage,
                formatConversation(conversationHistory)
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
