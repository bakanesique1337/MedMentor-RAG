package ru.medmentor.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public record StartSimulationRequestDto(
        @Schema(example = "infection-influenza-001")
        @NotBlank(message = "Case id is required")
        String caseId
) {
}
