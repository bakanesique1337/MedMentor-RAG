package ru.medmentor.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.medmentor.dto.ActiveSimulationDto;
import ru.medmentor.dto.CaseCardDto;
import ru.medmentor.dto.ConversationMessageDto;
import ru.medmentor.dto.CriterionNotesDto;
import ru.medmentor.dto.HistorySessionDto;
import ru.medmentor.dto.KeyTurnDto;
import ru.medmentor.dto.PatientPassportDto;
import ru.medmentor.dto.PatientVitalsDto;
import ru.medmentor.dto.ResultDto;
import ru.medmentor.dto.ScoreDto;
import ru.medmentor.dto.SimulationCommandResponseDto;
import ru.medmentor.dto.SimulationSessionDto;
import ru.medmentor.dto.SimulationStatsOverviewDto;
import ru.medmentor.dto.StreamingStatusDto;
import ru.medmentor.model.ConversationMessage;
import ru.medmentor.model.MedicalCase;
import ru.medmentor.model.MedicalCasePassport;
import ru.medmentor.model.MedicalCaseVitals;
import ru.medmentor.model.MessageRole;
import ru.medmentor.model.OpeningStatus;
import ru.medmentor.model.SimulationResult;
import ru.medmentor.model.SimulationSession;
import ru.medmentor.model.SimulationState;
import ru.medmentor.model.UserAccount;
import ru.medmentor.model.UserScore;
import ru.medmentor.repository.ConversationMessageRepository;
import ru.medmentor.repository.SimulationResultRepository;
import ru.medmentor.repository.SimulationSessionRepository;
import ru.medmentor.repository.UserScoreRepository;

import java.util.*;
import java.util.regex.Pattern;

@Service
public class SimulationServiceImpl implements SimulationService {

    private static final int MAX_USER_MESSAGES = 10;
    private static final int MAX_AI_MESSAGES = 11;

    /**
     * Russian-language keyword classifier used to detect when the doctor's free-text message
     * is asking for vitals or a physical exam. Matched as a substring against the lowercased
     * trimmed message.
     */
    private static final Pattern EXAM_KEYWORD_PATTERN = Pattern.compile(
            "(\\bад\\b|давлен|пульс|чсс|сатурац|spo2|spо2|температур|виталы|витальн|осмотр|"
                    + "физикальн|чдд|дыхан|аускульт|пальпац|перкус|измер.{0,10}(давлен|температур|пульс))",
            Pattern.CASE_INSENSITIVE
    );

    private final CaseLoaderService caseLoaderService;
    private final ConversationMessageRepository conversationMessageRepository;
    private final SimulationAiService simulationAiService;
    private final SimulationInFlightRegistry simulationInFlightRegistry;
    private final SimulationResultRepository simulationResultRepository;
    private final SimulationSessionRepository simulationSessionRepository;
    private final SimulationStreamingService simulationStreamingService;
    private final UserAccountService userAccountService;
    private final UserScoreRepository userScoreRepository;

