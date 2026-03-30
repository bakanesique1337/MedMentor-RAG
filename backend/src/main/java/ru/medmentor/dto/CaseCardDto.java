package ru.medmentor.dto;

import java.util.List;

public record CaseCardDto(
        String id,
        String category,
        String title,
        String difficulty,
        List<String> tags,
        String patientName,
        int patientAge,
        String patientSex,
        String patientBrief
) {
}
