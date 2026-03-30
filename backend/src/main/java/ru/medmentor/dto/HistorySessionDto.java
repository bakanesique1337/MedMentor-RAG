package ru.medmentor.dto;

import ru.medmentor.model.SimulationState;

import java.time.LocalDateTime;

public record HistorySessionDto(
        Long id,
        String caseId,
        String caseTitle,
        String patientName,
        SimulationState state,
        ScoreDto score,
        ResultDto result,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