    public SimulationServiceImpl(
            CaseLoaderService caseLoaderService,
            ConversationMessageRepository conversationMessageRepository,
            SimulationAiService simulationAiService,
            SimulationInFlightRegistry simulationInFlightRegistry,
            SimulationResultRepository simulationResultRepository,
            SimulationSessionRepository simulationSessionRepository,
            SimulationStreamingService simulationStreamingService,
            UserAccountService userAccountService,
            UserScoreRepository userScoreRepository
    ) {
        this.caseLoaderService = caseLoaderService;
        this.conversationMessageRepository = conversationMessageRepository;
        this.simulationAiService = simulationAiService;
        this.simulationInFlightRegistry = simulationInFlightRegistry;
        this.simulationResultRepository = simulationResultRepository;
        this.simulationSessionRepository = simulationSessionRepository;
        this.simulationStreamingService = simulationStreamingService;
        this.userAccountService = userAccountService;
        this.userScoreRepository = userScoreRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CaseCardDto> getCaseCards(String category) {
        final List<MedicalCase> cases = category == null || category.isBlank()
                ? caseLoaderService.getCases()
                : caseLoaderService.getCasesByCategory(category);
        return cases.stream()
                .map(medicalCase -> new CaseCardDto(
                        medicalCase.id(),
                        medicalCase.category(),
                        medicalCase.title(),
                        medicalCase.difficulty(),
                        medicalCase.tags(),
                        medicalCase.patientName(),
                        medicalCase.patientAge(),
                        medicalCase.patientSex(),
                        medicalCase.patientBrief()
                ))
                .toList();
    }

    @Override
    public SimulationCommandResponseDto startSession(String username, String caseId) {
        final UserAccount userAccount = userAccountService.getByUsername(username);
        final Optional<SimulationSession> activeSession = findActiveSessionEntity(userAccount.getId());
        if (activeSession.isPresent()) {
            throw new IllegalStateException("User already has an unfinished simulation session");
        }

        final MedicalCase medicalCase = caseLoaderService.getCaseById(caseId);
        final List<String> shuffledDiagnosisOptions = new ArrayList<>(medicalCase.diagnosisOptions());
        Collections.shuffle(shuffledDiagnosisOptions);

        SimulationSession session = SimulationSession.builder()
                .user(userAccount)
                .caseId(medicalCase.id())
                .state(SimulationState.CASE_STARTED)
                .openingStatus(OpeningStatus.OPENING_PENDING)
                .shuffledDiagnosisOptions(shuffledDiagnosisOptions)
                .build();
        session = simulationSessionRepository.save(session);
        simulationStreamingService.startOpeningMessage(session.getId());
        return new SimulationCommandResponseDto(session.getId(), "OPENING_STARTED");
    }

    @Override
    @Transactional
    public SimulationSessionDto getSession(String username, Long sessionId, boolean retryOpening) {
        final UserAccount userAccount = userAccountService.getByUsername(username);
        final SimulationSession session = getOwnedSession(userAccount, sessionId);
        if (retryOpening && session.getOpeningStatus() == OpeningStatus.OPENING_FAILED) {
            simulationStreamingService.retryOpeningMessage(sessionId);
        }
        final MedicalCase medicalCase = caseLoaderService.getCaseById(session.getCaseId());
        return buildSessionDto(simulationSessionRepository.findById(sessionId).orElseThrow(), medicalCase);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ActiveSimulationDto> getActiveSession(String username) {
        final UserAccount userAccount = userAccountService.getByUsername(username);
        return findActiveSessionEntity(userAccount.getId())
                .map(session -> {
                    final MedicalCase medicalCase = caseLoaderService.getCaseById(session.getCaseId());
                    return new ActiveSimulationDto(
                            session.getId(),
                            session.getCaseId(),
                            medicalCase.title(),
                            medicalCase.patientName(),
                            session.getState(),
                            session.getOpeningStatus(),
                            session.getUpdatedAt()
                    );
                });
    }

    @Override
    public SimulationCommandResponseDto sendMessage(String username, Long sessionId, String content) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Message content must not be blank");
        }

        final UserAccount userAccount = userAccountService.getByUsername(username);
        final SimulationSession session = getOwnedSession(userAccount, sessionId);
        ensureState(session, EnumSet.of(SimulationState.IN_PROGRESS));
        ensureOpeningReady(session);
        if (simulationInFlightRegistry.isAnyResponseInFlight(sessionId)) {
            throw new IllegalStateException("AI response is already in flight for this session");
        }

        final List<ConversationMessage> conversationHistory = conversationMessageRepository.findBySessionIdOrderByMessageOrderAsc(sessionId);
        final long userMessageCount = conversationHistory.stream().filter(message -> message.getRole() == MessageRole.DOCTOR).count();
        final long aiMessageCount = conversationHistory.stream().filter(message -> message.getRole() == MessageRole.PATIENT).count();

        if (userMessageCount >= MAX_USER_MESSAGES) {
            throw new IllegalStateException("Maximum user message limit reached for this session");
        }
        if (aiMessageCount >= MAX_AI_MESSAGES) {
            throw new IllegalStateException("Maximum AI message limit reached for this session");
        }

        final int nextOrder = conversationHistory.size() + 1;
        final String trimmedContent = content.trim();
        conversationMessageRepository.save(ConversationMessage.builder()
                .session(session)
                .role(MessageRole.DOCTOR)
                .content(trimmedContent)
                .messageOrder(nextOrder)
                .build());

        if (!session.isExamRevealed() && containsExamKeyword(trimmedContent)) {
            session.setExamRevealed(true);
        }

        simulationSessionRepository.save(session);
        simulationStreamingService.startPatientReply(sessionId, trimmedContent);
        return new SimulationCommandResponseDto(sessionId, "REPLY_STARTED");
    }

