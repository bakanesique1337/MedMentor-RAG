package ru.medmentor.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import ru.medmentor.model.OpeningStatus;
import ru.medmentor.model.SimulationState;

import java.time.LocalDateTime;
import java.util.List;

public record SimulationSessionDto(
        @Schema(example = "11")
        Long id,
        @Schema(example = "infection-influenza-001")
        String caseId,
        @Schema(example = "Classic influenza presentation")
        String caseTitle,
        @Schema(example = "Anna Petrova")
        String patientName,
        @Schema(example = "IN_PROGRESS")
        SimulationState state,
        @Schema(example = "OPENING_READY")
        OpeningStatus openingStatus,
        @Schema(example = "[\"Influenza\",\"Common cold\"]")
        List<String> diagnosisOptions,
        @Schema(example = "Influenza")
        String selectedDiagnosis,
        List<ConversationMessageDto> messages,
        StreamingStatusDto streamingStatus,
        ScoreDto score,
        ResultDto result,
        @Schema(example = "2026-03-30T14:05:00")
        LocalDateTime createdAt,
        @Schema(example = "2026-03-30T14:25:00")
        LocalDateTime updatedAt
) {
}
