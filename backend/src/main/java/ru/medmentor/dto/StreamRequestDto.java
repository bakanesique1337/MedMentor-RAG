package ru.medmentor.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * DTO for WebSocket streaming AI requests.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StreamRequestDto {

    /**
     * Conversation ID for this session
     */
    private String conversationId;

    /**
     * User's message to send to the AI
     */
    @NotBlank(message = "User message cannot be blank")
    private String userMessage;

    /**
     * Optional metadata (can be used for context, user info, etc.)
     */
    private Map<String, Object> metadata;
}