    @Override
    @Transactional
    public SimulationCommandResponseDto abandonSession(String username, Long sessionId) {
        final UserAccount userAccount = userAccountService.getByUsername(username);
        final SimulationSession session = getOwnedSession(userAccount, sessionId);
        ensureState(session, EnumSet.complementOf(EnumSet.of(
                SimulationState.SCORING,
                SimulationState.COMPLETED,
                SimulationState.ABANDONED
        )));
        session.setState(SimulationState.ABANDONED);
        simulationSessionRepository.save(session);
        return new SimulationCommandResponseDto(sessionId, "ABANDONED");
    }

    @Override
    @Transactional
    public SimulationSessionDto revealExam(String username, Long sessionId) {
        final UserAccount userAccount = userAccountService.getByUsername(username);
        final SimulationSession session = getOwnedSession(userAccount, sessionId);
        ensureState(session, EnumSet.of(SimulationState.IN_PROGRESS));
        ensureOpeningReady(session);

        if (!session.isExamRevealed()) {
            session.setExamRevealed(true);
            simulationSessionRepository.save(session);
        }

        final MedicalCase medicalCase = caseLoaderService.getCaseById(session.getCaseId());
        return buildSessionDto(session, medicalCase);
    }

    /**
     * Checks whether a doctor message looks like a request for vitals or a physical exam.
     */
    private boolean containsExamKeyword(String message) {
        if (message == null || message.isBlank()) {
            return false;
        }
        return EXAM_KEYWORD_PATTERN.matcher(message.toLowerCase(Locale.ROOT)).find();
    }

    @Override
    @Transactional
    public SimulationSessionDto submitDiagnosis(
            String username,
            Long sessionId,
            String diagnosis,
            String rationale,
            Integer confidence
    ) {
        if (diagnosis == null || diagnosis.isBlank()) {
            throw new IllegalArgumentException("Diagnosis must not be blank");
        }
        if (confidence != null && (confidence < 0 || confidence > 100)) {
            throw new IllegalArgumentException("Confidence must be between 0 and 100");
        }

        final UserAccount userAccount = userAccountService.getByUsername(username);
        final SimulationSession session = getOwnedSession(userAccount, sessionId);
        final MedicalCase medicalCase = caseLoaderService.getCaseById(session.getCaseId());
        ensureState(session, EnumSet.of(SimulationState.IN_PROGRESS, SimulationState.DIAGNOSIS_SELECT));
        ensureOpeningReady(session);
        if (simulationInFlightRegistry.isAnyResponseInFlight(sessionId)) {
            throw new IllegalStateException("AI response is already in flight for this session");
        }

        session.setSelectedDiagnosis(diagnosis.trim());
        session.setSelectedDiagnosisRationale(rationale == null || rationale.isBlank() ? null : rationale.trim());
        session.setSelectedDiagnosisConfidence(confidence);
        session.setState(SimulationState.SCORING);
        simulationSessionRepository.save(session);
        generateAndPersistScore(session, medicalCase);
        return buildSessionDto(session, medicalCase);
    }

