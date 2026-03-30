package ru.medmentor.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

public record ResultDto(
        @Schema(example = "You asked focused and empathetic questions. Strong diagnostic reasoning overall.")
        String summary,
        @Schema(example = "2026-03-30T14:25:00")
        LocalDateTime createdAt
) {
}
