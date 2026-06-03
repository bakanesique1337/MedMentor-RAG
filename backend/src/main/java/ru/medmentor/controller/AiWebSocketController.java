package ru.medmentor.controller;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import reactor.core.publisher.Flux;
import ru.medmentor.dto.StreamChunkDto;
import ru.medmentor.dto.StreamRequestDto;
import ru.medmentor.service.AiService;

import java.util.UUID;

/**
 * WebSocket controller for streaming AI responses.
 * Handles real-time bidirectional communication using STOMP protocol.
 */
@Controller
@RequiredArgsConstructor
public class AiWebSocketController {

    private static final Logger logger = LoggerFactory.getLogger(AiWebSocketController.class);

    private final AiService aiService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Handle streaming AI chat requests via WebSocket.
     * Client sends to: /app/ai/chat
     * Server responds to: /topic/ai/{conversationId}
     */
    @MessageMapping("/ai/chat")
    public void handleStreamingChat(StreamRequestDto request) {
        String conversationId = request.getConversationId();
        if (conversationId == null || conversationId.isEmpty()) {
            conversationId = UUID.randomUUID().toString();
        }

        final String finalConversationId = conversationId;

        logger.info("WebSocket streaming request received [conversationId={}]: userMessage='{}'",
                finalConversationId, request.getUserMessage());

        try {
            // Get streaming response from AI service
            final Flux<String> streamingResponse = aiService.processStreamingRequest(
                    request.getUserMessage(),
                    finalConversationId
            );

            // Subscribe and send each chunk to the client
            streamingResponse
                    .doOnNext(chunk -> {
                        // Send each chunk to the topic for this conversation
                        final StreamChunkDto chunkDto = StreamChunkDto.chunk(finalConversationId, chunk);
                        messagingTemplate.convertAndSend(
                                "/topic/ai/" + finalConversationId,
                                chunkDto
                        );
                    })
                    .doOnComplete(() -> {
                        // Send completion message
                        final StreamChunkDto doneDto = StreamChunkDto.done(finalConversationId);
                        messagingTemplate.convertAndSend(
                                "/topic/ai/" + finalConversationId,
                                doneDto
                        );
                        logger.info("Streaming completed [conversationId={}]", finalConversationId);
                    })
                    .doOnError(error -> {
                        // Send error message
                        final StreamChunkDto errorDto = StreamChunkDto.error(
                                finalConversationId,
                                error.getMessage()
                        );
                        messagingTemplate.convertAndSend(
                                "/topic/ai/" + finalConversationId,
                                errorDto
                        );
                        logger.error("Streaming error [conversationId={}]: {}",
                                finalConversationId, error.getMessage(), error);
                    })
                    .subscribe(); // Start the stream

        } catch (Exception e) {
            logger.error("Error handling streaming chat [conversationId={}]: {}",
                    finalConversationId, e.getMessage(), e);

            // Send error to client
            final StreamChunkDto errorDto = StreamChunkDto.error(
                    finalConversationId,
                    "Failed to process request: " + e.getMessage()
            );
            messagingTemplate.convertAndSend(
                    "/topic/ai/" + finalConversationId,
                    errorDto
            );
        }
    }
}
