package ru.medmentor.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SimulationDiagnosisRequestDto(
        @Schema(example = "Influenza")
        @NotBlank(message = "Diagnosis is required")
        @Size(max = 500, message = "Diagnosis must not exceed 500 characters")
        String diagnosis,

        @Schema(example = "Typical influenza presentation with fever and myalgia.")
        @Size(max = 2000, message = "Rationale must not exceed 2000 characters")
        String rationale,

        @Schema(example = "70", description = "Self-reported confidence in the diagnosis, 0..100")
        @Min(value = 0, message = "Confidence must be between 0 and 100")
        @Max(value = 100, message = "Confidence must be between 0 and 100")
        Integer confidence
) {
}
