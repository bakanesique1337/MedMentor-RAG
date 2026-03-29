package ru.medmentor.dto;

import ru.medmentor.model.OpeningStatus;
import ru.medmentor.model.SimulationState;

import java.time.LocalDateTime;

public record ActiveSimulationDto(
        Long id,
        String caseId,
        String caseTitle,
        String patientName,
        SimulationState state,
        OpeningStatus openingStatus,
        LocalDateTime updatedAt
) {
}
