package ru.medmentor.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

public record ScoreDto(
        @Schema(example = "0.82")
        Double politeness,
        @Schema(example = "0.76")
        Double questioningStructure,
        @Schema(example = "0.71")
        Double thoroughness,
        @Schema(example = "0.88")
        Double empathy,
        @Schema(example = "1.00")
        Double diagnosisCorrect,
        @Schema(example = "2026-03-30T14:25:00")
        LocalDateTime createdAt
) {
}
