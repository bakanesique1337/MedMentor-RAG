package ru.medmentor.dto;

import ru.medmentor.model.OpeningStatus;
import ru.medmentor.model.SimulationState;

import java.time.LocalDateTime;
import java.util.List;

public record SimulationSessionDto(
        Long id,
        String caseId,
        String caseTitle,
        String patientName,
        SimulationState state,
        OpeningStatus openingStatus,
        List<String> diagnosisOptions,
        String selectedDiagnosis,
        List<ConversationMessageDto> messages,
        StreamingStatusDto streamingStatus,
        ScoreDto score,
        ResultDto result,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
