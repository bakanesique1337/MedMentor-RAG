package ru.medmentor.model;

public record MedicalCasePassport(
        int heightCm,
        double weightKg,
        String allergies,
        String chronicConditions,
        String smoking
) {
}
