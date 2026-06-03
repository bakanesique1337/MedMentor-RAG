package ru.medmentor.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import ru.medmentor.config.AiProperties;
import ru.medmentor.dto.AiRequestDto;
import ru.medmentor.dto.AiResponseDto;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AiServiceImpl implements AiService {

    private static final Logger logger = LoggerFactory.getLogger(AiServiceImpl.class);

    private final ChatClient chatClient;
    private final AiProperties aiProperties;

    @Override
    public AiResponseDto processRequest(AiRequestDto request) {
        final String requestId = UUID.randomUUID().toString();
        final long startTime = System.currentTimeMillis();

        logger.info("Processing AI request [requestId={}]: userMessage='{}'",
                requestId, request.getUserMessage());

        try {
            // Prepend constant context to user message if configured
            final String fullMessage = buildFullMessage(request.getUserMessage());

            logger.debug("Full message with context [requestId={}]: '{}'", requestId, fullMessage);

            // Call ChatClient for synchronous response
            final ChatResponse chatResponse = chatClient.prompt()
                    .user(fullMessage)
                    .call()
                    .chatResponse();

            final String aiMessage = chatResponse != null ? chatResponse.getResult().getOutput().getText() : null;
            final long executionTime = System.currentTimeMillis() - startTime;

            logger.info("AI response received [requestId={}]: model={}, executionTime={}ms, responseLength={}",
                    requestId,
                    aiProperties.getModel(),
                    executionTime,
                    aiMessage != null ? aiMessage.length() : 0);

            // Log token usage if available
            if (chatResponse.getMetadata().getUsage() != null) {
                logger.info("Token usage [requestId={}]: promptTokens={}, getCompletionTokens={}, totalTokens={}",
                        requestId,
                        chatResponse.getMetadata().getUsage().getPromptTokens(),
                        chatResponse.getMetadata().getUsage().getCompletionTokens(),
                        chatResponse.getMetadata().getUsage().getTotalTokens());
            }

            logger.debug("AI response content [requestId={}]: '{}'", requestId, aiMessage);

            return AiResponseDto.builder()
                    .aiMessage(aiMessage)
                    .requestId(requestId)
                    .timestamp(System.currentTimeMillis())
                    .build();

        } catch (Exception e) {
            final long executionTime = System.currentTimeMillis() - startTime;
            logger.error("Error processing AI request [requestId={}] after {}ms: {}",
                    requestId, executionTime, e.getMessage(), e);
            throw new RuntimeException("Failed to process AI request: " + e.getMessage(), e);
        }
    }

    @Override
    public Flux<String> processStreamingRequest(String userMessage, String conversationId) {
        logger.info("Processing streaming AI request [conversationId={}]: userMessage='{}'",
                conversationId, userMessage);

        try {
            final String fullMessage = buildFullMessage(userMessage);

            logger.debug("Full message with context [conversationId={}]: '{}'", conversationId, fullMessage);

            // Use ChatClient stream() method for streaming responses
            return chatClient.prompt()
                    .user(fullMessage)
                    .stream()
                    .content()
                    .doOnNext(chunk -> logger.debug("Stream chunk [conversationId={}]: '{}'", conversationId, chunk))
                    .doOnComplete(() -> logger.info("Stream completed [conversationId={}]", conversationId))
                    .doOnError(error -> logger.error("Stream error [conversationId={}]: {}", conversationId, error.getMessage()));

        } catch (Exception e) {
            logger.error("Error initiating streaming request [conversationId={}]: {}", conversationId, e.getMessage(), e);
            return Flux.error(new RuntimeException("Failed to process streaming AI request: " + e.getMessage(), e));
        }
    }

    private String buildFullMessage(String userMessage) {
        final String constantContext = aiProperties.getConstantContext();

        if (constantContext == null || constantContext.trim().isEmpty()) {
            return userMessage;
        }

        return constantContext + "\n\n" + userMessage;
    }
}
