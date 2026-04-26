package ru.medmentor.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.List;

public record ResultDto(
        @Schema(example = "You asked focused and empathetic questions. Strong diagnostic reasoning overall.")
        String summary,
        @Schema(description = "Per-criterion explanatory notes; null for legacy sessions")
        CriterionNotesDto criterionNotes,
        @Schema(description = "Pivotal turns extracted from the dialogue; empty for legacy sessions")
        List<KeyTurnDto> keyTurns,
        @Schema(description = "Findings the doctor did not check; empty for legacy sessions")
        List<String> missedFindings,
        @Schema(example = "2026-03-30T14:25:00")
        LocalDateTime createdAt
) {
}
