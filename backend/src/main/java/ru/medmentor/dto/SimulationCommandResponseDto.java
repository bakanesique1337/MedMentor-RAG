package ru.medmentor.dto;

import io.swagger.v3.oas.annotations.media.Schema;

public record SimulationCommandResponseDto(
        @Schema(example = "11")
        Long sessionId,
        @Schema(example = "OPENING_STARTED")
        String status
) {
}
