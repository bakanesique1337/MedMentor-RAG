package ru.medmentor.service;

import reactor.core.publisher.Flux;
import ru.medmentor.dto.AiRequestDto;
import ru.medmentor.dto.AiResponseDto;

public interface AiService {

    /**
     * Process AI request synchronously (for REST endpoint)
     */
    AiResponseDto processRequest(AiRequestDto request);

    /**
     * Process AI request with streaming response (for WebSocket)
     */
    Flux<String> processStreamingRequest(String userMessage, String conversationId);
}
