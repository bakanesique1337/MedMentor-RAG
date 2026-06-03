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
        @Schema(description = "Binary semantic verdict: true iff the submitted diagnosis is clinically equivalent to the case reference. Null for legacy sessions scored before this field existed.", example = "true")
        Boolean diagnosisMatch,
        @Schema(description = "Composite of the five criteria on a 0-1 scale.", example = "0.83")
        Double totalScore,
        @Schema(example = "2026-03-30T14:25:00")
        LocalDateTime createdAt
) {
}
