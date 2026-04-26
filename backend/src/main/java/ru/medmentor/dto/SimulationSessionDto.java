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
        @Schema(example = "Cardiology")
        String caseCategory,
        @Schema(example = "medium")
        String caseDifficulty,
        @Schema(example = "Anna Petrova")
        String patientName,
        @Schema(example = "26")
        int patientAge,
        @Schema(example = "female")
        String patientSex,
        @Schema(example = "IN_PROGRESS")
        SimulationState state,
        @Schema(example = "OPENING_READY")
        OpeningStatus openingStatus,
        @Schema(example = "[\"Influenza\",\"Common cold\"]")
        List<String> diagnosisOptions,
        @Schema(example = "Influenza")
        String selectedDiagnosis,
        @Schema(example = "Typical influenza presentation with fever and myalgia.")
        String selectedDiagnosisRationale,
        @Schema(example = "70", description = "Self-reported diagnosis confidence 0..100; null until submitted")
        Integer selectedDiagnosisConfidence,
        @Schema(example = "Influenza", description = "Reference diagnosis from the case; only revealed once the session is COMPLETED or ABANDONED")
        String correctDiagnosis,
        List<ConversationMessageDto> messages,
        StreamingStatusDto streamingStatus,
        @Schema(description = "Whether the user has triggered the physical exam reveal")
        boolean examRevealed,
        @Schema(description = "Patient passport revealed after the physical exam; null until examRevealed=true")
        PatientPassportDto passport,
        @Schema(description = "Vital signs revealed after the physical exam; null until examRevealed=true")
        PatientVitalsDto vitals,
        ScoreDto score,
        ResultDto result,
        @Schema(example = "2026-03-30T14:05:00")
        LocalDateTime createdAt,
        @Schema(example = "2026-03-30T14:25:00")
        LocalDateTime updatedAt
) {
}
