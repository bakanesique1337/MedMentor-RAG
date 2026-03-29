package ru.medmentor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for streaming AI response chunks via WebSocket.
 * Each chunk represents a piece of the AI's response as it's generated.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StreamChunkDto {

    /**
     * Unique identifier for this conversation/request
     */
    private String conversationId;

    /**
     * The text content of this chunk
     */
    private String content;

    /**
     * Type of message: "chunk", "done", "error"
     */
    private String type;

    /**
     * Error message if type is "error"
     */
    private String error;

    /**
     * Timestamp when this chunk was sent
     */
    private Long timestamp;

    public static StreamChunkDto chunk(String conversationId, String content) {
        return StreamChunkDto.builder()
                .conversationId(conversationId)
                .content(content)
                .type("chunk")
                .timestamp(System.currentTimeMillis())
                .build();
    }

    public static StreamChunkDto done(String conversationId) {
        return StreamChunkDto.builder()
                .conversationId(conversationId)
                .type("done")
                .timestamp(System.currentTimeMillis())
                .build();
    }

    public static StreamChunkDto error(String conversationId, String error) {
        return StreamChunkDto.builder()
                .conversationId(conversationId)
                .type("error")
                .error(error)
                .timestamp(System.currentTimeMillis())
                .build();
    }
}
