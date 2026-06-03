package ru.medmentor.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import ru.medmentor.config.RagProperties;
import ru.medmentor.model.ConversationMessage;
import ru.medmentor.model.MedicalCase;
import ru.medmentor.model.MedicalCaseFacts;
import ru.medmentor.model.MedicalCasePassport;
import ru.medmentor.service.prompt.LlmPrompt;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.function.Consumer;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class SimulationAiServiceImpl implements SimulationAiService {

    private static final Logger promptAudit = LoggerFactory.getLogger("ru.medmentor.audit.prompt");

    private static final Logger responseAudit = LoggerFactory.getLogger("ru.medmentor.audit.response");

    private final ChatClient chatClient;
    private final PromptTemplateService promptTemplateService;
    private final RagSearchService ragSearchService;
    private final RagProperties ragProperties;
    private final ObjectMapper objectMapper;

    public SimulationAiServiceImpl(
            ChatClient chatClient,
            PromptTemplateService promptTemplateService,
            RagSearchService ragSearchService,
            RagProperties ragProperties,
            ObjectMapper objectMapper
    ) {
        this.chatClient = chatClient;
        this.promptTemplateService = promptTemplateService;
        this.ragSearchService = ragSearchService;
        this.ragProperties = ragProperties;
        this.objectMapper = objectMapper;
    }

    @Override
    public String generateOpeningMessage(MedicalCase medicalCase) {
        return callText("opening", buildOpeningPrompt(medicalCase, warning -> { }));
    }

    @Override
    public Flux<String> streamOpeningMessage(MedicalCase medicalCase) {
        return streamOpeningMessage(medicalCase, warning -> { });
    }

    @Override
    public Flux<String> streamOpeningMessage(MedicalCase medicalCase, Consumer<String> warningSink) {
        return streamText("opening", buildOpeningPrompt(medicalCase, warningSink));
    }

    @Override
    public String generatePatientReply(
            MedicalCase medicalCase,
            List<ConversationMessage> conversationHistory,
            String doctorMessage
    ) {
        return callText("reply", buildReplyPrompt(medicalCase, conversationHistory, doctorMessage, warning -> { }));
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
        return streamText("reply", buildReplyPrompt(medicalCase, conversationHistory, doctorMessage, warningSink));
    }

    @Override
    public Flux<String> streamExaminationFinding(
            MedicalCase medicalCase,
            List<ConversationMessage> conversationHistory,
            String doctorMessage,
            Consumer<String> warningSink
    ) {
        return streamText("examination-finding", buildExaminationFindingPrompt(medicalCase, conversationHistory, doctorMessage, warningSink));
    }

    @Override
    public ScoreReviewPayload generateScoreReview(
            MedicalCase medicalCase,
            List<ConversationMessage> conversationHistory,
            String selectedDiagnosis,
            String selectedDiagnosisRationale,
            Integer selectedDiagnosisConfidence
    ) {
        final String rawResponse = callText(
                "score-review",
                buildScoreReviewPrompt(
                        medicalCase,
                        conversationHistory,
                        selectedDiagnosis,
                        selectedDiagnosisRationale,
                        selectedDiagnosisConfidence
                )
        );
        return parseScorePayload(rawResponse);
    }

    private String formatConversationWithTurnIndex(List<ConversationMessage> conversationHistory) {
        if (conversationHistory.isEmpty()) {
            return "(no conversation yet)";
        }
        final StringBuilder builder = new StringBuilder();
        int doctorTurn = 0;
        for (ConversationMessage message : conversationHistory) {
            if (!builder.isEmpty()) {
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

    private String callText(String promptKind, LlmPrompt prompt) {
        auditPrompt(promptKind, prompt);
        final String response = chatClient.prompt()
                .user(prompt.forLlm())
                .call()
                .content();
        if (response == null || response.isBlank()) {
            throw new IllegalStateException("AI returned an empty response");
        }
        final String trimmed = response.trim();
        auditResponse(promptKind, trimmed);
        return trimmed;
    }

    private Flux<String> streamText(String promptKind, LlmPrompt prompt) {
        auditPrompt(promptKind, prompt);
        final StringBuilder accumulator = new StringBuilder();
        return chatClient.prompt()
                .user(prompt.forLlm())
                .stream()
                .content()
                .filter(chunk -> chunk != null && !chunk.isEmpty())
                .doOnNext(accumulator::append)
                .doOnComplete(() -> auditResponse(promptKind, accumulator.toString()))
                .doOnError(error -> auditResponseError(promptKind, accumulator.toString(), error));
    }

    private void auditPrompt(String promptKind, LlmPrompt prompt) {
        if (promptAudit.isDebugEnabled()) {
            promptAudit.debug("LLM prompt [{}] (system templates omitted):\n{}", promptKind, prompt.forAudit());
        }
    }

    private void auditResponse(String promptKind, String response) {
        if (responseAudit.isDebugEnabled()) {
            responseAudit.debug("LLM response [{}]:\n{}", promptKind, response);
        }
    }

    private void auditResponseError(String promptKind, String partialResponse, Throwable error) {
        if (responseAudit.isDebugEnabled()) {
            responseAudit.debug("LLM response [{}] failed after partial output:\n{}\nError: {}",
                    promptKind, partialResponse, error.toString());
        }
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

    private static final Pattern OBJECTIVE_SYMPTOM_PREFIX =
            Pattern.compile("^\\s*при\\s+осмотре\\b", Pattern.CASE_INSENSITIVE);

    private static final Pattern INSTRUMENTAL_HISTORY_PREFIX = Pattern.compile(
            "^\\s*(ЭКГ|ЭхоКГ|КТ|МРТ|УЗИ|Рентген|тропонин|электролит|общий\\s+анализ|биохимический\\s+анализ|биохимия)\\b",
            Pattern.CASE_INSENSITIVE
    );

    private record SplitFacts(
            List<String> subjectiveSymptoms,
            List<String> objectiveSymptoms,
            List<String> anamnesisHistory,
            List<String> instrumentalHistory,
            List<String> negatives
    ) { }

    /**
     * Partitions facts into "what the patient could naturally know and say" and
     * "what is only revealed by an exam or workup". Uses simple prefix patterns
     * agreed for the case format; entries that do not match a marker default to
     * the patient-visible buckets so the partitioning is fail-open (never
     * accidentally hides anamnesis from the patient view).
     */
    private SplitFacts splitFacts(MedicalCaseFacts facts) {
        final List<String> subjectiveSymptoms = new ArrayList<>();
        final List<String> objectiveSymptoms = new ArrayList<>();
        for (String entry : facts.symptoms()) {
            if (OBJECTIVE_SYMPTOM_PREFIX.matcher(entry).find()) {
                objectiveSymptoms.add(entry);
            } else {
                subjectiveSymptoms.add(entry);
            }
        }
        final List<String> anamnesisHistory = new ArrayList<>();
        final List<String> instrumentalHistory = new ArrayList<>();
        for (String entry : facts.history()) {
            if (INSTRUMENTAL_HISTORY_PREFIX.matcher(entry).find()) {
                instrumentalHistory.add(entry);
            } else {
                anamnesisHistory.add(entry);
            }
        }
        return new SplitFacts(
                subjectiveSymptoms,
                objectiveSymptoms,
                anamnesisHistory,
                instrumentalHistory,
                facts.negatives()
        );
    }

    private String formatCaseForPatient(MedicalCase medicalCase) {
        final SplitFacts split = splitFacts(medicalCase.facts());
        final MedicalCasePassport passport = medicalCase.passport();
        return """
                patientName: %s
                patientAge: %d
                patientSex: %s
                patientBrief: %s
                openingComplaint: %s
                authorNote: %s
                symptoms: %s
                history: %s
                negatives: %s
                allergies: %s
                chronicConditions: %s
                smoking: %s
                """.formatted(
                medicalCase.patientName(),
                medicalCase.patientAge(),
                medicalCase.patientSex(),
                medicalCase.patientBrief(),
                medicalCase.openingComplaint(),
                medicalCase.authorNote(),
                String.join(", ", split.subjectiveSymptoms()),
                String.join(", ", split.anamnesisHistory()),
                String.join(", ", split.negatives()),
                passport != null ? passport.allergies() : "(unknown)",
                passport != null ? passport.chronicConditions() : "(unknown)",
                passport != null ? passport.smoking() : "(unknown)"
        );
    }

    private String formatCaseForExamFinding(MedicalCase medicalCase) {
        final SplitFacts split = splitFacts(medicalCase.facts());
        return """
                patientName: %s
                patientAge: %d
                patientSex: %s
                patientBrief: %s
                openingComplaint: %s
                authorNote: %s
                symptoms: %s
                history: %s
                negatives: %s
                """.formatted(
                medicalCase.patientName(),
                medicalCase.patientAge(),
                medicalCase.patientSex(),
                medicalCase.patientBrief(),
                medicalCase.openingComplaint(),
                medicalCase.authorNote(),
                String.join(", ", medicalCase.facts().symptoms()),
                String.join(", ", medicalCase.facts().history()),
                String.join(", ", split.negatives())
        );
    }

    /**
     * Review view of the case. Full ground truth — including diagnosisOptions and
     * correctDiagnosis — so the scoring LLM can grade the doctor's reasoning.
     */
    private String formatCaseForReview(MedicalCase medicalCase) {
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

    private LlmPrompt buildOpeningPrompt(MedicalCase medicalCase, Consumer<String> warningSink) {
        final String ragContext = ragSearchService.buildPromptContext(
                "opening",
                buildOpeningRagQuery(medicalCase),
                warningSink
        );
        return LlmPrompt.builder()
                .system(promptTemplateService.getPatientRolePrompt())
                .section("Case data", formatCaseForPatient(medicalCase))
                .section("Relevant clinical recommendations", ragContext.isBlank() ? "(none)" : ragContext)
                .system("Instructions", promptTemplateService.getSessionOpeningPrompt())
                .build();
    }

    private LlmPrompt buildReplyPrompt(
            MedicalCase medicalCase,
            List<ConversationMessage> conversationHistory,
            String doctorMessage,
            Consumer<String> warningSink
    ) {
        final String ragContext = ragSearchService.buildPromptContext(
                "reply",
                buildReplyRagQuery(medicalCase, conversationHistory, doctorMessage),
                warningSink
        );
        return LlmPrompt.builder()
                .system(promptTemplateService.getPatientRolePrompt())
                .section("Case data", formatCaseForPatient(medicalCase))
                .section("Relevant clinical recommendations", ragContext.isBlank() ? "(none)" : ragContext)
                .section("Conversation so far", formatConversation(conversationHistory))
                .section("Latest doctor message", doctorMessage)
                .build();
    }

    private LlmPrompt buildExaminationFindingPrompt(
            MedicalCase medicalCase,
            List<ConversationMessage> conversationHistory,
            String doctorMessage,
            Consumer<String> warningSink
    ) {
        final String ragContext = ragSearchService.buildPromptContext(
                "examination-finding",
                buildExaminationFindingRagQuery(medicalCase, conversationHistory, doctorMessage),
                warningSink
        );
        return LlmPrompt.builder()
                .system(promptTemplateService.getExaminationFindingPrompt())
                .section("Case data", formatCaseForExamFinding(medicalCase))
                .section("Relevant clinical recommendations", ragContext.isBlank() ? "(none)" : ragContext)
                .section("Conversation so far", formatConversation(conversationHistory))
                .section("Targeted maneuver requested by the doctor", doctorMessage)
                .build();
    }

    private LlmPrompt buildScoreReviewPrompt(
            MedicalCase medicalCase,
            List<ConversationMessage> conversationHistory,
            String selectedDiagnosis,
            String selectedDiagnosisRationale,
            Integer selectedDiagnosisConfidence
    ) {
        final String ragContext = ragSearchService.buildPromptContext(
                "score-review",
                buildScoreRagQuery(medicalCase, conversationHistory, selectedDiagnosis)
        );
        final String rationaleSection = selectedDiagnosisRationale == null || selectedDiagnosisRationale.isBlank()
                ? "(not provided)"
                : selectedDiagnosisRationale.trim();
        final String confidenceSection = selectedDiagnosisConfidence == null
                ? "(not provided)"
                : selectedDiagnosisConfidence + "%";
        final String conversationHeader = "Conversation (each doctor message is labelled with its 1-based `doctor turn N`\n"
                + "index; reference these N values verbatim in the `turn` field of `keyTurns`)";
        return LlmPrompt.builder()
                .system(promptTemplateService.getScoreReviewPrompt())
                .section("Case data", formatCaseForReview(medicalCase))
                .section("Relevant clinical recommendations", ragContext.isBlank() ? "(none)" : ragContext)
                .section("Selected diagnosis", selectedDiagnosis)
                .section("Doctor's rationale", rationaleSection)
                .section("Doctor's self-reported confidence", confidenceSection)
                .section(conversationHeader, formatConversationWithTurnIndex(conversationHistory))
                .build();
    }

    private String buildDiagnosisRagHeader(MedicalCase medicalCase) {
        final int weight = Math.max(1, ragProperties.getDiagnosisQueryWeight());
        final StringBuilder header = new StringBuilder();
        for (int i = 0; i < weight; i++) {
            header.append(medicalCase.correctDiagnosis()).append('\n');
        }
        header.append('\n');
        return header.toString();
    }

    private String buildExaminationFindingRagQuery(
            MedicalCase medicalCase,
            List<ConversationMessage> conversationHistory,
            String doctorMessage
    ) {
        final MedicalCaseFacts facts = medicalCase.facts();
        return buildDiagnosisRagHeader(medicalCase) + """
                targeted physical examination finding
                patient age: %d
                patient sex: %s
                symptoms: %s
                history: %s
                negatives: %s
                doctor maneuver: %s
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

    private String buildOpeningRagQuery(MedicalCase medicalCase) {
        final MedicalCaseFacts facts = medicalCase.facts();
        return buildDiagnosisRagHeader(medicalCase) + """
                opening patient interaction
                patient age: %d
                patient sex: %s
                complaint: %s
                symptoms: %s
                history: %s
                negatives: %s
                """.formatted(
                medicalCase.patientAge(),
                medicalCase.patientSex(),
                medicalCase.openingComplaint(),
                String.join(", ", facts.symptoms()),
                String.join(", ", facts.history()),
                String.join(", ", facts.negatives())
        );
    }

    private String buildReplyRagQuery(
            MedicalCase medicalCase,
            List<ConversationMessage> conversationHistory,
            String doctorMessage
    ) {
        final MedicalCaseFacts facts = medicalCase.facts();
        return buildDiagnosisRagHeader(medicalCase) + """
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
        return buildDiagnosisRagHeader(medicalCase) + """
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
