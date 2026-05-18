package ru.medmentor.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import ru.medmentor.dto.StreamChunkDto;
import ru.medmentor.model.ConversationMessage;
import ru.medmentor.model.MedicalCase;
import ru.medmentor.model.MessageRole;
import ru.medmentor.model.OpeningStatus;
import ru.medmentor.model.SimulationSession;
import ru.medmentor.model.SimulationState;
import ru.medmentor.repository.ConversationMessageRepository;
import ru.medmentor.repository.SimulationSessionRepository;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
public class SimulationStreamingServiceImpl implements SimulationStreamingService {

    private static final Logger log = LoggerFactory.getLogger(SimulationStreamingServiceImpl.class);

    private final ConversationMessageRepository conversationMessageRepository;
    private final CaseLoaderService caseLoaderService;
    private final SimpMessagingTemplate messagingTemplate;
    private final SimulationAiService simulationAiService;
    private final SimulationInFlightRegistry simulationInFlightRegistry;
    private final SimulationSessionRepository simulationSessionRepository;

    public SimulationStreamingServiceImpl(
            ConversationMessageRepository conversationMessageRepository,
            CaseLoaderService caseLoaderService,
            SimpMessagingTemplate messagingTemplate,
            SimulationAiService simulationAiService,
            SimulationInFlightRegistry simulationInFlightRegistry,
            SimulationSessionRepository simulationSessionRepository
    ) {
        this.conversationMessageRepository = conversationMessageRepository;
        this.caseLoaderService = caseLoaderService;
        this.messagingTemplate = messagingTemplate;
        this.simulationAiService = simulationAiService;
        this.simulationInFlightRegistry = simulationInFlightRegistry;
        this.simulationSessionRepository = simulationSessionRepository;
    }

    @Override
    public void startOpeningMessage(Long sessionId) {
        if (!simulationInFlightRegistry.markOpeningInFlight(sessionId)) {
            return;
        }
        CompletableFuture.runAsync(() -> streamOpening(sessionId));
    }

    @Override
    public void retryOpeningMessage(Long sessionId) {
        startOpeningMessage(sessionId);
    }

    @Override
    public void startPatientReply(Long sessionId, String doctorMessage) {
        if (!simulationInFlightRegistry.markMessageInFlight(sessionId)) {
            throw new IllegalStateException("AI response is already in flight for this session");
        }
        log.info("[stream] startPatientReply dispatch sessionId={} messageLen={}", sessionId, doctorMessage.length());
        CompletableFuture.runAsync(() -> streamReply(sessionId, doctorMessage))
                .exceptionally(ex -> {
                    log.error("[stream] streamReply async task failed sessionId={}", sessionId, ex);
                    return null;
                });
    }

    @Override
    public void startSystemReply(Long sessionId, String doctorMessage) {
        if (!simulationInFlightRegistry.markSystemInFlight(sessionId)) {
            throw new IllegalStateException("AI response is already in flight for this session");
        }
        log.info("[stream] startSystemReply dispatch sessionId={} messageLen={}", sessionId, doctorMessage.length());
        CompletableFuture.runAsync(() -> streamSystemReply(sessionId, doctorMessage))
                .exceptionally(ex -> {
                    log.error("[stream] streamSystemReply async task failed sessionId={}", sessionId, ex);
                    return null;
                });
    }

    @Override
    public void startExaminationFinding(Long sessionId, String doctorMessage) {
        if (!simulationInFlightRegistry.markFindingInFlight(sessionId)) {
            throw new IllegalStateException("AI response is already in flight for this session");
        }
        log.info("[stream] startExaminationFinding dispatch sessionId={} messageLen={}", sessionId, doctorMessage.length());
        CompletableFuture.runAsync(() -> streamExaminationFinding(sessionId, doctorMessage))
                .exceptionally(ex -> {
                    log.error("[stream] streamExaminationFinding async task failed sessionId={}", sessionId, ex);
                    return null;
                });
    }

    @Override
    public boolean isAnyResponseInFlight(Long sessionId) {
        return simulationInFlightRegistry.isAnyResponseInFlight(sessionId);
    }

