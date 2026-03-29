package ru.medmentor.dto;

import jakarta.validation.constraints.NotBlank;

public record StartSimulationRequestDto(
        @NotBlank(message = "Case id is required")
        String caseId
) {
}
