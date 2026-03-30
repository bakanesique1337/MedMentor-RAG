package ru.medmentor.model;

import java.util.List;

public record MedicalCase(
        String id,
        int version,
        String category,
        String title,
        String difficulty,
        List<String> tags,
        String patientName,
        int patientAge,
        String patientSex,
        String patientBrief,
        String openingComplaint,
        String authorNote,
        MedicalCaseFacts facts,
        List<String> diagnosisOptions,
        String correctDiagnosis
) {
}
