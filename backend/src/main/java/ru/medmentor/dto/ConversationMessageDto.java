package ru.medmentor.dto;

import ru.medmentor.model.MessageRole;

import java.time.LocalDateTime;

public record ConversationMessageDto(
        Long id,
        MessageRole role,
        String content,
        Integer messageOrder,
        LocalDateTime timestamp
) {
}
