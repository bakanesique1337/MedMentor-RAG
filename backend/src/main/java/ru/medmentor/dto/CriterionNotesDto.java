package ru.medmentor.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Per-criterion explanatory notes accompanying the numeric scores")
public record CriterionNotesDto(
        String politeness,
        String questioningStructure,
        String thoroughness,
        String empathy,
        String correctDiagnosis
) {
}
