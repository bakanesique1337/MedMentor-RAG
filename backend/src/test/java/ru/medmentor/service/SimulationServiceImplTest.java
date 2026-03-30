package ru.medmentor.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ru.medmentor.dto.SimulationCommandResponseDto;
import ru.medmentor.dto.SimulationSessionDto;
import ru.medmentor.model.ConversationMessage;
import ru.medmentor.model.MedicalCase;
import ru.medmentor.model.MedicalCaseFacts;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SimulationServiceImplTest {

    @Mock
    private CaseLoaderService caseLoaderService;
    @Mock
    private ConversationMessageRepository conversationMessageRepository;
    @Mock
    private SimulationAiService simulationAiService;
    @Mock
    private SimulationInFlightRegistry simulationInFlightRegistry;
    @Mock
    private SimulationResultRepository simulationResultRepository;
    @Mock
    private SimulationSessionRepository simulationSessionRepository;
    @Mock
    private SimulationStreamingService simulationStreamingService;
    @Mock
    private UserAccountService userAccountService;
    @Mock
    private UserScoreRepository userScoreRepository;

    private SimulationServiceImpl simulationService;

    @BeforeEach
    void setUp() {
        simulationService = new SimulationServiceImpl(
                caseLoaderService,
                conversationMessageRepository,
                simulationAiService,
                simulationInFlightRegistry,
                simulationResultRepository,
                simulationSessionRepository,
                simulationStreamingService,
                userAccountService,
                userScoreRepository
        );
    }

    @Test
    void startSessionCreatesSessionAndStartsOpeningStream() {
        final UserAccount user = user(1L, "doctor");
        final MedicalCase medicalCase = medicalCaseOf("case-1", "Influenza");

        when(userAccountService.getByUsername("doctor")).thenReturn(user);
        when(simulationSessionRepository.findFirstByUserIdAndStateNotInOrderByCreatedAtDesc(eq(1L), any()))
                .thenReturn(Optional.empty());
        when(caseLoaderService.getCaseById("case-1")).thenReturn(medicalCase);
        when(simulationSessionRepository.save(any(SimulationSession.class))).thenAnswer(invocation -> {
            final SimulationSession session = invocation.getArgument(0);
            session.setId(42L);
            return session;
        });

        final SimulationCommandResponseDto response = simulationService.startSession("doctor", "case-1");

        assertEquals(42L, response.sessionId());
        assertEquals("OPENING_STARTED", response.status());
        verify(simulationStreamingService).startOpeningMessage(42L);
    }

    @Test
    void sendMessageRejectsWhenResponseAlreadyInFlight() {
        final UserAccount user = user(1L, "doctor");
        final SimulationSession session = session(101L, user, "case-1", SimulationState.IN_PROGRESS, OpeningStatus.OPENING_READY);

        when(userAccountService.getByUsername("doctor")).thenReturn(user);
        when(simulationSessionRepository.findById(101L)).thenReturn(Optional.of(session));
        when(simulationInFlightRegistry.isAnyResponseInFlight(101L)).thenReturn(true);

        assertThrows(IllegalStateException.class, () -> simulationService.sendMessage("doctor", 101L, "How are you?"));
        verify(conversationMessageRepository, never()).save(any(ConversationMessage.class));
        verify(simulationStreamingService, never()).startPatientReply(any(), any());
    }

    @Test
    void submitDiagnosisPersistsScoresAndResult() {
        final UserAccount user = user(1L, "doctor");
        final SimulationSession session = session(200L, user, "case-1", SimulationState.IN_PROGRESS, OpeningStatus.OPENING_READY);
        final MedicalCase medicalCase = medicalCaseOf("case-1", "Influenza");
        final LocalDateTime createdAt = LocalDateTime.now();
        final UserScore persistedScore = UserScore.builder()
                .session(session)
                .politeness(0.80)
                .questioningStructure(0.70)
                .thoroughness(0.60)
                .empathy(0.90)
                .diagnosisCorrect(1.00)
                .createdAt(createdAt)
                .build();
        final SimulationResult persistedResult = SimulationResult.builder()
                .session(session)
                .summary("Good structure")
                .createdAt(createdAt)
                .build();

        when(userAccountService.getByUsername("doctor")).thenReturn(user);
        when(simulationSessionRepository.findById(200L)).thenReturn(Optional.of(session));
        when(caseLoaderService.getCaseById("case-1")).thenReturn(medicalCase);
        when(simulationInFlightRegistry.isAnyResponseInFlight(200L)).thenReturn(false);
        when(conversationMessageRepository.findBySessionIdOrderByMessageOrderAsc(200L)).thenReturn(List.of());
        when(simulationAiService.generateScoreReview(eq(medicalCase), any(), eq("Influenza")))
                .thenReturn(new ScoreReviewPayload(
                        new ScoreReviewPayload.ScorePayload(0.8, 0.7, 0.6, 0.9, 0.0),
                        "Good structure"
                ));
        when(userScoreRepository.findBySessionId(200L)).thenReturn(Optional.empty(), Optional.of(persistedScore));
        when(simulationResultRepository.findBySessionId(200L)).thenReturn(Optional.empty(), Optional.of(persistedResult));
        when(simulationResultRepository.save(any(SimulationResult.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(simulationSessionRepository.save(any(SimulationSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        final SimulationSessionDto response = simulationService.submitDiagnosis("doctor", 200L, "Influenza");

        assertEquals(SimulationState.COMPLETED, response.state());
        assertNotNull(response.result());
        assertEquals("Good structure", response.result().summary());
        final ArgumentCaptor<UserScore> scoreCaptor = ArgumentCaptor.forClass(UserScore.class);
        verify(userScoreRepository).save(scoreCaptor.capture());
        assertEquals(1.00, scoreCaptor.getValue().getDiagnosisCorrect());
        assertEquals(SimulationState.COMPLETED, session.getState());
    }

    @Test
    void submitDiagnosisCompletesSessionAndReturnsScoreData() {
        final UserAccount user = user(1L, "doctor");
        final SimulationSession session = session(300L, user, "case-1", SimulationState.DIAGNOSIS_SELECT, OpeningStatus.OPENING_READY);
        final MedicalCase medicalCase = medicalCaseOf("case-1", "Influenza");
        final LocalDateTime createdAt = LocalDateTime.now();
        final UserScore persistedScore = UserScore.builder()
                .session(session)
                .politeness(0.80)
                .questioningStructure(0.70)
                .thoroughness(0.60)
                .empathy(0.90)
                .diagnosisCorrect(1.00)
                .createdAt(createdAt)
                .build();
        final SimulationResult persistedResult = SimulationResult.builder()
                .session(session)
                .summary("Good structure")
                .createdAt(createdAt)
                .build();

        when(userAccountService.getByUsername("doctor")).thenReturn(user);
        when(simulationSessionRepository.findById(300L)).thenReturn(Optional.of(session));
        when(caseLoaderService.getCaseById("case-1")).thenReturn(medicalCase);
        when(simulationInFlightRegistry.isAnyResponseInFlight(300L)).thenReturn(false);
        when(conversationMessageRepository.findBySessionIdOrderByMessageOrderAsc(300L)).thenReturn(List.of());
        when(simulationAiService.generateScoreReview(eq(medicalCase), any(), eq("Influenza")))
                .thenReturn(new ScoreReviewPayload(
                        new ScoreReviewPayload.ScorePayload(0.8, 0.7, 0.6, 0.9, 0.0),
                        "Good structure"
                ));
        when(userScoreRepository.findBySessionId(300L)).thenReturn(Optional.empty(), Optional.of(persistedScore));
        when(simulationResultRepository.findBySessionId(300L)).thenReturn(Optional.empty(), Optional.of(persistedResult));
        when(simulationResultRepository.save(any(SimulationResult.class))).thenAnswer(invocation -> {
            final SimulationResult result = invocation.getArgument(0);
            result.setCreatedAt(createdAt);
            return result;
        });
        when(simulationSessionRepository.save(any(SimulationSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        final SimulationSessionDto response = simulationService.submitDiagnosis("doctor", 300L, "Influenza");

        assertEquals(SimulationState.COMPLETED, response.state());
        assertNotNull(response.score());
        assertNotNull(response.result());
        assertEquals("Good structure", response.result().summary());
        assertEquals("Influenza", response.selectedDiagnosis());
    }

    private UserAccount user(Long id, String username) {
        return UserAccount.builder()
                .id(id)
                .username(username)
                .displayName("Doctor")
                .build();
    }

    private SimulationSession session(Long id, UserAccount user, String caseId, SimulationState state, OpeningStatus openingStatus) {
        return SimulationSession.builder()
                .id(id)
                .user(user)
                .caseId(caseId)
                .state(state)
                .openingStatus(openingStatus)
                .shuffledDiagnosisOptions(List.of("Influenza", "Cold"))
                .build();
    }

    private MedicalCase medicalCaseOf(String id, String correctDiagnosis) {
        return new MedicalCase(
                id,
                1,
                "Infections",
                "Influenza case",
                "easy",
                List.of("fever"),
                "Anna",
                26,
                "female",
                "brief",
                "opening",
                "author note",
                new MedicalCaseFacts(List.of("fever"), List.of("history"), List.of("negative")),
                List.of("Influenza", "Common cold"),
                correctDiagnosis
        );
    }
}