    @Override
    @Transactional(readOnly = true)
    public List<HistorySessionDto> getHistory(String username) {
        final UserAccount userAccount = userAccountService.getByUsername(username);
        return simulationSessionRepository.findByUserIdOrderByCreatedAtDesc(userAccount.getId()).stream()
                .map(session -> {
                    final MedicalCase medicalCase = caseLoaderService.getCaseById(session.getCaseId());
                    final Optional<UserScore> userScore = userScoreRepository.findBySessionId(session.getId());
                    final Optional<SimulationResult> result = simulationResultRepository.findBySessionId(session.getId());
                    return new HistorySessionDto(
                            session.getId(),
                            session.getCaseId(),
                            medicalCase.title(),
                            medicalCase.category(),
                            medicalCase.patientName(),
                            session.getState(),
                            userScore.map(score -> new ScoreDto(
                                    score.getPoliteness(),
                                    score.getQuestioningStructure(),
                                    score.getThoroughness(),
                                    score.getEmpathy(),
                                    score.getDiagnosisCorrect(),
                                    score.getTotalScore(),
                                    score.getCreatedAt()
                            )).orElse(null),
                            result.map(this::toResultDto).orElse(null),
                            session.getCreatedAt(),
                            session.getUpdatedAt()
                    );
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SimulationStatsOverviewDto getStatsOverview(String username) {
        final UserAccount userAccount = userAccountService.getByUsername(username);
        final List<SimulationSession> completedSessions = simulationSessionRepository.findByUserIdAndStateOrderByCreatedAtDesc(
                userAccount.getId(),
                SimulationState.COMPLETED
        );
        final List<UserScore> scores = completedSessions.stream()
                .map(session -> userScoreRepository.findBySessionId(session.getId()).orElse(null))
                .filter(Objects::nonNull)
                .toList();
        return new SimulationStatsOverviewDto(
                completedSessions.size(),
                average(scores.stream().map(UserScore::getPoliteness).toList()),
                average(scores.stream().map(UserScore::getQuestioningStructure).toList()),
                average(scores.stream().map(UserScore::getThoroughness).toList()),
                average(scores.stream().map(UserScore::getEmpathy).toList()),
                average(scores.stream().map(UserScore::getDiagnosisCorrect).toList()),
                average(scores.stream().map(UserScore::getTotalScore).toList())
        );
    }

    private Optional<SimulationSession> findActiveSessionEntity(Long userId) {
        return simulationSessionRepository.findFirstByUserIdAndStateNotInOrderByCreatedAtDesc(
                userId,
                List.of(SimulationState.COMPLETED, SimulationState.ABANDONED)
        );
    }

    private SimulationSession getOwnedSession(UserAccount userAccount, Long sessionId) {
        final SimulationSession session = simulationSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown session id: " + sessionId));
        if (!session.getUser().getId().equals(userAccount.getId())) {
            throw new IllegalArgumentException("Session does not belong to the authenticated user");
        }
        return session;
    }

    private void ensureState(SimulationSession session, EnumSet<SimulationState> allowedStates) {
        if (!allowedStates.contains(session.getState())) {
            throw new IllegalStateException("Invalid session state: " + session.getState());
        }
    }

    private void ensureOpeningReady(SimulationSession session) {
        if (session.getOpeningStatus() != OpeningStatus.OPENING_READY) {
            throw new IllegalStateException("Opening message is not ready for this session");
        }
    }

    private Double toScore(double value) {
        final double clampedValue = Math.max(0.0, Math.min(1.0, value));
        return round2(clampedValue);
    }

    private SimulationResult generateAndPersistScore(SimulationSession session, MedicalCase medicalCase) {
        final Long sessionId = session.getId();
        final List<ConversationMessage> conversationHistory = conversationMessageRepository.findBySessionIdOrderByMessageOrderAsc(sessionId);
        final ScoreReviewPayload payload = simulationAiService.generateScoreReview(
                medicalCase,
                conversationHistory,
                session.getSelectedDiagnosis(),
                session.getSelectedDiagnosisRationale(),
                session.getSelectedDiagnosisConfidence()
        );
        final String selected = session.getSelectedDiagnosis() == null ? "" : session.getSelectedDiagnosis().trim();
        final String correct = medicalCase.correctDiagnosis() == null ? "" : medicalCase.correctDiagnosis().trim();
        final Double diagnosisCorrectScore = !selected.isEmpty() && selected.equalsIgnoreCase(correct)
                ? 1.00
                : toScore(payload.score().correctDiagnosis());

        userScoreRepository.findBySessionId(sessionId).ifPresent(userScoreRepository::delete);
        simulationResultRepository.findBySessionId(sessionId).ifPresent(simulationResultRepository::delete);

        final Double politenessScore = toScore(payload.score().politeness());
        final Double questioningScore = toScore(payload.score().questioningStructure());
        final Double thoroughnessScore = toScore(payload.score().thoroughness());
        final Double empathyScore = toScore(payload.score().empathy());
        final Double totalScore = composite(politenessScore, questioningScore, thoroughnessScore, empathyScore, diagnosisCorrectScore);

        userScoreRepository.save(UserScore.builder()
                .session(session)
                .politeness(politenessScore)
                .questioningStructure(questioningScore)
                .thoroughness(thoroughnessScore)
                .empathy(empathyScore)
                .diagnosisCorrect(diagnosisCorrectScore)
                .totalScore(totalScore)
                .build());

        final SimulationResult result = simulationResultRepository.save(SimulationResult.builder()
                .session(session)
                .summary(payload.summary().trim())
                .criterionNotes(buildCriterionNotes(payload))
                .keyTurns(buildKeyTurns(payload))
                .missedFindings(buildMissedFindings(payload))
                .build());

        session.setState(SimulationState.COMPLETED);
        simulationSessionRepository.save(session);
        return result;
    }

    private Map<String, String> buildCriterionNotes(ScoreReviewPayload payload) {
        final ScoreReviewPayload.CriterionNotesPayload notes = payload.criterionNotes();
        if (notes == null) {
            return null;
        }
        final Map<String, String> stored = new LinkedHashMap<>();
        stored.put("politeness", notes.politeness());
        stored.put("questioningStructure", notes.questioningStructure());
        stored.put("thoroughness", notes.thoroughness());
        stored.put("empathy", notes.empathy());
        stored.put("correctDiagnosis", notes.correctDiagnosis());
        return stored;
    }

    private List<Map<String, Object>> buildKeyTurns(ScoreReviewPayload payload) {
        if (payload.keyTurns() == null || payload.keyTurns().isEmpty()) {
            return List.of();
        }
        return payload.keyTurns().stream()
                .filter(turn -> turn != null && turn.text() != null && !turn.text().isBlank())
                .map(turn -> {
                    final Map<String, Object> stored = new LinkedHashMap<>();
                    stored.put("turn", turn.turn());
                    stored.put("kind", normalizeTurnKind(turn.kind()));
                    stored.put("text", turn.text().trim());
                    stored.put("tag", turn.tag() == null ? "" : turn.tag().trim());
                    return stored;
                })
                .toList();
    }

    private List<String> buildMissedFindings(ScoreReviewPayload payload) {
        if (payload.missedFindings() == null) {
            return List.of();
        }
        return payload.missedFindings().stream()
                .filter(item -> item != null && !item.isBlank())
                .map(String::trim)
                .toList();
    }

    private String normalizeTurnKind(String kind) {
        if (kind == null) {
            return "good";
        }
        final String normalized = kind.trim().toLowerCase(Locale.ROOT);
        return "warn".equals(normalized) ? "warn" : "good";
    }

    private SimulationSessionDto buildSessionDto(SimulationSession session, MedicalCase medicalCase) {
        final List<ConversationMessage> messages = conversationMessageRepository.findBySessionIdOrderByMessageOrderAsc(session.getId());
        final Optional<UserScore> userScore = userScoreRepository.findBySessionId(session.getId());
        final Optional<SimulationResult> simulationResult = simulationResultRepository.findBySessionId(session.getId());

        final boolean examRevealed = session.isExamRevealed();
        final PatientPassportDto passportDto = examRevealed ? toPassportDto(medicalCase.passport()) : null;
        final PatientVitalsDto vitalsDto = examRevealed ? toVitalsDto(medicalCase.vitals()) : null;
        final boolean revealCorrectDiagnosis = session.getState() == SimulationState.COMPLETED
                || session.getState() == SimulationState.ABANDONED;
        final String correctDiagnosis = revealCorrectDiagnosis ? medicalCase.correctDiagnosis() : null;

        return new SimulationSessionDto(
                session.getId(),
                session.getCaseId(),
                medicalCase.title(),
                medicalCase.category(),
                medicalCase.difficulty(),
                medicalCase.patientName(),
                medicalCase.patientAge(),
                medicalCase.patientSex(),
                session.getState(),
                session.getOpeningStatus(),
                List.copyOf(session.getShuffledDiagnosisOptions()),
                session.getSelectedDiagnosis(),
                session.getSelectedDiagnosisRationale(),
                session.getSelectedDiagnosisConfidence(),
                correctDiagnosis,
                messages.stream()
                        .map(message -> new ConversationMessageDto(
                                message.getId(),
                                message.getRole(),
                                message.getContent(),
                                message.getMessageOrder(),
                                message.getTimestamp()
                        ))
                        .toList(),
                new StreamingStatusDto(
                        simulationInFlightRegistry.isAnyResponseInFlight(session.getId()),
                        session.getOpeningStatus() != OpeningStatus.OPENING_READY
                                && session.getOpeningStatus() != OpeningStatus.OPENING_FAILED
                                ? "opening"
                                : simulationInFlightRegistry.isMessageInFlight(session.getId()) ? "message" : "idle"
                ),
                examRevealed,
                passportDto,
                vitalsDto,
                userScore.map(score -> new ScoreDto(
                        score.getPoliteness(),
                        score.getQuestioningStructure(),
                        score.getThoroughness(),
                        score.getEmpathy(),
                        score.getDiagnosisCorrect(),
                        score.getTotalScore(),
                        score.getCreatedAt()
                )).orElse(null),
                simulationResult.map(this::toResultDto).orElse(null),
                session.getCreatedAt(),
                session.getUpdatedAt()
        );
    }

    private ResultDto toResultDto(SimulationResult result) {
        return new ResultDto(
                result.getSummary(),
                toCriterionNotesDto(result.getCriterionNotes()),
                toKeyTurnsDto(result.getKeyTurns()),
                result.getMissedFindings() == null ? List.of() : List.copyOf(result.getMissedFindings()),
                result.getCreatedAt()
        );
    }

    private CriterionNotesDto toCriterionNotesDto(Map<String, String> notes) {
        if (notes == null || notes.isEmpty()) {
            return null;
        }
        return new CriterionNotesDto(
                notes.get("politeness"),
                notes.get("questioningStructure"),
                notes.get("thoroughness"),
                notes.get("empathy"),
                notes.get("correctDiagnosis")
        );
    }

    private List<KeyTurnDto> toKeyTurnsDto(List<Map<String, Object>> stored) {
        if (stored == null || stored.isEmpty()) {
            return List.of();
        }
        return stored.stream()
                .map(entry -> new KeyTurnDto(
                        entry.get("turn") instanceof Number n ? n.intValue() : 0,
                        entry.get("kind") instanceof String s ? s : "good",
                        entry.get("text") instanceof String s ? s : "",
                        entry.get("tag") instanceof String s ? s : ""
                ))
                .toList();
    }

    private PatientPassportDto toPassportDto(MedicalCasePassport passport) {
        if (passport == null) {
            return null;
        }
        return new PatientPassportDto(
                passport.heightCm(),
                passport.weightKg(),
                passport.allergies(),
                passport.chronicConditions(),
                passport.smoking()
        );
    }

    private PatientVitalsDto toVitalsDto(MedicalCaseVitals vitals) {
        if (vitals == null) {
            return null;
        }
        return new PatientVitalsDto(
                vitals.heartRate(),
                vitals.bloodPressure(),
                vitals.respiratoryRate(),
                vitals.spo2(),
                vitals.temperatureC()
        );
    }

    private Double average(List<Double> values) {
        if (values.isEmpty()) {
            return 0.00;
        }
        final double sum = values.stream()
                .reduce(0.0, Double::sum);
        return round2(sum / values.size());
    }

    private Double composite(Double politeness, Double questioning, Double thoroughness, Double empathy, Double diagnosisCorrect) {
        return round2((politeness + questioning + thoroughness + empathy + diagnosisCorrect) / 5.0);
    }

    private Double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
