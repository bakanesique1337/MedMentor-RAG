package ru.medmentor.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public record SimulationDiagnosisRequestDto(
        @Schema(example = "Influenza")
        @NotBlank(message = "Diagnosis is required")
        String diagnosis
) {
}
