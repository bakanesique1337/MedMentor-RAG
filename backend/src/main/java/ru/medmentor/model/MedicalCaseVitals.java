package ru.medmentor.model;

public record MedicalCaseVitals(
        int heartRate,
        String bloodPressure,
        int respiratoryRate,
        int spo2,
        double temperatureC
) {
}
