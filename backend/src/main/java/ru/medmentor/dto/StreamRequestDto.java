package ru.medmentor.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    @Schema(example = "sim-chat-42")
    private String conversationId;

    /**
     * User's message to send to the AI
     */
    @Schema(example = "Can you describe your chest pain?")
    @NotBlank(message = "User message cannot be blank")
    private String userMessage;
}
