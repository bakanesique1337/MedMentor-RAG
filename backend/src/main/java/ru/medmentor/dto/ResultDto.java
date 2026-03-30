package ru.medmentor.dto;

import java.time.LocalDateTime;

public record ResultDto(
        String summary,
        LocalDateTime createdAt
) {
}
