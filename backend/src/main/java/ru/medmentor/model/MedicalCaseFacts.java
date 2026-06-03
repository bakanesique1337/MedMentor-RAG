package ru.medmentor.model;

import java.util.List;

public record MedicalCaseFacts(
        List<String> symptoms,
        List<String> history,
        List<String> negatives
) {
}
