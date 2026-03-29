package ru.medmentor.service;

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
        CompletableFuture.runAsync(() -> streamReply(sessionId, doctorMessage));
    }

    @Override
    public boolean isAnyResponseInFlight(Long sessionId) {
        return simulationInFlightRegistry.isOpeningInFlight(sessionId) || simulationInFlightRegistry.isMessageInFlight(sessionId);
    }

    @Transactional(noRollbackFor = RuntimeException.class)
    protected void streamOpening(Long sessionId) {
        final SimulationSession session = getSession(sessionId);
        final MedicalCase medicalCase = caseLoaderService.getCaseById(session.getCaseId());
        session.setOpeningStatus(OpeningStatus.OPENING_STREAMING);
        simulationSessionRepository.save(session);

        final StringBuilder buffer = new StringBuilder();
        final Flux<String> flux = simulationAiService.streamOpeningMessage(medicalCase);

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
        final SimulationSession session = getSession(sessionId);
        final MedicalCase medicalCase = caseLoaderService.getCaseById(session.getCaseId());
        final List<ConversationMessage> history = conversationMessageRepository.findBySessionIdOrderByMessageOrderAsc(sessionId);
        final StringBuilder buffer = new StringBuilder();
        final Flux<String> flux = simulationAiService.streamPatientReply(medicalCase, history, doctorMessage);

        try {
            flux.doOnNext(chunk -> {
                        buffer.append(chunk);
                        publishChunk(sessionId, chunk);
                    })
                    .blockLast();

            savePatientMessage(session, buffer.toString(), nextOrder(sessionId));
            publishDone(sessionId);
        } catch (RuntimeException exception) {
            publishError(sessionId, exception.getMessage());
            throw exception;
        } finally {
            simulationInFlightRegistry.clearMessageInFlight(sessionId);
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

    private void publishChunk(Long sessionId, String chunk) {
        messagingTemplate.convertAndSend("/topic/simulations/" + sessionId, StreamChunkDto.chunk(String.valueOf(sessionId), chunk));
    }

    private void publishDone(Long sessionId) {
        messagingTemplate.convertAndSend("/topic/simulations/" + sessionId, StreamChunkDto.done(String.valueOf(sessionId)));
    }

    private void publishError(Long sessionId, String error) {
        messagingTemplate.convertAndSend("/topic/simulations/" + sessionId, StreamChunkDto.error(String.valueOf(sessionId), error));
    }
}