    @Transactional(noRollbackFor = RuntimeException.class)
    protected void streamOpening(Long sessionId) {
        final SimulationSession session = getSession(sessionId);
        final MedicalCase medicalCase = caseLoaderService.getCaseById(session.getCaseId());
        session.setOpeningStatus(OpeningStatus.OPENING_STREAMING);
        simulationSessionRepository.save(session);

        final StringBuilder buffer = new StringBuilder();
        final Flux<String> flux = simulationAiService.streamOpeningMessage(
                medicalCase,
                warning -> publishWarning(sessionId, warning)
        );

        try {
            flux.doOnNext(chunk -> {
                        buffer.append(chunk);
                        publishChunk(sessionId, chunk);
                    })
                    .blockLast();

            savePatientMessage(session, buffer.toString(), nextOrder(sessionId));
            session.setOpeningStatus(OpeningStatus.OPENING_READY);
            session.setState(SimulationState.IN_PROGRESS);
            simulationSessionRepository.save(session);
            publishDone(sessionId);
        } catch (RuntimeException exception) {
            session.setOpeningStatus(OpeningStatus.OPENING_FAILED);
            simulationSessionRepository.save(session);
            publishError(sessionId, exception.getMessage());
            throw exception;
        } finally {
            simulationInFlightRegistry.clearOpeningInFlight(sessionId);
        }
    }

    @Transactional(noRollbackFor = RuntimeException.class)
    protected void streamReply(Long sessionId, String doctorMessage) {
        log.info("[stream] streamReply enter sessionId={}", sessionId);
        final SimulationSession session = getSession(sessionId);
        final MedicalCase medicalCase = caseLoaderService.getCaseById(session.getCaseId());
        final List<ConversationMessage> history = conversationMessageRepository.findBySessionIdOrderByMessageOrderAsc(sessionId);
        final StringBuilder buffer = new StringBuilder();
        log.info("[stream] streamReply building flux sessionId={} historySize={}", sessionId, history.size());
        final Flux<String> flux = simulationAiService.streamPatientReply(
                medicalCase,
                history,
                doctorMessage,
                warning -> publishWarning(sessionId, warning)
        );
        log.info("[stream] streamReply flux built, subscribing sessionId={}", sessionId);

        try {
            flux.doOnNext(chunk -> {
                        buffer.append(chunk);
                        log.debug("[stream] chunk sessionId={} len={}", sessionId, chunk.length());
                        publishChunk(sessionId, chunk);
                    })
                    .doOnError(err -> log.error("[stream] flux error sessionId={}", sessionId, err))
                    .doOnComplete(() -> log.info("[stream] flux complete sessionId={} totalLen={}", sessionId, buffer.length()))
                    .blockLast();

            log.info("[stream] streamReply publishing done sessionId={} totalLen={}", sessionId, buffer.length());
            savePatientMessage(session, buffer.toString(), nextOrder(sessionId));
            publishDone(sessionId);
        } catch (RuntimeException exception) {
            log.error("[stream] streamReply caught exception sessionId={}", sessionId, exception);
            publishError(sessionId, exception.getMessage());
            throw exception;
        } finally {
            simulationInFlightRegistry.clearMessageInFlight(sessionId);
            log.info("[stream] streamReply exit sessionId={}", sessionId);
        }
    }

    @Transactional(noRollbackFor = RuntimeException.class)
    protected void streamSystemReply(Long sessionId, String doctorMessage) {
        log.info("[stream] streamSystemReply enter sessionId={}", sessionId);
        final SimulationSession session = getSession(sessionId);
        final MedicalCase medicalCase = caseLoaderService.getCaseById(session.getCaseId());
        final List<ConversationMessage> history = conversationMessageRepository.findBySessionIdOrderByMessageOrderAsc(sessionId);
        final StringBuilder buffer = new StringBuilder();
        // Используем тот же flux, что и для ответа пациента: prompt patient-role.txt
        // содержит явную секцию-override для лабораторных/инструментальных запросов,
        // в которой модель переключается на роль system-нарратора и отвечает markdown.
        final Flux<String> flux = simulationAiService.streamPatientReply(
                medicalCase,
                history,
                doctorMessage,
                warning -> publishWarning(sessionId, warning)
        );

        try {
            flux.doOnNext(chunk -> {
                        buffer.append(chunk);
                        publishChunk(sessionId, chunk);
                    })
                    .doOnError(err -> log.error("[stream] system flux error sessionId={}", sessionId, err))
                    .doOnComplete(() -> log.info("[stream] system flux complete sessionId={} totalLen={}", sessionId, buffer.length()))
                    .blockLast();

            saveSystemMessage(session, buffer.toString(), nextOrder(sessionId));
            publishDone(sessionId);
        } catch (RuntimeException exception) {
            log.error("[stream] streamSystemReply caught exception sessionId={}", sessionId, exception);
            publishError(sessionId, exception.getMessage());
            throw exception;
        } finally {
            simulationInFlightRegistry.clearSystemInFlight(sessionId);
            log.info("[stream] streamSystemReply exit sessionId={}", sessionId);
        }
    }

