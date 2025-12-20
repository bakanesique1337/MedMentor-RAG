package ru.medmentor.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.stereotype.Service;
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
        String requestId = UUID.randomUUID().toString();
        long startTime = System.currentTimeMillis();

        logger.info("Processing AI request [requestId={}]: userMessage='{}'",
                requestId, request.getUserMessage());

        try {
            // Prepend constant context to user message if configured
            String fullMessage = buildFullMessage(request.getUserMessage());

            logger.debug("Full message with context [requestId={}]: '{}'", requestId, fullMessage);

            // Call ChatClient for synchronous response
            ChatResponse chatResponse = chatClient.prompt()
                    .user(fullMessage)
                    .call()
                    .chatResponse();

            String aiMessage = chatResponse.getResult().getOutput().getText();
            long executionTime = System.currentTimeMillis() - startTime;

            logger.info("AI response received [requestId={}]: model={}, executionTime={}ms, responseLength={}",
                    requestId,
                    aiProperties.getModel(),
                    executionTime,
                    aiMessage.length());

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
                    .metadata(request.getMetadata())
                    .build();

        } catch (Exception e) {
            long executionTime = System.currentTimeMillis() - startTime;
            logger.error("Error processing AI request [requestId={}] after {}ms: {}",
                    requestId, executionTime, e.getMessage(), e);
            throw new RuntimeException("Failed to process AI request: " + e.getMessage(), e);
        }
    }

    private String buildFullMessage(String userMessage) {
        String constantContext = aiProperties.getConstantContext();

        if (constantContext == null || constantContext.trim().isEmpty()) {
            return userMessage;
        }

        return constantContext + "\n\n" + userMessage;
    }
}
