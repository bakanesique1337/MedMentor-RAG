package ru.medmentor.dto;

import jakarta.validation.constraints.NotBlank;

public record SimulationDiagnosisRequestDto(
        @NotBlank(message = "Diagnosis is required")
        String diagnosis
) {
}