    @Transactional(noRollbackFor = RuntimeException.class)
    protected void streamExaminationFinding(Long sessionId, String doctorMessage) {
        log.info("[stream] streamExaminationFinding enter sessionId={}", sessionId);
        final SimulationSession session = getSession(sessionId);
        final MedicalCase medicalCase = caseLoaderService.getCaseById(session.getCaseId());
        final List<ConversationMessage> history = conversationMessageRepository.findBySessionIdOrderByMessageOrderAsc(sessionId);
        final StringBuilder buffer = new StringBuilder();
        final Flux<String> flux = simulationAiService.streamExaminationFinding(
                medicalCase,
                history,
                doctorMessage,
                warning -> publishWarning(sessionId, warning)
        );

        try {
            flux.doOnNext(chunk -> {
                        buffer.append(chunk);
                        publishChunk(sessionId, chunk);
                    })
                    .doOnError(err -> log.error("[stream] finding flux error sessionId={}", sessionId, err))
                    .doOnComplete(() -> log.info("[stream] finding flux complete sessionId={} totalLen={}", sessionId, buffer.length()))
                    .blockLast();

            saveMentorMessage(session, buffer.toString(), nextOrder(sessionId));
            publishDone(sessionId);
        } catch (RuntimeException exception) {
            log.error("[stream] streamExaminationFinding caught exception sessionId={}", sessionId, exception);
            publishError(sessionId, exception.getMessage());
            throw exception;
        } finally {
            simulationInFlightRegistry.clearFindingInFlight(sessionId);
            log.info("[stream] streamExaminationFinding exit sessionId={}", sessionId);
        }
    }

    private SimulationSession getSession(Long sessionId) {
        return simulationSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown session id: " + sessionId));
    }

    private int nextOrder(Long sessionId) {
        return conversationMessageRepository.findBySessionIdOrderByMessageOrderAsc(sessionId).size() + 1;
    }

    private void savePatientMessage(SimulationSession session, String content, int order) {
        conversationMessageRepository.save(ConversationMessage.builder()
                .session(session)
                .role(MessageRole.PATIENT)
                .content(content.trim())
                .messageOrder(order)
                .build());
    }

    private void saveMentorMessage(SimulationSession session, String content, int order) {
        conversationMessageRepository.save(ConversationMessage.builder()
                .session(session)
                .role(MessageRole.MENTOR)
                .content(content.trim())
                .messageOrder(order)
                .build());
    }

    private void saveSystemMessage(SimulationSession session, String content, int order) {
        conversationMessageRepository.save(ConversationMessage.builder()
                .session(session)
                .role(MessageRole.SYSTEM)
                .content(content.trim())
                .messageOrder(order)
                .build());
    }

    private void publishChunk(Long sessionId, String chunk) {
        messagingTemplate.convertAndSend("/topic/simulations/" + sessionId, StreamChunkDto.chunk(String.valueOf(sessionId), chunk));
    }

    private void publishDone(Long sessionId) {
        messagingTemplate.convertAndSend("/topic/simulations/" + sessionId, StreamChunkDto.done(String.valueOf(sessionId)));
    }

    private void publishError(Long sessionId, String error) {
        messagingTemplate.convertAndSend("/topic/simulations/" + sessionId, StreamChunkDto.error(String.valueOf(sessionId), error));
    }

    private void publishWarning(Long sessionId, String message) {
        log.warn("[stream] publishWarning sessionId={} message={}", sessionId, message);
        messagingTemplate.convertAndSend("/topic/simulations/" + sessionId, StreamChunkDto.warning(String.valueOf(sessionId), message));
    }
}
