package ru.medmentor.dto;

import io.swagger.v3.oas.annotations.media.Schema;

public record PatientVitalsDto(
        @Schema(example = "78")
        int heartRate,
        @Schema(example = "148/92")
        String bloodPressure,
        @Schema(example = "16")
        int respiratoryRate,
        @Schema(example = "97")
        int spo2,
        @Schema(example = "36.6")
        double temperatureC
) {
}
