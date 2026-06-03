package ru.medmentor.dto;

import io.swagger.v3.oas.annotations.media.Schema;

public record PatientPassportDto(
        @Schema(example = "178")
        int heightCm,
        @Schema(example = "88.0")
        double weightKg,
        @Schema(example = "не выявлено")
        String allergies,
        @Schema(example = "артериальная гипертензия")
        String chronicConditions,
        @Schema(example = "25 лет, ~1 пачка/день")
        String smoking
) {
}
